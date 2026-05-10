import { Router } from 'express';
import Client from '../models/Client.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { isFirmOrLawyerUser } from '../utils/access.js';

const router = Router();

// Get all clients for the firm
router.get(
  '/',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      if (!isFirmOrLawyerUser(req)) {
        return res.status(403).json({ message: 'Only firms and lawyers can view added clients' });
      }

      const { search } = req.query;
      const query: any = {
        createdByUid: req.userId,
      };

      // Search filter
      if (search) {
        query.$or = [
          { displayName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phoneNumber: { $regex: search, $options: 'i' } },
        ];
      }

      const clients = await Client.find(query).sort({ createdAt: -1 });
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch clients', error });
    }
  }
);

// Get client by ID
router.get(
  '/:id',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const client = await Client.findById(req.params.id);
      
      if (!client) {
        return res.status(404).json({ message: 'Client not found' });
      }

      // Check permissions
      if (client.createdByUid !== req.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      res.json(client);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch client', error });
    }
  }
);

// Create new client
router.post(
  '/',
  authMiddleware,
  requireRole('LAWYER', 'STAFF', 'ADMIN'),
  async (req: AuthRequest, res) => {
    try {
      const { displayName, email, phoneNumber, type, address, firmId } = req.body;

      if (!displayName) {
        return res.status(400).json({ message: 'Client name is required' });
      }

      const client = new Client({
        displayName,
        email: email || undefined,
        phoneNumber: phoneNumber || undefined,
        type: type || 'Individual',
        address: address || {},
        createdByUid: req.userId,
        firmId: firmId || req.userId,
      });

      await client.save();

      res.status(201).json({
        message: 'Client created successfully',
        client,
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to create client', error });
    }
  }
);

// Update client
router.put(
  '/:id',
  authMiddleware,
  requireRole('LAWYER', 'STAFF', 'ADMIN'),
  async (req: AuthRequest, res) => {
    try {
      const client = await Client.findById(req.params.id);

      if (!client) {
        return res.status(404).json({ message: 'Client not found' });
      }

      // Check permissions
      if (client.createdByUid !== req.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const { displayName, email, phoneNumber, type, address } = req.body;

      if (displayName) client.displayName = displayName;
      if (email !== undefined) client.email = email || undefined;
      if (phoneNumber !== undefined) client.phoneNumber = phoneNumber || undefined;
      if (type) client.type = type;
      if (address) client.address = { ...client.address, ...address };

      await client.save();

      res.json({
        message: 'Client updated successfully',
        client,
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update client', error });
    }
  }
);

// Delete client
router.delete(
  '/:id',
  authMiddleware,
  requireRole('LAWYER', 'STAFF', 'ADMIN'),
  async (req: AuthRequest, res) => {
    try {
      const client = await Client.findById(req.params.id);

      if (!client) {
        return res.status(404).json({ message: 'Client not found' });
      }

      // Check permissions
      if (client.createdByUid !== req.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      await Client.findByIdAndDelete(req.params.id);

      res.json({ message: 'Client deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete client', error });
    }
  }
);

export default router;
