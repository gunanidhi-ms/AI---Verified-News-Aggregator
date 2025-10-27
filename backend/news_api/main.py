from fastapi import FastAPI, Query
import uvicorn
import feedparser
import json
from typing import List
from dateutil import parser as date_parser

app = FastAPI(title="News Aggregator API")

# Load feeds JSON
with open("rss_links.json", "r", encoding="utf-8") as f:
    feeds_data = json.load(f)


# ------------------ RSS fetch helpers ------------------
def fetch_rss_articles(url: str, limit: int = 10):
    """Fetch articles from a single RSS feed"""
    articles = []
    try:
        feed = feedparser.parse(url)

        if 'entries' in feed and feed.entries:
            for entry in feed.entries[:limit]:
                # Try to get image
                image_url = None
                if hasattr(entry, "media_content") and entry.media_content:
                    image_url = entry.media_content[0].get("url")
                elif hasattr(entry, "media_thumbnail") and entry.media_thumbnail:
                    image_url = entry.media_thumbnail[0].get("url")
                elif hasattr(entry, "enclosures") and entry.enclosures:
                    image_url = entry.enclosures[0].get("url")

                articles.append({
                    "title": entry.get("title"),
                    "link": entry.get("link"),
                    "published": entry.get("published", None),
                    "summary": entry.get("summary", None),
                    "image": image_url,
                    "source_feed": url
                })
    except Exception as e:
        print(f"Error fetching feed {url}: {e}")
    return articles


def fetch_articles_from_feeds(feed_list: List[str], limit_per_feed: int = 10):
    """Fetch articles from multiple feeds"""
    all_articles = []
    for feed_url in feed_list:
        all_articles.extend(fetch_rss_articles(feed_url, limit_per_feed))
    return all_articles


def sort_articles_by_date(articles: List[dict]):
    """Sort articles by published date (newest first)"""
    def get_date(article):
        try:
            return date_parser.parse(article["published"])
        except:
            return None
    return sorted(articles, key=get_date, reverse=True)


# ------------------ News endpoint ------------------
@app.get("/news")
def get_news(
    sector: str = Query(None, description="Sector name (e.g., politics, sports)"),
    country: str = Query(None, description="Country name (e.g., India, USA)"),
    international: bool = Query(False, description="Get international news")
):
    feed_list = []

    # Sector feeds
    if sector and sector in feeds_data.get("sector", {}):
        feed_list.extend(feeds_data["sector"][sector])

    # Country feeds
    if country and country in feeds_data.get("countries", {}):
        feed_list.extend(feeds_data["countries"][country])

    # International feeds
    if international:
        feed_list.extend(feeds_data.get("international", []))

    # Remove duplicates
    feed_list = list(set(feed_list))

    if not feed_list:
        return {"error": "No feeds found for the given query parameters."}

    # Return only the links
    return {"feed_count": len(feed_list), "feeds": feed_list}


