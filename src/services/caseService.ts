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
      ...item,
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
      ...response.data,
    } as Case;
    onData(caseData);
  } catch (error) {
    if (onError) onError(error);
  }
}
