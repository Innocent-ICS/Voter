import { projectId, publicAnonKey } from "./supabase/info";

// Use local backend in development, Render backend in production
const API_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:8000/make-server-02adf113'
  : 'https://voter-ul2k.onrender.com/make-server-02adf113';

export async function apiCall(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${publicAnonKey}`,
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
}

export const api = {
  register: (email: string, fullName: string, studentClass: string) =>
    apiCall('/register', {
      method: 'POST',
      body: JSON.stringify({ email, fullName, studentClass }),
    }),

  sendRegistrationLink: (email: string) =>
    apiCall('/send-registration-link', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  verifyRegistrationToken: (token: string) =>
    apiCall(`/verify-registration-token/${token}`),

  completeRegistration: (token: string, fullName: string, studentClass: string) =>
    apiCall('/complete-registration', {
      method: 'POST',
      body: JSON.stringify({ token, fullName, studentClass }),
    }),

  sendVoteLink: (email: string) =>
    apiCall('/send-vote-link', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  verifyToken: (token: string) =>
    apiCall(`/verify-token/${token}`),

  getCandidates: (studentClass: string) =>
    apiCall(`/candidates/${encodeURIComponent(studentClass)}`),

  submitVote: (token: string, votes: any) =>
    apiCall('/submit-vote', {
      method: 'POST',
      body: JSON.stringify({ token, votes }),
    }),

  getResults: () =>
    apiCall('/results'),
};