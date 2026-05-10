import { Router } from 'express';
import Invoice from '../models/Invoice.js';
import Case from '../models/Case.js';
import Client from '../models/Client.js';
import User from '../models/User.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import {
  buildCaseAccessQuery,
  canAccessCase,
  canAccessInvoice,
  canIssueInvoices,
  canManageInvoice,
  mergeQueries,
} from '../utils/access.js';

const router = Router();

const isMongoId = (value?: string) => Boolean(value && /^[0-9a-fA-F]{24}$/.test(value));

async function getAccessibleCaseIds(req: AuthRequest) {
  const cases = await Case.find(buildCaseAccessQuery(req)).select('_id').lean();
  return cases.map((caseData) => caseData._id.toString());
}

function buildInvoiceAccessQuery(req: AuthRequest, accessibleCaseIds: string[]) {
  const userId = req.userId;
  if (!userId) return { _id: null };

  const accessFilters: any[] = [
    { createdByUid: userId },
    { clientUid: userId },
    { clientId: userId },
  ];

  if (accessibleCaseIds.length > 0) {
    accessFilters.push({ caseId: { $in: accessibleCaseIds } });
  }

  return { $or: accessFilters };
}

async function resolveClientForInvoice(input: {
  clientId?: string;
  clientUid?: string;
  clientName?: string;
}) {
  const { clientId, clientUid, clientName } = input;

  if (isMongoId(clientUid)) {
    const user = await User.findOne({ _id: clientUid, userType: 'CLIENT' }).select('-password');
    if (user) {
      return {
        clientId: user._id.toString(),
        clientUid: user._id.toString(),
        clientName: user.clientProfile?.fullName || user.displayName,
        clientEmail: user.email,
      };
    }
  }

  if (isMongoId(clientId)) {
    const user = await User.findOne({ _id: clientId, userType: 'CLIENT' }).select('-password');
    if (user) {
      return {
        clientId: user._id.toString(),
        clientUid: user._id.toString(),
        clientName: user.clientProfile?.fullName || user.displayName,
        clientEmail: user.email,
      };
    }

    const client = await Client.findById(clientId);
    if (client) {
      return {
        clientId: client._id.toString(),
        clientUid: undefined,
        clientName: client.displayName,
        clientEmail: client.email || '',
      };
    }
  }

  return {
    clientId: clientId || clientUid || '',
    clientUid: clientUid || undefined,
    clientName: clientName || 'Unknown Client',
    clientEmail: '',
  };
}

// Get billing statistics for invoices visible to the requester.
router.get('/stats/overview', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const accessibleCaseIds = await getAccessibleCaseIds(req);
    const invoices = await Invoice.find(buildInvoiceAccessQuery(req, accessibleCaseIds));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalRevenue = invoices
      .filter((i) => i.status === 'PAID')
      .reduce((sum, i) => sum + i.amount, 0);

    const outstanding = invoices
      .filter((i) => {
        if (i.status === 'PAID') return false;
        const dueDate = new Date(i.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate >= today;
      })
      .reduce((sum, i) => sum + (i.amount - (i.amountPaid || 0)), 0);

    const overdue = invoices
      .filter((i) => {
        if (i.status === 'PAID') return false;
        const dueDate = new Date(i.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate < today;
      })
      .reduce((sum, i) => sum + (i.amount - (i.amountPaid || 0)), 0);

    const collected = invoices.reduce((sum, i) => sum + (i.amountPaid || 0), 0);
    const paidCount = invoices.filter((i) => i.status === 'PAID').length;
    const unpaidCount = invoices.filter((i) => i.status === 'UNPAID').length;
    const partialCount = invoices.filter((i) => i.status === 'PARTIAL').length;
    const overdueCount = invoices.filter((i) => {
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
});

// Get all invoices with filtering. Results are always scoped to the requester.
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { status, caseId, clientId, search, startDate, endDate } = req.query;
    const accessibleCaseIds = await getAccessibleCaseIds(req);
    const filters: any = {};

    if (status && status !== 'All') filters.status = status;
    if (caseId) filters.caseId = String(caseId);
    if (clientId) {
      filters.$or = [
        { clientId: String(clientId) },
        { clientUid: String(clientId) },
      ];
    }

    if (startDate || endDate) {
      filters.issuedDate = {};
      if (startDate) filters.issuedDate.$gte = new Date(startDate as string);
      if (endDate) filters.issuedDate.$lte = new Date(endDate as string);
    }

    const searchFilter = search
      ? {
          $or: [
            { invoiceNumber: { $regex: String(search), $options: 'i' } },
            { clientName: { $regex: String(search), $options: 'i' } },
            { caseId: { $regex: String(search), $options: 'i' } },
          ],
        }
      : {};

    const query = mergeQueries(buildInvoiceAccessQuery(req, accessibleCaseIds), filters, searchFilter);
    const invoices = await Invoice.find(query).sort({ issuedDate: -1 });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch invoices', error });
  }
});

// Get invoice by ID
router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const accessibleCaseIds = await getAccessibleCaseIds(req);
    if (!canAccessInvoice(invoice, accessibleCaseIds, req)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch invoice', error });
  }
});

// Create new invoice. Only the firm that owns the case can issue it.
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!canIssueInvoices(req)) {
      return res.status(403).json({ message: 'Only firm accounts can issue invoices' });
    }

    const { caseId, clientId, items, dueDate, notes, clientName } = req.body;

    if (!caseId || !items || items.length === 0 || !dueDate) {
      return res.status(400).json({
        message: 'Missing required fields: caseId, items, dueDate',
      });
    }

    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({ message: 'Case not found' });
    }

    const ownsCase =
      caseData.createdByUid === req.userId ||
      (!caseData.createdByUid && caseData.assignedLawyerUid === req.userId);

    if (!canAccessCase(caseData, req) || !ownsCase) {
      return res.status(403).json({ message: 'You can only issue invoices for your firm cases' });
    }

    const totalAmount = items.reduce((sum: number, item: any) => sum + (item.amount || item.quantity * item.unitPrice || 0), 0);

    if (totalAmount === 0) {
      return res.status(400).json({ message: 'Invoice total amount must be greater than 0' });
    }

    const client = await resolveClientForInvoice({
      clientId: caseData.clientUid || caseData.clientId || clientId,
      clientUid: caseData.clientUid,
      clientName: caseData.clientName || clientName,
    });

    if (!client.clientId) {
      return res.status(400).json({ message: 'Case does not have an associated client' });
    }

    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const newInvoice = new Invoice({
      invoiceNumber,
      caseId,
      clientId: client.clientId,
      clientUid: client.clientUid,
      clientName: client.clientName,
      clientEmail: client.clientEmail,
      amount: totalAmount,
      items,
      dueDate: new Date(dueDate),
      notes,
      createdByUid: req.userId,
      createdByName: req.user?.displayName || req.user?.email,
      status: 'UNPAID',
    });

    await newInvoice.save();
    res.status(201).json(newInvoice);
  } catch (error) {
    console.error('Invoice creation error:', error);
    res.status(500).json({ message: 'Failed to create invoice', error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Update invoice (status, payment, etc.). Only the issuing firm can update it.
router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { status, amountPaid, notes } = req.body;

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (!canManageInvoice(invoice, req)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (status) {
      invoice.status = status;
    }

    if (amountPaid !== undefined) {
      invoice.amountPaid = amountPaid;

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
});

// Delete invoice. Only the issuing firm can delete it.
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (!canManageInvoice(invoice, req)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Invoice.findByIdAndDelete(req.params.id);
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete invoice', error });
  }
});

export default router;
