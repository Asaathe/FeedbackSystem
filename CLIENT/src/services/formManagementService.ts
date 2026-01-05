// Form Management Service
// Handles CRUD operations for forms via API

// Debug mode - set to true to enable detailed logging
const DEBUG_MODE = true;

const logDebug = (...args: any[]) => {
  if (DEBUG_MODE) {
    console.log('[FormManagementService]', ...args);
  }
};

const logError = (...args: any[]) => {
  console.error('[FormManagementService ERROR]', ...args);
};

export interface FormData {
  id: string;
  title: string;
  description: string;
  category: string;
  target_audience: string;
  status: string;
  image_url?: string;
  submission_count: number;
  created_at: string;
  question_count: number;
  creator_name?: string;
  is_template?: boolean;
}

export interface CreateFormData {
  title: string;
  description: string;
  category: string;
  targetAudience: string;
  startDate?: string;
  endDate?: string;
  questions?: any[];
  imageUrl?: string;
  isTemplate?: boolean;
}

export interface FormsResponse {
  success: boolean;
  forms: FormData[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Get all forms with filtering
export const getForms = async (
  type: 'all' | 'templates' | 'custom' = 'all',
  status: 'all' | 'active' | 'draft' | 'inactive' = 'all',
  search: string = '',
  page: number = 1,
  limit: number = 10
): Promise<FormsResponse> => {
  logDebug('getForms called with params:', { type, status, search, page, limit });
  
  try {
    const token = sessionStorage.getItem('authToken') || localStorage.getItem('auth_token') || localStorage.getItem('token');
    logDebug('Auth token found:', token ? `${token.substring(0, 20)}...` : 'null');
    
    if (!token) {
      logError('No authentication token found');
      return { success: false, forms: [] };
    }

    const params = new URLSearchParams({
      type,
      status,
      search,
      page: page.toString(),
      limit: limit.toString(),
    });

    const apiUrl = `/api/forms?${params}`;
    logDebug(`Making GET request to: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    logDebug('Response status:', response.status, response.statusText);

    if (!response.ok) {
      logError(`HTTP error! status: ${response.status}`);
      // Try to get error details from response
      try {
        const errorData = await response.json();
        logError('Error details:', errorData);
      } catch (e) {
        logError('Could not parse error response');
      }
      return { success: false, forms: [] };
    }

    const result = await response.json();
    logDebug('Response data:', result);
    
    if (result.success && result.forms) {
      const forms = result.forms.map((form: any) => ({
        id: form.id.toString(),
        title: form.title,
        description: form.description,
        category: form.category,
        target_audience: form.target_audience,
        status: form.status,
        image_url: form.image_url,
        submission_count: form.submission_count || 0,
        created_at: form.created_at,
        question_count: form.question_count || 0,
        creator_name: form.creator_name,
        is_template: form.is_template,
      }));
      logDebug(`Successfully loaded ${forms.length} forms`);
      return {
        success: true,
        forms,
        pagination: result.pagination,
      };
    }

    logError('Unexpected response format:', result);
    return { success: false, forms: [] };
  } catch (error) {
    logError('Exception in getForms:', error);
    return { success: false, forms: [] };
  }
};

// Create new form
export const createForm = async (formData: CreateFormData): Promise<{ success: boolean; formId?: string; message: string }> => {
  logDebug('createForm called with data:', formData);
  
  try {
    const token = sessionStorage.getItem('authToken') || localStorage.getItem('auth_token') || localStorage.getItem('token');
    logDebug('Auth token found:', token ? `${token.substring(0, 20)}...` : 'null');
    
    if (!token) {
      logError('No authentication token found');
      return { success: false, message: 'No authentication token found' };
    }

    const requestData = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      targetAudience: formData.targetAudience,
      startDate: formData.startDate,
      endDate: formData.endDate,
      questions: formData.questions,
      imageUrl: formData.imageUrl,
      isTemplate: formData.isTemplate,
    };

    logDebug('Making POST request to: /api/forms');
    logDebug('Request data:', requestData);

    const response = await fetch('/api/forms', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    logDebug('Response status:', response.status, response.statusText);

    const result = await response.json();
    logDebug('Response data:', result);

    if (response.ok && result.success) {
      logDebug('Form created successfully with ID:', result.formId);
      return { success: true, formId: result.formId, message: result.message || 'Form created successfully' };
    } else {
      logError('Failed to create form:', result.message);
      return { success: false, message: result.message || 'Failed to create form' };
    }
  } catch (error) {
    logError('Exception in createForm:', error);
    return { success: false, message: 'An error occurred while creating the form' };
  }
};

// Update form
export const updateForm = async (
  formId: string,
  updates: Partial<CreateFormData>
): Promise<{ success: boolean; message: string }> => {
  logDebug('updateForm called with formId:', formId, 'updates:', updates);
  
  try {
    const token = sessionStorage.getItem('authToken') || localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (!token) {
      logError('No authentication token found');
      return { success: false, message: 'No authentication token found' };
    }

    logDebug(`Making PATCH request to: /api/forms/${formId}`);

    const response = await fetch(`/api/forms/${formId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    logDebug('Response status:', response.status, response.statusText);

    const result = await response.json();
    logDebug('Response data:', result);

    if (response.ok && result.success) {
      logDebug('Form updated successfully');
      return { success: true, message: result.message || 'Form updated successfully' };
    } else {
      logError('Failed to update form:', result.message);
      return { success: false, message: result.message || 'Failed to update form' };
    }
  } catch (error) {
    logError('Exception in updateForm:', error);
    return { success: false, message: 'An error occurred while updating the form' };
  }
};

// Delete form
export const deleteForm = async (formId: string): Promise<{ success: boolean; message: string }> => {
  logDebug('deleteForm called with formId:', formId);
  
  try {
    const token = sessionStorage.getItem('authToken') || localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (!token) {
      logError('No authentication token found');
      return { success: false, message: 'No authentication token found' };
    }

    logDebug(`Making DELETE request to: /api/forms/${formId}`);

    const response = await fetch(`/api/forms/${formId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    logDebug('Response status:', response.status, response.statusText);

    const result = await response.json();
    logDebug('Response data:', result);

    if (response.ok && result.success) {
      logDebug('Form deleted successfully');
      return { success: true, message: result.message || 'Form deleted successfully' };
    } else {
      logError('Failed to delete form:', result.message);
      return { success: false, message: result.message || 'Failed to delete form' };
    }
  } catch (error) {
    logError('Exception in deleteForm:', error);
    return { success: false, message: 'An error occurred while deleting the form' };
  }
};

// Duplicate form
export const duplicateForm = async (formId: string): Promise<{ success: boolean; formId?: string; message: string }> => {
  logDebug('duplicateForm called with formId:', formId);
  
  try {
    const token = sessionStorage.getItem('authToken') || localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (!token) {
      logError('No authentication token found');
      return { success: false, message: 'No authentication token found' };
    }

    logDebug(`Making POST request to: /api/forms/${formId}/duplicate`);

    const response = await fetch(`/api/forms/${formId}/duplicate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    logDebug('Response status:', response.status, response.statusText);

    const result = await response.json();
    logDebug('Response data:', result);

    if (response.ok && result.success) {
      logDebug('Form duplicated successfully with new ID:', result.formId);
      return { success: true, formId: result.formId, message: result.message || 'Form duplicated successfully' };
    } else {
      logError('Failed to duplicate form:', result.message);
      return { success: false, message: result.message || 'Failed to duplicate form' };
    }
  } catch (error) {
    logError('Exception in duplicateForm:', error);
    return { success: false, message: 'An error occurred while duplicating the form' };
  }
};

// Get form templates
export const getFormTemplates = async (): Promise<FormData[]> => {
  logDebug('getFormTemplates called');
  
  try {
    const token = sessionStorage.getItem('authToken') || localStorage.getItem('auth_token') || localStorage.getItem('token');
    logDebug('Auth token found:', token ? `${token.substring(0, 20)}...` : 'null');
    
    if (!token) {
      logError('No authentication token found');
      return [];
    }

    const apiUrl = '/api/forms/templates';
    logDebug(`Making GET request to: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    logDebug('Response status:', response.status, response.statusText);

    if (!response.ok) {
      logError(`HTTP error! status: ${response.status}`);
      try {
        const errorData = await response.json();
        logError('Error details:', errorData);
      } catch (e) {
        logError('Could not parse error response');
      }
      return [];
    }

    const result = await response.json();
    logDebug('Response data:', result);
    
    if (result.success && result.templates) {
      const templates = result.templates.map((template: any) => ({
        id: template.id.toString(),
        title: template.title,
        description: template.description,
        category: template.category,
        target_audience: template.target_audience,
        status: 'template',
        image_url: template.image_url,
        submission_count: 0,
        created_at: template.created_at,
        question_count: template.question_count || 0,
        creator_name: template.creator_name,
        is_template: true,
      }));
      logDebug(`Successfully loaded ${templates.length} templates`);
      return templates;
    }

    logError('Unexpected response format:', result);
    return [];
  } catch (error) {
    logError('Exception in getFormTemplates:', error);
    return [];
  }
};