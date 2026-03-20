// Published Forms Service
// Manages loading and filtering of published forms for different user roles

export interface FormQuestion {
  id: string;
  type: 'multiple-choice' | 'rating' | 'text' | 'textarea' | 'checkbox' | 'dropdown' | 'linear-scale';
  question: string;
  description?: string;
  required: boolean;
  options?: Array<{ id: number; option_text: string; order_index: number }>;
  min?: number;
  max?: number;
  section_id?: number;
  sectionId?: number;
}

export interface PublishedForm {
  id: string;
  title: string;
  description: string;
  category: string;
  target: string; // Target audience: Students, Alumni, Instructors, Staff, All Users
  questions: FormQuestion[];
  questionCount?: number;
  image?: string;
  status: 'published';
  publishedAt: string;
  dueDate?: string;
  startDate?: string;
  // Separate date/time fields for availability check
  startDateOnly?: string | null;
  startTimeOnly?: string | null;
  endDateOnly?: string | null;
  endTimeOnly?: string | null;
  assignment_status?: string; // pending, completed, expired
}

// Get all published forms from API
export const getPublishedForms = async (): Promise<PublishedForm[]> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No authentication token found');
      return [];
    }

    const response = await fetch('/api/forms?type=all&status=active', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch forms:', response.statusText);
      return [];
    }

    const result = await response.json();
    if (result.success && result.forms) {
      return result.forms.map((form: any) => ({
        id: form.id.toString(),
        title: form.title,
        description: form.description,
        category: form.category,
        target: form.target_audience,
        questions: [], // Questions will be loaded separately when needed
        image: form.image_url,
        status: 'published',
        publishedAt: form.created_at,
        dueDate: form.end_date ? new Date(form.end_date).toLocaleDateString() : undefined
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching published forms:', error);
    return [];
  }
};

// Get assigned forms for a specific user role from API
export const getFormsForUserRole = async (userRole: string): Promise<PublishedForm[]> => {
  try {
    // Check both storage locations for token
    const token = localStorage.getItem('token') || sessionStorage.getItem('authToken');
    if (!token) {
      console.warn('No authentication token found - user may not be logged in');
      return [];
    }

    const response = await fetch('/api/users/assigned-forms', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch assigned forms:', response.statusText);
      return [];
    }

    const result = await response.json();
    if (result.success && result.forms) {
      // Filter forms based on user role
      const roleMapping: Record<string, string> = {
        'student': 'Students',
        'instructor': 'Instructors',
        'alumni': 'Alumni',
        'employer': 'Staff',
        'admin': 'Staff'
      };

      const mappedRole = roleMapping[userRole.toLowerCase()];

      const filteredForms = result.forms
        .filter((form: any) => {
          // Match forms based on target audience
          const targetAudience = form.target_audience || '';
          const matchesAllUsers = targetAudience === 'All Users';
          const matchesRole = targetAudience === mappedRole;
          const matchesRolePrefix = targetAudience.startsWith(mappedRole + ' - ');
          const shouldInclude = matchesAllUsers || matchesRole || matchesRolePrefix;

          console.log('[Client Filter] Form:', form.title, 'targetAudience:', targetAudience, 'mappedRole:', mappedRole, 'matches:', { matchesAllUsers, matchesRole, matchesRolePrefix, shouldInclude });
          
          return shouldInclude;
        });

      return filteredForms
        .map((form: any) => ({
          id: form.id.toString(),
          title: form.title,
          description: form.description,
          category: form.category,
          target: form.target_audience,
          questions: form.questions || [], // Include questions from the form data
          questionCount: form.question_count || 0,
          image: form.image_url,
          status: 'published',
          publishedAt: form.created_at,
          // Handle dueDate - parse properly or use default
          dueDate: (() => {
            if (!form.end_date || form.end_date === 'null') {
              return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString();
            }
            try {
              const parsed = form.end_date.includes(' ') 
                ? new Date(form.end_date.replace(' ', 'T')) 
                : new Date(form.end_date);
              return !isNaN(parsed.getTime()) ? parsed.toLocaleDateString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString();
            } catch (e) {
              return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString();
            }
          })(),
          // Safely parse start_date - handle null, undefined, or invalid values
          startDate: (form.start_date && form.start_date !== 'null' && form.start_date !== 'undefined') 
            ? (() => {
                const dateTimeStr = form.start_time ? `${form.start_date} ${form.start_time}` : `${form.start_date} 00:00:00`;
                const parsed = new Date(dateTimeStr.replace(' ', 'T'));
                return !isNaN(parsed.getTime()) ? parsed.toISOString() : null;
              })()
            : null,
          // Store separate date/time fields for availability check
          // Extract just the date portion (YYYY-MM-DD) from the datetime string
          // Handle both string and object types from MySQL
          startDateOnly: form.start_date ? (typeof form.start_date === 'object' && form.start_date !== null ? String(form.start_date).split('T')[0] : String(form.start_date).split('T')[0]) : null,
          startTimeOnly: form.start_time ? (typeof form.start_time === 'object' && form.start_time !== null ? String(form.start_time) : form.start_time) : null,
          endDateOnly: form.end_date ? (typeof form.end_date === 'object' && form.end_date !== null ? String(form.end_date).split('T')[0] : String(form.end_date).split('T')[0]) : null,
          endTimeOnly: form.end_time ? (typeof form.end_time === 'object' && form.end_time !== null ? String(form.end_time) : form.end_time) : null,
          assignment_status: form.assignment_status || 'pending'
        }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching assigned forms:', error);
    return [];
  }
};

// Get pending forms for user (forms that haven't been submitted yet)
export const getPendingFormsForUser = async (userRole: string, userId?: string): Promise<PublishedForm[]> => {
  const assignedForms = await getFormsForUserRole(userRole);
  
  try {
    const token = sessionStorage.getItem('authToken') || localStorage.getItem('token');
    if (!token) {
      return assignedForms; // Return all assigned forms if no token
    }

    // Get user's submitted responses
    const response = await fetch('/api/forms/my-responses', {
     headers: {
       'Authorization': `Bearer ${token}`,
       'Content-Type': 'application/json',
     },
   });

    if (response.ok) {
      const result = await response.json();
      const submittedFormIds = new Set(result.responses?.map((r: any) => r.form_id.toString()) || []);
      
      // Return only forms that haven't been submitted
      return assignedForms.filter(form => !submittedFormIds.has(form.id));
    }
  } catch (error) {
    console.error('Error fetching user responses:', error);
  }
  
  return assignedForms;
};

// Get completed forms for user
  export const getCompletedFormsForUser = async (userRole: string, userId?: string): Promise<Array<{title: string, date: string, rating?: number}>> => {
    try {
      // Check both storage locations for token
      const token = localStorage.getItem('token') || sessionStorage.getItem('authToken');
      if (!token) {
        console.warn('No authentication token found for completed forms');
        return [];
      }

      const response = await fetch('/api/forms/my-responses', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

    if (response.ok) {
      const result = await response.json();
      return result.responses?.map((response: any) => ({
        title: response.form_title,
        date: new Date(response.submitted_at).toLocaleDateString(),
        rating: undefined // TODO: Calculate from response data if needed
      })) || [];
    }
  } catch (error) {
    console.error('Error fetching completed forms:', error);
  }
  
  return [];
};

// Generate a due date based on form category
const generateDueDate = (category: string): string => {
  const now = new Date();
  const daysToAdd = category === 'Academic' ? 7 : category === 'Facilities' ? 14 : 10;
  now.setDate(now.getDate() + daysToAdd);
  return now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Get form statistics for dashboard
export const getFormStatsForUser = async (userRole: string) => {
  const pendingForms = await getPendingFormsForUser(userRole);
  const completedForms = await getCompletedFormsForUser(userRole);

  return {
    pending: pendingForms.length,
    completed: completedForms.length,
    total: pendingForms.length + completedForms.length,
    completionRate: pendingForms.length + completedForms.length > 0
      ? Math.round((completedForms.length / (pendingForms.length + completedForms.length)) * 100)
      : 0
  };
};

// Interface for shared responses
export interface SharedResponse {
  id: string;
  formId: string;
  formTitle: string;
  category?: string;
  courseCode: string;
  section: string;
  sharedBy: string;
  sharedDate: string;
  totalResponses: number;
  responses: Response[];
}

export interface Response {
  id: string;
  answers: Answer[];
  submittedDate: string;
}

export interface Answer {
  question: string;
  answer: string;
  rating?: number;
}

// Get shared responses for instructor
export const getSharedResponsesForInstructor = async (): Promise<SharedResponse[]> => {
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('authToken');
    if (!token) {
      console.warn('No authentication token found');
      return [];
    }

    const response = await fetch('/api/instructor/shared-responses', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch shared responses:', response.statusText);
      return [];
    }

    const result = await response.json();
    if (result.success && result.responses) {
      return result.responses.map((item: any) => ({
        id: item.id?.toString() || '',
        formId: item.form_id?.toString() || '',
        formTitle: item.form_title || '',
        courseCode: item.course_code || '',
        section: item.section || '',
        sharedBy: item.shared_by || 'Administrator',
        sharedDate: item.shared_date ? new Date(item.shared_date).toLocaleDateString() : '',
        totalResponses: item.total_responses || 0,
        responses: item.responses?.map((resp: any) => ({
          id: resp.id?.toString() || '',
          answers: resp.answers || [],
          submittedDate: resp.submitted_date ? new Date(resp.submitted_date).toLocaleDateString() : '',
        })) || [],
      }));
    }

    return [];
  } catch (error) {
    console.error('Error fetching shared responses:', error);
    return [];
  }
};

// Get detailed responses for a specific shared form
export const getSharedResponsesDetails = async (sharedId: string): Promise<Response[]> => {
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('authToken');
    if (!token) {
      console.warn('No authentication token found');
      return [];
    }

    const response = await fetch(`/api/instructor/shared-responses/${sharedId}/responses`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch shared response details:', response.statusText);
      return [];
    }

    const result = await response.json();
    if (result.success && result.responses) {
      return result.responses.map((resp: any) => ({
        id: resp.id.toString(),
        answers: resp.answers || [],
        submittedDate: new Date(resp.submittedDate).toLocaleDateString(),
      }));
    }

    return [];
  } catch (error) {
    console.error('Error fetching shared response details:', error);
    return [];
  }
};

// Check form submission status - helps diagnose why a form can't be submitted
export interface FormSubmissionStatus {
  success: boolean;
  canSubmit: boolean;
  form: {
    id: string;
    title: string;
    status: string;
    startDate?: string;
    endDate?: string;
  };
  issues: Array<{
    type: string;
    message: string;
    currentStatus?: string;
    submittedAt?: string;
    startDate?: string;
    endDate?: string;
  }>;
}

export const checkFormSubmissionStatus = async (formId: string): Promise<FormSubmissionStatus | null> => {
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('authToken');
    if (!token) {
      console.warn('No authentication token found');
      return null;
    }

    const response = await fetch(`/api/forms/${formId}/submission-status`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to check form submission status:', response.statusText);
      return null;
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error checking form submission status:', error);
    return null;
  }
};
