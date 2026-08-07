# 🦁 VYRAION OS — Autonomous AI Emergency Operations Platform

[![Vyraion OS CI Pipeline](https://github.com/Priyanshu-20079/VYRAION-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/Priyanshu-20079/VYRAION-ai/actions/workflows/ci.yml)

> **Singapore Emergency Operations Intelligence Engine**
> Merging Real-Time Swarm Agent Simulation, Anthropic Claude LLM Blueprint Synthesis, Persistent ChromaDB Vector RAG, and WebSockets Push Events.

---

## 🌟 Key Architecture & Live Features

- **🤖 Live Anthropic Claude LLM Engine (`/api/nova/blueprint`)**:
  Synthesizes multi-incident emergency response blueprints using live Claude reasoning models (`claude-3-5-sonnet-20241022`, `claude-3-7-sonnet-20250219`). Displays real wall-clock latency in the UI.

- **🧠 Persistent ChromaDB RAG Vector Store (`ai-service/`)**:
  FastAPI microservice embedding emergency SOPs into ChromaDB using local `sentence-transformers` (`all-MiniLM-L6-v2`). Supports PDF/Markdown text extraction, sliding window chunking (~500 tokens), and cosine similarity search.

- **⚡ Real-Time WebSockets Layer (`socket.io`)**:
  Instant event-driven state updates (`incident:created`, `incident:phase-changed`, `incident:approved`, `incident:resolved`) replacing laggy polling intervals.

- **📱 Installable Operator Console PWA**:
  Mobile-first Progressive Web App terminal for emergency operators with physical haptic vibration and push notifications.

- **🛡️ Resilient Demo Mode**:
  Explicit top amber banner (`⚠ Demo Mode — backend unreachable, using local session`) whenever the backend server is offline, ensuring complete transparency without hiding network state.

---

## 🚀 Quick Start Guide

### 1. Backend Express Server (Port 5000)
```bash
cd backend
npm install
npm run seed     # Pre-populates 3 active emergency scenarios
npm run dev      # Starts Express + Socket.io server
```

### 2. Python AI RAG Microservice (Port 8000)
```bash
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 3. Vite Frontend (Port 5173)
```bash
cd frontend
npm install
npm run dev
```

---

## 🔑 Environment Variables Reference

| Variable | Service | Description | Default |
| :--- | :--- | :--- | :--- |
| `ANTHROPIC_API_KEY` | Backend | Anthropic API Key for live Claude blueprint synthesis | `(Optional)` |
| `ANTHROPIC_MODEL` | Backend | Target Claude Model | `claude-3-5-sonnet-20241022` |
| `CHROMA_PERSIST_DIR` | AI Service | Path to persistent ChromaDB vector store | `./chroma_data` |
| `MONGODB_URI` | Backend | MongoDB connection string (write-through persistence) | `mongodb://localhost:27017/vyraion` |
| `VITE_API_URL` | Frontend | Backend Express API base URL | `http://localhost:5000` |
| `VITE_AI_SERVICE_URL` | Frontend | AI Microservice base URL | `http://localhost:8000` |

---

## 🧪 Testing & CI

```bash
# Run backend tests
cd backend && npm test

# Run frontend test suite
cd frontend && npm test
```
