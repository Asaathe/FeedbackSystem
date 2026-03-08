// Evaluation Form Routes
const express = require("express");
const router = express.Router();
const evaluationFormController = require("../controllers/evaluationFormController");
const { verifyToken } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/auth");

// Link evaluation form to subject (admin only)
router.post("/link", verifyToken, requireAdmin, evaluationFormController.linkEvaluationForm);

// Unlink evaluation form from subject (admin only)
router.delete("/unlink/:id", verifyToken, requireAdmin, evaluationFormController.unlinkEvaluationForm);

// Get evaluation forms for a subject
router.get("/subject/:subjectId", verifyToken, evaluationFormController.getSubjectEvaluationForms);

// Get evaluation forms for a student (to submit)
router.get("/my-evaluations", verifyToken, evaluationFormController.getStudentEvaluationForms);

// Submit evaluation response
router.post("/submit", verifyToken, evaluationFormController.submitEvaluationResponse);

// Get evaluation results by section with question averages
router.get("/results-by-section/:subjectId", async (req, res) => {
  console.log("DEBUG: Route /results-by-section/:subjectId matched!", req.params);
  try {
    const { subjectId } = req.params;
    console.log("DEBUG: subjectId =", subjectId);
    
    if (!subjectId || isNaN(parseInt(subjectId))) {
      return res.status(400).json({ success: false, message: "Invalid subject ID" });
    }
    
    const db = require("../config/database");
    
    // Get the total enrolled count for this subject from student_enrollments table
    const enrolledQuery = `SELECT COUNT(*) as count FROM student_enrollments WHERE subject_id = ? AND status = 'enrolled'`;

    db.query(enrolledQuery, [subjectId], (enrolledErr, enrolledResult) => {
      console.log("DEBUG: student_enrollments data:", enrolledResult);
      const totalEnrolled = enrolledResult[0]?.count || 0;
      console.log("DEBUG: Total enrolled:", totalEnrolled);
    
      // Get evaluation responses for this subject
      const responsesQuery = `
        SELECT 
          ser.*,
          st.program_id,
          cm.program_name,
          cm.year_level,
          cm.section
        FROM subject_evaluation_responses ser
        LEFT JOIN students st ON ser.student_id = st.user_id
        LEFT JOIN course_management cm ON st.program_id = cm.id
        WHERE ser.subject_id = ?
      `;

      db.query(responsesQuery, [subjectId], (respErr, responses) => {
        if (respErr) {
          console.error("Error fetching responses:", respErr);
          return res.status(500).json({ success: false, message: "Failed to fetch responses" });
        }

        console.log("DEBUG: Got responses:", responses.length);

        // Group responses by program/section
        const programGroups = {};
        
        if (responses.length > 0) {
          responses.forEach(response => {
            const key = response.program_id 
              ? `${response.program_name || 'Unknown'} - Year ${response.year_level || '1'}${response.section ? ' Section ' + response.section : ''}` 
              : 'General';
              
            if (!programGroups[key]) {
              programGroups[key] = {
                program_name: key,
                student_ids: [],
                responses: []
              };
            }
            
            // Add to responses array for this group
            programGroups[key].responses.push(response);
            
            // Track unique students
            if (!programGroups[key].student_ids.includes(response.student_id)) {
              programGroups[key].student_ids.push(response.student_id);
            }
          });
        }

        // Calculate results for each group
        const results = Object.keys(programGroups).map(key => {
          const group = programGroups[key];
          const groupResponses = group.responses;

          // Calculate averages from responses JSON - dynamically find all unique question IDs
          const questionValues = {};
          
          groupResponses.forEach(response => {
            if (response.responses) {
              try {
                const resp = typeof response.responses === 'string' 
                  ? JSON.parse(response.responses) 
                  : response.responses;
                
                Object.keys(resp).forEach(questionId => {
                  const value = parseFloat(resp[questionId]);
                  if (!isNaN(value)) {
                    if (!questionValues[questionId]) {
                      questionValues[questionId] = { sum: 0, count: 0 };
                    }
                    questionValues[questionId].sum += value;
                    questionValues[questionId].count++;
                  }
                });
              } catch (parseErr) {
                console.error("Error parsing response:", parseErr);
              }
            }
          });

          // Calculate average for each question
          const questionAverages = {};
          Object.keys(questionValues).forEach(qId => {
            questionAverages[qId] = (questionValues[qId].sum / questionValues[qId].count).toFixed(1);
          });

          // Calculate overall average
          const avgValues = Object.values(questionAverages).map(v => parseFloat(v));
          const overallAvg = avgValues.length > 0 
            ? (avgValues.reduce((a, b) => a + b, 0) / avgValues.length).toFixed(1)
            : 'N/A';

          return {
            respondents: key,
            total_enrolled: `${group.student_ids.length} / ${totalEnrolled}`,
            total_responses: group.student_ids.length,
            question_averages: questionAverages,
            average: overallAvg
          };
        });

        console.log("DEBUG: Returning results:", results);
        return res.status(200).json({ success: true, results });
      });
    });
  } catch (error) {
    console.error("Get evaluation results by section error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Get evaluation results for a subject
router.get("/results/:subjectId", verifyToken, evaluationFormController.getSubjectEvaluationResults);

// Get evaluation summary by section (admin dashboard)
router.get("/summary", verifyToken, evaluationFormController.getEvaluationSummaryBySection);

// Get instructor evaluation results
router.get("/instructor/:instructorId", verifyToken, evaluationFormController.getInstructorEvaluationResults);

module.exports = router;
