import axios from 'axios';
import { Case } from '../types';
import { authAPI } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface CreateCaseInput {
  title: string;
  caseNumber: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description?: string;
  court: string;
  judge?: string;
  clientName: string;
  assignedLawyerUid: string;
  assignedLawyerName: string;
  nextHearingDate?: string | null;
}

// Helper to get authorization headers
const getAuthHeaders = () => {
  const token = authAPI.getToken();
  return {
    Authorization: `Bearer ${token}`,
  };
};

export async function createCase(input: CreateCaseInput) {
  const payload = {
    title: input.title,
    caseNumber: input.caseNumber,
    category: input.category,
    priority: input.priority,
    description: input.description || '',
    court: input.court,
    judge: input.judge || '',
    status: 'ACTIVE',
    clientName: input.clientName,
    clientId: '',
    assignedLawyerUid: input.assignedLawyerUid,
    assignedLawyerName: input.assignedLawyerName,
    nextHearingDate: input.nextHearingDate || null,
    lastActivityDate: new Date().toISOString(),
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const response = await axios.post(`${API_BASE_URL}/cases`, payload, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

export async function subscribeCases(onData: (cases: Case[]) => void, onError?: (error: unknown) => void) {
  try {
    const response = await axios.get(`${API_BASE_URL}/cases`, {
      headers: getAuthHeaders(),
    });
    const casesData = response.data.map((item: any) => ({
      id: item._id,
      title: item.title,
      caseNumber: item.caseNumber,
      category: item.category,
      priority: item.priority,
      description: item.description,
      court: item.court,
      judge: item.judge,
      status: item.status,
      clientName: item.clientName,
      clientId: item.clientId,
      assignedLawyerUid: item.assignedLawyerUid,
      assignedLawyerName: item.assignedLawyerName,
      nextHearingDate: item.nextHearingDate,
      lastActivityDate: item.lastActivityDate,
      tags: item.tags || [],
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    })) as Case[];
    onData(casesData);
  } catch (error) {
    if (onError) onError(error);
  }
}

export async function subscribeCasesByFilter(
  filters: { status?: string; court?: string; clientId?: string; lawyer?: string },
  onData: (cases: Case[]) => void,
  onError?: (error: unknown) => void
) {
  try {
    const queryParams = new URLSearchParams();
    if (filters.status && filters.status !== 'All Statuses') queryParams.append('status', filters.status);
    if (filters.court && filters.court !== 'All Courts') queryParams.append('court', filters.court);
    if (filters.clientId) queryParams.append('clientId', filters.clientId);
    if (filters.lawyer) queryParams.append('lawyer', filters.lawyer);

    const response = await axios.get(`${API_BASE_URL}/cases?${queryParams.toString()}`, {
      headers: getAuthHeaders(),
    });
    const casesData = response.data.map((item: any) => ({
      id: item._id,
      title: item.title,
      caseNumber: item.caseNumber,
      category: item.category,
      priority: item.priority,
      description: item.description,
      court: item.court,
      judge: item.judge,
      status: item.status,
      clientName: item.clientName,
      clientId: item.clientId,
      assignedLawyerUid: item.assignedLawyerUid,
      assignedLawyerName: item.assignedLawyerName,
      nextHearingDate: item.nextHearingDate,
      lastActivityDate: item.lastActivityDate,
      tags: item.tags || [],
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    })) as Case[];
    onData(casesData);
  } catch (error) {
    if (onError) onError(error);
  }
}

export async function subscribeCaseById(
  caseId: string,
  onData: (caseData: Case | null) => void,
  onError?: (error: unknown) => void
) {
  try {
    const response = await axios.get(`${API_BASE_URL}/cases/${caseId}`, {
      headers: getAuthHeaders(),
    });
    const caseData = {
      id: response.data._id,
      title: response.data.title,
      caseNumber: response.data.caseNumber,
      category: response.data.category,
      priority: response.data.priority,
      description: response.data.description,
      court: response.data.court,
      judge: response.data.judge,
      status: response.data.status,
      clientName: response.data.clientName,
      clientId: response.data.clientId,
      assignedLawyerUid: response.data.assignedLawyerUid,
      assignedLawyerName: response.data.assignedLawyerName,
      nextHearingDate: response.data.nextHearingDate,
      lastActivityDate: response.data.lastActivityDate,
      tags: response.data.tags || [],
      createdAt: response.data.createdAt,
      updatedAt: response.data.updatedAt,
    } as Case;
    onData(caseData);
  } catch (error) {
    if (onError) onError(error);
  }
}

export async function updateCase(caseId: string, updates: Partial<Case>) {
  const response = await axios.put(`${API_BASE_URL}/cases/${caseId}`, updates, {
    headers: getAuthHeaders(),
  });
  return {
    id: response.data._id,
    ...response.data,
  } as Case;
}

export async function deleteCase(caseId: string) {
  const response = await axios.delete(`${API_BASE_URL}/cases/${caseId}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
}
