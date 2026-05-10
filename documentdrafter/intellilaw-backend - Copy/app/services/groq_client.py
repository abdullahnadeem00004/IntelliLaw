import json
from groq import Groq
from app.core.config import settings

# Initialize the Groq client using the API key from your config
client = Groq(api_key=settings.GROQ_API_KEY)

def structure_legal_text(raw_text: str, statute_name: str) -> dict:
    """
    Sends raw extracted PDF text to Llama 3.1 8B to format into strict JSON.
    """
    system_prompt = f"""
    You are an expert Legal Data Engineer for IntelliLaw. Your job is to extract legal sections from the provided text and output ONLY a valid JSON array.
    DO NOT summarize or alter the legal text. Ensure 5 relevant semantic tags are included per section.
    
    Output a JSON object with a single key "data" containing an array of these objects:
    {{
      "statute": "{statute_name}",
      "section": "Section Number",
      "title": "Heading of the section",
      "text": "Exact text of the law",
      "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
    }}
    """

    try:
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Extract and format this text:\n\n{raw_text[:25000]}"} 
            ],
            model="llama-3.1-8b-instant",
            temperature=0.1, # Low temperature so it doesn't hallucinate fake laws
            response_format={"type": "json_object"} # Forces the AI to return valid JSON
        )
        
        # Parse the string response into an actual Python dictionary
        result = json.loads(response.choices[0].message.content)
        return result
        
    except Exception as e:
        raise Exception(f"Groq API Error: {str(e)}")

def generate_legal_answer(query: str, retrieved_context: list) -> str:
    """
    Takes the user's question and the laws retrieved from Qdrant,
    and forces the AI to answer ONLY using those laws.
    """
    # Format the retrieved laws into a readable string for the AI
    context_str = "\n\n".join([
        f"Statute: {item['statute']}\nSection: {item['section']} - {item['title']}\nText: {item['text']}"
        for item in retrieved_context
    ])

    system_prompt = """
    You are IntelliLaw, an expert AI legal assistant for the Pakistani legal system.
    Answer the user's query using ONLY the provided legal context.
    If the context does not contain the answer, you must say "I cannot answer this based on the currently loaded legal documents."
    Do not invent or hallucinate laws. Always cite the specific statute and section you used in your answer.
    """

    try:
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Context:\n{context_str}\n\nUser Query: {query}"}
            ],
            model="llama-3.1-8b-instant",
            temperature=0.2 # Keep it low for factual legal accuracy
        )
        return response.choices[0].message.content
        
    except Exception as e:
        raise Exception(f"Groq QA Error: {str(e)}")