// Student Promotion Controller
const studentPromotionService = require("../services/studentPromotionService");

/**
 * Get students eligible for promotion
 */
const getEligibleStudents = async (req, res) => {
  try {
    const filters = req.query;
    const result = await studentPromotionService.getEligibleStudents(filters);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error("Get eligible students controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      students: [],
      count: 0
    });
  }
};

/**
 * Get target programs for promotion
 */
const getTargetPrograms = async (req, res) => {
  try {
    const { programId } = req.params;
    
    if (!programId) {
      return res.status(400).json({
        success: false,
        message: "Program ID is required",
        programs: []
      });
    }
    
    const result = await studentPromotionService.getTargetPrograms(parseInt(programId));
    
    return res.status(200).json(result);
  } catch (error) {
    console.error("Get target programs controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      programs: []
    });
  }
};

/**
 * Promote students to new program/year
 */
const promoteStudents = async (req, res) => {
  try {
    const { studentIds, newProgramId, notes } = req.body;
    const promotedBy = req.userId;
    
    // Validation
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Student IDs array is required"
      });
    }
    
    if (!newProgramId) {
      return res.status(400).json({
        success: false,
        message: "Target program ID is required"
      });
    }
    
    const result = await studentPromotionService.promoteStudents(
      studentIds.map(id => parseInt(id)),
      parseInt(newProgramId),
      promotedBy,
      notes || ''
    );
    
    return res.status(200).json(result);
  } catch (error) {
    console.error("Promote students controller error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
};

/**
 * Graduate students (convert to alumni)
 */
const graduateStudents = async (req, res) => {
  try {
    const { studentIds, graduationYear, degree, honors, ceremonyDate, jobtitle, notes } = req.body;
    const promotedBy = req.userId;
    
    // Validation
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Student IDs array is required"
      });
    }
    
    if (!graduationYear) {
      return res.status(400).json({
        success: false,
        message: "Graduation year is required"
      });
    }
    
    const graduationData = {
      degree,
      honors,
      ceremonyDate,
      jobtitle,
      notes
    };
    
    const result = await studentPromotionService.graduateStudents(
      studentIds.map(id => parseInt(id)),
      graduationYear,
      promotedBy,
      graduationData
    );
    
    return res.status(200).json(result);
  } catch (error) {
    console.error("Graduate students controller error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
};

/**
 * Get promotion history
 */
const getPromotionHistory = async (req, res) => {
  try {
    const filters = req.query;
    const result = await studentPromotionService.getPromotionHistory(filters);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error("Get promotion history controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      history: [],
      count: 0,
      total: 0
    });
  }
};

/**
 * Get all programs for admin selection
 */
const getAllPrograms = async (req, res) => {
  try {
    const result = await studentPromotionService.getAllPrograms();
    
    return res.status(200).json(result);
  } catch (error) {
    console.error("Get all programs controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      programs: [],
      grouped: {}
    });
  }
};

module.exports = {
  getEligibleStudents,
  getTargetPrograms,
  promoteStudents,
  graduateStudents,
  getPromotionHistory,
  getAllPrograms
};
