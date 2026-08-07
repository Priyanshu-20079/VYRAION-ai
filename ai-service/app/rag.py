import os
import io
import re
import math
import uuid
import datetime
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.utils import embedding_functions
from pypdf import PdfReader
from app.config import settings

/* ═══════════════════════════════════════════════════════════
   VYRAION RAG KNOWLEDGE BASE ENGINE
   Persistent ChromaDB Collection with Local Sentence Transformers Embeddings
═══════════════════════════════════════════════════════════ */

CHROMA_DIR = os.path.abspath(settings.CHROMA_PERSIST_DIR)
os.makedirs(CHROMA_DIR, exist_ok=True)

# Initialize ChromaDB Persistent Client
chroma_client = chromadb.PersistentClient(path=CHROMA_DIR)

# Local sentence-transformers embedding function (free, local, no API key required)
try:
    embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name="all-MiniLM-L6-v2"
    )
except Exception as e:
    print(f"[RAG Engine] SentenceTransformer fallback warning: {e}")
    embedding_fn = embedding_functions.DefaultEmbeddingFunction()

COLLECTION_NAME = "vyraion_knowledge_base"

def get_collection():
    return chroma_client.get_or_create_collection(
        name=COLLECTION_NAME,
        embedding_function=embedding_fn,
        metadata={"hnsw:space": "cosine"}
    )

def chunk_text(text: str, chunk_size: int = 600, overlap: int = 100) -> List[str]:
    """Splits text into sliding window chunks of ~500-600 characters."""
    if not text or not text.strip():
        return []
    
    clean_text = re.sub(r'\s+', ' ', text).strip()
    if len(clean_text) <= chunk_size:
        return [clean_text]
    
    chunks = []
    start = 0
    while start < len(clean_text):
        end = start + chunk_size
        chunk = clean_text[start:end]
        chunks.append(chunk)
        start += (chunk_size - overlap)
    
    return chunks

def extract_file_text(file_name: str, file_bytes: bytes) -> str:
    """Extracts raw text content from uploaded .txt, .md, .json, or .pdf files."""
    ext = os.path.splitext(file_name)[1].lower()
    
    if ext in ['.pdf']:
        try:
            reader = PdfReader(io.BytesIO(file_bytes))
            text_pages = [page.extract_text() or '' for page in reader.pages]
            return "\n".join(text_pages).strip()
        except Exception as err:
            raise ValueError(f"Failed to parse PDF file text: {err}")
    
    try:
        return file_bytes.decode('utf-8', errors='ignore').strip()
    except Exception as err:
        raise ValueError(f"Failed to decode text file: {err}")

def add_document(doc_name: str, text_content: str, category: str = "Standard Protocol") -> Dict[str, Any]:
    """Chunks text content, embeds each chunk, and upserts to ChromaDB."""
    collection = get_collection()
    chunks = chunk_text(text_content)
    
    if not chunks:
        raise ValueError("Document contains no readable text content.")
    
    ids = []
    documents = []
    metadatas = []
    timestamp = datetime.datetime.utcnow().isoformat()
    
    for idx, chunk in enumerate(chunks):
        chunk_id = f"{doc_name.lower().replace(' ', '_')}_chk_{idx}_{uuid.uuid4().hex[:6]}"
        ids.append(chunk_id)
        documents.append(chunk)
        metadatas.append({
            "doc_name": doc_name,
            "category": category,
            "chunk_index": idx,
            "total_chunks": len(chunks),
            "uploaded_at": timestamp
        })
    
    collection.upsert(
        ids=ids,
        documents=documents,
        metadatas=metadatas
    )
    
    return {
        "doc_name": doc_name,
        "category": category,
        "chunk_count": len(chunks),
        "uploaded_at": timestamp
    }

