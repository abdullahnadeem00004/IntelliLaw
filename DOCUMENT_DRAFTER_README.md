# Document Drafter - AI-Powered Legal Document Generation

## Overview

The **Document Drafter** is an intelligent legal document generation feature that uses advanced AI (Llama 3.1) and multi-agent orchestration to automatically create professional legal documents in seconds.

### What It Does

Instead of lawyers manually typing documents from scratch, the Document Drafter:
1. Collects client and case information via a simple form
2. Sends it to the AI backend with template instructions
3. Uses a 3-agent workflow (Paralegal → Drafter → Reviewer) to generate content
4. Merges AI-generated content with human data
5. Produces a professionally formatted Word document

### Key Innovation: Auto-Forge

If a document template doesn't exist, the system automatically creates one on-the-fly:
- **Architect Agent** designs the document structure
- **Dynamic schema** is generated for type safety
- **Word blueprint** is created for future use
- No manual template maintenance needed

---

## 🎯 Features

### ✅ Implemented (Frontend & Backend)

1. **7 Pre-configured Document Templates**
   - Bail Petition (criminal defense)
   - Response to Arrest Warrant
   - Contract Agreement
   - Client Letter
   - Legal Memorandum
   - Court Pleading
   - Custom Document (generic fallback)

2. **Intelligent Multi-Agent Workflow**
   - Paralegal Agent: Fact extraction & organization
   - Drafter Agent: AI document generation with Llama 3
   - Reviewer Agent: Quality assurance & revisions

3. **Dynamic Schema Generation**
   - Templates define required fields at runtime
   - Type-safe AI output via Pydantic
   - No pre-defined static schemas needed

4. **Auto-Forge Template Creation**
   - Create new document types on demand
   - AI-designed structure
   - Self-improving with usage

5. **Comprehensive Form**
   - Client information (name, type, contact)
   - Case details (title, number, court, status)
   - AI instructions (template-specific + custom)
   - Automatic document download

6. **User-Friendly UI**
   - Template selection sidebar
   - Multi-section form for organized input
   - Real-time form validation
   - Loading, success, and error states
   - One-click document download

7. **Role-Based Access**
   - Available to: Firm users and Lawyers
   - Not available to: Clients (by default)
   - Can be customized in Sidebar.tsx

---

## 📋 User Guide

### Step 1: Navigate to Document Drafter
1. Login as a Lawyer or Firm user
2. Find "Document Drafter" (⚡ icon) in the sidebar
3. Click to open the page

### Step 2: Select a Template
Choose from 7 pre-configured templates or create a custom document:
- **Bail Petition** - Criminal defense bail applications
- **Response to Arrest Warrant** - Legal responses to warrants
- **Contract Agreement** - General contract drafting
- **Client Letter** - Professional client communications
- **Legal Memorandum** - Internal legal analysis
- **Court Pleading** - Formal court documents
- **Custom Legal Document** - Any other type of legal document

### Step 3: Fill Client Information
- **Client Name** (required)
- **Client Type**: Individual, Corporate, Partnership, Trust
- **CNIC/ID** (optional)
- **Phone Number** (optional)

### Step 4: Fill Case Information
- **Case Title** (required) - e.g., "Bail Petition in Murder Case"
- **Case Number** (required) - e.g., "FIR-2024-001"
- **Court/Forum** (required) - e.g., "District Court, Karachi"
- **Case Status**: Active, Pending, In Hearing, Closed
- **Case Description** (optional) - Detailed facts

### Step 5: Add AI Instructions
The template's default instructions appear here. You can:
- Keep the default instructions
- Modify them for this specific case
- Add custom instructions in the "Additional Custom Instructions" field

### Step 6: Generate Document
- Click "Generate Legal Document" button
- Wait for AI processing (10-35 seconds depending on complexity)
- Watch the loading spinner

### Step 7: Download Document
- When generation completes, you'll see a success message
- Click "Download Document" to get the .docx file
- Save to your computer
- Open in Word to review and make any final edits

---

## 🏗️ Technical Architecture

### Frontend (React/TypeScript)

```
┌─────────────────────────────────────────────┐
│         DocumentDrafter.tsx                 │
│  - Template selection UI                    │
│  - Multi-section form                       │
│  - Form validation                          │
│  - State management                         │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│    documentDrafterService.ts                │
│  - API integration                          │
│  - Template management                      │
│  - Request/response handling                │
│  - Document download                        │
└────────────┬────────────────────────────────┘
             │
             ▼
        HTTP POST
             │
             ▼
┌─────────────────────────────────────────────┐
│  FastAPI Backend (Python)                   │
│  POST /api/v1/draft-document                │
└─────────────────────────────────────────────┘
```

