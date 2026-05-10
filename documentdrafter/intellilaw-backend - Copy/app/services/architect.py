import os
import json
from pydantic import BaseModel, Field
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from docx import Document
from dotenv import load_dotenv

load_dotenv()

# --- THE PYDANTIC SCHEMA FOR THE ARCHITECT ---
class ArchitectDesign(BaseModel):
    system_prompt: str = Field(description="The system prompt for the drafting AI, giving it a persona for this specific document type.")
    ai_generated_fields: dict[str, str] = Field(description="A dictionary mapping variable names (e.g., 'groom_name', 'eviction_clause') to instructions on how the Drafter Agent should extract or generate them.")
    blueprint_text: str = Field(description="The full raw text of the legal document. You MUST include {{variable_names}} matching the ai_generated_fields exactly where data needs to be injected.")

# --- THE ARCHITECT AI ---
def design_template(document_type: str, instructions: str) -> ArchitectDesign:
    print(f"🧠 [Architect] Designing new template for: {document_type}...")
    
    # We use a heavier model for architecture design
    llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.1)
    structured_llm = llm.with_structured_output(ArchitectDesign)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are an elite legal systems architect in Pakistan. 
        A user has requested a document type that does not exist in our database. 
        Your job is to design the JSON manifest and the Word blueprint text.
        Ensure the blueprint text contains {{jinja_tags}} that perfectly match the keys in your ai_generated_fields dictionary."""),
        ("human", "Document Type: {doc_type}\nUser Instructions: {instructions}\n\nGenerate the ArchitectDesign now.")
    ])
    
    chain = prompt | structured_llm
    return chain.invoke({"doc_type": document_type, "instructions": instructions})

# --- THE BLACKSMITH (FILE GENERATOR) ---
def create_physical_word_blueprint(text_content: str, save_path: str):
    print(f"🔨 [Blacksmith] Forging physical Word document at {save_path}...")
    doc = Document()
    
    # Add the text line by line to keep formatting clean
    for line in text_content.split('\n'):
        doc.add_paragraph(line)
        
    doc.save(save_path)