/**
 * IntelliLaw Types
 */

export enum UserRole {
  ADMIN = 'ADMIN',
  LAWYER = 'LAWYER',
  STAFF = 'STAFF',
  CLIENT = 'CLIENT'
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  firmId?: string;
  photoURL?: string;
  phoneNumber?: string;
  type?: string; // Added for client type (Individual/Corporate)
  createdAt: string;
}

export interface Client {
  id: string;
  displayName: string;
  email?: string;
  phoneNumber?: string;
  type: 'Individual' | 'Corporate' | 'Organization';
  address?: {
    province?: string;
    district?: string;
    city?: string;
    area?: string;
    postalCode?: string;
  };
  createdByUid: string;
  firmId?: string;
  createdAt: string | Date;
}

export interface Case {
  id: string;
  caseNumber: string;
  title: string;
  court: string;
  judge?: string;
  status: 'ACTIVE' | 'PENDING' | 'CLOSED' | 'ARCHIVED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  clientName: string;
  clientId?: string;
  clientUid?: string;
  assignedLawyerId?: string;
  assignedLawyerUid?: string;
  assignedLawyerName: string;
  nextHearingDate?: string | Date;
  lastActivityDate?: string | Date;
  createdAt: string | Date;
  updatedAt?: string | Date;
  description?: string;
  category: string;
  tags: string[];
}

export interface Hearing {
  id: string;
  caseId: string;
  caseTitle: string;
  date: string;
  time: string;
  court: string;
  purpose: string;
  status: 'UPCOMING' | 'COMPLETED' | 'ADJOURNED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  notes?: string;
}

export interface Task {
  id: string;
  caseId?: string;
  title: string;
  description?: string;
  dueDate: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
  assignedTo: string;
  createdAt: string;
}

export interface LegalDocument {
  id: string;
  caseId: string;
  name: string;
  type: string;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
  size: number;
  category: 'PLEADINGS' | 'EVIDENCE' | 'ORDERS' | 'CORRESPONDENCE' | 'OTHER';
}

export interface Invoice {
  id: string;
  caseId: string;
  clientId: string;
  clientName: string;
  amount: number;
  status: 'PAID' | 'UNPAID' | 'OVERDUE' | 'PARTIAL';
  dueDate: string;
  issuedDate: string;
  items: InvoiceItem[];
}

export interface InvoiceItem {
  description: string;
  amount: number;
  quantity: number;
}
