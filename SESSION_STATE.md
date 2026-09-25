# Session State: 2026-09-25

**Date:** 2026-09-25  
**Last Updated:** 01:28  
**Project:** blot2video (Textto-video)  
**Topic:** Testing and booting the Document-to-Video local application stack  

---

## What We Are Building

Transforming `blog2video` into a multi-format **Document-to-Video** tool (branded as *Textto-video* / *Doc2Video*). The platform accepts PDFs, Word documents, PowerPoint presentations, Excel spreadsheets, CSV data tables, Markdown, TXT, and VTT files, detects optimal visual structures (summary, explainer, presentation, dataviz), and generates scripted videos with Remotion and AI narration.

The GitHub repository has been set up at `https://github.com/superpollo02/Textto-video.git` on branch `main`. We are currently testing the local execution of the FastAPI backend and React frontend.

---

## What WORKED (with evidence)

- **Git & GitHub Repository Push**: Confirmed by `git push -u origin main` returning clean remote branch tracking to `https://github.com/superpollo02/Textto-video.git`.
- **Frontend Dependencies (`frontend`)**: Confirmed by `npm.cmd install` completing with code 0 (`added 778 packages`).
- **Remotion Video Dependencies (`remotion-video`)**: Confirmed by `npm.cmd install` completing with code 0 (`added 350 packages`).
- **Backend Core Dependencies**: Successfully installed `fastapi`, `uvicorn`, `sqlalchemy`, `pydantic-settings`, `boto3`, `PyMuPDF`, `python-docx`, `python-pptx`, `pdfplumber`, `openpyxl`, `opentelemetry`, `openai`, `anthropic`, `dspy`, `litellm`, etc.
- **SQLite Database Support**: Confirmed by inspection of `database.py` showing native auto-migration and table creation at startup (`IS_SQLITE = True`).
- **Backend Import Resilience**: Patched `app/support/llm_client.py` with fallback credentials so `AsyncOpenAI` does not throw `Missing credentials` at import time when `OPEN_ROUTER_KEY` is unset.

---

## What Did NOT Work (and why)

- **`fast-langdetect` build**: Failed because it relies on `fasttext-predict` which has no prebuilt wheel for Python 3.14 on Windows and required MSVC 14.0+. Resolved because `language_detection.py` has a safe try/except fallback defaulting to `"en"`.
- **`mcp>=2.0.0` attribute mismatch**: Installing default/unpinned `mcp` brought v2.2.0 where `@mcp_server.list_tools()` is deprecated/renamed. Pinned requirement in `requirements.txt` is `mcp==1.27.1`.
- **PowerShell ExecutionPolicy with `npm`**: Running `npm` called `npm.ps1` which was blocked by PowerShell's default script execution policy. Solved by calling `npm.cmd` directly.

---

## Current State of Files

| File | Status | Notes |
| --- | --- | --- |
| `backend/app/support/llm_client.py` | PASS: Complete | Added fallback key for dev startup |
| `backend/app/services/doc_extractor.py` | PASS: Complete | Supports XLSX, XLS, CSV, PDF, Word, PPT |
| `backend/app/routers/projects.py` | PASS: Complete | Multi-document MIME validation |
| `backend/app/routers/pipeline.py` | PASS: Complete | Video mode prompt steering fallback |
| `frontend/src/components/DocumentUploadZone.tsx` | PASS: Complete | Drag & drop document upload zone |
| `frontend/src/components/DocumentVideoModeSelector.tsx` | PASS: Complete | Mode selector (summary, explainer, presentation, dataviz) |
| `frontend/src/components/BlogUrlForm.tsx` | PASS: Complete | Integrated upload zone and mode selector |
| `frontend/src/pages/Dashboard.tsx` | PASS: Complete | Document-first onboarding UI |
| `frontend/src/pages/PdfLanding.tsx` | PASS: Complete | Rebranded landing page |
| `backend/requirements.txt` | PASS: Complete | Added `openpyxl>=3.1.0` |

---

## Decisions Made

- **Keep SQLite for local dev**: Allows immediate local testing without needing a running PostgreSQL instance or cloud Neon database.
- **Use `npm.cmd` on Windows**: Avoids PowerShell script execution policy errors with `npm.ps1`.
- **Graceful language fallback**: Avoid needing Microsoft C++ Build Tools for `fasttext-predict` under Python 3.14.

---

## Blockers & Open Questions

- Missing `mcp==1.27.1` package installation to resolve `AttributeError: 'Server' object has no attribute 'list_tools'`.
- Running servers locally in background daemon mode or side-by-side terminal windows.

---

## Exact Next Step

1. Run `python -m pip install mcp==1.27.1` in the backend directory.
2. Verify with `python -c "import app.main; print('OK')"` that the backend imports cleanly.
3. Start backend: `python -m uvicorn app.main:app --reload --port 8000` in `blog2video-main/blog2video-main/backend`.
4. Start frontend: `npm.cmd run dev` in `blog2video-main/blog2video-main/frontend`.
5. Open `http://localhost:5173` and verify the document upload functionality.

---

## Environment & Setup Notes

- **OS**: Windows (PowerShell)
- **Python**: 3.14.3 (`C:\Users\arifi\AppData\Local\Python\pythoncore-3.14-64\python.exe`)
- **Node.js**: v24.19.0 with npm 11.17.0 (`npm.cmd`)
- **Backend Directory**: `c:\Users\arifi\Documents\antigravity\blot2video\blog2video-main\blog2video-main\backend`
- **Frontend Directory**: `c:\Users\arifi\Documents\antigravity\blot2video\blog2video-main\blog2video-main\frontend`
- **Remote Git**: `https://github.com/superpollo02/Textto-video.git` (branch `main`)
