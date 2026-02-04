// Response Controller
const responseService = require("../services/responseService");

/**
 * Get form responses (for form owner)
 */
const getFormResponses = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const result = await responseService.getFormResponses(id, userId);

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error("Get form responses controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      responses: [],
    });
  }
};

/**
 * Get form submission status
 */
const getFormSubmissionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const result = await responseService.getFormSubmissionStatus(id, userId);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Get submission status controller error:", error);
    return res.status(500).json({
      success: false,
      canSubmit: false,
      issues: [{ type: "error", message: "Failed to check submission status" }],
    });
  }
};

/**
 * Get user's own responses
 */
const getMyResponses = async (req, res) => {
  try {
    const userId = req.userId;

    const result = await responseService.getUserResponses(userId);

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error("Get my responses controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      responses: [],
    });
  }
};

/**
 * Get shared responses for instructor
 */
const getSharedResponses = async (req, res) => {
  try {
    const userId = req.userId;

    const result = await responseService.getSharedResponses(userId);

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error("Get shared responses controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      responses: [],
    });
  }
};

/**
 * Get detailed responses for a shared form
 */
const getSharedResponsesDetails = async (req, res) => {
  try {
    const { sharedId } = req.params;
    const userId = req.userId;

    const result = await responseService.getSharedResponsesDetails(sharedId, userId);

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error("Get shared responses details controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      responses: [],
    });
  }
};

/**
 * Submit form response
 */
const submitFormResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { responses } = req.body;

    console.log("Submit form response - formId:", id, "userId:", userId);

    if (!responses || typeof responses !== 'object') {
      console.log("Invalid responses format:", responses);
      return res.status(400).json({
        success: false,
        message: "Responses are required",
      });
    }

    const result = await responseService.submitFormResponse(id, userId, responses);
    console.log("Submit response result:", result);

    if (result.success) {
      return res.status(201).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error("Submit form response controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  getFormResponses,
  getFormSubmissionStatus,
  getMyResponses,
  getSharedResponses,
  getSharedResponsesDetails,
  submitFormResponse,
};