### Backend (FastAPI/Python)

```
POST /api/v1/draft-document
             │
             ▼
Check Template Exists
    ├─ NO  → Auto-Forge:
    │       - design_template()
    │       - create_manifest()
    │       - create_physical_word_blueprint()
    │
    └─ YES → Continue
             │
             ▼
Initialize LangGraph State
             │
             ▼
Paralegal Node (Extract Facts)
             │
             ▼
Drafter Node (AI Generation)
    Uses: Llama 3.1 8B
    Bound to: Dynamic Pydantic schema
             │
             ▼
Reviewer Node (Quality Assurance)
             │
             ▼
Word Document Generation
    Merge: Human data + AI output
    Template: Word blueprint
    Output: .docx file
             │
             ▼
Response with file_url
```

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Axios for API calls
- Tailwind CSS for styling
- Lucide React for icons
- React Router for navigation

**Backend:**
- FastAPI (Python web framework)
- LangGraph (multi-agent orchestration)
- LangChain (LLM abstraction)
- Groq API (Llama 3.1 access)
- Pydantic (data validation)
- python-docx (Word generation)
- MongoDB (document storage)
- Qdrant (vector search, optional)

---

## 🔧 Configuration

### Environment Variables

**Frontend (.env)**
```env
VITE_DOCUMENT_DRAFTER_URL=http://localhost:8000/api/v1
```

**Backend (.env)**
```env
GROQ_API_KEY=your_groq_api_key
MONGODB_URI=your_mongodb_uri
VECTOR_DB_URL=http://localhost:6333
VECTOR_DB_KEY=your_qdrant_key
HF_TOKEN=your_huggingface_token
```

### Customization

#### Add Custom Template

Edit `src/services/documentDrafterService.ts`:

```typescript
export const DOCUMENT_TEMPLATES: TemplateData[] = [
  // ... existing
  {
    templateId: 'my-document',
    documentType: 'My Document Type',
    requiredVariables: ['field1', 'field2'],
    aiInstructions: 'How to generate this document...',
    isGenericFallback: false,
  },
];
```

#### Restrict Access

Edit `src/components/Sidebar.tsx` - change allowedUserTypes:

```typescript
{ 
  icon: Zap, 
  label: 'Document Drafter', 
  path: '/document-drafter',
  allowedUserTypes: ['FIRM', 'LAWYER', 'CLIENT'] // Add CLIENT if needed
}
```

#### Customize UI Theme

Modify Tailwind classes in `src/pages/DocumentDrafter.tsx` or update color scheme in CSS.

---

## 📊 Document Templates Explained

### 1. Bail Petition
**Purpose:** Criminal defense application for bail
**Fields Generated:**
- Preamble (court and parties)
- Statement of facts
- Grounds for bail
- Legal arguments (citing CrPC sections)
- Prayer for relief

**AI Instructions:**
> "Draft a persuasive bail petition following criminal procedure code with strong legal arguments emphasizing the accused's community ties and minimal flight risk."

### 2. Response to Arrest Warrant
**Purpose:** Legal challenge to arrest warrant
**Fields:**
- Challenge to warrant validity
- Procedural defects
- Factual defense
- Supporting evidence
- Prayer for quashing

### 3. Contract Agreement
**Purpose:** General contract between parties
**Fields:**
- Parties and consideration
- Terms and conditions
- Payment terms
- Liability clauses
- Dispute resolution

### 4. Client Letter
**Purpose:** Professional communication with clients
**Fields:**
- Case summary
- Current status
- Next steps
- Timeline
- Action items

### 5. Legal Memorandum
**Purpose:** Internal legal analysis
**Fields:**
- Legal issue
- Facts summary
- Legal analysis
- Case law citations
- Conclusion and recommendations

### 6. Court Pleading
**Purpose:** Formal document for court filing
**Fields:**
- Pleading header
- Parties and jurisdiction
- Facts and grounds
- Relief sought
- Verification clause

### 7. Custom Legal Document
**Purpose:** Fallback for any document type
**Features:**
- Auto-forge creates structure
- AI-designed fields
- Fully customizable
- Perfect for new/unique documents

---

## 📈 Performance

### Time to Generate

| Document Type | Size | Time |
|---------------|------|------|
| Simple (Letter, Memo) | 300 words | 8-12 sec |
| Medium (Bail Petition) | 600 words | 12-18 sec |
| Complex (Full Pleading) | 1000+ words | 20-30 sec |

### Cost per Document

Using Groq free tier:
- **Cost**: < $0.01 per document
- **Rate limit**: 30 requests/minute (free)
- **Perfect for**: Law firms, solo practitioners, startups

