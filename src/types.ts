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
  userType?: 'FIRM' | 'LAWYER' | 'CLIENT';
  isProfileComplete?: boolean;
  createdAt: string;
}

export interface RegisteredUserProfile extends UserProfile {
  _id?: string;
  updatedAt?: string;
  firmProfile?: {
    firmName?: string;
    firmLicense?: string;
    country?: string;
    city?: string;
    address?: string;
    phoneNumber?: string;
    website?: string;
    numberOfLawyers?: number;
    specialization?: string;
  };
  lawyerProfile?: {
    fullName?: string;
    licenseNumber?: string;
    specialization?: string;
    yearsOfExperience?: number;
    barCouncil?: string;
    phoneNumber?: string;
    address?: string;
    firmName?: string;
  };
  clientProfile?: {
    fullName?: string;
    phoneNumber?: string;
    address?: string;
    city?: string;
    cnic?: string;
    companyName?: string;
    isIndividual?: boolean;
  };
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
  status: 'ACTIVE' | 'PENDING' | 'CLOSED' | 'ARCHIVED' | 'ON_HOLD';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  clientName: string;
  clientId?: string;
  clientUid?: string;
  clientEmail?: string;
  assignedLawyerId?: string;
  assignedLawyerUid?: string;
  assignedLawyerName: string;
  createdByUid?: string;
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
  _id?: string;
  id?: string;
  documentNumber: string;
  name: string;
  description?: string;
  caseId: string;
  category: 'PLEADINGS' | 'EVIDENCE' | 'ORDERS' | 'CORRESPONDENCE' | 'OTHER';
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  uploadedAt: Date | string;
  tags?: string[];
  isVerified?: boolean;
  confidentiality?: 'PUBLIC' | 'RESTRICTED' | 'CONFIDENTIAL';
  size?: number; // alias for fileSize for compatibility
  url?: string; // alias for fileUrl for compatibility
  type?: string; // alias for fileType for compatibility
}

export interface Invoice {
  id: string;
  caseId: string;
  clientId: string;
  clientUid?: string;
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
