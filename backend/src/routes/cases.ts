import { Router } from 'express';
import Case from '../models/Case.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get all cases with optional filtering
router.get(
  '/',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const { status, court, clientId, lawyer, search } = req.query;
      const query: any = {};

      if (status && status !== 'All Statuses') query.status = status;
      if (court && court !== 'All Courts') query.court = court;
      if (clientId) query.clientId = clientId;
      if (lawyer) query.assignedLawyerUid = lawyer;

      if (search) {
        query.$or = [
          { caseNumber: { $regex: search, $options: 'i' } },
          { title: { $regex: search, $options: 'i' } },
          { clientName: { $regex: search, $options: 'i' } },
        ];
      }

      const cases = await Case.find(query).sort({ createdAt: -1 });
      res.json(cases);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch cases', error });
    }
  }
);

// Get case by ID
router.get(
  '/:id',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const caseData = await Case.findById(req.params.id);
      if (!caseData) return res.status(404).json({ message: 'Case not found' });
      res.json(caseData);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch case', error });
    }
  }
);

// Create new case
router.post(
  '/',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const { title, caseNumber, category, priority, description, court, judge, clientName, assignedLawyerUid, assignedLawyerName, nextHearingDate } = req.body;

      // Validate required fields
      if (!title || !caseNumber || !category || !court || !clientName || !assignedLawyerUid) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const caseData = new Case({
        title,
        caseNumber,
        category,
        priority: priority || 'MEDIUM',
        description: description || '',
        court,
        judge: judge || undefined,
        status: 'ACTIVE',
        clientName,
        assignedLawyerUid,
        assignedLawyerName,
        nextHearingDate: nextHearingDate ? new Date(nextHearingDate) : undefined,
        lastActivityDate: new Date(),
        tags: [],
      });

      await caseData.save();
      res.status(201).json(caseData);
    } catch (error: any) {
      if (error.code === 11000) {
        return res.status(400).json({ message: 'Case number already exists' });
      }
      res.status(500).json({ message: 'Failed to create case', error });
    }
  }
);

// Update case
router.put(
  '/:id',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const { title, caseNumber, category, priority, description, court, judge, status, clientName, nextHearingDate } = req.body;

      const updateData: any = {};
      if (title) updateData.title = title;
      if (caseNumber) updateData.caseNumber = caseNumber;
      if (category) updateData.category = category;
      if (priority) updateData.priority = priority;
      if (description !== undefined) updateData.description = description;
      if (court) updateData.court = court;
      if (judge) updateData.judge = judge;
      if (status) updateData.status = status;
      if (clientName) updateData.clientName = clientName;
      if (nextHearingDate) updateData.nextHearingDate = new Date(nextHearingDate);
      updateData.lastActivityDate = new Date();

      const caseData = await Case.findByIdAndUpdate(req.params.id, updateData, { new: true });
      
      if (!caseData) {
        return res.status(404).json({ message: 'Case not found' });
      }

      res.json(caseData);
    } catch (error: any) {
      if (error.code === 11000) {
        return res.status(400).json({ message: 'Case number already exists' });
      }
      res.status(500).json({ message: 'Failed to update case', error });
    }
  }
);

// Delete case
router.delete(
  '/:id',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const caseData = await Case.findByIdAndDelete(req.params.id);
      
      if (!caseData) {
        return res.status(404).json({ message: 'Case not found' });
      }

      res.json({ message: 'Case deleted successfully', caseData });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete case', error });
    }
  }
);

export default router;