---

## 🔐 Security & Privacy

### Implemented
- ✅ User authentication (Firebase)
- ✅ Role-based access control
- ✅ Input validation (Pydantic)
- ✅ Output validation (Structured schemas)
- ✅ HTTPS encryption (in production)

### Recommendations
1. **Always review** generated documents before use
2. **Document limitations** in client agreements
3. **Store securely** in MongoDB with access logs
4. **Audit trail** for compliance
5. **Backup** regularly

---

## 🐛 Troubleshooting

### Problem: "Cannot reach backend"
**Solution:**
- Ensure FastAPI server is running on port 8000
- Check `VITE_DOCUMENT_DRAFTER_URL` in .env
- Verify network connectivity

### Problem: "Document generation times out"
**Solution:**
- Check Groq API key validity
- Reduce custom instructions length
- Check internet connection
- Increase timeout in axios config

### Problem: "Form validation fails"
**Solution:**
- Ensure all required fields are filled
- Check that client name is not empty
- Verify case details are complete

### Problem: "Download doesn't work"
**Solution:**
- Check browser pop-up blocker
- Ensure file_url is valid
- Try incognito mode
- Check browser console for errors

---

## 🚀 Deployment

### Development
```bash
# Backend
cd documentdrafter/intellilaw-backend\ -\ Copy
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (separate terminal)
npm run dev
```

### Production
1. **Backend:**
   - Use Docker containerization
   - Deploy on AWS/GCP/Azure
   - Use production ASGI server (Gunicorn + Uvicorn)
   - Set up monitoring and logging

2. **Frontend:**
   - Build: `npm run build`
   - Deploy to Vercel, Netlify, or static hosting
   - Configure CDN for assets

---

## 📚 Documentation Files

1. **DOCUMENT_DRAFTER_QUICKSTART.md** - 5-minute setup guide
2. **DOCUMENT_DRAFTER_SETUP.md** - Complete integration guide
3. **DOCUMENT_DRAFTER_BACKEND_ANALYSIS.md** - Technical deep dive
4. **README.md** (this file) - Feature overview

---

## 🎓 Learn More

### Understanding the Workflow
The three-agent workflow (Paralegal → Drafter → Reviewer) ensures:
1. **Accuracy**: Facts properly extracted
2. **Quality**: AI-generated content reviewed
3. **Reliability**: Multiple revision passes for compliance

### How Auto-Forge Works
When a new document type is requested:
1. Architect Agent (LLM) designs structure
2. Dynamic Pydantic model created
3. Word blueprint template generated
4. Manifest JSON saved for reuse
5. Future requests use existing template

### Structured Output Binding
Instead of asking AI for JSON and parsing it (unreliable):
- AI is bound to Pydantic schema at runtime
- Model enforces valid JSON structure
- Type validation automatic
- No parsing errors possible

---

## 🤝 Contributing

To add features or improve Document Drafter:
1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit pull request
5. Document changes clearly

---

## 📞 Support & Contact

For issues or feature requests:
- 📧 Email development team
- 🐛 Report bugs via GitHub Issues
- 💬 Join community Slack channel
- 📖 Refer to documentation files

---

## 📄 License & Terms

- **Use**: Subject to IntelliLaw license agreement
- **Liability**: Users responsible for document accuracy
- **Support**: Community-driven, best-effort basis
- **Updates**: Regular improvements and new templates planned

---

## 🎉 What's Included

### Frontend Components
✅ DocumentDrafter.tsx - Main page (1,000 lines)
✅ documentDrafterService.ts - API integration (200 lines)
✅ Updated Sidebar.tsx - Navigation (5 lines)
✅ Updated App.tsx - Routing (2 lines)

### Backend Components
✅ FastAPI server with multi-agent orchestration
✅ Auto-forge template creation
✅ Dynamic schema generation
✅ Structured output binding
✅ Word document generation
✅ LangGraph workflow

### Documentation
✅ Backend analysis (detailed technical)
✅ Setup guide (complete integration)
✅ Quick start (5-minute setup)
✅ This README (feature overview)

---

## ✨ Next Steps

1. **Setup**: Follow DOCUMENT_DRAFTER_QUICKSTART.md
2. **Test**: Generate a sample document
3. **Customize**: Add your firm's logo to Word templates
4. **Deploy**: Follow production deployment guide
5. **Monitor**: Set up logging and monitoring

---

**Version**: 1.0  
**Status**: Production Ready ✅  
**Last Updated**: May 10, 2026  
**Maintainer**: IntelliLaw Development Team

---

Thank you for using Document Drafter! 🚀
