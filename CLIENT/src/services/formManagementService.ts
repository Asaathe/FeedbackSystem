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
  questions?: any[];
  ai_description?: string;
}

export interface CreateFormData {
  title: string;
  description: string;
  category: string;
  targetAudience: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  questions?: any[];
  imageUrl?: string;
  isTemplate?: boolean;
  status?: string;
  aiDescription?: string;
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

// Get single form by ID
export const getForm = async (formId: string): Promise<{ success: boolean; form?: any; message: string }> => {
  logDebug('getForm called with formId:', formId);

  try {
    const token = sessionStorage.getItem('authToken') || localStorage.getItem('auth_token') || localStorage.getItem('token');
    logDebug('Auth token found:', token ? `${token.substring(0, 20)}...` : 'null');

    if (!token) {
      logError('No authentication token found');
      return { success: false, message: 'No authentication token found' };
    }

    const apiUrl = `/api/forms/${formId}`;
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
      return { success: false, message: 'Failed to fetch form' };
    }

    const result = await response.json();
    logDebug('Response data:', result);

    if (result.success && result.form) {
      logDebug('Form fetched successfully');
      // Standardize question properties for consistency
      const standardizedForm = {
        ...result.form,
        questions: result.form.questions?.map((question: any) => ({
          ...question,
          type: question.question_type || question.type,
          question: question.question_text || question.question,
        }))
      };
      return { success: true, form: standardizedForm, message: 'Form fetched successfully' };
    } else {
      logError('Unexpected response format:', result);
      return { success: false, message: result.message || 'Failed to fetch form' };
    }
  } catch (error) {
    logError('Exception in getForm:', error);
    return { success: false, message: 'An error occurred while fetching the form' };
  }
};

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
        // Try different possible field names for question count
        question_count: form.question_count || form.questions_count || form.total_questions || 0,
        creator_name: form.creator_name,
        is_template: form.is_template,
        // Store the questions array if available
        questions: form.questions || undefined,
        // Debug: log the raw form data to see what's actually being returned
        _rawData: form,
      }));
      logDebug(`Successfully loaded ${forms.length} forms`);
      console.log('Forms data from API:', forms);
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

    // Send questions as-is - let the server handle the format
    const questionsToSend = formData.questions || [];
    console.log('📤 Questions being sent to server:', questionsToSend);
    console.log('📤 First question sample:', questionsToSend[0]);

    const requestData = {
      title: formData.title,
      description: formData.description,
      aiDescription: formData.aiDescription,
      category: formData.category,
      targetAudience: formData.targetAudience,
      startDate: formData.startDate,
      endDate: formData.endDate,
      startTime: formData.startTime,
      endTime: formData.endTime,
      questions: questionsToSend,
      imageUrl: formData.imageUrl,
      isTemplate: formData.isTemplate,
    };

    logDebug('Making POST request to: /api/forms');
    logDebug('Request data:', requestData);

    // Map camelCase to snake_case for API
    const mappedRequestData: any = { ...requestData };
    if (mappedRequestData.aiDescription !== undefined) {
      mappedRequestData.ai_description = mappedRequestData.aiDescription;
      delete mappedRequestData.aiDescription;
    }
    logDebug('Mapped request data:', mappedRequestData);
    console.log('🔍 CLIENT: Form creation request data:', JSON.stringify(mappedRequestData, null, 2));
    if (requestData.questions && requestData.questions.length > 0) {
      console.log('🔍 CLIENT: Questions being sent:', requestData.questions.map((q, i) => ({
        index: i + 1,
        question: q.question,
        type: q.type,
        required: q.required,
        hasOptions: !!(q.options && q.options.length > 0),
        optionsCount: q.options ? q.options.length : 0
      })));
    }

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
    console.log('Create form API response:', result);

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

    // Map camelCase to snake_case for API
    const mappedUpdates: any = { ...updates };
    if (mappedUpdates.aiDescription !== undefined) {
      mappedUpdates.ai_description = mappedUpdates.aiDescription;
      delete mappedUpdates.aiDescription;
    }

    const response = await fetch(`/api/forms/${formId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mappedUpdates),
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

// Save form as template
export const saveAsTemplate = async (formId: string): Promise<{ success: boolean; templateId?: string; message: string }> => {
  logDebug('saveAsTemplate called with formId:', formId);

  try {
    const token = sessionStorage.getItem('authToken') || localStorage.getItem('auth_token') || localStorage.getItem('token');
    logDebug('Auth token found:', token ? `${token.substring(0, 20)}...` : 'null');
    
    if (!token) {
      logError('No authentication token found');
      return { success: false, message: 'No authentication token found' };
    }

    // Call the new API endpoint that handles both template creation and form status update
    const response = await fetch(`/api/forms/${formId}/save-as-template`, {
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
      logDebug('Form saved as template successfully');
      return {
        success: true,
        templateId: result.templateId,
        message: result.message || 'Form saved as template successfully'
      };
    } else {
      logError('Failed to save form as template:', result.message);
      return {
        success: false,
        message: result.message || 'Failed to save form as template'
      };
    }
  } catch (error) {
    logError('Exception in saveAsTemplate:', error);
    return { success: false, message: 'An error occurred while saving as template' };
  }
};

// Get filtered users for form targeting - UPDATED
export const getFilteredUsers = async (filters: {
  role: string;
  course?: string;
  year?: string;
  section?: string;
  grade?: string;
  course_year_section?: string;
  department?: string;
  company?: string;
}): Promise<{ success: boolean; users?: any[]; count?: number; message: string }> => {
  logDebug('getFilteredUsers called with filters:', filters);

  try {
    const token = sessionStorage.getItem('authToken') || localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (!token) {
      logError('No authentication token found');
      return { success: false, message: 'No authentication token found' };
    }

    const params = new URLSearchParams();
    params.append('role', filters.role);
    if (filters.course) params.append('course', filters.course);
    if (filters.year) params.append('year', filters.year);
    if (filters.section) params.append('section', filters.section);
    if (filters.grade) params.append('grade', filters.grade);
    if (filters.course_year_section) params.append('course_year_section', filters.course_year_section);
    if (filters.department) params.append('department', filters.department);
    if (filters.company) params.append('company', filters.company);

    const apiUrl = `/api/users/filter?${params}`;
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
      return { success: false, message: 'Failed to fetch users' };
    }

    const result = await response.json();
    logDebug('Response data:', result);

    if (result.success && result.users) {
      logDebug(`Successfully loaded ${result.users.length} users`);
      return {
        success: true,
        users: result.users,
        count: result.count,
        message: 'Users fetched successfully'
      };
    } else {
      logError('Unexpected response format:', result);
      return { success: false, message: result.message || 'Failed to fetch users' };
    }
  } catch (error) {
    logError('Exception in getFilteredUsers:', error);
    return { success: false, message: 'An error occurred while fetching users' };
  }
};

// Get shared instructors for a form
export const getSharedInstructors = async (formId: string): Promise<{ success: boolean; instructors: { id: number; fullName: string; department: string }[]; message?: string }> => {
  logDebug('getSharedInstructors called with formId:', formId);

  try {
    const token = sessionStorage.getItem('authToken') || localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (!token) {
      logError('No authentication token found');
      return { success: false, instructors: [], message: 'No authentication token found' };
    }

    const apiUrl = `/api/forms/${formId}/shared-instructors`;
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      logError(`HTTP error! status: ${response.status}`);
      return { success: false, instructors: [], message: 'Failed to fetch shared instructors' };
    }

    const result = await response.json();
    if (result.success && result.instructors) {
      logDebug(`Successfully loaded ${result.instructors.length} shared instructors`);
      return { success: true, instructors: result.instructors };
    }

    return { success: false, instructors: [], message: result.message || 'Failed to fetch shared instructors' };
  } catch (error) {
    logError('Exception in getSharedInstructors:', error);
    return { success: false, instructors: [], message: 'An error occurred while fetching shared instructors' };
  }
};

// Get form assignments (assigned users)
export const getFormAssignments = async (formId: string): Promise<{ success: boolean; assignments: { id: number; fullName: string; role: string; department: string }[]; message?: string }> => {
  logDebug('getFormAssignments called with formId:', formId);

  try {
    const token = sessionStorage.getItem('authToken') || localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (!token) {
      logError('No authentication token found');
      return { success: false, assignments: [], message: 'No authentication token found' };
    }

    const apiUrl = `/api/forms/${formId}/assignments`;
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      logError(`HTTP error! status: ${response.status}`);
      return { success: false, assignments: [], message: 'Failed to fetch form assignments' };
    }

    const result = await response.json();
    if (result.success && result.assignments) {
      logDebug(`Successfully loaded ${result.assignments.length} assignments`);
      return { success: true, assignments: result.assignments };
    }

    return { success: false, assignments: [], message: result.message || 'Failed to fetch form assignments' };
  } catch (error) {
    logError('Exception in getFormAssignments:', error);
    return { success: false, assignments: [], message: 'An error occurred while fetching form assignments' };
  }
};

// Get form templates
export const getFormTemplates = async (): Promise<FormData[]> => {
  logDebug('getFormTemplates called');

  const result = await getForms('templates', 'all', '', 1, 100);
  if (result.success) {
    // Filter to ensure only templates are returned and maintain their original data
    return result.forms.filter(form => form.is_template || form.status === 'template');
  }
  return [];
};

// Category interface
export interface FormCategory {
  id: number;
  name: string;
  description?: string;
}

// Get all form categories
export const getFormCategories = async (): Promise<{ success: boolean; categories: FormCategory[]; message?: string }> => {
  logDebug('getFormCategories called');

  try {
    const token = sessionStorage.getItem('authToken') || localStorage.getItem('auth_token') || localStorage.getItem('token');
    logDebug('Auth token found:', token ? `${token.substring(0, 20)}...` : 'null');
    
    if (!token) {
      logError('No authentication token found');
      return { success: false, categories: [], message: 'No authentication token found' };
    }

    const apiUrl = '/api/form-categories';
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
      return { success: false, categories: [], message: 'Failed to fetch categories' };
    }

    const result = await response.json();
    logDebug('Response data:', result);

    if (result.success && result.categories) {
      logDebug(`Successfully loaded ${result.categories.length} categories`);
      return {
        success: true,
        categories: result.categories.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          description: cat.description || ''
        })),
        message: 'Categories fetched successfully'
      };
    } else {
      logError('Unexpected response format:', result);
      return { success: false, categories: [], message: result.message || 'Failed to fetch categories' };
    }
  } catch (error) {
    logError('Exception in getFormCategories:', error);
    return { success: false, categories: [], message: 'An error occurred while fetching categories' };
  }
};

// Add new form category
export const addFormCategory = async (name: string, description?: string): Promise<{ success: boolean; category?: FormCategory; message: string }> => {
  logDebug('addFormCategory called with:', { name, description });

  try {
    const token = sessionStorage.getItem('authToken') || localStorage.getItem('auth_token') || localStorage.getItem('token');
    logDebug('Auth token found:', token ? `${token.substring(0, 20)}...` : 'null');
    
    if (!token) {
      logError('No authentication token found');
      return { success: false, message: 'No authentication token found' };
    }

    const apiUrl = '/api/form-categories';
    logDebug(`Making POST request to: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, description }),
    });

    logDebug('Response status:', response.status, response.statusText);

    const result = await response.json();
    logDebug('Response data:', result);

    if (response.ok && result.success) {
      logDebug('Category added successfully');
      return {
        success: true,
        category: result.category,
        message: result.message || 'Category added successfully'
      };
    } else {
      logError('Failed to add category:', result.message);
      return { success: false, message: result.message || 'Failed to add category' };
    }
  } catch (error) {
    logError('Exception in addFormCategory:', error);
    return { success: false, message: 'An error occurred while adding the category' };
  }
};

