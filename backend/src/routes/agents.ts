import { Router, Response } from 'express';
import axios from 'axios';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

const AGENT_SERVICE_URL = process.env.AGENT_SERVICE_URL || 'http://localhost:8000';

const proxyToAgent = async (
  req: AuthRequest,
  res: Response,
  method: 'GET' | 'POST',
  path: string
) => {
  try {
    const url = `${AGENT_SERVICE_URL}${path}`;
    const response = method === 'POST'
      ? await axios.post(url, req.body, { timeout: 300000 })
      : await axios.get(url, { timeout: 30000 });
    res.status(response.status).json(response.data);
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return res.status(503).json({
        error: 'Agent service unavailable',
        message: 'The AI agent service is not running. Start it with: cd agents && uvicorn main:app --port 8000',
      });
    }
    const status = error.response?.status || 502;
    const data = error.response?.data || { error: 'Agent service error', message: error.message };
    res.status(status).json(data);
  }
};

// POST /api/agents/verify-citations
router.post('/verify-citations', authMiddleware, (req: AuthRequest, res: Response) => {
  proxyToAgent(req, res, 'POST', '/agents/verify-citations');
});

// POST /api/agents/case-research
router.post('/case-research', authMiddleware, (req: AuthRequest, res: Response) => {
  proxyToAgent(req, res, 'POST', '/agents/case-research');
});

// POST /api/agents/draft-document
router.post('/draft-document', authMiddleware, (req: AuthRequest, res: Response) => {
  proxyToAgent(req, res, 'POST', '/agents/draft-document');
});

// GET /api/agents/case-research/:caseId/suggestions
router.get('/case-research/:caseId/suggestions', authMiddleware, (req: AuthRequest, res: Response) => {
  proxyToAgent(req, res, 'GET', `/agents/case-research/${req.params.caseId}/suggestions`);
});

// GET /api/agents/health (no auth needed for health check)
router.get('/health', (req, res) => {
  proxyToAgent(req as AuthRequest, res, 'GET', '/agents/health');
});

export default router;
