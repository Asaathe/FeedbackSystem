// Evaluation Form Controller
// DEPRECATED - This controller uses legacy tables that have been dropped
// Routes have been disabled in server.js
// Use subject_offerings and the Forms system instead

/**
 * Link an evaluation form to a subject
 * DEPRECATED - Use subject_offerings instead
 */
const linkEvaluationForm = async (req, res) => {
  return res.status(410).json({ 
    success: false, 
    message: "This endpoint has been deprecated. Use subject_offerings for subject management."
  });
};

/**
 * Unlink an evaluation form from a subject
 * DEPRECATED
 */
const unlinkEvaluationForm = async (req, res) => {
  return res.status(410).json({ 
    success: false, 
    message: "This endpoint has been deprecated. Use subject_offerings for subject management."
  });
};

/**
 * Get evaluation forms for a subject
 * DEPRECATED
 */
const getSubjectEvaluationForms = async (req, res) => {
  return res.status(410).json({ 
    success: false, 
    message: "This endpoint has been deprecated. Use subject_offerings instead."
  });
};

/**
 * Get evaluation forms for a student
 * DEPRECATED
 */
const getStudentEvaluationForms = async (req, res) => {
  return res.status(410).json({ 
    success: false, 
    message: "This endpoint has been deprecated. Use subject_offerings and Forms system instead."
  });
};

/**
 * Submit evaluation response
 * DEPRECATED
 */
const submitEvaluationResponse = async (req, res) => {
  return res.status(410).json({ 
    success: false, 
    message: "This endpoint has been deprecated. Use Forms and Form_Responses instead."
  });
};

/**
 * Get evaluation results for a subject
 * DEPRECATED
 */
const getSubjectEvaluationResults = async (req, res) => {
  return res.status(410).json({ 
    success: false, 
    message: "This endpoint has been deprecated. Use Forms and Form_Responses for analytics."
  });
};

/**
 * Get evaluation summary
 * DEPRECATED
 */
const getEvaluationSummary = async (req, res) => {
  return res.status(410).json({ 
    success: false, 
    message: "This endpoint has been deprecated. Use Forms and Form_Responses for analytics."
  });
};

/**
 * Get instructor evaluation results
 * DEPRECATED
 */
const getInstructorEvaluationResults = async (req, res) => {
  return res.status(410).json({ 
    success: false, 
    message: "This endpoint has been deprecated. Use Forms and Form_Responses instead."
  });
};

/**
 * Get evaluation results by section
 * DEPRECATED
 */
const getEvaluationResultsBySection = async (req, res) => {
  return res.status(410).json({ 
    success: false, 
    message: "This endpoint has been deprecated. Use Forms and Form_Responses instead."
  });
};

module.exports = {
  linkEvaluationForm,
  unlinkEvaluationForm,
  getSubjectEvaluationForms,
  getStudentEvaluationForms,
  submitEvaluationResponse,
  getSubjectEvaluationResults,
  getEvaluationSummary,
  getInstructorEvaluationResults,
  getEvaluationResultsBySection
};