// Update form category
export const updateFormCategory = async (categoryId: number, name: string, description?: string): Promise<{ success: boolean; category?: FormCategory; message: string }> => {
  logDebug('updateFormCategory called with:', { categoryId, name, description });

  try {
    const token = sessionStorage.getItem('authToken') || localStorage.getItem('auth_token') || localStorage.getItem('token');
    logDebug('Auth token found:', token ? `${token.substring(0, 20)}...` : 'null');
    
    if (!token) {
      logError('No authentication token found');
      return { success: false, message: 'No authentication token found' };
    }

    const apiUrl = `/api/form-categories/${categoryId}`;
    logDebug(`Making PATCH request to: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, description }),
    });

    logDebug('Response status:', response.status, response.statusText);

    const result = await response.json();
    logDebug('Response data:', result);

    if (response.ok && result.success) {
      logDebug('Category updated successfully');
      return {
        success: true,
        category: result.category,
        message: result.message || 'Category updated successfully'
      };
    } else {
      logError('Failed to update category:', result.message);
      return { success: false, message: result.message || 'Failed to update category' };
    }
  } catch (error) {
    logError('Exception in updateFormCategory:', error);
    return { success: false, message: 'An error occurred while updating the category' };
  }
};

// Delete form category
export const deleteFormCategory = async (categoryId: number): Promise<{ success: boolean; message: string }> => {
  logDebug('deleteFormCategory called with categoryId:', categoryId);

  try {
    const token = sessionStorage.getItem('authToken') || localStorage.getItem('auth_token') || localStorage.getItem('token');
    logDebug('Auth token found:', token ? `${token.substring(0, 20)}...` : 'null');
    
    if (!token) {
      logError('No authentication token found');
      return { success: false, message: 'No authentication token found' };
    }

    const apiUrl = `/api/form-categories/${categoryId}`;
    logDebug(`Making DELETE request to: ${apiUrl}`);

    const response = await fetch(apiUrl, {
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
      logDebug('Category deleted successfully');
      return { success: true, message: result.message || 'Category deleted successfully' };
    } else {
      logError('Failed to delete category:', result.message);
      return { success: false, message: result.message || 'Failed to delete category' };
    }
  } catch (error) {
    logError('Exception in deleteFormCategory:', error);
    return { success: false, message: 'An error occurred while deleting the category' };
  }
};

// Assign form to users
export async function assignFormToUsers(
  formId: string,
  userIds: number[],
  targetAudience: string,
  startDate?: string,
  endDate?: string,
  startTime?: string,
  endTime?: string,
  department?: string,
  courseYearSection?: string
) {
  logDebug('assignFormToUsers called with:', { formId, userIds, targetAudience, startDate, endDate, startTime, endTime, department, courseYearSection });

  try {
    const token = sessionStorage.getItem('authToken') || localStorage.getItem('auth_token') || localStorage.getItem('token');
    logDebug('Auth token found:', token ? `${token.substring(0, 20)}...` : 'null');

    if (!token) {
      logError('No authentication token found');
      throw new Error('No authentication token found');
    }

    console.log('🚀 Assigning form:', formId);
    console.log('👥 User IDs:', userIds);
    console.log('🎯 Target audience:', targetAudience);

    const apiUrl = `/api/forms/${formId}/deploy`;
    logDebug(`Making POST request to: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        userIds,
        targetAudience,
        startDate,
        endDate,
        startTime,
        endTime,
        department,
        courseYearSection,
      }),
    });

    logDebug('Response status:', response.status, response.statusText);

    const data = await response.json();
    logDebug('Response data:', data);
    console.log('📨 Assignment response:', data);

    if (!response.ok) {
      logError('Failed to assign form:', data.message);
      throw new Error(data.message || 'Failed to assign form');
    }

    return data;
  } catch (error) {
    logError('Exception in assignFormToUsers:', error);
    console.error('❌ Error assigning form:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to assign form',
    };
  }
}