def search_knowledge(query_text: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """Embeds query text, runs cosine similarity search on ChromaDB, and returns top matches."""
    if not query_text or not query_text.strip():
        return []
    
    collection = get_collection()
    results = collection.query(
        query_texts=[query_text],
        n_results=min(top_k, max(1, collection.count()))
    )
    
    if not results or not results['documents'] or not results['documents'][0]:
        return []
    
    formatted_results = []
    docs = results['documents'][0]
    metas = results['metadatas'][0] if results['metadatas'] else []
    distances = results['distances'][0] if results['distances'] else []
    
    for idx in range(len(docs)):
        distance = distances[idx] if idx < len(distances) else 0.5
        # Convert cosine distance to similarity score (0.0 to 1.0)
        similarity = max(0.0, min(1.0, 1.0 - (distance / 2.0 if distance > 1.0 else distance)))
        meta = metas[idx] if idx < len(metas) else {}
        
        formatted_results.append({
            "id": results['ids'][0][idx] if results['ids'] else f"res_{idx}",
            "title": meta.get("doc_name", "Emergency SOP Document"),
            "category": meta.get("category", "Operations SOP"),
            "score": round(similarity * 100, 1),
            "similarity": round(similarity, 4),
            "snippet": docs[idx],
            "chunk_index": meta.get("chunk_index", 0),
            "total_chunks": meta.get("total_chunks", 1)
        })
    
    return formatted_results

def get_documents_list() -> List[Dict[str, Any]]:
    """Retrieves list of indexed documents with real chunk counts from ChromaDB metadata."""
    collection = get_collection()
    total_chunks_count = collection.count()
    
    if total_chunks_count == 0:
        return []
    
    # Query all metadata in collection
    all_items = collection.get(include=["metadatas"])
    metadatas = all_items.get("metadatas", [])
    
    doc_summary = {}
    for meta in metadatas:
        if not meta or "doc_name" not in meta:
            continue
        doc_name = meta["doc_name"]
        category = meta.get("category", "Emergency SOP")
        uploaded_at = meta.get("uploaded_at", "System Startup")
        
        if doc_name not in doc_summary:
            doc_summary[doc_name] = {
                "name": doc_name,
                "category": category,
                "chunks": 0,
                "uploaded_at": uploaded_at,
                "status": "Indexed & Vectorized"
            }
        doc_summary[doc_name]["chunks"] += 1
    
    return list(doc_summary.values())

def seed_sop_documents():
    """Seeds ChromaDB collection at startup with 5 real short SOP-style emergency documents."""
    collection = get_collection()
    if collection.count() > 0:
        return  # Collection already populated
    
    sop_docs = [
        {
            "doc_name": "Traffic Incident Coordinated Response Protocol.md",
            "category": "Expressway Operations",
            "content": """SOP-SGP-TRAFFIC-041: Coordinated Expressway Emergency Traffic Management.
1. Incident Detection & Verification: Road sensors and CCTV AI fusion confirm lane obstruction on major expressways (PIE, AYE, CTE, ECP).
2. Green-Wave Signal Sync: Traffic Control Agent overrides 14 SCADA traffic lights to establish an uninterrupted 80 km/h emergency corridor for responding SCDF fire engines and ALS ambulances.
3. Fast Clearance & Towing: Tow trucks and traffic police units clear vehicles within 12 minutes of arrival to prevent secondary tailback collisions."""
        },
        {
            "doc_name": "Hospital Emergency Power & Grid Backup Protocol.md",
            "category": "Critical Infrastructure",
            "content": """SOP-SGP-[#954]: Regional Hospital Substation Failure & Microgrid Emergency Response.
1. Grid Isolation: If primary 230kV substation power trips, Sentinel Agent isolates hospital SCADA feeder within 1.2 seconds.
2. Fuel Reserve Allocation: Auxiliary diesel generators engage instantly, maintaining 100% uninterrupted ICU power, ventilator support, and surgical operating theatre systems.
3. SCADA Rerouting: Infrastructure Agent coordinates automatic grid transfer from secondary SCADA substations within 4 minutes."""
        },
        {
            "doc_name": "Industrial Fire & Hazmat Containment SOP.md",
            "category": "Fire & Rescue",
            "content": """SOP-SGP-HAZMAT-108: SCDF Hazardous Material Vapor Plume Neutralization.
1. Thermal Anomaly Identification: Infrared drone sensors identify chemical storage tank rupture and thermal plume propagation.
2. Foam Appliance Deployment: Hazmat decontamination units and heavy foam tenders establish a 200-meter safety perimeter.
3. Vapor Suppression: Chemical neutralizer mist spray is deployed to bind toxic airborne particles and prevent community exposure."""
        },
        {
            "doc_name": "Monsoon Flood & Stormwater Drainage Protocol.md",
            "category": "PUB Water Infrastructure",
            "content": """SOP-SGP-PUB-202: Extreme Monsoon Rainfall & Drainage Pump Telemetry.
1. Rainfall Threshold Telemetry: Weather sensors detecting >60mm/hr rainfall trigger automated canal flood barrier warnings.
2. High-Capacity Drainage Pumps: PUB stormwater drainage pump stations activate at Marina Barrage and Bukit Timah underpass.
3. Transit Tunnel Safeguarding: Sub-surface barrier gates protect underground MRT tunnels from stormwater ingress."""
        },
        {
            "doc_name": "Public Safety Transit Station Lockdown Protocol.md",
            "category": "Security & Counter-Terrorism",
            "content": """SOP-SGP-SPF-303: Unattended Package & Transit Station Lockdown Protocol.
1. AI Camera Object Detection: Concourse CCTV AI flags unattended luggage stationary for >180 seconds.
2. Platform Evacuation: Station Master issues immediate platform evacuation and redirects MRT trains to bypass station.
3. K9 & X-Ray Robot Deployment: Tactical Police K9 units and autonomous X-ray scanning robots scan package to verify non-explosive status."""
        }
    ]
    
    for doc in sop_docs:
        add_document(doc["doc_name"], doc["content"], doc["category"])
    
    print(f"[RAG Engine] Successfully seeded {len(sop_docs)} SOP documents ({collection.count()} chunks) into ChromaDB.")
