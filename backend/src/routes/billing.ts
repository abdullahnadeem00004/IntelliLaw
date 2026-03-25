import { Router } from 'express';
import Invoice from '../models/Invoice.js';
import Case from '../models/Case.js';
import Client from '../models/Client.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get all invoices with filtering
router.get(
  '/',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const { status, caseId, clientId, search, startDate, endDate } = req.query;
      const query: any = {};

      if (status && status !== 'All') query.status = status;
      if (caseId) query.caseId = caseId;
      if (clientId) query.clientId = clientId;

      if (search) {
        query.$or = [
          { invoiceNumber: { $regex: search, $options: 'i' } },
          { clientName: { $regex: search, $options: 'i' } },
          { caseId: { $regex: search, $options: 'i' } },
        ];
      }

      if (startDate || endDate) {
        query.issuedDate = {};
        if (startDate) query.issuedDate.$gte = new Date(startDate as string);
        if (endDate) query.issuedDate.$lte = new Date(endDate as string);
      }

      const invoices = await Invoice.find(query).sort({ issuedDate: -1 });
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch invoices', error });
    }
  }
);

// Get invoice by ID
router.get(
  '/:id',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const invoice = await Invoice.findById(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch invoice', error });
    }
  }
);

// Create new invoice
router.post(
  '/',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const { caseId, clientId, items, dueDate, notes, clientName } = req.body;

      if (!caseId || !clientId || !items || items.length === 0 || !dueDate) {
        return res.status(400).json({ 
          message: 'Missing required fields: caseId, clientId, items, dueDate' 
        });
      }

      // Try to get client details if clientId is a valid MongoDB ID
      let client = null;
      let retrievedClientName = clientName || 'Unknown Client';
      let retrievedClientEmail = '';

      try {
        if (clientId.match(/^[0-9a-fA-F]{24}$/)) {
          client = await Client.findById(clientId);
          if (client) {
            retrievedClientName = client.displayName;
            retrievedClientEmail = client.email || '';
          }
        }
      } catch (err) {
        console.log('Could not fetch client details');
      }

      // Calculate total amount
      const totalAmount = items.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);

      if (totalAmount === 0) {
        return res.status(400).json({ message: 'Invoice total amount must be greater than 0' });
      }

      // Generate invoice number
      const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const newInvoice = new Invoice({
        invoiceNumber,
        caseId,
        clientId,
        clientName: retrievedClientName,
        clientEmail: retrievedClientEmail,
        amount: totalAmount,
        items,
        dueDate: new Date(dueDate),
        notes,
        createdByUid: req.user?.uid || 'unknown',
        status: 'UNPAID',
      });

      await newInvoice.save();
      res.status(201).json(newInvoice);
    } catch (error) {
      console.error('Invoice creation error:', error);
      res.status(500).json({ message: 'Failed to create invoice', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
);

// Update invoice (status, payment, etc.)
router.put(
  '/:id',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const { status, amountPaid, notes } = req.body;

      const invoice = await Invoice.findById(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }

      if (status) {
        invoice.status = status;
      }

      if (amountPaid !== undefined) {
        invoice.amountPaid = amountPaid;
        
        // Auto-determine status based on payment
        if (amountPaid >= invoice.amount) {
          invoice.status = 'PAID';
        } else if (amountPaid > 0) {
          invoice.status = 'PARTIAL';
        } else if (new Date() > invoice.dueDate) {
          invoice.status = 'OVERDUE';
        } else {
          invoice.status = 'UNPAID';
        }
      }

      if (notes !== undefined) {
        invoice.notes = notes;
      }

      await invoice.save();
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update invoice', error });
    }
  }
);

// Delete invoice
router.delete(
  '/:id',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const invoice = await Invoice.findByIdAndDelete(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      res.json({ message: 'Invoice deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete invoice', error });
    }
  }
);

// Get billing statistics
router.get(
  '/stats/overview',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const invoices = await Invoice.find();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const totalRevenue = invoices
        .filter(i => i.status === 'PAID')
        .reduce((sum, i) => sum + i.amount, 0);

      // Outstanding: UNPAID or PARTIAL (not yet due or just not paid yet)
      const outstanding = invoices
        .filter(i => {
          if (i.status === 'PAID') return false;
          const dueDate = new Date(i.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate >= today; // Not yet overdue
        })
        .reduce((sum, i) => sum + (i.amount - (i.amountPaid || 0)), 0);

      // Overdue: Past due date and not fully paid
      const overdue = invoices
        .filter(i => {
          if (i.status === 'PAID') return false;
          const dueDate = new Date(i.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate < today; // Past due
        })
        .reduce((sum, i) => sum + (i.amount - (i.amountPaid || 0)), 0);

      const collected = invoices.reduce((sum, i) => sum + (i.amountPaid || 0), 0);

      // Count by actual status
      const paidCount = invoices.filter(i => i.status === 'PAID').length;
      const unpaidCount = invoices.filter(i => i.status === 'UNPAID').length;
      const partialCount = invoices.filter(i => i.status === 'PARTIAL').length;
      
      // Count by calculated overdue status
      const overdueCount = invoices.filter(i => {
        if (i.status === 'PAID') return false;
        const dueDate = new Date(i.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate < today;
      }).length;

      res.json({
        totalRevenue,
        outstanding,
        overdue,
        collected,
        totalInvoices: invoices.length,
        paidCount,
        unpaidCount,
        partialCount,
        overdueCount,
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch billing stats', error });
    }
  }
);

export default router;
