from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.embedding_service import get_embedding
from app.services.groq_client import generate_legal_answer
from app.core.database import qdrant_client, VECTOR_COLLECTION_NAME

router = APIRouter()

class SearchQuery(BaseModel):
    query: str
    top_k: int = 3 # How many legal sections to retrieve

@router.post("/ask")
async def ask_intellilaw(request: SearchQuery):
    """
    The core RAG endpoint: Embeds the query, searches Qdrant, and generates an answer.
    """
    try:
        # 1. Convert the user's question into a math vector
        query_vector = get_embedding(request.query)
        
        # 2. Search Qdrant for the closest matching laws (Using the NEW v1.16+ syntax)
        search_response = qdrant_client.query_points(
            collection_name=VECTOR_COLLECTION_NAME,
            query=query_vector,
            limit=request.top_k
        )
        
        # Extract the points from the response object
        search_results = search_response.points
        
        if not search_results:
            return {
                "answer": "No relevant legal documents found in the database.", 
                "sources": []
            }
            
        # 3. Extract the readable text from the database hits
        retrieved_context = [hit.payload for hit in search_results]
        
        # 4. Send the question AND the retrieved laws to Groq to generate the final answer
        final_answer = generate_legal_answer(request.query, retrieved_context)
        
        # Return the AI's answer along with the exact source documents it read
        return {
            "answer": final_answer,
            "sources": retrieved_context
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))