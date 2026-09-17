# Multi-Agent Medical Assistant

FastAPI backend orchestrating LLM + RAG + computer-vision + web-search agents (LangGraph) for medical Q&A and image triage. Single Python 3.11 process, no JS toolchain. Azure OpenAI, Qdrant (local), ElevenLabs (TTS), Tavily (web search), HuggingFace (reranker).

## Dev environment

- **Python 3.11** (Dockerfile base is `python:3.11-slim`).
- **ffmpeg** required for speech service — `conda install -c conda-forge ffmpeg` (Conda) or `winget install ffmpeg` (Windows).
- Install: `pip install -r requirements.txt`.
- Create `.env` in repo root (see README for full list). All Azure OpenAI vars + `ELEVEN_LABS_API_KEY`, `TAVILY_API_KEY`, `HUGGINGFACE_TOKEN`. No trailing whitespace after `=` (README warns).
- **No `Makefile`, no `package.json`, no `pyproject.toml`, no `tox.ini`, no test/lint config exists in this repo.**

## Build & run

- Local dev: `python app.py` → serves at `http://localhost:8000`. Health: `GET /health`.
- Vector DB ingest (single file): `python ingest_rag_data.py --file ./data/raw/brain_tumors_ucni.pdf`.
- Vector DB ingest (directory): `python ingest_rag_data.py --dir ./data/raw`.
- Docker: `docker build -t medical-assistant .` then `docker run -d --name medical-assistant-app -p 8000:8000 --env-file .env medical-assistant`. Container exposes 8000 and runs `python app.py`.
- CI: `.github/workflows/docker-image.yml` only builds the Docker image on push/PR to `main` — no test/lint jobs.

## Layout

- `app.py` — FastAPI app, routes (`/`, `/health`, `/chat`, `/upload`, `/validate`, `/speech`), background audio cleanup thread.
- `config.py` — single `Config` object composed of per-domain sub-configs (`AgentDecisoinConfig`, `ConversationConfig`, `WebSearchConfig`, `RAGConfig`, `MedicalCVConfig`, `SpeechConfig`, `ValidationConfig`, `APIConfig`, `UIConfig`). Loads `.env` at import time.
- `agents/agent_decision.py` — LangGraph orchestrator; routes to one of {RAG, web search, image-analysis, conversation} based on input. Implements `NodeInterrupt`-based human-in-the-loop validation.
- `agents/rag_agent/` — Docling-based doc parser, semantic chunker, Qdrant vector store + BM25, HuggingFace cross-encoder reranker (`ms-marco-TinyBERT-L-6`), query expander, response generator. Public entry: `MedicalRAG` in `__init__.py`.
- `agents/image_analysis_agent/` — image classifier + sub-agents: `chest_xray_agent/covid_chest_xray_inference.py`, `skin_lesion_agent/skin_lesion_inference.py`. `brain_tumor_agent/brain_tumor_inference.py` exists but is a stub (commented out in `__init__.py`).
- `agents/web_search_processor_agent/` — Tavily + PubMed searchers.
- `agents/guardrails/local_guardrails.py` — input/output guardrails.
- `templates/index.html` — single-page UI (served at `/`).
- `data/raw/` — PDFs to ingest; `data/qdrant_db/`, `data/docs_db/`, `data/parsed_docs/` — generated, gitignored.

## Conventions

- One `Config` class per concern, instantiated inside `Config.__init__`. Sub-config classes use `self.llm = AzureChatOpenAI(...)` (not pydantic). `AgentDecisoinConfig` is misspelled in the source — keep the typo when referencing it.
- LLM temperatures: decision=0.1, conversation=0.7, web_search=0.3, rag=0.3, summarizer=0.5, chunker=0.0, response_generator=0.3, image classification=0.1. Per-agent values matter — don't normalize.
- Embedding model: `text-embedding-ada-002`, dim 1536, Cosine distance (hardcoded in `RAGConfig`).
- RAG tuning constants in `config.py`: `chunk_size=512`, `chunk_overlap=50`, `top_k=5`, `reranker_top_k=3`, `min_retrieval_confidence=0.40` (controls RAG→web-search handoff), `max_context_length=8192`.
- Validation gating (`ValidationConfig.require_validation`): all three CV agents (brain/chest/skin) require human validation; RAG/web-search/conversation do not. Default on timeout = `reject`.
- Image upload limit: 5 MB (`APIConfig.max_image_upload_size`). Allowed extensions: `png`, `jpg`, `jpeg` (lowercase).
- Per-LLM-call logging uses `logging.getLogger(f"{self.__module__}")` with INFO step markers "1. Parsing...", "2. Summarizing..." in `MedicalRAG.ingest_file`/`process_query` — match that pattern when adding steps.
- Imports for `agents/rag_agent` are relative (`.doc_parser`, etc.); keep the dotted style.

## Pitfalls

- **First run downloads models on the fly** (Docling, CV model weights, cross-encoder reranker). Expect errors on first start; retry once downloads finish. README is explicit about this.
- **No tests, no linter, no formatter config.** `ruff` is installed via `requirements.txt` but no `ruff.toml`/CI step exists — running `ruff check` is fine but won't be enforced.
- **`.env` is gitignored.** Copy from README's template; never commit keys.
- **CV model weights are not in the repo.** Paths like `agents/image_analysis_agent/chest_xray_agent/models/covid_chest_xray_model.pth` must be populated separately (see `skin_lesion_agent/model_download.py` for an example download script). Missing weights → runtime error at first `/upload`.
- **Qdrant data lives in `data/qdrant_db/`.** Wiping it forces re-ingestion of all PDFs in `data/raw/`.
- **Brain-tumor agent is a stub** (`brain_tumor_inference.py` is 5 bytes; import line commented out in `agents/image_analysis_agent/__init__.py`). Don't enable it without supplying weights.
- **LLM provider is Azure OpenAI, not raw OpenAI.** Swapping to a different provider requires edits across every `AzureChatOpenAI(...)` instantiation in `config.py`; README says "code modification is required throughout the codebase."
- **Port 8000** is the only port used (`APIConfig.port`). Container's healthcheck curls `localhost:8000/health`; if you change ports, update both `APIConfig` and the Dockerfile `HEALTHCHECK`.
- **`uploads/speech/` is wiped every 5 minutes** by a daemon thread in `app.py` — generated audio is intentionally ephemeral.