import { Router } from 'express';
import Case from '../models/Case.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const cases = await Case.find().sort({ createdAt: -1 });
    res.json(cases);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch cases', error });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const caseData = await Case.findById(req.params.id);
    if (!caseData) return res.status(404).json({ message: 'Case not found' });
    res.json(caseData);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch case', error });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const caseData = new Case(req.body);
    await caseData.save();
    res.status(201).json(caseData);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create case', error });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const caseData = await Case.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(caseData);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update case', error });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Case.findByIdAndDelete(req.params.id);
    res.json({ message: 'Case deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete case', error });
  }
});

export default router;
