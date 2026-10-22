import logging
from typing import Dict, Any, List
import requests
from backend.config import Config

logger = logging.getLogger(__name__)


class SerpService:
    """Server-side SerpAPI integration for destination facts, attractions, and cultural highlights."""

    def __init__(self):
        self.api_key = Config.SERPAPI_API_KEY

    def search_destination_insights(self, query: str) -> List[Dict[str, str]]:
        if not self.api_key:
            return []
        try:
            params = {
                "engine": "google",
                "q": f"{query} travel attractions highlights",
                "api_key": self.api_key,
                "num": 5,
            }
            res = requests.get("https://serpapi.com/search", params=params, timeout=7)
            if res.status_code == 200:
                data = res.json()
                snippets = []
                for item in data.get("organic_results", [])[:4]:
                    snippets.append({
                        "title": item.get("title", ""),
                        "snippet": item.get("snippet", ""),
                        "link": item.get("link", ""),
                    })
                return snippets
        except Exception as e:
            logger.warning("SerpAPI lookup error: %s", e)
        return []

