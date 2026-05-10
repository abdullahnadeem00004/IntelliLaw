from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import uuid

from app.utils.document_parser import extract_text_from_pdf
from app.services.groq_client import structure_legal_text
from app.services.embedding_service import get_embedding
from app.core.database import cases_collection, qdrant_client, VECTOR_COLLECTION_NAME
from qdrant_client.http.models import PointStruct

router = APIRouter()

class IngestRequest(BaseModel):
    file_path: str
    statute_name: str

@router.post("/process-pdf")
async def process_pdf_endpoint(request: IngestRequest):
    """
    1. Extracts PDF text.
    2. Structures it into JSON using Groq.
    3. Saves the full JSON to MongoDB.
    4. Converts each section to a vector and saves to Qdrant.
    """
    if not os.path.exists(request.file_path):
        raise HTTPException(status_code=404, detail="PDF file not found on server.")
        
    try:
        # --- PHASE 2 LOGIC (Extract & Structure) ---
        raw_text = extract_text_from_pdf(request.file_path)
        structured_data = structure_legal_text(raw_text, request.statute_name)
        sections = structured_data.get("data", [])
        
        if not sections:
            return {"message": "No legal sections found by the AI."}

        # --- PHASE 3 LOGIC (Storage & Vectorization) ---
        
        # 1. Save to MongoDB
        doc_id = str(uuid.uuid4()) # Generate a unique ID for this PDF
        mongo_document = {
            "_id": doc_id,
            "statute_name": request.statute_name,
            "file_path": request.file_path,
            "sections": sections
        }
        await cases_collection.insert_one(mongo_document)
        
        # 2. Save to Qdrant
        points = []
        for section in sections:
            # Combine the title and text so the AI has maximum context when searching
            text_to_embed = f"{section['title']}. {section['text']}"
            
            # Convert that text into a 1024-dimension math vector
            vector = get_embedding(text_to_embed)
            
            # Create the Qdrant database point
            point = PointStruct(
                id=str(uuid.uuid4()), # Unique ID for this specific section
                vector=vector,
                payload={ # The metadata that travels with the vector
                    "mongo_doc_id": doc_id,
                    "statute": section["statute"],
                    "section": section["section"],
                    "title": section["title"],
                    "text": section["text"],
                    "tags": section["tags"]
                }
            )
            points.append(point)
        
        # Upload all points to the cloud vector database in one batch
        qdrant_client.upsert(
            collection_name=VECTOR_COLLECTION_NAME,
            points=points
        )
        
        return {
            "status": "success",
            "message": "PDF processed, saved to MongoDB, and vectorized in Qdrant!",
            "mongo_id": doc_id,
            "qdrant_points_inserted": len(points)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))