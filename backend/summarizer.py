import re
from sklearn.feature_extraction.text import TfidfVectorizer
from nltk.tokenize import sent_tokenize
import nltk
import json

# Ensure NLTK punkt tokenizer is downloaded quietly
nltk.download('punkt', quiet=True)

def clean_text(text: str) -> str:
    """Clean excessive whitespace and newlines."""
    return re.sub(r'\s+', ' ', text).strip()

def extractive_summary_tfidf(text: str, max_sentences: int = 5) -> list:
    """Extractive summarization using TF-IDF sentence scoring, returned as bullet points with full context."""
    text = clean_text(text)
    if not text or len(text) < 20:
        return [text or "No content to summarize"]

    sentences = sent_tokenize(text)
    if len(sentences) <= max_sentences:
        return sentences  # short text, return all sentences

    # Compute TF-IDF for each sentence
    vectorizer = TfidfVectorizer(stop_words='english')
    tfidf_matrix = vectorizer.fit_transform(sentences)
    scores = tfidf_matrix.sum(axis=1).A1  # sum TF-IDF scores per sentence

    # Select top sentences
    top_idx = scores.argsort()[::-1][:max_sentences]
    top_idx_sorted = sorted(top_idx)  # maintain original order
    summary_points = [f"- {sentences[i].strip()}" for i in top_idx_sorted]
    return summary_points

def summarize_articles(articles, max_sentences=5):
    """Summarize a list of articles using extractive TF-IDF summarization."""
    results = []
    for article in articles:
        text = article.get("content") or article.get("description") or ""
        article["summary"] = extractive_summary_tfidf(text, max_sentences=max_sentences)
        results.append(article)
    return results

if __name__ == "__main__":
    # Read JSON input from stdin
    articles = json.load(open(0))
    summarized_articles = summarize_articles(articles, max_sentences=5)
    print(json.dumps(summarized_articles, indent=4, ensure_ascii=False))