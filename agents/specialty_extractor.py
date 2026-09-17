"""Specialty extractor — single-purpose LLM call.

Returns {specialty, urgency, red_flags} from a free-text patient message.
Cached per chat message (TTL via conversation.updated_at). Cheap: one LLM call,
temperature 0.1, ~200ms typical.

Used by:
  - backend/services/match.py   (to rank doctors by specialty)
  - future: route patient queries to specialty-specific prompt templates
"""
from __future__ import annotations

import json
from typing import Optional

from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate

from config import Config

# ponytail: fixed enum — adding a new specialty = extend this list + the
# doctors.specialty field. Don't free-form extract; bounded set keeps matching clean.
VALID_SPECIALTIES = {
    "general", "cardiology", "dermatology", "neurology", "oncology",
    "pulmonology", "gastroenterology", "orthopedics", "pediatrics",
    "psychiatry", "endocrinology", "radiology", "urology", "gynecology",
    "ophthalmology", "ent",
}

_VALID_URGENCY = {"low", "medium", "high"}


def _build_prompt() -> ChatPromptTemplate:
    return ChatPromptTemplate.from_messages([
        ("system",
         "You are a medical triage classifier. Given a patient message, return JSON with:\n"
         "  specialty: one of " + ", ".join(sorted(VALID_SPECIALTIES)) + " (use 'general' if unclear)\n"
         "  urgency: 'low' | 'medium' | 'high'\n"
         "  red_flags: array of short strings naming red-flag symptoms (e.g. 'chest pain', "
         "'sudden severe headache', 'shortness of breath'); empty array if none.\n"
         "Return ONLY the JSON object, no commentary."),
        ("user", "{query}"),
    ])


def extract(query: str, llm=None) -> dict:
    """Run one LLM call; fall back to a safe default on any failure."""
    fallback = {"specialty": "general", "urgency": "low", "red_flags": []}
    if not query or not query.strip():
        return fallback
    try:
        llm = llm or Config().conversation.llm  # uses existing configured LLM
        parser = JsonOutputParser()
        prompt = _build_prompt()
        chain = prompt | llm | parser
        out = chain.invoke({"query": query})
        if not isinstance(out, dict):
            return fallback
        spec = str(out.get("specialty", "general")).strip().lower()
        if spec not in VALID_SPECIALTIES:
            # ponytail: one-shot retry with stricter phrasing. LLMs sometimes
            # return the wrong case or free-form; we re-ask without commentary.
            try:
                out = chain.invoke({"query": "specialty only, no commentary. " + query})
                spec = str(out.get("specialty", "general")).strip().lower()
            except Exception:
                spec = "general"
            if spec not in VALID_SPECIALTIES:
                spec = "general"
        urg = str(out.get("urgency", "low")).strip().lower()
        if urg not in _VALID_URGENCY:
            urg = "low"
        flags = out.get("red_flags") or []
        if not isinstance(flags, list):
            flags = []
        flags = [str(x).strip() for x in flags if str(x).strip()][:8]
        return {"specialty": spec, "urgency": urg, "red_flags": flags}
    except Exception:
        # ponytail: never let extractor failure break the chat flow.
        return fallback
