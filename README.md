# 🦁 VYRAION OS — Autonomous AI Emergency Operations Platform

[![Vyraion OS CI Pipeline](https://github.com/Priyanshu-20079/VYRAION-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/Priyanshu-20079/VYRAION-ai/actions/workflows/ci.yml)

> **Singapore Emergency Operations Intelligence Engine**
> Merging Real-Time Swarm Agent Simulation, Anthropic Claude LLM Blueprint Synthesis, Persistent ChromaDB Vector RAG, WebSockets Push Events, and MongoDB Atlas Persistence.

---

## 🚀 Live Demo Links

| Interface | URL | Purpose |
| :--- | :--- | :--- |
| **🌐 Main Dashboard** | `YOUR_FRONTEND_URL` | Main EOC Emergency Command Dashboard |
| **🚨 Operator Console** | `YOUR_OPERATOR_URL` | Standalone Operator PWA Dispatch Terminal |
| **📊 Dataset Generator** | `YOUR_DATASET_URL` | MongoDB Atlas Incident Dataset & Report Generator |
| **⚙️ Backend API** | `YOUR_BACKEND_URL` | Node.js / Express REST API & Socket.io Server |
| **🤖 AI Service** | `YOUR_AI_SERVICE_URL` | Python FastAPI Microservice & ChromaDB RAG Vector Store |
| **💻 GitHub** | [Priyanshu-20079/VYRAION-ai](https://github.com/Priyanshu-20079/VYRAION-ai) | Full Monorepo Source Code & CI Pipeline |

---

## 🔐 Demo Login Accounts

| Role | Email / ID | Password | Dashboard |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@vyraion.ai` | `Admin@2026` *(or any 6+ char pass)* | Admin Command Dashboard (`/dashboard`) |
| **Operator** | `operator@vyraion.ai` | `Dispatch@2026` | Operator Console (`/operator`) |
| **Police** | `DEMO ACCOUNT NOT CONFIGURED` | *(Accessible via UI Role Switcher)* | Police / Authority View |
| **Hospital** | `DEMO ACCOUNT NOT CONFIGURED` | *(Accessible via UI Role Switcher)* | Hospital & Healthcare View |

> [!NOTE]
> In addition to account login, judges can instantly test any operational role using the **Role Switcher** dropdown in the top header (`View: Authority`, `View: Hospital`, `View: Investigator`, `View: Reviewer`, `View: Admin`, `View: Citizen User`, `View: Operator`).

---

# 🧑‍⚖️ Complete Judge Demonstration

Follow this step-by-step walkthrough to test and evaluate the entire VYRAION OS platform from start to finish:

### STEP 1 — OPEN THE MAIN APPLICATION
```text
Main Dashboard URL:
YOUR_FRONTEND_URL
```
1. Navigate to the **Main Dashboard** in your browser (`YOUR_FRONTEND_URL` or `/dashboard`).
2. Log in using the Admin demo account (`admin@vyraion.ai`).
3. Confirm that the **Singapore Satellite Map**, **AI Decision Engine Status**, **Live Command Feed**, and **EOC Control Panels** load immediately.

### STEP 2 — TRIGGER AN EMERGENCY SIMULATION
1. Locate the **Emergency Simulation** trigger panel on the left sidebar.
2. Click any of the emergency triggers: **Traffic Accident**, **Fire Outbreak**, **Medical Emergency**, or **Hospital Power Failure**.
3. Confirm the newly created incident appears instantaneously on the interactive satellite map and broadcasts live via Socket.io to the **Live Command Feed**.

### STEP 3 — REVIEW AI BLUEPRINT SYNTHESIS
1. Observe the **AI Decision Engine** panel analyzing the active emergency.
2. Review the live LLM wall-clock latency (e.g. `4.3s`), AI confidence scores, and multi-agent specialist priority rankings (`Fire Response Agent`, `Healthcare Agent`, `Sentinel Agent`).

### STEP 4 — OPEN THE OPERATOR CONSOLE
```text
Operator Console URL:
YOUR_OPERATOR_URL
```
1. Open the standalone **Operator Console** in a separate browser tab or mobile viewport (`YOUR_OPERATOR_URL` or `/operator`).
2. Log in using `operator@vyraion.ai` / `Dispatch@2026`.
3. Review the pending incident in Phase 3 (*Awaiting Operator Approval*).
4. Click **Approve & Dispatch** to authorize emergency response units.

### STEP 5 — MONITOR REAL-TIME DISPATCH & CHECKLIST
1. Switch back to the EOC Dashboard or monitor directly in the Operator Console.
2. Watch emergency response units (Ambulance, Fire Engine, Traffic Police) navigating live road routes from station to scene.
3. Observe the **Incident Action Checklist** updating automatically as dispatched units reach the scene (*Units Arrived On Scene*, *Hospital Notified*).

### STEP 6 — RESOLVE THE INCIDENT
1. In the Incident Action Checklist panel or Operator Console, click **Resolve Incident**.
2. Confirm the incident transitions to Phase 5 (*RESOLVED*) and is saved permanently to MongoDB Atlas.

### STEP 7 — OPEN THE DATASET GENERATOR
```text
Dataset Generator URL:
YOUR_DATASET_URL
```
1. Open the **Dataset Generator** page (`YOUR_DATASET_URL` or `/dataset`).
2. Verify that total record counters reflect real-time records stored in MongoDB Atlas (`vyraion.incidents`).
3. Use the search input to filter for your resolved incident.

### STEP 8 — DOWNLOAD SINGLE INCIDENT REPORT
1. Locate the resolved incident row or open its detail drawer modal.
2. Click **Download Report** and select your preferred format: **PDF**, **CSV**, **HTML**, or **JSON**.
3. Open the downloaded file and confirm it contains full incident identity, timestamps, dispatched units, AI priorities, and 6-stage checklist verification history.

### STEP 9 — DEMONSTRATE ROLE-BASED DASHBOARDS
1. Locate the **Role Switcher** dropdown in the top header (`View: Authority`, `View: Hospital`, `View: Investigator`, `View: Reviewer`, `View: Admin`, `View: Citizen User`).
2. Switch to **Hospital** view to observe medical-scoped telemetry (`Viewing as: Hospital — Incidents involving medical/hospital response`).
3. Switch to **Investigator** view to audit closed/resolved incidents (`Viewing as: Investigator — Resolved and rejected incidents only`).

---

## 👥 Role-Based Dashboards & Operational Views

VYRAION OS features strict role-aware telemetry scoping across both backend REST endpoints (`GET /api/incidents/active?role=X`) and frontend UI filters:

```
                      ┌─────────────────────────────────┐
                      │    Role Scoping Telemetry       │
                      └────────────────┬────────────────┘
                                       │
        ┌──────────────┬───────────────┼───────────────┬──────────────┐
        ▼              ▼               ▼               ▼              ▼
   👑 Admin      👮 Police       🏥 Hospital     🚨 Operator    🔍 Investigator
   (All Data)   (Hazmat/Traffic)  (Trauma/Med)    (Dispatch/PWA)  (Post-Incident)
```

### 👑 Admin (`admin`)
- **Capabilities**: Unrestricted system visibility across all active and historical incidents sorted by severity (`CRITICAL` > `HIGH` > `ELEVATED` > `LOW`). Access to Dataset Generator, Analytics, System Configuration, and Neural Network parameters.

### 👮 Police / Authority (`authority`)
- **Capabilities**: Focuses on public safety, traffic collisions, hazardous material spills, road network clearance, and perimeter containment. Dispatches traffic police units and coordinates expressway corridors.

### 🏥 Hospital / Medical (`hospital`)
- **Capabilities**: Scoped to mass casualty triage, medical emergencies, trauma center readiness, and hospital power grid failures. Automatically filters for incidents with dispatched ambulance fleets (`u.category === 'hospital'`) or medical emergency classifications.

### 🚨 Operator (`operator`)
- **Capabilities**: Emergency dispatch terminal for EOC operators. Allows one-click incident approval/rejection, unit dispatch execution, checklist progress tracking, and mission completion.

### 🔍 Investigator (`investigator`)
- **Capabilities**: Post-incident forensic audit view. Scoped exclusively to closed, resolved, and rejected incidents (`status === 'RESOLVED'` or `'REJECTED'`).

### 🤖 Reviewer (`reviewer`)
- **Capabilities**: AI blueprint auditing view. Filters for incidents possessing AI-generated decision priorities and blueprint recommendations.

### 👤 Citizen User (`user`)
- **Capabilities**: Public alert view. Filters active, non-closed incidents (`excludes RESOLVED and REJECTED`).

---

## 🚨 Operator Console PWA Terminal

URL: `YOUR_OPERATOR_URL` *(or `/operator`)*

The **Operator Console** is a mobile-optimized Progressive Web App (PWA) designed for field dispatchers:

```
Operator Login
     ↓
Operator Console Terminal (/operator)
     ↓
Active Incident Queue (Phase 3 Awaiting Approval)
     ↓
Review Incident Telemetry & AI Blueprint
     ↓
Approve & Dispatch / Reject
     ↓
Monitor Real-Time GPS Response Unit Movement
     ↓
Incident Action Checklist (Automated Station-to-Scene Arrival)
     ↓
Resolve Incident
     ↓
Incident Report Generated
```

- **Features**: Single active session enforcement, haptic vibration alerts, sound effects, real-time Socket.io state sync, and direct resolution triggers.

---

## 📊 Dataset Generator

URL: `YOUR_DATASET_URL` *(or `/dataset`)*

The Dataset Generator reads real emergency incident records directly from MongoDB Atlas and converts them into a tabular dataset.

```
┌─────────────────┐      ┌─────────────────────────┐      ┌──────────────────┐
│  MongoDB Atlas  │ ───► │ Database: vyraion       │ ───► │ Dataset Generator│
│  Single Source  │      │ Collection: incidents   │      │ Preview & Export │
└─────────────────┘      └─────────────────────────┘      └──────────────────┘
```

- **Features**:
  - Reads directly from `vyraion.incidents` via `GET /api/dataset`.
  - Real-time search query filtering across Title, Category, Hotspot, and Unique ID.
  - Interactive pagination and record counters (`Total Records`, `Database Name`, `MongoDB Source`).
  - Raw MongoDB document JSON payload viewer drawer.
  - 100% Read-Only pipeline preserving historical MongoDB Atlas records.

---

## 📄 Single Incident Report Export

Judges can select **ANY individual incident** from the Dataset Generator table or detail drawer to export a project-specific resolution report:

```
Dataset Generator Row / Modal
             ↓
   Select Single Incident
             ↓
 ┌───────┬───────┬───────┬───────┐
 │  PDF  │  CSV  │ HTML  │ JSON  │
 └───────┴───────┴───────┴───────┘
```

### Supported Export Formats
- **PDF Report** (`format=pdf`): Server-side binary PDF stream built with `PDFKit` (`Content-Type: application/pdf`). Filename format: `incident-report-<id>.pdf`.
- **CSV Report** (`format=csv`): Formatted tabular CSV file containing full incident metrics.
- **HTML Report** (`format=html`): Printable standalone web report styled for dark UI and light print media.
- **JSON Payload** (`format=json`): Full structured JSON payload for external analysis.

### Standardized Report Contents
- **Source**: `MongoDB Atlas / vyraion.incidents`
- **Identity**: MongoDB `_id`, `uniqueId`, `id`
- **Details**: Title, Type, Severity, Status, Phase
- **Timestamps**: Time Detected, Created At, Approved At, Resolved At, Updated At
- **Location**: Hotspot Zone, Coordinates (`lat`, `lng`), Destination
- **Response**: Dispatched Units, Assigned Agents, Operator, Detected By
- **AI Blueprints**: Ranked Priorities, AI Reasoning Time, Impact Strategy
- **Action Checklist**: 6-Stage Checklist Verification Status
- **Resolution**: Resolution Outcome & Total Mission Duration

---

## 🗄️ MongoDB Atlas Data Flow

```
  ┌────────────────┐
  │  Vite Frontend │
  └───────┬────────┘
          │ HTTP / REST & WebSockets
          ▼
  ┌────────────────┐
  │  Express API   │
  └───────┬────────┘
          │ Mongoose ODM
          ▼
  ┌────────────────┐
  │ MongoDB Atlas  │
  │ Database:      │ vyraion
  │ Collection:    │ incidents
  └────────────────┘
```

- **Persistence Policy**: MongoDB Atlas is the single source of truth.
- **Reset City Isolation**: Triggering *Reset City Status* resets live runtime simulation queues (`inMemoryIncidents`) and broadcasts `incident:reset` while keeping all historical MongoDB Atlas documents intact.

---

## 🚨 Incident Lifecycle Flow

```
Emergency Event Triggered (Traffic / Fire / Medical / Power)
                         │
                         ▼
           MongoDB Atlas Document Created
                         │
                         ▼
        AI Decision Engine (Claude LLM Blueprint)
                         │
                         ▼
          Phase 3: Awaiting Operator Approval
                         │
                         ▼
      Operator Approves & Dispatches Units (Phase 4)
                         │
                         ▼
       Real-Time Unit Navigation & Checklist Update
                         │
                         ▼
       Incident Resolved & Report Available (Phase 5)
```

---

## 🤖 AI Engine & RAG Architecture

### 1. Anthropic Claude LLM Synthesis (`/api/nova/blueprint`)
- Uses `claude-3-5-sonnet-20241022` or `claude-3-7-sonnet-20250219` to synthesize multi-agent response blueprints.
- Renders real wall-clock LLM latency (e.g. `4.3s`) directly in the UI header.

### 2. Python ChromaDB RAG Microservice (`ai-service/`)
- **Framework**: FastAPI + Uvicorn (`port 8000`).
- **Embedding Model**: Local `sentence-transformers` (`all-MiniLM-L6-v2`).
- **Vector Store**: Persistent ChromaDB (`./chroma_data`).
- **SOP Ingestion**: Extracting PDF/Markdown emergency SOP manuals into overlapping chunks (~500 tokens) with cosine similarity retrieval.

---

## ⚡ Real-Time WebSockets (Socket.io)

Instant push notifications and UI state sync powered by Socket.io:

| Socket.io Event | Trigger Condition | Payload Content |
| :--- | :--- | :--- |
| `incident:created` | Emergency triggered via UI or Vision API | Full Incident Document |
| `incident:phase-changed` | Phase transition (Phase 1 → Phase 5) | `id`, `phase`, `status`, `incident` |
| `incident:approved` | Operator approves emergency dispatch | Approved Incident Object |
| `incident:resolved` | Emergency checklist complete & resolved | Resolution Report & Metadata |
| `incident:reset` | Reset City Status executed | `{ id: 'all', reset: true }` |

---

## 📋 Incident Action Checklist

Every active incident tracks a 6-stage operational checklist:

1. **Incident Verified**: Telemetry confirmed by AI vision or emergency call dispatch.
2. **Response Team Notified**: Multi-agent EOC notification dispatched.
3. **Emergency Units Dispatched**: Response units assigned and en route.
4. **Units Arrived On Scene**: Navigation state transition triggered upon scene arrival.
5. **Hospital / Medical Notified**: Trauma center notified of incoming casualties.
6. **Incident Resolved**: Emergency stabilized and mission complete.

---

## 🛠️ Local Development Quick Start

### 1. Prerequisites
- Node.js `v18+`
- Python `3.10+`
- MongoDB Atlas Connection String (or local MongoDB)

### 2. Backend Express Server (Port 5000)
```bash
cd backend
npm install
npm run seed     # Pre-populates demo incidents
npm run dev      # Starts Express API & Socket.io on http://localhost:5000
```

### 3. Python AI RAG Microservice (Port 8000)
```bash
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 4. Vite Frontend Application (Port 5173)
```bash
cd frontend
npm install
npm run dev      # Starts Vite dev server on http://localhost:5173
```

---

## 🔑 Environment Variables Reference

| Variable | Service | Description | Sample / Default Value |
| :--- | :--- | :--- | :--- |
| `MONGODB_URI` | Backend | MongoDB Atlas Connection String | `<YOUR_MONGODB_ATLAS_CONNECTION_STRING>` |
| `ANTHROPIC_API_KEY` | Backend | Anthropic Claude API Key | `(Optional)` |
| `ANTHROPIC_MODEL` | Backend | Claude LLM Model Name | `claude-3-5-sonnet-20241022` |
| `JWT_SECRET` | Backend | JWT Signing Key | `<YOUR_JWT_SECRET>` |
| `VITE_API_URL` | Frontend | Express Backend REST Base URL | `http://localhost:5000` |
| `VITE_AI_SERVICE_URL` | Frontend | FastAPI AI Service Base URL | `http://localhost:8000` |
| `CHROMA_PERSIST_DIR` | AI Service | ChromaDB Persistent Storage Directory | `./chroma_data` |

---

## 🧪 Automated Testing & CI

```bash
# Run Backend Jest Test Suite (19/19 tests)
cd backend
npm test

# Run End-to-End Integration Audit Script
cd backend
node tests/test-full-bounty-audit.js

# Verify Frontend Production Build
cd frontend
npm run build
```

---

## 📁 Repository Structure

```
VYRAION-ai/
├── backend/                      # Node.js / Express / Socket.io / Mongoose API
│   ├── src/
│   │   ├── config/              # MongoDB & Environment Config
│   │   ├── models/              # Incident & User Mongoose Schemas
│   │   ├── routes/              # Incident, Auth, Dataset, Vision & Nova Routes
│   │   ├── services/            # Incident Engine & PDF/CSV/HTML/JSON Report Generator
│   │   └── scripts/             # Demo Seeding & Sample Export Generators
│   └── tests/                   # Jest Test Suites & E2E Integration Audit Scripts
├── frontend/                     # React 18 / Vite / Tailwind CSS Web Application
│   ├── src/
│   │   ├── components/          # Satellite Maps, Vision Telemetry, Checklists & Headers
│   │   ├── context/             # Auth, Socket & ViewRole Context Providers
│   │   ├── pages/               # Dashboard, Operator Console, Dataset Generator, Analytics
│   │   └── utils/               # Role Filters, LLM Decision Engine & Status Colors
├── ai-service/                   # Python FastAPI / ChromaDB RAG Vector Store
│   ├── app/                     # Vector RAG, FastAPI Routes & SOP Chunking
│   └── data/                    # Emergency SOP Reference Documents
├── sample-exports/               # Pre-generated Sample PDF & CSV Incident Reports
└── README.md                     # Monorepo Documentation
```

---

## 🏆 Hackathon Feature Highlights

- **AI-Powered Decision Engine**: Claude LLM blueprint synthesis with live latency telemetry.
- **RAG Emergency Knowledge Base**: Sentence-transformers & ChromaDB vector store for SOP retrieval.
- **Real-Time WebSockets**: Socket.io event stream powering instant state synchronization.
- **Persistent MongoDB Atlas Engine**: Write-through document storage for emergency records.
- **Role-Aware Security & Scoping**: 7 operational role views with dynamic filter captions.
- **Installable Operator PWA**: Haptic-enabled mobile terminal for dispatch operators.
- **Single Incident Report Generator**: One-click PDF, CSV, HTML, and JSON resolution reports.

---

## 🔒 Security & Data Safety

- Never commit `.env` or secret keys to version control.
- Sample environment variables are provided via `.env.example` files in each service directory.
- All MongoDB Atlas connections use encrypted TLS transactions with sanitized connection strings.
