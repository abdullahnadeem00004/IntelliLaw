from docxtpl import DocxTemplate
import os

def generate_word_doc(template_filename: str, context_data: dict, output_filename: str):
    """
    Takes a Word template and injects a JSON dictionary into the {{tags}}.
    """
    # Define absolute/relative paths
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    template_path = os.path.join(base_dir, "templates", template_filename)
    output_dir = os.path.join(base_dir, "outputs")
    
    # Ensure the outputs directory exists
    os.makedirs(output_dir, exist_ok=True)
    
    output_path = os.path.join(output_dir, output_filename)

    try:
        # Load the Word template
        doc = DocxTemplate(template_path)
        
        # Inject the JSON data into the tags
        doc.render(context_data)
        
        # Save the brand new document
        doc.save(output_path)
        
        return {"status": "success", "file_path": output_path}
    
    except Exception as e:
        return {"status": "error", "message": str(e)}

# --- QUICK TEST ---
# If you run this file directly, it will test the generator without needing the API running.
if __name__ == "__main__":
    dummy_ai_output = {
        "court_name": "SESSIONS JUDGE, LAHORE",
        "accused_name": "Muzammil Idrees",
        "fir_details": "104/2026",
        "offence_section": "411/414 PPC",
        "police_station": "Model Town, Lahore",
        "legal_grounds_paragraph": "That the accused is completely innocent. The maximum sentence for an attempt to commit an offence under Section 411/414 read with Section 511 cannot exceed 1.5 years, making it a bailable offence and entitling the petitioner to the concession of bail."
    }
    
    print("Generating test document...")
    result = generate_word_doc("standard_bail_blueprint.docx", dummy_ai_output, "test_bail_draft.docx")
    print(f"Result: {result}")