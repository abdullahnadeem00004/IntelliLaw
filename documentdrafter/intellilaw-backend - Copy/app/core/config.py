import os
from dotenv import load_dotenv

# Force Python to read the .env file in the root directory
load_dotenv()

class Settings:
    PROJECT_NAME: str = "IntelliLaw AI Backend"
    
    # AI Model Keys
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY")
    HF_TOKEN: str = os.getenv("HF_TOKEN")
    
    # Database Connections
    MONGODB_URI: str = os.getenv("MONGODB_URI")
    VECTOR_DB_URL: str = os.getenv("VECTOR_DB_URL")
    VECTOR_DB_KEY: str = os.getenv("VECTOR_DB_KEY")

# Create a single instance of these settings to use throughout the app
settings = Settings()