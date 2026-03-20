// Subject Management Service
// Handles CRUD operations for subjects and evaluation forms

const API_BASE_URL = '/api';

const getAuthHeaders = () => {
  const token = sessionStorage.getItem('authToken') || localStorage.getItem('auth_token') || localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

// Subject CRUD Operations
export const getSubjects = async (search?: string, status?: string, department?: string) => {
  try {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    if (department) params.append('department', department);

    const response = await fetch(`${API_BASE_URL}/subjects?${params}`, {
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return { success: false, message: 'Failed to fetch subjects', subjects: [] };
  }
};

export const getSubject = async (id: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/subjects/${id}`, {
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching subject:', error);
    return { success: false, message: 'Failed to fetch subject' };
  }
};

export const createSubject = async (subjectData: {
  subject_code: string;
  subject_name: string;
  department?: string;
  units?: number;
  description?: string;
}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/subjects`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(subjectData),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error creating subject:', error);
    return { success: false, message: 'Failed to create subject' };
  }
};

export const updateSubject = async (id: string, updates: Partial<{
  subject_code: string;
  subject_name: string;
  department: string;
  units: number;
  description: string;
  status: string;
}>) => {
  try {
    const response = await fetch(`${API_BASE_URL}/subjects/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error updating subject:', error);
    return { success: false, message: 'Failed to update subject' };
  }
};

export const deleteSubject = async (id: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/subjects/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error deleting subject:', error);
    return { success: false, message: 'Failed to delete subject' };
  }
};

// Subject Instructors
export const getSubjectInstructors = async (subjectId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/subjects/${subjectId}/instructors`, {
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching subject instructors:', error);
    return { success: false, message: 'Failed to fetch instructors', instructors: [] };
  }
};

export const assignInstructorToSubject = async (data: {
  subject_id: number;
  instructor_id: number;
  academic_year?: string;
  semester?: string;
}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/subjects/instructors`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error assigning instructor:', error);
    return { success: false, message: 'Failed to assign instructor' };
  }
};

export const removeInstructorFromSubject = async (id: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/subjects/instructors/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error removing instructor:', error);
    return { success: false, message: 'Failed to remove instructor' };
  }
};

// Subject Students
export const getSubjectStudents = async (subjectId: string, status?: string) => {
  try {
    const params = new URLSearchParams();
    if (status) params.append('status', status);

    const response = await fetch(`${API_BASE_URL}/subjects/${subjectId}/students?${params}`, {
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching subject students:', error);
    return { success: false, message: 'Failed to fetch students', students: [] };
  }
};

export const enrollStudent = async (data: {
  subject_id: number;
  student_id: number;
  academic_year?: string;
  semester?: string;
}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/subjects/students`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error enrolling student:', error);
    return { success: false, message: 'Failed to enroll student' };
  }
};

export const unenrollStudent = async (id: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/subjects/students/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error unenrolling student:', error);
    return { success: false, message: 'Failed to unenroll student' };
  }
};

// Available Students and Instructors
export const getAvailableStudents = async (search?: string, department?: string) => {
  try {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (department) params.append('department', department);

    const response = await fetch(`${API_BASE_URL}/subjects/students/available?${params}`, {
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching available students:', error);
    return { success: false, message: 'Failed to fetch students', students: [] };
  }
};

export const getAvailableInstructors = async (search?: string, department?: string) => {
  try {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (department) params.append('department', department);

    const response = await fetch(`${API_BASE_URL}/subjects/instructors/available?${params}`, {
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching available instructors:', error);
    return { success: false, message: 'Failed to fetch instructors', instructors: [] };
  }
};

// Evaluation Form Operations
export const linkEvaluationForm = async (data: {
  form_id: number;
  subject_id: number;
  instructor_id?: number;
  academic_year?: string;
  semester?: string;
}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/evaluation-forms/link`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error linking evaluation form:', error);
    return { success: false, message: 'Failed to link evaluation form' };
  }
};

export const unlinkEvaluationForm = async (id: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/evaluation-forms/unlink/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error unlinking evaluation form:', error);
    return { success: false, message: 'Failed to unlink evaluation form' };
  }
};

export const getSubjectEvaluationForms = async (subjectId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/evaluation-forms/subject/${subjectId}`, {
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching evaluation forms:', error);
    return { success: false, message: 'Failed to fetch evaluation forms', forms: [] };
  }
};

export const getStudentEvaluationForms = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/evaluation-forms/my-evaluations`, {
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching student evaluations:', error);
    return { success: false, message: 'Failed to fetch evaluations', forms: [] };
  }
};

export const submitEvaluationResponse = async (data: {
  evaluation_form_id: number;
  responses: Record<string, number>;
}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/evaluation-forms/submit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error submitting evaluation:', error);
    return { success: false, message: 'Failed to submit evaluation' };
  }
};

export const getSubjectEvaluationResults = async (subjectId: string, academic_year?: string, semester?: string) => {
  try {
    const params = new URLSearchParams();
    if (academic_year) params.append('academic_year', academic_year);
    if (semester) params.append('semester', semester);

    const response = await fetch(`${API_BASE_URL}/subject-evaluation/results/${subjectId}?${params}`, {
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching evaluation results:', error);
    return { success: false, message: 'Failed to fetch results' };
  }
};

export const getEvaluationSummary = async (academic_year?: string, semester?: string) => {
  try {
    const params = new URLSearchParams();
    if (academic_year) params.append('academic_year', academic_year);
    if (semester) params.append('semester', semester);

    const response = await fetch(`${API_BASE_URL}/evaluation-forms/summary?${params}`, {
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching evaluation summary:', error);
    return { success: false, message: 'Failed to fetch summary', summary: [] };
  }
};

export const getInstructorEvaluationResults = async (instructorId: string, academic_year?: string, semester?: string) => {
  try {
    const params = new URLSearchParams();
    if (academic_year) params.append('academic_year', academic_year);
    if (semester) params.append('semester', semester);

    const response = await fetch(`${API_BASE_URL}/evaluation-forms/instructor/${instructorId}?${params}`, {
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching instructor results:', error);
    return { success: false, message: 'Failed to fetch results' };
  }
};

// Get evaluation results by section with question category averages (C1, C2, C3)
export const getEvaluationResultsBySection = async (subjectId: string, academic_year?: string, semester?: string) => {
  try {
    const params = new URLSearchParams();
    if (academic_year) params.append('academic_year', academic_year);
    if (semester) params.append('semester', semester);

    const queryString = params.toString();
    const url = queryString 
      ? `${API_BASE_URL}/subject-evaluation/results-by-section/${subjectId}?${queryString}`
      : `${API_BASE_URL}/subject-evaluation/results-by-section/${subjectId}`;

    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching evaluation results by section:', error);
    return { success: false, message: 'Failed to fetch results', results: [] };
  }
};

// Get feedback category breakdown with rubric-style results
export const getFeedbackCategoryBreakdown = async (subjectId: string, feedbackType?: 'instructor' | 'subject') => {
  try {
    const params = new URLSearchParams();
    if (feedbackType) params.append('feedback_type', feedbackType);

    const queryString = params.toString();
    const url = queryString 
      ? `${API_BASE_URL}/subject-evaluation/category-breakdown/${subjectId}?${queryString}`
      : `${API_BASE_URL}/subject-evaluation/category-breakdown/${subjectId}`;

    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching category breakdown:', error);
    return { success: false, message: 'Failed to fetch category breakdown', data: null };
  }
};

// Programs API
export const getPrograms = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/programs`, {
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching programs:', error);
    return { success: false, message: 'Failed to fetch programs', programs: [] };
  }
};

// Get students by program for bulk enrollment
export const getStudentsByProgram = async (programId: string, academicYear?: string, semester?: string) => {
  try {
    const params = new URLSearchParams();
    if (academicYear) params.append('academic_year', academicYear);
    if (semester) params.append('semester', semester);

    const response = await fetch(`${API_BASE_URL}/programs/${programId}/students?${params}`, {
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching program students:', error);
    return { success: false, message: 'Failed to fetch students', students: [] };
  }
};

// Bulk enroll students by program
export const bulkEnrollStudents = async (data: {
  subject_id: number;
  program_id: number;
  academic_year?: string;
  semester?: string;
}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/subjects/students/bulk`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error bulk enrolling students:', error);
    return { success: false, message: 'Failed to bulk enroll students' };
  }
};

// ==================== Subject Offerings ====================

export interface SubjectOffering {
  id: number;
  subject_id: number;
  program_id: number;
  year_level: number;
  section: string;
  academic_year: string;
  semester: string;
  instructor_id: number | null;
  status: string;
  created_at: string;
  subject_code: string;
  subject_name: string;
  units: number;
  program_code: string;
  program_name: string;
  instructor_name: string | null;
  instructor_email: string | null;
  enrolled_count: number;
}

export const getSubjectOfferings = async (params?: {
  search?: string;
  academic_year?: string;
  semester?: string;
  program_id?: string;
}) => {
  try {
    const urlParams = new URLSearchParams();
    if (params?.search) urlParams.append('search', params.search);
    if (params?.academic_year) urlParams.append('academic_year', params.academic_year);
    if (params?.semester) urlParams.append('semester', params.semester);
    if (params?.program_id) urlParams.append('program_id', params.program_id);

    const response = await fetch(`${API_BASE_URL}/subjects/offerings/all?${urlParams}`, {
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching subject offerings:', error);
    return { success: false, message: 'Failed to fetch subject offerings', offerings: [] };
  }
};

export const createSubjectOffering = async (data: {
  subject_id: number;
  program_id: number;
  year_level: number;
  section: string;
  academic_year?: string;
  semester?: string;
  instructor_id?: number;
}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/subjects/offerings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error creating subject offering:', error);
    return { success: false, message: 'Failed to create subject offering' };
  }
};

export const updateSubjectOffering = async (id: string, updates: {
  instructor_id?: number;
  status?: string;
}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/subjects/offerings/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error updating subject offering:', error);
    return { success: false, message: 'Failed to update subject offering' };
  }
};

export const deleteSubjectOffering = async (id: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/subjects/offerings/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error deleting subject offering:', error);
    return { success: false, message: 'Failed to delete subject offering' };
  }
};

export const getSubjectOfferingStudents = async (offeringId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/subjects/offerings/${offeringId}/students`, {
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching subject offering students:', error);
    return { success: false, message: 'Failed to fetch students', students: [] };
  }
};

