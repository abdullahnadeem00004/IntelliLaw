# Document Drafter - Quick Start Guide

## 🚀 Quick Start (5 minutes)

### Prerequisites
- Node.js 18+ & npm
- Python 3.10+
- MongoDB (for storing documents)
- Groq API key (free at groq.com)
- Qdrant instance (optional, for case law search)

### 1. Backend Setup

```bash
# Navigate to backend
cd documentdrafter/intellilaw-backend\ -\ Copy

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
GROQ_API_KEY=your_groq_api_key_here
MONGODB_URI=your_mongodb_connection_string
VECTOR_DB_URL=http://localhost:6333
VECTOR_DB_KEY=optional_qdrant_key
HF_TOKEN=your_huggingface_token
EOF

# Start server
uvicorn app.main:app --reload --port 8000
```

Backend ready at: `http://localhost:8000`

### 2. Frontend Setup

```bash
# Navigate to frontend root
cd ../../../

# Update .env
echo "VITE_DOCUMENT_DRAFTER_URL=http://localhost:8000/api/v1" >> .env

# Start frontend (if not already running)
npm run dev
```

### 3. Access Document Drafter
1. Login as Lawyer or Firm user
2. Click "Document Drafter" in sidebar
3. Select a template or create a custom one
4. Fill in client and case information
5. Click "Generate Legal Document"
6. Download the generated .docx file

---

## 📁 Project Structure

```
Frontend:
src/
├── pages/
│   └── DocumentDrafter.tsx         # Main page component
├── services/
│   └── documentDrafterService.ts   # API integration
└── components/
    └── Sidebar.tsx                 # Updated with new nav item

Backend:
documentdrafter/intellilaw-backend - Copy/
├── app/
│   ├── main.py                     # FastAPI server
│   ├── api/
│   │   └── drafting.py             # Main endpoint
│   ├── models/
│   │   └── schemas.py              # Request/response types
│   ├── services/
│   │   ├── drafting_swarm.py       # LangGraph workflow
│   │   ├── architect.py            # Auto-forge
│   │   ├── document_generator.py   # Word generation
│   │   └── groq_client.py          # LLM integration
│   └── core/
│       └── config.py               # Settings
└── requirements.txt                # Python dependencies
```

---

## 🎯 Key Features Explained

### Template Selection
- **7 pre-configured templates** (Bail Petition, Contract, etc.)
- **Auto-forge**: Creates new templates on-the-fly
- **Custom instructions**: Tailor AI behavior per document

### Multi-Agent Workflow
1. **Paralegal**: Extracts and organizes facts
2. **Drafter**: Generates content using Llama 3
3. **Reviewer**: Quality assurance & revisions

### Form Sections
- **Client Info**: Name, type (Individual/Corporate), contact
- **Case Info**: Title, number, court, status, description
- **AI Instructions**: Template-specific + custom notes
- **Auto-download**: Generated .docx ready to use

---

## 🔌 API Endpoint

### POST /api/v1/draft-document

**Request:**
```json
{
  "lawyer": {
    "uid": "user123",
    "email": "lawyer@firm.com",
    "displayName": "Ahmed Khan"
  },
  "client": {
    "clientId": "client_456",
    "displayName": "Client Name",
    "type": "Individual"
  },
  "case_details": {
    "caseId": "case_789",
    "title": "Case Title",
    "caseNumber": "FIR-2024-001",
    "court": "District Court",
    "status": "ACTIVE"
  },
  "template": {
    "templateId": "bail-petition",
    "documentType": "Bail Petition",
    "requiredVariables": ["court_name"],
    "aiInstructions": "Draft persuasive bail petition"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Bail Petition drafted successfully",
  "file_url": "/app/outputs/Client_Name_Bail_Petition_abc123.docx",
  "ai_revision_count": 2
}
```

---

## 🎨 Frontend Customization

### Add New Template

Edit `src/services/documentDrafterService.ts`:

```typescript
export const DOCUMENT_TEMPLATES: TemplateData[] = [
  // ... existing templates
  {
    templateId: 'my-custom-doc',
    documentType: 'My Custom Document',
    requiredVariables: ['field1', 'field2'],
    aiInstructions: 'Instructions for AI...',
    isGenericFallback: false,
  },
];
```

### Customize Form Fields

Edit `src/pages/DocumentDrafter.tsx` in the form sections.

### Change UI Theme

Uses Tailwind CSS classes:
- Primary color: `primary-600` → customize in `globals.css`
- Neutral dark theme by default
- Icons: Lucide React

---

## ⚙️ Configuration

### Environment Variables

**Frontend (.env or .env.local):**
```env
VITE_DOCUMENT_DRAFTER_URL=http://localhost:8000/api/v1
VITE_API_URL=http://localhost:5000/api
```

**Backend (.env):**
```env
# Required
GROQ_API_KEY=gsk_xxxxx
MONGODB_URI=mongodb+srv://username:password@host

# Optional (for case law search)
VECTOR_DB_URL=http://localhost:6333
VECTOR_DB_KEY=qdrant_key
HF_TOKEN=hf_xxxxx
```

---

## 🧪 Testing

### Manual Test
```bash
# Terminal 1: Backend
cd documentdrafter/intellilaw-backend\ -\ Copy
uvicorn app.main:app --reload

# Terminal 2: Frontend
npm run dev

# Terminal 3: Frontend
curl -X POST http://localhost:8000/api/v1/draft-document \
  -H "Content-Type: application/json" \
  -d '{...request_payload...}'
```

### Test Checklist
- [ ] Page loads without errors
- [ ] Can select different templates
- [ ] Form validation works
- [ ] Document generation succeeds
- [ ] Download button works
- [ ] Error messages display correctly

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| CORS error | Ensure backend running on port 8000 |
| 404 on /api/v1 | Check VITE_DOCUMENT_DRAFTER_URL in .env |
| LLM timeout | Check GROQ_API_KEY validity |
| Word generation error | Verify templates directory exists |
| Database error | Check MongoDB connection string |

---

## 📊 Performance

- **Small documents** (< 500 words): 8-15 seconds
- **Medium documents** (500-1000 words): 15-25 seconds
- **Large documents** (> 1000 words): 25-35 seconds

*Times include: AI processing (Llama 3), revision, and Word generation*

---

## 🔐 Security Notes

1. ✅ Authentication required (Firebase)
2. ✅ Role-based access (FIRM/LAWYER only)
3. ✅ Input validation (Pydantic)
4. ✅ Output validation (Structured schemas)
5. ⚠️ Documents should be reviewed by lawyer before use

---

## 📚 Additional Resources

- [Backend Analysis](./DOCUMENT_DRAFTER_BACKEND_ANALYSIS.md) - Deep technical dive
- [Setup Guide](./DOCUMENT_DRAFTER_SETUP.md) - Complete integration guide
- [Groq Docs](https://console.groq.com/docs) - LLM API reference
- [LangGraph Docs](https://langchain-ai.github.io/langgraph/) - Agent orchestration

---

## 🤝 Support

For issues or questions:
1. Check error message in UI
2. Review browser console (F12)
3. Check backend logs (terminal)
4. Refer to troubleshooting section above
5. Contact development team

---

**Last Updated**: May 10, 2026  
**Version**: 1.0  
**Status**: ✅ Production Ready
