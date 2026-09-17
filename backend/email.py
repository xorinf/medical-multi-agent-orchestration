"""Dev email — log to console; replace with SMTP in deploy phase."""
from __future__ import annotations

import logging

log = logging.getLogger("email")


def send(to: str, subject: str, body: str, *, link: str = "") -> None:
    # ponytail: stdout-only in dev — real SMTP/SES swap is one function later.
    log.warning("EMAIL to=%s subject=%s link=%s body=%r", to, subject, link, body[:200])
