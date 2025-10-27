import sys, json, re
from transformers import pipeline
from sentence_transformers import SentenceTransformer, util
from concurrent.futures import ThreadPoolExecutor


BERT_MODEL = "jy46604790/Fake-News-Bert-Detect"
clf = pipeline("text-classification", model=BERT_MODEL, tokenizer=BERT_MODEL)

raw_input = sys.stdin.read().strip()
if not raw_input:
    print(json.dumps([]))
    sys.exit(0)

try:
    articles = json.loads(raw_input)
except Exception:
    print(json.dumps([]))
    sys.exit(0)


def clean(text):
    if not isinstance(text, str):
        return ""
    return (
        text.replace("â€™", "'")
            .replace("â€œ", '"')
            .replace("â€", '"')
            .replace("â€“", "-")
            .replace("â€”", "—")
            .replace("â€˜", "'")
            .replace("Ã©", "é")
            .replace("Ã¨", "è")
            .replace("Ã¶", "ö")
            .replace("Â", "")
            .encode("utf-8", "ignore")
            .decode("utf-8", "ignore")
    )

for a in articles:
    a["title"] = clean(a.get("title", ""))
    a["description"] = clean(a.get("description", ""))
    a["content"] = clean(a.get("content", ""))
    a["source"] = a.get("source") if isinstance(a.get("source"), str) else a.get("source", {}).get("name", "Unknown")
    a["verified_sources"] = []
    a["verified_ml"] = False
    a["verified_score"] = 0.0

def verify_article_bert(article):
    def classify_text(text):
        if not text.strip():
            return 0.0, "LABEL_0"
        result = clf(text, truncation=True, max_length=512)[0]
        label = result["label"].upper()
        score = float(result["score"])
        return score, label

    def get_verified_score(article):
        desc_text = article.get("description", "") or ""
        content_text = article.get("content", "") or ""

        with ThreadPoolExecutor(max_workers=2) as executor:
            future_desc = executor.submit(classify_text, desc_text)
            future_content = executor.submit(classify_text, content_text)

            score_desc, label_desc = future_desc.result()
            score_content, label_content = future_content.result()

        if label_desc in ["LABEL_1", "1"]:
            return score_desc, True
        elif label_content in ["LABEL_1", "1"]:
            return score_content, True
        else:
            return max(score_desc, score_content), False

    return get_verified_score(article)


for a in articles:
    bert_score, verified = verify_article_bert(a)
    a["verified_ml"] = verified
    a["verified_score"] = round(bert_score, 3)
    a["verified_sources"] = a.get("verified_sources", [])

# --- Step 2: Semantic + Lexical similarity cross-check ---
use_model = True
try:
    sim_model = SentenceTransformer("all-MiniLM-L6-v2")
except Exception:
    use_model = False

semantic_threshold = 0.55
lexical_threshold = 0.1

def jaccard_similarity(text1, text2):
    words1 = set(text1.lower().split())
    words2 = set(text2.lower().split())
    inter, uni = words1.intersection(words2), words1.union(words2)
    return len(inter) / len(uni) if uni else 0

if use_model and len(articles) > 1:
    texts = [a.get("description", "") or a.get("content", "") for a in articles]
    embeddings = sim_model.encode(texts, convert_to_tensor=True)

    verified_indices = set()  # Keep track of articles already assigned as verified sources

    for i in range(len(articles)):
        if i in verified_indices:
            continue  # Skip if this article is already a verified source of another

        for j in range(i + 1, len(articles)):
            if j in verified_indices:
                continue  # Skip if this article is already a verified source
            if articles[i]["source"].lower() == articles[j]["source"].lower():
                continue

            semantic_score = float(util.cos_sim(embeddings[i], embeddings[j]))
            lexical_score = jaccard_similarity(texts[i], texts[j])

            if semantic_score > semantic_threshold and lexical_score > lexical_threshold:
                # Boost verified score
                articles[i]["verified_score"] = min(1.0, articles[i]["verified_score"] + 0.2)
                
                # Track cross-source verification
                articles[i]["verified_sources"].append({
                    "source": articles[j]["source"],
                    "url": articles[j].get("url", ""),
                    "content": articles[j].get("content", "")  # include content for summarization
                })

                verified_indices.add(j)  # mark j as verified so it won’t be treated as original


# --- Step 3: Final output and sorting ---
output = []
for a in articles:
    # Verified if BERT or cross-source confirmation
    verified = a["verified_ml"] or len(a["verified_sources"]) > 0
    reason = "Verified by BERT and/or cross-source similarity" if verified else "Unverified or likely fake"

    output.append({
        "title": a.get("title", ""),
        "description": a.get("description", ""),
        "content": a.get("content", ""),
        "url": a.get("url", ""),
        "image": a.get("image", ""),
        "publishedAt": a.get("publishedAt", ""),
        "source": a.get("source", "Unknown"),
        "verified": verified,
        "verified_score": round(a["verified_score"], 3),
        "verified_reason": reason,
        "verified_sources": a["verified_sources"]
    })

# Sort: verified first, then unverified
output_sorted = sorted(output, key=lambda x: not x["verified"])

print(json.dumps(output_sorted, indent=2))
