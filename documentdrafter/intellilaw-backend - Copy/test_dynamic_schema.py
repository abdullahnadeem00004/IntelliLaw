from pydantic import create_model, Field
from langchain_groq import ChatGroq
import os
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

# Initialize the LLM
llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0.1)

print("1. Reading the simulated Manifest...")
# Imagine this dictionary comes from our tpl_rent_002.json manifest file
manifest_required_ai_fields = {
    "eviction_clause": "Strict legal clause detailing eviction process for non-payment of rent.",
    "maintenance_responsibilities": "Legal clause defining that the tenant fixes minor issues, but landlord handles structural issues."
}

print("2. Building the Dynamic Pydantic Model at runtime...")
# We use dictionary comprehension to map our manifest into Pydantic Field objects
# The format is: { "field_name": (Type, Field(description)) }
dynamic_fields = {
    key: (str, Field(description=desc)) 
    for key, desc in manifest_required_ai_fields.items()
}

# create_model is a native Pydantic function that builds a class dynamically
DynamicDraftOutput = create_model('DynamicDraftOutput', **dynamic_fields)

print("3. Binding the dynamic model to Llama 3...")
structured_llm = llm.with_structured_output(DynamicDraftOutput)

print("4. Executing the AI call...\n")
# We just give it a simple prompt. The guardrail forces the structure.
response = structured_llm.invoke("Write the rent clauses for a residential property in Lahore. The monthly rent is 60,000 PKR.")

# Print the resulting JSON
print("🏁 AI Output:")
print(json.dumps(response.model_dump(), indent=2))