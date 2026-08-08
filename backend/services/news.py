"""Fetch news for a stock via Google News RSS (free, no API key) and
score sentiment with VADER (lightweight, pure-python)."""
import feedparser
from urllib.parse import quote_plus
from datetime import datetime
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

_analyzer = SentimentIntensityAnalyzer()


def fetch_news(company_name: str, symbol: str, limit: int = 12) -> list[dict]:
    query = quote_plus(f"{company_name} share OR stock NSE India")
    url = f"https://news.google.com/rss/search?q={query}&hl=en-IN&gl=IN&ceid=IN:en"

    feed = feedparser.parse(url)
    articles = []
    for entry in feed.entries[:limit]:
        title = entry.get("title", "")
        source = entry.get("source", {}).get("title", "") if hasattr(entry, "source") else ""
        published = entry.get("published", "")
        link = entry.get("link", "")

        score = _analyzer.polarity_scores(title)
        compound = score["compound"]
        if compound >= 0.2:
            label = "positive"
        elif compound <= -0.2:
            label = "negative"
        else:
            label = "neutral"

        articles.append(
            {
                "title": title,
                "source": source,
                "published": published,
                "link": link,
                "sentiment": label,
                "sentiment_score": round(compound, 3),
            }
        )
    return articles


def aggregate_sentiment(articles: list[dict]) -> dict:
    if not articles:
        return {"average_score": 0.0, "label": "neutral", "positive": 0, "negative": 0, "neutral": 0}

    scores = [a["sentiment_score"] for a in articles]
    avg = sum(scores) / len(scores)
    pos = sum(1 for a in articles if a["sentiment"] == "positive")
    neg = sum(1 for a in articles if a["sentiment"] == "negative")
    neu = len(articles) - pos - neg

    if avg >= 0.15:
        label = "positive"
    elif avg <= -0.15:
        label = "negative"
    else:
        label = "neutral"

    return {
        "average_score": round(avg, 3),
        "label": label,
        "positive": pos,
        "negative": neg,
        "neutral": neu,
    }
