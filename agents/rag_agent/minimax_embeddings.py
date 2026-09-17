"""Custom embeddings wrapper for MiniMax.

MiniMax's /v1/embeddings endpoint uses a non-OpenAI shape:
  request:  {"model": "embo-01", "type": "db"|"query", "texts": [...]}
  response: {"vectors": [[...]], "base_resp": {"status_code": 0, ...}}

`langchain_openai.OpenAIEmbeddings` sends the OpenAI shape and MiniMax returns
`data: null`. We can't reuse OpenAIEmbeddings; we wrap urllib directly.
"""

from __future__ import annotations

import json
import logging
import os
from typing import List, Optional
from urllib import request as urlrequest
from urllib.error import HTTPError

from dotenv import load_dotenv
from langchain_core.embeddings import Embeddings

load_dotenv()

logger = logging.getLogger(__name__)

DEFAULT_MODEL = "embo-01"
DEFAULT_BASE_URL = "https://api.minimax.io/v1"


class MiniMaxEmbeddings(Embeddings):
    """Minimal MiniMax embeddings wrapper (db/query types, vectors response)."""

    def __init__(
        self,
        model: str = DEFAULT_MODEL,
        api_key: Optional[str] = None,
        base_url: str = DEFAULT_BASE_URL,
        timeout: float = 30.0,
    ):
        self.model = os.getenv("EMBEDDING_MODEL", model)
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        if not self.api_key:
            raise RuntimeError("OPENAI_API_KEY not set")

    # ponytail: synchronous urllib — fine for low-throughput ingest/query.
    # Swap to httpx + async batch if RPM limits bite (MiniMax caps embeddings at ~60 RPM).
    def _call(self, texts: List[str], type_: str) -> List[List[float]]:
        payload = json.dumps({"model": self.model, "type": type_, "texts": texts}).encode()
        req = urlrequest.Request(
            f"{self.base_url}/embeddings",
            data=payload,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        try:
            with urlrequest.urlopen(req, timeout=self.timeout) as resp:
                body = json.loads(resp.read())
        except HTTPError as e:
            raise RuntimeError(f"MiniMax embeddings HTTP {e.code}: {e.read().decode()[:300]}") from e

        if (body.get("base_resp") or {}).get("status_code", 0) != 0:
            raise RuntimeError(f"MiniMax embeddings error: {body}")

        vecs = body.get("vectors") or []
        if not vecs:
            raise RuntimeError(f"MiniMax embeddings: empty vectors, body={json.dumps(body)[:200]}")
        return vecs

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return self._call(texts, type_="db")

    def embed_query(self, text: str) -> List[float]:
        return self._call([text], type_="query")[0]