from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.config import settings
from app.rag import seed_sop_documents, add_document, search_knowledge, get_documents_list, extract_file_text

app = FastAPI(
    title=settings.APP_NAME,
    description="Vyraion AI Microservice — RAG Knowledge Base & Embeddings Engine",
    version="1.0.0"
)

# Enable CORS for all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    try:
        seed_sop_documents()
    except Exception as e:
        print(f"[RAG Microservice] Startup SOP seeding warning: {e}")

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "environment": settings.ENVIRONMENT
    }

class SearchQueryPayload(BaseModel):
    query: str
    top_k: Optional[int] = 5

@app.post("/api/knowledge/search")
def search_knowledge_base(payload: SearchQueryPayload):
    try:
        results = search_knowledge(payload.query, top_k=payload.top_k or 5)
        return {
            "success": True,
            "query": payload.query,
            "results": results,
            "total_results": len(results)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Knowledge search failed: {str(e)}")

@app.post("/api/knowledge/upload")
async def upload_document(
    file: UploadFile = File(...),
    category: Optional[str] = Form("Standard Protocol")
):
    try:
        content_bytes = await file.read()
        extracted_text = extract_file_text(file.filename, content_bytes)
        
        if not extracted_text:
            raise HTTPException(status_code=400, detail="Uploaded file contains no readable text.")
        
        result = add_document(file.filename, extracted_text, category=category or "Standard Protocol")
        
        return {
            "success": True,
            "message": f"Document '{file.filename}' processed and indexed into ChromaDB successfully.",
            "document": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document upload processing failed: {str(e)}")

@app.get("/api/knowledge/documents")
def list_knowledge_documents():
    try:
        docs = get_documents_list()
        total_chunks = sum(d.get("chunks", 0) for d in docs)
        
        return {
            "success": True,
            "documents": docs,
            "total_documents": len(docs),
            "total_chunks": total_chunks
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list documents: {str(e)}")
