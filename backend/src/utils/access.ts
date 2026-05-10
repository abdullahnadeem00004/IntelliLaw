import { AuthRequest } from '../middleware/auth.js';

export const isFirmUser = (req: AuthRequest) =>
  req.userType === 'FIRM' || (req.userRole === 'ADMIN' && !req.userType);

export const isLawyerUser = (req: AuthRequest) =>
  req.userType === 'LAWYER' || req.userRole === 'LAWYER';

export const isClientUser = (req: AuthRequest) =>
  req.userType === 'CLIENT' || req.userRole === 'CLIENT';

export const isFirmOrLawyerUser = (req: AuthRequest) =>
  isFirmUser(req) || isLawyerUser(req) || req.userRole === 'STAFF';

export function mergeQueries(...queries: any[]) {
  const activeQueries = queries.filter((query) => query && Object.keys(query).length > 0);
  if (activeQueries.length === 0) return {};
  if (activeQueries.length === 1) return activeQueries[0];
  return { $and: activeQueries };
}

export function buildCaseAccessQuery(req: AuthRequest) {
  const userId = req.userId;
  if (!userId) return { _id: null };

  if (isClientUser(req)) {
    return {
      $or: [
        { clientUid: userId },
        { clientId: userId },
      ],
    };
  }

  return {
    $or: [
      { createdByUid: userId },
      { assignedLawyerUid: userId },
    ],
  };
}

export function canAccessCase(caseData: any, req: AuthRequest) {
  const userId = req.userId;
  if (!caseData || !userId) return false;

  if (isClientUser(req)) {
    return caseData.clientUid === userId || caseData.clientId === userId;
  }

  return caseData.createdByUid === userId || caseData.assignedLawyerUid === userId;
}

export function canManageCase(caseData: any, req: AuthRequest) {
  const userId = req.userId;
  if (!caseData || !userId || isClientUser(req)) return false;
  return caseData.createdByUid === userId || caseData.assignedLawyerUid === userId;
}

export function canIssueInvoices(req: AuthRequest) {
  return isFirmUser(req);
}

export function canManageInvoice(invoice: any, req: AuthRequest) {
  const userId = req.userId;
  if (!invoice || !userId) return false;
  return invoice.createdByUid === userId;
}

export function canAccessInvoice(invoice: any, accessibleCaseIds: string[], req: AuthRequest) {
  const userId = req.userId;
  if (!invoice || !userId) return false;

  if (invoice.createdByUid === userId) return true;
  if (invoice.clientUid === userId || invoice.clientId === userId) return true;

  return accessibleCaseIds.includes(String(invoice.caseId));
}
