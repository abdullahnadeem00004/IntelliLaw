from motor.motor_asyncio import AsyncIOMotorClient
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams
from app.core.config import settings

# ==========================================
# 1. MongoDB Setup (For storing raw text)
# ==========================================
mongo_client = AsyncIOMotorClient(settings.MONGODB_URI)
db = mongo_client.intellilaw
cases_collection = db.cases

# ==========================================
# 2. Qdrant Setup (For storing AI Vectors)
# ==========================================
qdrant_client = QdrantClient(
    url=settings.VECTOR_DB_URL,
    api_key=settings.VECTOR_DB_KEY
)

# CHANGED: We use a new collection name so it doesn't conflict with the old one
VECTOR_COLLECTION_NAME = "legal_sections_mini"

def init_qdrant():
    try:
        collections_response = qdrant_client.get_collections()
        existing_collections = [col.name for col in collections_response.collections]
        
        if VECTOR_COLLECTION_NAME not in existing_collections:
            # CHANGED: MiniLM-L6-v2 outputs exactly 384 dimensions
            qdrant_client.create_collection(
                collection_name=VECTOR_COLLECTION_NAME,
                vectors_config=VectorParams(size=384, distance=Distance.COSINE),
            )
            print(f"Successfully created Qdrant collection: {VECTOR_COLLECTION_NAME}")
        else:
            print(f"Qdrant collection '{VECTOR_COLLECTION_NAME}' already exists and is ready.")
            
    except Exception as e:
        print(f"Failed to connect to Qdrant: {str(e)}")