import { Router } from 'express';
import Case from '../models/Case.js';
import Client from '../models/Client.js';
import User from '../models/User.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import {
  buildCaseAccessQuery,
  canAccessCase,
  canManageCase,
  isFirmOrLawyerUser,
  isFirmUser,
  isLawyerUser,
  mergeQueries,
} from '../utils/access.js';

const router = Router();

const isMongoId = (value?: string) => Boolean(value && /^[0-9a-fA-F]{24}$/.test(value));

async function resolveRegisteredClient(input: {
  clientUid?: string;
  clientId?: string;
  clientEmail?: string;
}) {
  const { clientUid, clientId, clientEmail } = input;

  if (isMongoId(clientUid)) {
    const user = await User.findOne({ _id: clientUid, userType: 'CLIENT' }).select('-password');
    if (user) return user;
  }

  if (isMongoId(clientId)) {
    const user = await User.findOne({ _id: clientId, userType: 'CLIENT' }).select('-password');
    if (user) return user;
  }

  if (clientEmail) {
    const user = await User.findOne({
      email: clientEmail.toLowerCase().trim(),
      userType: 'CLIENT',
    }).select('-password');
    if (user) return user;
  }

  return null;
}

// Get all cases with optional filtering. Results are always scoped to the requester.
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { status, court, clientId, lawyer, search } = req.query;
    const filters: any = {};

    if (status && status !== 'All Statuses') filters.status = status;
    if (court && court !== 'All Courts') filters.court = court;
    if (clientId) {
      filters.$or = [
        { clientId: String(clientId) },
        { clientUid: String(clientId) },
      ];
    }
    if (lawyer) filters.assignedLawyerUid = String(lawyer);

    if (search) {
      const searchFilter = {
        $or: [
          { caseNumber: { $regex: String(search), $options: 'i' } },
          { title: { $regex: String(search), $options: 'i' } },
          { clientName: { $regex: String(search), $options: 'i' } },
        ],
      };

      const query = mergeQueries(buildCaseAccessQuery(req), filters, searchFilter);
      const cases = await Case.find(query).sort({ createdAt: -1 });
      return res.json(cases);
    }

    const query = mergeQueries(buildCaseAccessQuery(req), filters);
    const cases = await Case.find(query).sort({ createdAt: -1 });
    res.json(cases);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch cases', error });
  }
});

// Get case by ID
router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const caseData = await Case.findById(req.params.id);
    if (!caseData) return res.status(404).json({ message: 'Case not found' });

    if (!canAccessCase(caseData, req)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(caseData);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch case', error });
  }
});

// Create new case
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!isFirmOrLawyerUser(req)) {
      return res.status(403).json({ message: 'Only firms and lawyers can create cases' });
    }

    const {
      title,
      caseNumber,
      category,
      priority,
      description,
      court,
      judge,
      clientName,
      clientId,
      clientUid,
      clientEmail,
      assignedLawyerUid,
      assignedLawyerName,
      nextHearingDate,
    } = req.body;

    if (!title || !caseNumber || !category || !court || !clientName) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const registeredClient = await resolveRegisteredClient({ clientUid, clientId, clientEmail });
    let legacyClient = null;

    if (!registeredClient && isMongoId(clientId)) {
      legacyClient = await Client.findById(clientId);
    }

    const effectiveClientUid = registeredClient?._id.toString();
    const effectiveClientId = effectiveClientUid || legacyClient?._id.toString() || clientId || undefined;
    const effectiveClientName =
      registeredClient?.clientProfile?.fullName ||
      registeredClient?.displayName ||
      legacyClient?.displayName ||
      clientName;
    const effectiveClientEmail =
      registeredClient?.email ||
      legacyClient?.email ||
      clientEmail ||
      undefined;

    let effectiveAssignedLawyerUid = assignedLawyerUid || req.userId;
    let effectiveAssignedLawyerName =
      assignedLawyerName || req.user?.displayName || req.user?.email || 'Assigned Lawyer';

    if (isLawyerUser(req)) {
      effectiveAssignedLawyerUid = req.userId;
      effectiveAssignedLawyerName = req.user?.displayName || req.user?.email || effectiveAssignedLawyerName;
    }

    if (isFirmUser(req) && assignedLawyerUid && assignedLawyerUid !== req.userId) {
      if (!isMongoId(assignedLawyerUid)) {
        return res.status(400).json({ message: 'Invalid assigned lawyer' });
      }

      const lawyer = await User.findOne({ _id: assignedLawyerUid, userType: 'LAWYER' }).select('-password');
      if (!lawyer) {
        return res.status(400).json({ message: 'Assigned lawyer profile was not found' });
      }

      effectiveAssignedLawyerUid = lawyer._id.toString();
      effectiveAssignedLawyerName = lawyer.lawyerProfile?.fullName || lawyer.displayName;
    }

    if (!effectiveAssignedLawyerUid) {
      return res.status(400).json({ message: 'Assigned lawyer is required' });
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
      clientName: effectiveClientName,
      clientId: effectiveClientId,
      clientUid: effectiveClientUid,
      clientEmail: effectiveClientEmail,
      assignedLawyerUid: effectiveAssignedLawyerUid,
      assignedLawyerName: effectiveAssignedLawyerName,
      createdByUid: req.userId,
      createdByName: req.user?.displayName || req.user?.email,
      createdByUserType: req.userType,
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
});

// Update case
router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const caseData = await Case.findById(req.params.id);

    if (!caseData) {
      return res.status(404).json({ message: 'Case not found' });
    }

    if (!canManageCase(caseData, req)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { title, caseNumber, category, priority, description, court, judge, status, clientName, nextHearingDate } = req.body;

    if (title) caseData.title = title;
    if (caseNumber) caseData.caseNumber = caseNumber;
    if (category) caseData.category = category;
    if (priority) caseData.priority = priority;
    if (description !== undefined) caseData.description = description;
    if (court) caseData.court = court;
    if (judge !== undefined) caseData.judge = judge || undefined;
    if (status) caseData.status = status;
    if (clientName) caseData.clientName = clientName;
    if (nextHearingDate) caseData.nextHearingDate = new Date(nextHearingDate);
    caseData.lastActivityDate = new Date();

    await caseData.save();
    res.json(caseData);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Case number already exists' });
    }
    res.status(500).json({ message: 'Failed to update case', error });
  }
});

// Delete case
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const caseData = await Case.findById(req.params.id);

    if (!caseData) {
      return res.status(404).json({ message: 'Case not found' });
    }

    if (!canManageCase(caseData, req)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Case.findByIdAndDelete(req.params.id);
    res.json({ message: 'Case deleted successfully', caseData });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete case', error });
  }
});

export default router;