// Get assigned forms for current user
export async function getAssignedForms(status: string = 'all') {
  logDebug('getAssignedForms called with status:', status);

  try {
    const token = sessionStorage.getItem('authToken') || localStorage.getItem('auth_token') || localStorage.getItem('token');
    logDebug('Auth token found:', token ? `${token.substring(0, 20)}...` : 'null');
    
    if (!token) {
      logError('No authentication token found');
      throw new Error('No authentication token found');
    }

    const apiUrl = `/api/users/assigned-forms?status=${status}`;
    logDebug(`Making GET request to: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    logDebug('Response status:', response.status, response.statusText);

    const data = await response.json();
    logDebug('Response data:', data);

    if (!response.ok) {
      logError('Failed to fetch assigned forms:', data.message);
      throw new Error(data.message || 'Failed to fetch assigned forms');
    }

    return data;
  } catch (error) {
    logError('Exception in getAssignedForms:', error);
    console.error('Error fetching assigned forms:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch assigned forms',
      forms: [],
    };
  }
}

// Update assignment status
export async function updateAssignmentStatus(formId: string, status: string) {
  logDebug('updateAssignmentStatus called with:', { formId, status });

  try {
    const token = sessionStorage.getItem('authToken') || localStorage.getItem('auth_token') || localStorage.getItem('token');
    logDebug('Auth token found:', token ? `${token.substring(0, 20)}...` : 'null');
    
    if (!token) {
      logError('No authentication token found');
      throw new Error('No authentication token found');
    }

    const apiUrl = `/api/forms/${formId}/assignment-status`;
    logDebug(`Making PATCH request to: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });

    logDebug('Response status:', response.status, response.statusText);

    const data = await response.json();
    logDebug('Response data:', data);

    if (!response.ok) {
      logError('Failed to update assignment status:', data.message);
      throw new Error(data.message || 'Failed to update assignment status');
    }

    return data;
  } catch (error) {
    logError('Exception in updateAssignmentStatus:', error);
    console.error('Error updating assignment status:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update assignment status',
    };
  }
}

