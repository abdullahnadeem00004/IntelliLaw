import express, { Router, Request, Response, NextFunction } from 'express';
import Case from '../models/Case.js';
import Hearing from '../models/Hearing.js';
import Client from '../models/Client.js';
import Task from '../models/Task.js';
import Document from '../models/Document.js';
import Expense from '../models/Expense.js';
import Invoice from '../models/Invoice.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Dashboard Statistics - Admin View (GET /api/dashboard/stats)
router.get('/stats', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const firmId = req.user?.firmId;

    // Get active cases count
    const activeCases = await Case.countDocuments({
      status: { $in: ['ACTIVE', 'PENDING'] },
      firmId,
    });

    // Get upcoming hearings count
    const upcomingHearings = await Hearing.countDocuments({
      status: 'UPCOMING',
      date: { $gte: new Date() },
      createdBy: userId,
    });

    // Get total clients count
    const totalClients = await Client.countDocuments({ firmId });

    // Get pending tasks count
    const pendingTasks = await Task.countDocuments({
      status: { $in: ['TODO', 'IN_PROGRESS'] },
      assignedTo: userId,
    });

    // Get revenue (total invoiced amount)
    const invoices = await Invoice.aggregate([
      {
        $match: {
          firmId,
          status: { $in: ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    const totalRevenue = invoices[0]?.total || 0;

    // Get total expenses
    const expenses = await Expense.aggregate([
      {
        $match: { firmId },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    const totalExpenses = expenses[0]?.total || 0;

    // Get recent documents count
    const recentDocuments = await Document.countDocuments({
      firmId,
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
    });

    res.json({
      activeCases,
      upcomingHearings,
      totalClients,
      pendingTasks,
      revenue: totalRevenue,
      expenses: totalExpenses,
      recentDocuments,
      netProfit: totalRevenue - totalExpenses,
    });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching dashboard stats', error: error.message });
  }
});

// Get upcoming hearings for widget
router.get('/upcoming-hearings', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const limit = parseInt(req.query.limit as string) || 5;

    const hearings = await Hearing.find({
      status: 'UPCOMING',
      date: { $gte: new Date() },
      createdBy: userId,
    })
      .sort({ date: 1 })
      .limit(limit)
      .lean();

    res.json(hearings);
  } catch (error: any) {
    console.error('Error fetching upcoming hearings:', error);
    res.status(500).json({ message: 'Error fetching upcoming hearings', error: error.message });
  }
});

// Get recent activities
router.get('/recent-activities', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const limit = parseInt(req.query.limit as string) || 10;

    // Fetch recent documents
    const recentDocs = await Document.find({ firmId: req.user?.firmId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Fetch completed tasks
    const completedTasks = await Task.find({
      status: 'COMPLETED',
      assignedTo: userId,
    })
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean();

    // Fetch recent hearing updates
    const recentHearings = await Hearing.find({
      createdBy: userId,
      status: { $in: ['COMPLETED', 'ADJOURNED'] },
    })
      .sort({ date: -1 })
      .limit(5)
      .lean();

    // Combine and sort all activities
    const activities = [
      ...recentDocs.map((doc) => ({
        type: 'document',
        icon: 'FileText',
        color: 'text-info',
        bg: 'bg-info/10',
        text: `Document "${doc.fileName}" uploaded to ${doc.caseId}`,
        time: doc.createdAt,
      })),
      ...completedTasks.map((task) => ({
        type: 'task',
        icon: 'CheckCircle2',
        color: 'text-success',
        bg: 'bg-success/10',
        text: `Task "${task.title}" marked as completed`,
        time: task.updatedAt,
      })),
      ...recentHearings.map((hearing) => ({
        type: 'hearing',
        icon: 'AlertCircle',
        color: hearing.status === 'COMPLETED' ? 'text-success' : 'text-warning',
        bg: hearing.status === 'COMPLETED' ? 'bg-success/10' : 'bg-warning/10',
        text: `Hearing ${hearing.status.toLowerCase()} for case ${hearing.caseId}`,
        time: hearing.date,
      })),
    ];

    // Sort by time (most recent first)
    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    res.json(activities.slice(0, limit));
  } catch (error: any) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({ message: 'Error fetching recent activities', error: error.message });
  }
});

// Get my cases for lawyer dashboard
router.get('/my-cases', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const limit = parseInt(req.query.limit as string) || 5;

    const cases = await Case.find({
      $or: [
        { assignedLawyerId: userId },
        { createdBy: userId },
      ],
      status: { $in: ['ACTIVE', 'PENDING'] },
    })
      .sort({ lastActivityDate: -1 })
      .limit(limit)
      .lean();

    res.json(cases);
  } catch (error: any) {
    console.error('Error fetching my cases:', error);
    res.status(500).json({ message: 'Error fetching my cases', error: error.message });
  }
});

// Get my tasks for lawyer/staff dashboard
router.get('/my-tasks', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const limit = parseInt(req.query.limit as string) || 5;

    const tasks = await Task.find({
      assignedTo: userId,
      status: { $in: ['TODO', 'IN_PROGRESS'] },
    })
      .sort({ dueDate: 1 })
      .limit(limit)
      .lean();

    res.json(tasks);
  } catch (error: any) {
    console.error('Error fetching my tasks:', error);
    res.status(500).json({ message: 'Error fetching my tasks', error: error.message });
  }
});

// Get dashboard summary for client
router.get('/client-summary', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    // Get cases for this client
    const clientCases = await Case.find({ clientUid: userId })
      .sort({ createdAt: -1 })
      .lean();

    // Get invoices for client
    const invoices = await Invoice.find({ clientId: userId, status: { $in: ['ISSUED', 'OVERDUE'] } })
      .sort({ dueDate: 1 })
      .lean();

    // Get upcoming hearings
    const upcomingHearings = await Hearing.find({
      caseId: { $in: clientCases.map((c) => c._id) },
      status: 'UPCOMING',
      date: { $gte: new Date() },
    })
      .sort({ date: 1 })
      .lean();

    res.json({
      cases: clientCases,
      invoices,
      upcomingHearings,
      totalCases: clientCases.length,
      activeHearings: upcomingHearings.length,
      pendingInvoices: invoices.length,
    });
  } catch (error: any) {
    console.error('Error fetching client summary:', error);
    res.status(500).json({ message: 'Error fetching client summary', error: error.message });
  }
});

export default router;
