import warnings
warnings.filterwarnings("ignore")  # suppress all warnings

import asyncio
import json
from playwright.async_api import async_playwright

def clean_encoding(text: str) -> str:
    return (
        text.replace("â€™", "'")
            .replace("â€œ", '"').replace("â€", '"')
            .replace("â€“", "-").replace("â€”", "—")
            .replace("â€˜", "'").replace("Ã©", "é")
            .replace("Ã¨", "è").replace("Ã¢", "â")
            .replace("Ã´", "ô").replace("Ã¼", "ü")
            .replace("Ã¶", "ö").replace("Â", "")
            .replace("\xa0", " ")
            .strip()
    )

async def scrape_article(page, article):
    try:
        await page.goto(article.get("url", ""), wait_until="domcontentloaded", timeout=30000)

        json_ld_elements = await page.query_selector_all('script[type="application/ld+json"]')
        for el in json_ld_elements:
            try:
                data = await el.inner_text()
                parsed = json.loads(data)
                if parsed.get("@type") == "NewsArticle" and parsed.get("articleBody"):
                    return clean_encoding(parsed["articleBody"])
            except:
                continue

        paragraphs = await page.query_selector_all("article p")
        content = "\n".join([await p.inner_text() for p in paragraphs])
        return clean_encoding(content)
    except Exception:
        return article.get("content") or article.get("description") or ""

async def fetch_full_content_batch(articles, concurrency=25, pages_count=5):
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        semaphore = asyncio.Semaphore(concurrency)
        pages = [await browser.new_page() for _ in range(pages_count)]
        page_locks = [asyncio.Lock() for _ in range(pages_count)]  # Lock per page

        async def worker(idx, article):
            async with semaphore:
                page_idx = idx % pages_count
                async with page_locks[page_idx]:  # ensure one task per page
                    page = pages[page_idx]
                    content = await scrape_article(page, article)
                    return {**article, "content": content}

        tasks = [worker(i, a) for i, a in enumerate(articles)]
        results = await asyncio.gather(*tasks)
        await browser.close()
        return results

if __name__ == "__main__":
    articles = json.load(open(0))  # read JSON from stdin
    full_contents = asyncio.run(fetch_full_content_batch(articles))
    print(json.dumps(full_contents))
