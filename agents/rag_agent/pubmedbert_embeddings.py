"""Local sentence-transformers wrapper for NeuML/pubmedbert-base-embeddings.

Returns 768-dim vectors. Used when EMBEDDINGS_BACKEND=pubmedbert.
First run downloads ~440MB from HuggingFace; cache lives in ~/.cache/huggingface.
"""
from __future__ import annotations

import os
from typing import List

from langchain_core.embeddings import Embeddings

DEFAULT_MODEL = "NeuML/pubmedbert-base-embeddings"


class PubMedBERTEmbeddings(Embeddings):
    # ponytail: loads model once on first embed; sentence-transformers is already
    # a transitive dep (reranker.py imports CrossEncoder from the same package).
    def __init__(self, model: str = DEFAULT_MODEL):
        from sentence_transformers import SentenceTransformer  # local import: heavy
        self._model = SentenceTransformer(model)

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [v.tolist() for v in self._model.encode(texts, convert_to_numpy=True)]

    def embed_query(self, text: str) -> List[float]:
        return self._model.encode([text], convert_to_numpy=True)[0].tolist()
