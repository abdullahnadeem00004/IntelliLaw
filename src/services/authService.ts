import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  displayName: string;
}

export interface AuthResponse {
  _id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: string;
  token: string;
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: string;
}

// API calls for authentication
export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  signup: async (credentials: SignupCredentials): Promise<AuthResponse> => {
    const response = await axios.post(`${API_BASE_URL}/auth/signup`, credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
  },

  getCurrentUser: async (): Promise<User | null> => {
    const token = localStorage.getItem('token');
    console.log('🔑 Getting current user - token exists:', !!token);
    
    if (!token) {
      console.log('❌ No token found in localStorage');
      return null;
    }

    try {
      console.log('📡 Calling /api/auth/me with token...');
      const response = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ User fetched successfully:', response.data.email);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to fetch user:', error.response?.status, error.response?.data);
      localStorage.removeItem('token');
      return null;
    }
  },

  getToken: () => localStorage.getItem('token'),
};
