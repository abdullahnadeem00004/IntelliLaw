# Document Drafter - Backend Integration Guide

## Overview

The Document Drafter feature integrates an AI-powered legal document generation system built with FastAPI (Python) with the IntelliLaw frontend (React/TypeScript).

## Backend Architecture

### Main Endpoint
```
POST /api/v1/draft-document
```

### Request Payload Structure
```typescript
{
  lawyer: {
    uid: string;
    email: string;
    displayName: string;
    lawyerProfile?: {
      fullName: string;
      licenseNumber?: string;
      specialization?: string;
      barCouncil?: string;
    };
  };
  client: {
    clientId: string;
    displayName: string;
    type: string; // Individual, Corporate, Partnership, Trust
    cnic?: string;
    phoneNumber?: string;
  };
  case_details: {
    caseId: string;
    title: string;
    caseNumber: string;
    court: string;
    status: string; // ACTIVE, PENDING, HEARING, CLOSED
    description?: string;
  };
  template: {
    templateId: string;
    documentType: string;
    requiredVariables: string[];
    aiInstructions: string; // Specific prompting rules
    isGenericFallback?: boolean;
  };
  custom_instructions?: string;
}
```

### Response Payload Structure
```typescript
{
  status: "success" | "error";
  message: string;
  file_url: string; // Path to generated DOCX file
  ai_revision_count: number; // Number of revisions completed by AI
}
```

## Backend Processing Pipeline

### 1. **Auto-Forge (Template Creation)**
If a template doesn't exist:
- **Architect Agent** designs the document structure
- **Dynamic schema generation** creates Pydantic models at runtime
- **Blacksmith service** creates Word blueprint (.docx)
- Manifest JSON is generated for future use

### 2. **LangGraph Swarm (Document Generation)**
Three autonomous nodes process in sequence:

#### a) **Paralegal Node** (`paralegal_node`)
- Extracts facts from human input
- Organizes client details, case details, custom instructions
- Checks manifest for case law requirements
- Retrieves case laws from Qdrant (if needed)

#### b) **Drafter Node** (`drafter_node`)
- Uses Llama 3.1 (via Groq API)
- Binds dynamic schema to LLM with `with_structured_output()`
- Pulls system prompt from manifest
- Generates document clauses in JSON format
- Can incorporate reviewer feedback for revisions

#### c) **Reviewer Node** (`reviewer_node`)
- Red team review of draft
- Provides feedback for tone, formatting, legal compliance
- Triggers revisions if needed (up to revision limit)

### 3. **Word Document Generation**
- Merges AI-generated content with human data
- Injects into Word blueprint template
- Generates unique filename with UUID
- Returns file path for download

## Core Technologies

### Python Backend
- **FastAPI**: REST API framework
- **LangGraph**: Agentic workflow orchestration
- **LangChain**: LLM integration framework
- **ChatGroq**: Llama 3.1 8B Instant model
- **Qdrant**: Vector database for case law retrieval
- **Pydantic**: Dynamic schema generation
- **Python-docx**: Word document manipulation

### Frontend
- **React**: UI framework
- **TypeScript**: Type safety
- **Axios**: HTTP client for API calls
- **Lucide React**: Icons
- **Tailwind CSS**: Styling

## API Integration Details

### Service Layer (`documentDrafterService.ts`)
Handles:
- Request construction and validation
- Response parsing
- Document download
- Template management
- Error handling

### Page Component (`DocumentDrafter.tsx`)
Provides:
- Template selection UI
- Multi-section form (Client, Case, AI Instructions)
- Real-time form validation
- Loading/success/error states
- Document download button

## Environment Setup

### Frontend (.env)
```env
VITE_DOCUMENT_DRAFTER_URL=http://localhost:8000/api/v1
```

### Backend (.env)
```env
# AI Model
GROQ_API_KEY=your_groq_api_key

# Database
MONGODB_URI=your_mongodb_connection_string
VECTOR_DB_URL=http://localhost:6333  # Qdrant URL
VECTOR_DB_KEY=your_qdrant_api_key

# Hugging Face (for embeddings)
HF_TOKEN=your_huggingface_token
```

## Running the Backend

### Install Dependencies
```bash
cd documentdrafter/intellilaw-backend\ -\ Copy
pip install -r requirements.txt
```

### Start Qdrant (if using vector search)
```bash
docker run -p 6333:6333 qdrant/qdrant
```

