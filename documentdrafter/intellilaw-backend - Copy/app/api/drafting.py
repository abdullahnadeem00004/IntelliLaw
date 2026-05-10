from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from app.models.schemas import DocumentDraftRequest
from app.services.drafting_swarm import drafting_app, flatten_complex_objects
from app.services.document_generator import generate_word_doc
from app.services.architect import design_template, create_physical_word_blueprint # <-- NEW IMPORT
import uuid
import os
import json

router = APIRouter()

@router.post("/draft-document")
async def generate_legal_document(request: DocumentDraftRequest):
    try:
        template_id = request.template.templateId
        document_type = request.template.documentType
        
        # Define where the files *should* be
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        manifest_path = os.path.join(base_dir, "templates", "manifests", f"{template_id}.json")
        blueprint_filename = f"{template_id}_blueprint.docx"
        blueprint_path = os.path.join(base_dir, "templates", blueprint_filename)
        
        # --- THE AUTO-FORGE INTERCEPTOR ---
        if not os.path.exists(manifest_path) or not os.path.exists(blueprint_path):
            print(f"\n⚠️ Template '{template_id}' not found. Waking up the Architect Agent...")
            
            # 1. Ask the AI to design the document and manifest
            architect_design = design_template(
                document_type=document_type,
                instructions=request.template.aiInstructions
            )
            
            # 2. Build the Manifest JSON structure
            new_manifest_data = {
                "template_id": template_id,
                "document_type": document_type,
                "word_blueprint_file": blueprint_filename,
                "requires_case_law_rag": False, # Default to false for generated docs
                "system_prompt": architect_design.system_prompt,
                "ai_generated_fields": architect_design.ai_generated_fields
            }
            
            # 3. Save the newly invented Manifest
            os.makedirs(os.path.dirname(manifest_path), exist_ok=True)
            with open(manifest_path, "w") as f:
                json.dump(new_manifest_data, f, indent=2)
                
            # 4. Create the physical Word Blueprint using the Blacksmith
            create_physical_word_blueprint(
                text_content=architect_design.blueprint_text, 
                save_path=blueprint_path
            )
            print("✅ Auto-Forge complete. Resuming standard drafting pipeline...\n")

        # --- NORMAL DRAFTING PIPELINE RESUMES HERE ---
        # Now the files are guaranteed to exist.
        with open(manifest_path, "r") as f:
            manifest_data = json.load(f)

        # 2. Prepare the Swarm State
        initial_state = {
            "request_payload": request.model_dump(),
            "manifest": manifest_data,
            "extracted_facts": {},
            "retrieved_laws": [],
            "current_draft": {},
            "review_feedback": "",
            "revision_count": 0
        }
        
        # 3. Trigger the LangGraph Swarm
        print(f"🚀 Starting autonomous drafting for: {manifest_data['document_type']}")
        final_state = drafting_app.invoke(initial_state)
        ai_draft_data = final_state["current_draft"]
        
        # Flatten complex objects (dicts, lists) to strings for Word compatibility
        flattened_ai_data = flatten_complex_objects(ai_draft_data)
        
        # 4. Merge human data with AI data
        template_context = {
            **request.client.model_dump(),
            **request.case_details.model_dump(),
            **flattened_ai_data 
        }
        
        # 5. Generate unique filename
        safe_client_name = request.client.displayName.replace(" ", "_")
        doc_type_clean = manifest_data["document_type"].replace(" ", "_")
        filename = f"{safe_client_name}_{doc_type_clean}_{uuid.uuid4().hex[:6]}.docx"
        
        # 6. Inject into the Word blueprint
        target_template_file = manifest_data["word_blueprint_file"]
        generation_result = generate_word_doc(
            template_filename=target_template_file,
            context_data=template_context,
            output_filename=filename
        )
        
        if generation_result["status"] == "error":
            raise Exception(f"Word generation failed: {generation_result['message']}")
        
        # Extract just the filename from the path
        generated_filename = os.path.basename(generation_result["file_path"])
            
        return {
            "status": "success",
            "message": f"{manifest_data['document_type']} drafted successfully",
            "file_url": f"/download-document/{generated_filename}",
            "ai_revision_count": final_state["revision_count"]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/download-document/{filename}")
async def download_document(filename: str):
    """Download a generated document by filename."""
    try:
        # Find the file in the outputs directory
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        file_path = os.path.join(base_dir, "outputs", filename)
        
        # Security: Prevent directory traversal attacks
        if not os.path.abspath(file_path).startswith(os.path.abspath(os.path.join(base_dir, "outputs"))):
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Check if file exists
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail=f"Document not found: {filename}")
        
        # Return the file with proper headers
        return FileResponse(
            path=file_path,
            filename=filename,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))