const API_BASE = '/api';

export interface FormData {
  title: string;
  description: string;
  category: string;
  targetAudience: string;
  startDate?: string;
  endDate?: string;
  questions: QuestionData[];
  imageUrl?: string;
  isTemplate?: boolean;
  status?: string;
}

export interface QuestionData {
  id?: number;
  question: string;
  type: 'text' | 'textarea' | 'multiple-choice' | 'checkbox' | 'dropdown' | 'rating' | 'linear-scale';
  description?: string;
  required: boolean;
  options?: string[];
  min?: number;
  max?: number;
  orderIndex?: number;
}

export interface FormResponse {
  success: boolean;
  message?: string;
  formId?: string;
  form?: any;
  forms?: any[];
  templates?: any[];
  categories?: any[];
}

export interface FormSubmission {
  formId: string;
  responses: Record<string, any>;
}

export interface DeploymentData {
  startDate: string;
  endDate: string;
  targetFilters?: any;
}

export const formApi = {
  // Form Management Endpoints
  
  // Get all forms with filtering
  getForms: async (filters: {
    type?: 'all' | 'templates';
    status?: 'all' | 'draft' | 'active' | 'inactive' | 'archived';
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<FormResponse> => {
    const token = localStorage.getItem('token');
    console.log('Client: Token from localStorage:', token ? `${token.substring(0, 20)}...` : 'null');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    console.log('Client: Making request to:', `${API_BASE}/forms?${params.toString()}`);
    
    try {
      const response = await fetch(`${API_BASE}/forms?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Client: Response status:', response.status);
      console.log('Client: Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          window.location.reload();
        }
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch forms');
      }

      const result = await response.json();
      console.log('Client: Forms response:', result);
      return result;
    } catch (error) {
      console.error('Client: Forms fetch error:', error);
      throw error;
    }
  },

  // Get single form with questions
  getForm: async (formId: string): Promise<FormResponse> => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      const response = await fetch(`${API_BASE}/forms/${formId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          window.location.reload();
        }
        const error = await response.json();
        throw new Error(error.message || 'Failed to load form');
      }

      const result = await response.json();
      console.log('Client: Form response:', result);
      return result;
    } catch (error) {
      console.error('Client: Form fetch error:', error);
      throw error;
    }
  },

  // Create new form
  createForm: async (formData: FormData): Promise<FormResponse> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/forms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create form');
    }

    return response.json();
  },

  // Update existing form
  updateForm: async (formId: string, formData: Partial<FormData>): Promise<FormResponse> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/forms/${formId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update form');
    }

    return response.json();
  },

  // Delete form
  deleteForm: async (formId: string): Promise<FormResponse> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/forms/${formId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete form');
    }

    return response.json();
  },

  // Duplicate form
  duplicateForm: async (formId: string): Promise<FormResponse> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/forms/${formId}/duplicate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to duplicate form');
    }

    return response.json();
  },

  // Deploy form
  deployForm: async (formId: string, deploymentData: DeploymentData): Promise<FormResponse> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/forms/${formId}/deploy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(deploymentData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to deploy form');
    }

    return response.json();
  },

  // Form Templates Endpoints
  
  // Get form templates
  getTemplates: async (filters: {
    category?: string;
    search?: string;
  } = {}): Promise<FormResponse> => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`${API_BASE}/forms/templates?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.reload();
      }
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch templates');
    }

    return response.json();
  },

  // Form Categories Endpoints
  
  // Get available categories
  getCategories: async (): Promise<FormResponse> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/forms/categories`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch categories');
    }

    return response.json();
  },

  // Question Management Endpoints
  
  // Add question to form
  addQuestion: async (formId: string, questionData: QuestionData): Promise<FormResponse> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/forms/${formId}/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(questionData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add question');
    }

    return response.json();
  },

  // Update question
  updateQuestion: async (formId: string, questionId: string, questionData: Partial<QuestionData>): Promise<FormResponse> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/forms/${formId}/questions/${questionId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(questionData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update question');
    }

    return response.json();
  },

  // Delete question
  deleteQuestion: async (formId: string, questionId: string): Promise<FormResponse> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/forms/${formId}/questions/${questionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete question');
    }

    return response.json();
  },

  // Image Upload Endpoints
  
  // Upload form image
  uploadImage: async (file: File): Promise<{ success: boolean; url: string }> => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_BASE}/forms/upload/image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload image');
    }

    return response.json();
  },

  // Form Submission Endpoints
  
  // Submit form response
  submitForm: async (formId: string, responses: Record<string, any>): Promise<FormResponse> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/forms/${formId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ responses }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to submit form');
    }

    return response.json();
  },

  // Get user's submitted responses
  getMyResponses: async (filters: {
    page?: number;
    limit?: number;
    formId?: string;
  } = {}): Promise<FormResponse> => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`${API_BASE}/forms/my-responses?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch responses');
    }

    return response.json();
  },

  // Get assigned forms
  getAssignedForms: async (filters: {
    status?: 'all' | 'pending' | 'completed' | 'expired';
    category?: string;
  } = {}): Promise<FormResponse> => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`${API_BASE}/forms/assigned-forms?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch assigned forms');
    }

    return response.json();
  },

  // Get form responses (for form owners)
  getFormResponses: async (formId: string, filters: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}): Promise<FormResponse> => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`${API_BASE}/forms/${formId}/responses?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch form responses');
    }

    return response.json();
  },

  // Get form summary/analytics
  getFormSummary: async (formId: string): Promise<FormResponse> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/forms/${formId}/summary`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch form summary');
    }

    return response.json();
  },

  // Get form completion progress
  getFormProgress: async (formId: string): Promise<FormResponse> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/forms/${formId}/progress`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch form progress');
    }

    return response.json();
  },
};