### Run FastAPI Server
```bash
uvicorn app.main:app --reload --port 8000
```

Server will be available at: `http://localhost:8000`

## Document Templates

### Available Templates
1. **Bail Petition** - Criminal defense bail applications
2. **Response to Arrest Warrant** - Legal responses to warrants
3. **Contract Agreement** - General contract drafting
4. **Client Letter** - Professional client communications
5. **Legal Memorandum** - Internal legal analysis
6. **Court Pleading** - Formal court documents
7. **Custom Legal Document** - Generic fallback for any document type

### Template Structure
Each template includes:
- `templateId`: Unique identifier
- `documentType`: Human-readable name
- `requiredVariables`: List of required fields
- `aiInstructions`: Specific prompting guidelines
- `isGenericFallback`: Whether it's a catch-all template

## Error Handling

### Common Errors
1. **Template Not Found**: Auto-forge creates it
2. **Invalid Request**: Returns 422 with validation errors
3. **LLM Failure**: Returns 500 with detailed message
4. **File Generation**: Returns 500 with generation error details

### Frontend Error Display
- Validation errors shown immediately
- API errors displayed in notification panel
- Retry mechanism available for transient failures

## Data Flow Diagram

```
Frontend Form (Client, Case, Template, Instructions)
    ↓
DocumentDrafterService.draftDocument()
    ↓
POST /api/v1/draft-document
    ↓
Auto-Forge (if needed) → Create Template & Manifest
    ↓
Paralegal Node → Extract Facts
    ↓
Drafter Node → Generate Document (Llama 3)
    ↓
Reviewer Node → Review & Revise (if needed)
    ↓
Word Generation → Merge Data + Template
    ↓
Response with file_url
    ↓
Frontend → Download Document
```

## Performance Considerations

- **LLM Calls**: ~5-30 seconds per document (depends on model)
- **Word Generation**: ~1-2 seconds
- **Total**: Typically 6-32 seconds per document
- **Vector Search**: Optional, adds 2-5 seconds if enabled

## Security Considerations

- **User Authentication**: Enforced via PrivateRoute
- **Role-Based Access**: FIRM and LAWYER users only
- **Input Validation**: Pydantic models validate all inputs
- **API Authentication**: Can be extended with JWT tokens
- **Document Storage**: Store in secure, authenticated cloud storage

## Future Enhancements

1. **Document History**: Store generated documents for audit trail
2. **Template Management**: UI for creating custom templates
3. **Batch Processing**: Generate multiple documents at once
4. **Document Versioning**: Track document versions
5. **Sharing & Collaboration**: Share documents with clients
6. **Templates Library**: Community templates marketplace
7. **Advanced RAG**: Integrate case law search more deeply
8. **Multi-language**: Generate documents in different languages

## Testing

### Manual Testing Checklist
- [ ] Form validation works correctly
- [ ] Template selection updates AI instructions
- [ ] Document generation completes successfully
- [ ] Download works as expected
- [ ] Error messages display properly
- [ ] Loading states show correctly
- [ ] Mobile responsive design works

### API Testing
```bash
# Test endpoint health
curl http://localhost:8000/

# Test document generation
curl -X POST http://localhost:8000/api/v1/draft-document \
  -H "Content-Type: application/json" \
  -d '{...request_payload...}'
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| CORS Error | Enable CORS in FastAPI with `CORSMiddleware` |
| 404 on /api/v1 | Check backend is running on correct port |
| Timeout | Increase timeout in axios config or add async queue |
| LLM Failure | Check GROQ_API_KEY is valid |
| Vector DB Error | Ensure Qdrant is running and accessible |
| Word Generation Error | Check templates directory exists |

## File Structure

```
Frontend:
├── src/
│   ├── services/documentDrafterService.ts
│   ├── pages/DocumentDrafter.tsx
│   └── components/Sidebar.tsx (updated)

Backend:
├── app/
│   ├── api/drafting.py (main endpoint)
│   ├── models/schemas.py (request/response)
│   ├── services/
│   │   ├── drafting_swarm.py (LangGraph)
│   │   ├── architect.py (auto-forge)
│   │   ├── document_generator.py (Word gen)
│   │   ├── groq_client.py (LLM)
│   │   └── embedding_service.py (vector DB)
│   └── core/config.py (settings)
```

---

**Last Updated**: May 10, 2026
**Version**: 1.0
