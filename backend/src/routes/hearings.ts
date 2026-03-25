import { Router } from 'express';
import Hearing from '../models/Hearing.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get all hearings with filtering
router.get(
  '/',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const { caseId, status, startDate, endDate, priority } = req.query;
      const query: any = {};

      if (caseId) query.caseId = caseId;
      if (status) query.status = (status as string).toUpperCase();
      if (priority) query.priority = (priority as string).toUpperCase();
      
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate as string);
        if (endDate) query.date.$lte = new Date(endDate as string);
      }

      const hearings = await Hearing.find(query)
        .sort({ date: 1 })
        .limit(500);

      res.json(hearings);
    } catch (error) {
      console.error('Error fetching hearings:', error);
      res.status(500).json({ message: 'Failed to fetch hearings', error });
    }
  }
);

// Get hearing by ID
router.get(
  '/:id',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const hearing = await Hearing.findById(req.params.id);
      if (!hearing) {
        return res.status(404).json({ message: 'Hearing not found' });
      }
      res.json(hearing);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch hearing', error });
    }
  }
);

// Create new hearing
router.post(
  '/',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const { caseId, caseTitle, date, time, court, purpose, status, priority, notes } = req.body;

      if (!caseId || !caseTitle || !date || !time || !court || !purpose) {
        return res.status(400).json({
          message: 'Missing required fields: caseId, caseTitle, date, time, court, purpose',
        });
      }

      const newHearing = new Hearing({
        caseId,
        caseTitle,
        date: new Date(date),
        time,
        court,
        purpose,
        status: status || 'UPCOMING',
        priority: priority || 'MEDIUM',
        notes,
        createdBy: req.user?.uid || 'unknown',
      });

      await newHearing.save();
      res.status(201).json(newHearing);
    } catch (error) {
      console.error('Hearing creation error:', error);
      res.status(500).json({
        message: 'Failed to create hearing',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// Update hearing
router.put(
  '/:id',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const { caseId, caseTitle, date, time, court, purpose, status, priority, notes } = req.body;

      const hearing = await Hearing.findById(req.params.id);
      if (!hearing) {
        return res.status(404).json({ message: 'Hearing not found' });
      }

      if (caseId) hearing.caseId = caseId;
      if (caseTitle) hearing.caseTitle = caseTitle;
      if (date) hearing.date = new Date(date);
      if (time) hearing.time = time;
      if (court) hearing.court = court;
      if (purpose) hearing.purpose = purpose;
      if (status) hearing.status = status.toUpperCase();
      if (priority) hearing.priority = priority.toUpperCase();
      if (notes !== undefined) hearing.notes = notes;

      await hearing.save();
      res.json(hearing);
    } catch (error) {
      console.error('Hearing update error:', error);
      res.status(500).json({
        message: 'Failed to update hearing',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// Delete hearing
router.delete(
  '/:id',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const hearing = await Hearing.findByIdAndDelete(req.params.id);
      if (!hearing) {
        return res.status(404).json({ message: 'Hearing not found' });
      }

      res.json({ message: 'Hearing deleted successfully' });
    } catch (error) {
      console.error('Hearing deletion error:', error);
      res.status(500).json({
        message: 'Failed to delete hearing',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// Get hearing statistics
router.get(
  '/stats/summary',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const total = await Hearing.countDocuments();
      const upcoming = await Hearing.countDocuments({ status: 'UPCOMING' });
      const completed = await Hearing.countDocuments({ status: 'COMPLETED' });
      const cancelled = await Hearing.countDocuments({ status: 'CANCELLED' });
      const adjourned = await Hearing.countDocuments({ status: 'ADJOURNED' });

      const byPriority = await Hearing.aggregate([
        {
          $group: {
            _id: '$priority',
            count: { $sum: 1 },
          },
        },
      ]);

      const upcomingHearings = await Hearing.find({ status: 'UPCOMING' })
        .sort({ date: 1 })
        .limit(5);

      res.json({
        total,
        upcoming,
        completed,
        cancelled,
        adjourned,
        byPriority,
        upcomingHearings,
      });
    } catch (error) {
      console.error('Hearing stats error:', error);
      res.status(500).json({
        message: 'Failed to fetch hearing stats',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

export default router;
