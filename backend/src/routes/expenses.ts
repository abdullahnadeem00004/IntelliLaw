import { Router } from 'express';
import Expense from '../models/Expense.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get all expenses with filtering
router.get(
  '/',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const { status, category, startDate, endDate, search } = req.query;
      const query: any = {};

      if (status) query.status = status;
      if (category) query.category = category;

      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate as string);
        if (endDate) query.date.$lte = new Date(endDate as string);
      }

      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { expenseNumber: { $regex: search, $options: 'i' } },
        ];
      }

      const expenses = await Expense.find(query).sort({ date: -1 });
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch expenses', error });
    }
  }
);

// Get expense by ID
router.get(
  '/:id',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const expense = await Expense.findById(req.params.id);
      if (!expense) {
        return res.status(404).json({ message: 'Expense not found' });
      }
      res.json(expense);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch expense', error });
    }
  }
);

// Create new expense
router.post(
  '/',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const { title, description, amount, category, date, status } = req.body;

      if (!title || !amount) {
        return res.status(400).json({ 
          message: 'Missing required fields: title, amount' 
        });
      }

      if (amount <= 0) {
        return res.status(400).json({ message: 'Amount must be greater than 0' });
      }

      // Generate expense number
      const expenseNumber = `EXP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const newExpense = new Expense({
        expenseNumber,
        title,
        description,
        amount,
        category: category || 'OTHER',
        date: date ? new Date(date) : new Date(),
        status: status || 'PENDING',
        createdByUid: req.user?.uid || 'unknown',
      });

      await newExpense.save();
      res.status(201).json(newExpense);
    } catch (error) {
      console.error('Expense creation error:', error);
      res.status(500).json({ message: 'Failed to create expense', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
);

// Update expense
router.put(
  '/:id',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const { title, description, amount, category, date, status } = req.body;

      const expense = await Expense.findById(req.params.id);
      if (!expense) {
        return res.status(404).json({ message: 'Expense not found' });
      }

      if (title) expense.title = title;
      if (description !== undefined) expense.description = description;
      if (amount && amount > 0) expense.amount = amount;
      if (category) expense.category = category;
      if (date) expense.date = new Date(date);
      if (status) expense.status = status;

      await expense.save();
      res.json(expense);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update expense', error });
    }
  }
);

// Delete expense
router.delete(
  '/:id',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const expense = await Expense.findByIdAndDelete(req.params.id);
      if (!expense) {
        return res.status(404).json({ message: 'Expense not found' });
      }
      res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete expense', error });
    }
  }
);

// Get expense statistics by category and time period
router.get(
  '/stats/summary',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const expenses = await Expense.find();
      
      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
      const pendingExpenses = expenses
        .filter(e => e.status === 'PENDING')
        .reduce((sum, e) => sum + e.amount, 0);
      
      const approvedExpenses = expenses
        .filter(e => e.status === 'APPROVED')
        .reduce((sum, e) => sum + e.amount, 0);

      const paidExpenses = expenses
        .filter(e => e.status === 'PAID')
        .reduce((sum, e) => sum + e.amount, 0);

      // Group by category
      const byCategory: any = {};
      expenses.forEach(e => {
        if (!byCategory[e.category]) {
          byCategory[e.category] = 0;
        }
        byCategory[e.category] += e.amount;
      });

      res.json({
        totalExpenses,
        pendingExpenses,
        approvedExpenses,
        paidExpenses,
        byCategory,
        count: expenses.length,
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch expense stats', error });
    }
  }
);

export default router;
