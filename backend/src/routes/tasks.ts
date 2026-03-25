import { Router } from 'express';
import Task from '../models/Task.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

// Get all tasks (optionally filtered by caseId or assignedTo)
router.get(
  '/',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const { caseId, assignedTo, status } = req.query;
      const query: any = {};

      if (caseId) query.caseId = caseId;
      if (assignedTo) query.assignedTo = assignedTo;
      if (status) query.status = status;

      // Non-admins can only see tasks they created or are assigned to
      if (req.userRole !== 'ADMIN') {
        query.$or = [
          { createdByUid: req.userId },
          { assignedTo: req.userId }
        ];
      }

      const tasks = await Task.find(query).sort({ dueDate: 1 });
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch tasks', error });
    }
  }
);

// Get task by ID
router.get(
  '/:id',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const task = await Task.findById(req.params.id);

      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }

      // Check permissions
      if (req.userRole !== 'ADMIN' && 
          task.createdByUid !== req.userId && 
          task.assignedTo !== req.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      res.json(task);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch task', error });
    }
  }
);

// Create new task
router.post(
  '/',
  authMiddleware,
  requireRole('LAWYER', 'STAFF', 'ADMIN'),
  async (req: AuthRequest, res) => {
    try {
      const { title, description, caseId, dueDate, priority, assignedTo, assignedToName } = req.body;

      if (!title || !dueDate || !assignedTo) {
        return res.status(400).json({ message: 'Title, dueDate, and assignedTo are required' });
      }

      const task = new Task({
        title,
        description: description || undefined,
        caseId: caseId || undefined,
        dueDate: new Date(dueDate),
        priority: priority || 'MEDIUM',
        status: 'TODO',
        assignedTo,
        assignedToName: assignedToName || 'Unknown',
        createdByUid: req.userId,
      });

      await task.save();

      res.status(201).json({
        message: 'Task created successfully',
        task,
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to create task', error });
    }
  }
);

// Update task
router.put(
  '/:id',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const task = await Task.findById(req.params.id);

      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }

      // Check permissions
      if (req.userRole !== 'ADMIN' && task.createdByUid !== req.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const { title, description, caseId, dueDate, priority, status, assignedTo, assignedToName } = req.body;

      if (title) task.title = title;
      if (description !== undefined) task.description = description || undefined;
      if (caseId !== undefined) task.caseId = caseId || undefined;
      if (dueDate) task.dueDate = new Date(dueDate);
      if (priority) task.priority = priority;
      if (status) {
        task.status = status;
        if (status === 'COMPLETED') {
          task.completedAt = new Date();
        }
      }
      if (assignedTo) task.assignedTo = assignedTo;
      if (assignedToName) task.assignedToName = assignedToName;

      await task.save();

      res.json({
        message: 'Task updated successfully',
        task,
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update task', error });
    }
  }
);

// Delete task
router.delete(
  '/:id',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const task = await Task.findById(req.params.id);

      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }

      // Check permissions
      if (req.userRole !== 'ADMIN' && task.createdByUid !== req.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      await Task.findByIdAndDelete(req.params.id);

      res.json({ message: 'Task deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete task', error });
    }
  }
);

export default router;
