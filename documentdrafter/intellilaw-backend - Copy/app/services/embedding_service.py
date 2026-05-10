from fastembed import TextEmbedding

# Initialize the model once when the server starts.
# This uses 'BAAI/bge-small-en-v1.5' which outputs exactly 384 dimensions
# (perfectly matching our database configuration!)
model = TextEmbedding()

def get_embedding(text: str) -> list[float]:
    """
    Generates a 384-dimension vector locally.
    No Hugging Face API key, no internet lag, no cloud crashes!
    """
    try:
        # FastEmbed expects a list of texts, so we wrap ours in brackets
        embeddings_generator = model.embed([text])
        
        # Extract the vector and convert it from a numpy array to a standard Python list
        vector = next(embeddings_generator).tolist()
        return vector
        
    except Exception as e:
        raise Exception(f"Local Embedding Error: {str(e)}")