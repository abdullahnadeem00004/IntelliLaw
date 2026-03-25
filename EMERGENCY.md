# EMERGENCY CHEAT SHEET — When Things Break

## "Gemini API key not working"
```bash
# Check your key is set
cat agents/.env
# Get FREE key from: https://aistudio.google.com/apikey
# Just sign in with Google account → Create API Key → copy it
# No credit card needed for gemini-2.0-flash
```

## "google-generativeai import error"
```bash
pip install google-generativeai --upgrade
# If still fails:
pip install google-generativeai==0.8.3
```

## "Gemini returning markdown instead of JSON"
Tell Claude Code:
"The Gemini call in [file] returns markdown-wrapped JSON. Fix call_llm_json to:
1. Add 'Return ONLY raw JSON. No markdown. No backticks. No explanation before or after.' to every prompt
2. Strip ```json and ``` from response using: text.replace('```json','').replace('```','').strip()
3. Retry up to 3 times if json.loads fails"

## "Gemini rate limit / 429 error"
```bash
# gemini-2.0-flash free tier: 15 requests/minute, 1500/day
# If hitting limits, add a 4-second sleep between calls:
import time; time.sleep(4)
# Or tell Claude Code: "Add a 4 second delay between all Gemini calls in llm_client.py"
```

## "MongoDB connection failed"
```bash
# Check if MongoDB is running
mongosh --eval "db.adminCommand('ping')"
# If not running:
# Mac: brew services start mongodb-community
# Ubuntu: sudo systemctl start mongod
# Windows: net start MongoDB
```

## "Agent service running but Express can't reach it"
```bash
# Check agent service is up
curl http://localhost:8000/agents/health
# If yes, check Express proxy is using correct URL
# Common mistake: using /agents/ vs /agents (trailing slash)
```

## "Citation extractor missing patterns"
```bash
cd agents
python -c "
from citation_agent.extractor import extract_citations
text = 'Under Section 302 PPC, the punishment for qatl-i-amd is death.'
print(extract_citations(text))
"
```

## "Running out of time — what to cut"
Hour 20 and Module A isn't done?
→ Simplify: skip LLM comparison, just check if section exists in JSON + check repealed status. That alone is impressive.

Hour 28 and Module C isn't done?
→ Skip query enrichment. Just append case title to the user's query before searching. Simple but works.

Hour 30 and Module B not started?
→ SKIP IT. Tell panel: "Template library and agent architecture designed. Code ready for next sprint."

## "Need to demo but something is broken"
Create /agents/demo_mode.py with hardcoded responses for 3 queries. Wire as fallback. A working demo beats a broken real system. Seriously.

## PowerShell-specific issues
```powershell
# "curl" in PowerShell is actually Invoke-WebRequest. Use this instead:
Invoke-RestMethod -Uri "http://localhost:8000/agents/health" -Method GET

# Or install actual curl:
winget install curl.curl

# Python not found:
# Download from python.org or:
winget install Python.Python.3.11
```
