from typing import TypedDict, List, Any
from langgraph.graph import StateGraph, END
from pydantic import BaseModel, Field, create_model
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv
import json

load_dotenv()

# Initialize the LLM
llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0.2)

# --- THE UNIVERSAL STATE ---
class DraftState(TypedDict):
    request_payload: dict      # The original API request
    manifest: dict             # The JSON config for the requested document
    extracted_facts: dict      # Facts the Paralegal pulls out
    retrieved_laws: List[str]  # Case law from Qdrant (if needed)
    current_draft: dict        # The actual paragraphs being written
    review_feedback: str       # Notes from the Red Team Reviewer
    revision_count: int        # To prevent infinite loops

# --- PILLAR 3: THE CONTEXT-AWARE AGENTS ---

def flatten_complex_objects(data: dict) -> dict:
    """Convert complex objects to readable strings for Word document compatibility."""
    flattened = {}
    for key, value in data.items():
        if isinstance(value, str):
            flattened[key] = value
        elif isinstance(value, dict):
            # Format dictionary as readable text
            items = []
            for k, v in value.items():
                items.append(f"{k.replace('_', ' ').title()}: {v}")
            flattened[key] = "\n".join(items)
        elif isinstance(value, list):
            # Format list as bullet points
            items = [f"• {item}" for item in value]
            flattened[key] = "\n".join(items)
        elif isinstance(value, (int, float, bool)):
            flattened[key] = str(value)
        else:
            # For other types, convert to JSON string
            flattened[key] = json.dumps(value, indent=2)
    return flattened

def paralegal_node(state: DraftState) -> DraftState:
    print(f"👨‍💼 [Paralegal] Analyzing manifest for: {state['manifest']['document_type']}")
    
    # 1. Organize human facts
    state["extracted_facts"] = {
        "client_details": state["request_payload"].get("client", {}),
        "case_details": state["request_payload"].get("case_details", {}),
        "custom_instructions": state["request_payload"].get("custom_instructions", "")
    }
    
    # 2. Check the manifest: Do we need case law?
    if state["manifest"].get("requires_case_law_rag", False):
        print("   -> 📚 Manifest requires case law. Searching Qdrant...")
        # TODO: Wire up actual Qdrant search here later
        state["retrieved_laws"] = ["Mock Case Law: Section 411/414 maximum sentence is 3 years."]
    else:
        print("   -> ⏩ No case law required for this document. Skipping Qdrant.")
        state["retrieved_laws"] = []
        
    return state

def drafter_node(state: DraftState) -> DraftState:
    print(f"✍️ [Drafter] Writing draft using Llama 3 (Revision: {state['revision_count']})...")
    
    manifest = state["manifest"]
    
    # 1. PILLAR 2: DYNAMIC SCHEMA GENERATION
    # Read the fields required by the manifest and build a Pydantic model at runtime
    # Use Any type to allow strings, dicts, lists, or any JSON-serializable data
    dynamic_fields = {
        key: (Any, Field(description=desc)) 
        for key, desc in manifest["ai_generated_fields"].items()
    }
    DynamicSchema = create_model('DynamicSchema', **dynamic_fields)
    
    # 3. Build the prompt
    fields_list = ", ".join(f'"{key}"' for key in manifest["ai_generated_fields"].keys())
    
    system_prompt = manifest["system_prompt"] + f"""
    
    IMPORTANT: You MUST respond with ONLY a valid JSON object.
    Required fields: {fields_list}
    
    Facts provided by user: {{facts}}
    Retrieved Law (if any): {{laws}}
    Reviewer Feedback (if any): {{feedback}}
    
    FLEXIBILITY NOTE: Each field value can be a simple string, a structured object, or an array.
    Example structures:
    - String: "some text content"
    - Object: with nested key-value pairs like key1 and key2
    - Array: with multiple items
    
    Use the most appropriate JSON structure for each field's content.
    Do NOT include markdown, code blocks, or explanations. Only valid JSON.
    """
    
    prompt_template = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "Generate the required document content as JSON. Return only valid JSON, no other text.")
    ])
    
    # 4. Execute LLM with proper chain
    chain = prompt_template | llm
    
    try:
        llm_response = chain.invoke({
            "facts": json.dumps(state["extracted_facts"]),
            "laws": json.dumps(state["retrieved_laws"]),
            "feedback": state["review_feedback"]
        })
        
        response_text = llm_response.content
        print(f"📝 Raw LLM response: {response_text[:300]}...")
        
        # Extract JSON from response (handle markdown code blocks too)
        json_start = response_text.find('{')
        json_end = response_text.rfind('}') + 1
        
        if json_start == -1 or json_end <= json_start:
            raise ValueError(f"No JSON object found in response: {response_text[:200]}")
        
        json_str = response_text[json_start:json_end]
        
        # Parse JSON
        parsed_output = json.loads(json_str)
        print(f"✅ Successfully parsed JSON: {list(parsed_output.keys())}")
        
        # Validate against schema
        validated_output = DynamicSchema(**parsed_output)
        state["current_draft"] = validated_output.model_dump()
        
    except json.JSONDecodeError as e:
        print(f"❌ JSON parse error: {e}")
        print(f"Failed to parse: {response_text}")
        raise ValueError(f"Invalid JSON from LLM: {str(e)}")
    except Exception as e:
        print(f"❌ Schema validation error: {e}")
        raise ValueError(f"LLM output doesn't match schema: {str(e)}")
    
    state["revision_count"] += 1
    return state

def reviewer_node(state: DraftState) -> DraftState:
    print("🕵️ [Red Team] Reviewing the draft...")
    # Keeping mock logic for now until we wire the Red Team to the LLM
    if state["revision_count"] < 2:
        print("   -> ❌ Rejecting: Ensure tone is strictly formal.")
        state["review_feedback"] = "Ensure tone is strictly formal."
        return state
    else:
        print("   -> ✅ Approved: Draft meets manifest requirements.")
        state["review_feedback"] = "APPROVED"
        return state

def route_after_review(state: DraftState) -> str:
    if state["review_feedback"] == "APPROVED":
        return "end_process"
    return "rewrite"

# --- COMPILE THE GRAPH ---
workflow = StateGraph(DraftState)
workflow.add_node("Paralegal", paralegal_node)
workflow.add_node("Drafter", drafter_node)
workflow.add_node("Reviewer", reviewer_node)
workflow.set_entry_point("Paralegal")
workflow.add_edge("Paralegal", "Drafter")
workflow.add_edge("Drafter", "Reviewer")
workflow.add_conditional_edges("Reviewer", route_after_review, {"rewrite": "Drafter", "end_process": END})

drafting_app = workflow.compile()