// Get assignment statistics for a form
export async function getAssignmentStats(formId: string) {
  logDebug('getAssignmentStats called with formId:', formId);

  try {
    const token = sessionStorage.getItem('authToken') || localStorage.getItem('auth_token') || localStorage.getItem('token');
    logDebug('Auth token found:', token ? `${token.substring(0, 20)}...` : 'null');
    
    if (!token) {
      logError('No authentication token found');
      throw new Error('No authentication token found');
    }

    const apiUrl = `/api/forms/${formId}/assignment-stats`;
    logDebug(`Making GET request to: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    logDebug('Response status:', response.status, response.statusText);

    const data = await response.json();
    logDebug('Response data:', data);

    if (!response.ok) {
      logError('Failed to fetch assignment stats:', data.message);
      throw new Error(data.message || 'Failed to fetch assignment stats');
    }

    return data;
  } catch (error) {
    logError('Exception in getAssignmentStats:', error);
    console.error('Error fetching assignment stats:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch assignment stats',
      stats: null,
    };
  }
}

// Add these new functions to formManagementService.ts

// Get alumni companies for filtering
export const getAlumniCompanies = async (): Promise<{ success: boolean; companies: string[]; message?: string }> => {
  logDebug('getAlumniCompanies called');

  try {
    const token = sessionStorage.getItem('authToken') || localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (!token) {
      logError('No authentication token found');
      return { success: false, companies: [], message: 'No authentication token found' };
    }

    const apiUrl = '/api/alumni/companies';
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      logError(`HTTP error! status: ${response.status}`);
      return { success: false, companies: [], message: 'Failed to fetch alumni companies' };
    }

    const result = await response.json();
    if (result.success && result.companies) {
      logDebug(`Successfully loaded ${result.companies.length} companies`);
      return { success: true, companies: result.companies, message: 'Companies fetched successfully' };
    }

    return { success: false, companies: [], message: result.message || 'Failed to fetch companies' };
  } catch (error) {
    logError('Exception in getAlumniCompanies:', error);
    return { success: false, companies: [], message: 'An error occurred while fetching companies' };
  }
};

// Get employer companies for filtering
export const getEmployerCompanies = async (): Promise<{ success: boolean; companies: string[]; message?: string }> => {
  logDebug('getEmployerCompanies called');

  try {
    const token = sessionStorage.getItem('authToken') || localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (!token) {
      logError('No authentication token found');
      return { success: false, companies: [], message: 'No authentication token found' };
    }

    const apiUrl = '/api/employers/companies';
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      logError(`HTTP error! status: ${response.status}`);
      return { success: false, companies: [], message: 'Failed to fetch employer companies' };
    }

    const result = await response.json();
    if (result.success && result.companies) {
      logDebug(`Successfully loaded ${result.companies.length} companies`);
      return { success: true, companies: result.companies, message: 'Companies fetched successfully' };
    }

    return { success: false, companies: [], message: result.message || 'Failed to fetch companies' };
  } catch (error) {
    logError('Exception in getEmployerCompanies:', error);
    return { success: false, companies: [], message: 'An error occurred while fetching companies' };
  }
};

// Get instructor departments for filtering
export const getInstructorDepartments = async (): Promise<{ success: boolean; departments: string[]; message?: string }> => {
  logDebug('getInstructorDepartments called');
  
  try {
    const token = sessionStorage.getItem('authToken') || localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (!token) {
      logError('No authentication token found');
      return { success: false, departments: [], message: 'No authentication token found' };
    }

    const apiUrl = '/api/instructors/departments';
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      logError(`HTTP error! status: ${response.status}`);
      return { success: false, departments: [], message: 'Failed to fetch departments' };
    }

    const result = await response.json();
    if (result.success && result.departments) {
      logDebug(`Successfully loaded ${result.departments.length} departments`);
      return { success: true, departments: result.departments, message: 'Departments fetched successfully' };
    }
    
    return { success: false, departments: [], message: result.message || 'Failed to fetch departments' };
  } catch (error) {
    logError('Exception in getInstructorDepartments:', error);
    return { success: false, departments: [], message: 'An error occurred while fetching departments' };
  }
};

// Get student sections for filtering
export const getStudentSections = async (): Promise<{ success: boolean; sections: string[]; message?: string }> => {
  logDebug('getStudentSections called');

  try {
    const token = sessionStorage.getItem('authToken') || localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (!token) {
      logError('No authentication token found');
      return { success: false, sections: [], message: 'No authentication token found' };
    }

    const apiUrl = '/api/students/sections';
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      logError(`HTTP error! status: ${response.status}`);
      return { success: false, sections: [], message: 'Failed to fetch student sections' };
    }

    const result = await response.json();
    if (result.success && result.sections) {
      logDebug(`Successfully loaded ${result.sections.length} sections`);
      return { success: true, sections: result.sections, message: 'Sections fetched successfully' };
    }

    return { success: false, sections: [], message: result.message || 'Failed to fetch sections' };
  } catch (error) {
    logError('Exception in getStudentSections:', error);
    return { success: false, sections: [], message: 'An error occurred while fetching sections' };
  }
};

// Get active course sections from course_management table
export const getActiveCourseSections = async (department?: string): Promise<{ success: boolean; sections: string[]; message?: string }> => {
  logDebug('getActiveCourseSections called with department:', department);

  try {
    const token = sessionStorage.getItem('authToken') || localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (!token) {
      logError('No authentication token found');
      return { success: false, sections: [], message: 'No authentication token found' };
    }

    // Build URL with optional department parameter
    let apiUrl = '/api/programs/sections';
    if (department) {
      apiUrl += `?department=${encodeURIComponent(department)}`;
    }
    
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      logError(`HTTP error! status: ${response.status}`);
      return { success: false, sections: [], message: 'Failed to fetch course sections' };
    }

    const result = await response.json();
    if (result.success && result.courses) {
      // Extract the value field from course section objects
      const sectionValues = result.courses.map((course: any) => course.value);
      logDebug(`Successfully loaded ${sectionValues.length} course sections`);
      return { success: true, sections: sectionValues, message: 'Course sections fetched successfully' };
    }

    return { success: false, sections: [], message: result.message || 'Failed to fetch course sections' };
  } catch (error) {
    logError('Exception in getActiveCourseSections:', error);
    return { success: false, sections: [], message: 'An error occurred while fetching course sections' };
  }
};

// Get departments from course_management table
export const getDepartmentsFromPrograms = async (): Promise<{ success: boolean; departments: string[]; message?: string }> => {
  logDebug('getDepartmentsFromPrograms called');

  try {
    const token = sessionStorage.getItem('authToken') || localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (!token) {
      logError('No authentication token found');
      return { success: false, departments: [], message: 'No authentication token found' };
    }

    const apiUrl = '/api/programs/departments';
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      logError(`HTTP error! status: ${response.status}`);
      return { success: false, departments: [], message: 'Failed to fetch departments' };
    }

    const result = await response.json();
    if (result.success && result.departments) {
      logDebug(`Successfully loaded ${result.departments.length} departments`);
      return { success: true, departments: result.departments, message: 'Departments fetched successfully' };
    }

    return { success: false, departments: [], message: result.message || 'Failed to fetch departments' };
  } catch (error) {
    logError('Exception in getDepartmentsFromPrograms:', error);
    return { success: false, departments: [], message: 'An error occurred while fetching departments' };
  }
};

// Deploy form
export const deployForm = async (formId: string, deploymentData: {
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  targetFilters: {
    roles: string[];
    target_audience: string;
    department?: string | null;
    course_year_section?: string | null;
    company?: string | null;
  };
}): Promise<{ success: boolean; message: string }> => {
  logDebug('deployForm called with formId:', formId, 'deploymentData:', deploymentData);

  try {
    const token = sessionStorage.getItem('authToken') || localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (!token) {
      logError('No authentication token found');
      return { success: false, message: 'No authentication token found' };
    }

    const apiUrl = `/api/forms/${formId}/deploy`;
    logDebug(`Making POST request to: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deploymentData),
    });

    logDebug('Response status:', response.status, response.statusText);

    const result = await response.json();
    logDebug('Response data:', result);

    if (response.ok && result.success) {
      logDebug('Form deployed successfully');
      return { success: true, message: result.message || 'Form deployed successfully' };
    } else {
      logError('Failed to deploy form:', result.message);
      return { success: false, message: result.message || 'Failed to deploy form' };
    }
  } catch (error) {
    logError('Exception in deployForm:', error);
    return { success: false, message: 'An error occurred while deploying the form' };
  }
};

