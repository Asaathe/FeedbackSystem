// Form Management Service
// Handles CRUD operations for forms via API

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
  try {
    const token = sessionStorage.getItem('authToken') || localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (!token) {
      console.warn('No authentication token found');
      return { success: false, forms: [] };
    }

    const params = new URLSearchParams({
      type,
      status,
      search,
      page: page.toString(),
      limit: limit.toString(),
    });

    console.log('🔍 Fetching forms with params:', params.toString());
    console.log('📡 Making request to:', `/api/forms?${params}`);
    console.log('🔑 Token preview:', token.substring(0, 20) + '...');

    const response = await fetch(`/api/forms?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('📊 Response status:', response.status, response.statusText);

    if (!response.ok) {
      console.error(' Failed to fetch forms:', response.status, response.statusText);
      // Try to get error details from response
      try {
        const errorData = await response.json();
        console.error(' Error details:', errorData);
      } catch (e) {
        console.error(' Could not parse error response');
      }
      return { success: false, forms: [] };
    }

    const result = await response.json();
    if (result.success && result.forms) {
      return {
        success: true,
        forms: result.forms.map((form: any) => ({
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
        })),
        pagination: result.pagination,
      };
    }

    return { success: false, forms: [] };
  } catch (error) {
    console.error('Error fetching forms:', error);
    return { success: false, forms: [] };
  }
};

// Create new form
export const createForm = async (formData: CreateFormData): Promise<{ success: boolean; formId?: string; message: string }> => {
  try {
    const token = sessionStorage.getItem('authToken') || localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (!token) {
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

    const response = await fetch('/api/forms', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      return { success: true, formId: result.formId, message: result.message || 'Form created successfully' };
    } else {
      return { success: false, message: result.message || 'Failed to create form' };
    }
  } catch (error) {
    console.error('Error creating form:', error);
    return { success: false, message: 'An error occurred while creating the form' };
  }
};

// Update form
export const updateForm = async (
  formId: string,
  updates: Partial<CreateFormData>
): Promise<{ success: boolean; message: string }> => {
  try {
    const token = sessionStorage.getItem('authToken') || localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (!token) {
      return { success: false, message: 'No authentication token found' };
    }

    const response = await fetch(`/api/forms/${formId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      return { success: true, message: result.message || 'Form updated successfully' };
    } else {
      return { success: false, message: result.message || 'Failed to update form' };
    }
  } catch (error) {
    console.error('Error updating form:', error);
    return { success: false, message: 'An error occurred while updating the form' };
  }
};

// Delete form
export const deleteForm = async (formId: string): Promise<{ success: boolean; message: string }> => {
  try {
    const token = sessionStorage.getItem('authToken') || localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (!token) {
      return { success: false, message: 'No authentication token found' };
    }

    const response = await fetch(`/api/forms/${formId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (response.ok && result.success) {
      return { success: true, message: result.message || 'Form deleted successfully' };
    } else {
      return { success: false, message: result.message || 'Failed to delete form' };
    }
  } catch (error) {
    console.error('Error deleting form:', error);
    return { success: false, message: 'An error occurred while deleting the form' };
  }
};

// Duplicate form
export const duplicateForm = async (formId: string): Promise<{ success: boolean; formId?: string; message: string }> => {
  try {
    const token = sessionStorage.getItem('authToken') || localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (!token) {
      return { success: false, message: 'No authentication token found' };
    }

    const response = await fetch(`/api/forms/${formId}/duplicate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (response.ok && result.success) {
      return { success: true, formId: result.formId, message: result.message || 'Form duplicated successfully' };
    } else {
      return { success: false, message: result.message || 'Failed to duplicate form' };
    }
  } catch (error) {
    console.error('Error duplicating form:', error);
    return { success: false, message: 'An error occurred while duplicating the form' };
  }
};

// Get form templates
export const getFormTemplates = async (): Promise<FormData[]> => {
  try {
    const token = sessionStorage.getItem('authToken') || localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (!token) {
      console.warn('No authentication token found');
      return [];
    }

    const response = await fetch('/api/forms/templates', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch templates:', response.statusText);
      return [];
    }

    const result = await response.json();
    if (result.success && result.templates) {
      return result.templates.map((template: any) => ({
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
    }

    return [];
  } catch (error) {
    console.error('Error fetching templates:', error);
    return [];
  }
};