// Form Response interface
export interface FormResponse {
  id: string;
  user_id: number;
  submitted_at: string;
  response_data: Record<string, any>; // JSON object of question_id -> answer
  respondent_name?: string;
  respondent_email?: string;
  respondent_role?: string;
}

// Get form responses for analysis
export const getFormResponses = async (formId: string): Promise<{ success: boolean; responses: FormResponse[]; form?: any; pagination?: any; message: string }> => {
  logDebug('getFormResponses called with formId:', formId);

  try {
    const token = sessionStorage.getItem('authToken') || localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (!token) {
      logError('No authentication token found');
      return { success: false, responses: [], message: 'No authentication token found' };
    }

    const apiUrl = `/api/forms/${formId}/responses`;
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
      return { success: false, responses: [], message: 'Failed to fetch form responses' };
    }

    const result = await response.json();
    logDebug('Response data:', result);

    if (result.success && result.responses) {
      logDebug(`Successfully loaded ${result.responses.length} responses`);
      // Transform answers to response_data for compatibility with FormResponse interface
      const transformedResponses = result.responses.map((r: any) => ({
        id: r.id?.toString() || '',
        user_id: r.user_id || 0,
        submitted_at: r.submitted_at || new Date().toISOString(),
        response_data: r.answers || {},
        respondent_name: r.full_name || r.respondent_name || '',
        respondent_email: r.email || r.respondent_email || '',
        respondent_role: r.role || r.respondent_role || '',
      }));
      return {
        success: true,
        responses: transformedResponses,
        form: result.form,
        pagination: result.pagination,
        message: 'Form responses fetched successfully'
      };
    } else {
      logError('Unexpected response format:', result);
      return { success: false, responses: [], message: result.message || 'Failed to fetch form responses' };
    }
  } catch (error) {
    logError('Exception in getFormResponses:', error);
    return { success: false, responses: [], message: 'An error occurred while fetching form responses' };
  }
};