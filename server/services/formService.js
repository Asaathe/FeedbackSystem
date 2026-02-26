// Form Service
const db = require("../config/database");
const { queryDatabase, executeTransaction } = require("../utils/helpers");
const { formatFormResponse, formatQuestionResponse, formatPagination } = require("../utils/formatting");
const { validateFormData, validateQuestion } = require("../utils/validation");

/**
 * Get all forms with filtering and pagination
 * @param {object} filters - Filter options
 * @returns {Promise<object>} Result with forms and pagination
 */
const getAllForms = async (filters = {}) => {
  try {
    const {
      type = "all",
      status = "all",
      search = "",
      page = 1,
      limit = 10,
    } = filters;

    const offset = (page - 1) * limit;

    // Build WHERE clause
    const conditions = [];
    const params = [];

    // Filter by type (templates vs custom)
    if (type === "templates") {
      conditions.push("f.is_template = TRUE");
    } else if (type === "custom") {
      conditions.push("f.is_template = FALSE");
    }

    // Filter by status
    if (status !== "all") {
      conditions.push("f.status = ?");
      params.push(status);
    }

    // Search filter
    if (search) {
      conditions.push("(f.title LIKE ? OR f.description LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM Forms f
      ${whereClause}
    `;
    const countResult = await queryDatabase(db, countQuery, params);
    const total = countResult[0].total;

    // Get forms with pagination
    const formsQuery = `
      SELECT 
        f.*,
        u.full_name as creator_name,
        (SELECT COUNT(*) FROM Questions WHERE form_id = f.id) as question_count,
        (SELECT COUNT(*) FROM Form_Responses WHERE form_id = f.id) as submission_count
      FROM Forms f
      LEFT JOIN Users u ON f.created_by = u.id
      ${whereClause}
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const forms = await queryDatabase(db, formsQuery, [...params, limit, offset]);

    return {
      success: true,
      forms: forms.map(formatFormResponse),
      pagination: formatPagination(total, page, limit),
    };
  } catch (error) {
    console.error("Get forms error:", error);
    return { success: false, message: "Failed to get forms", forms: [] };
  }
};

/**
 * Get single form by ID
 * @param {number} formId - Form ID
 * @returns {Promise<object>} Result with form data
 */
const getFormById = async (formId) => {
  try {
    // Get form details
    const forms = await queryDatabase(
      db,
      `
      SELECT 
        f.*,
        u.full_name as creator_name,
        (SELECT COUNT(*) FROM Questions WHERE form_id = f.id) as question_count,
        (SELECT COUNT(*) FROM Form_Responses WHERE form_id = f.id) as submission_count
      FROM Forms f
      LEFT JOIN Users u ON f.created_by = u.id
      WHERE f.id = ?
    `,
      [formId]
    );

    if (forms.length === 0) {
      return { success: false, message: "Form not found" };
    }

    const form = formatFormResponse(forms[0]);

    // Get sections (if table exists)
    let sections = [];
    try {
      sections = await queryDatabase(
        db,
        `
        SELECT 
          s.*
        FROM sections s
        WHERE s.form_id = ?
        ORDER BY s.order_index ASC
      `,
        [formId]
      );
    } catch (err) {
      // Table might not exist yet, ignore error
      console.log("Sections table not found, skipping...");
    }

    // Format sections
    form.sections = sections.map(s => ({
      id: s.id,
      title: s.title,
      description: s.description,
      order: s.order_index,
    }));

    // Get questions
    const questions = await queryDatabase(
      db,
      `
      SELECT 
        q.*
      FROM Questions q
      WHERE q.form_id = ?
      ORDER BY q.order_index ASC
    `,
      [formId]
    );

    // Get options for each question
    for (const question of questions) {
      const options = await queryDatabase(
        db,
        `
        SELECT 
          id,
          option_text,
          order_index
        FROM Question_Options
        WHERE question_id = ?
        ORDER BY order_index ASC
      `,
        [question.id]
      );
      question.options = options;
    }

    form.questions = questions.map(formatQuestionResponse);

    // Get assigned recipients (users assigned to this form)
    const assignedRecipients = await queryDatabase(
      db,
      `
      SELECT 
        fa.user_id,
        u.email,
        u.full_name,
        u.role,
        s.studentID,
        s.program_id,
        cm.course_section,
        cm.department,
        cm.program_name,
        cm.year_level,
        cm.section,
        a.company as alumni_company,
        e.companyname as employer_company
      FROM form_assignments fa
      LEFT JOIN Users u ON fa.user_id = u.id
      LEFT JOIN students s ON u.id = s.user_id
      LEFT JOIN course_management cm ON s.program_id = cm.id
      LEFT JOIN alumni a ON u.id = a.user_id
      LEFT JOIN employers e ON u.id = e.user_id
      WHERE fa.form_id = ?
    `,
      [formId]
    );

    form.assigned_recipients = assignedRecipients;

    // Get instructors with shared responses access
    const sharedInstructors = await queryDatabase(
      db,
      `
      SELECT 
        sr.shared_with_instructor_id as user_id,
        u.email,
        u.full_name,
        u.role,
        i.instructor_id,
        i.department,
        i.subject_taught
      FROM shared_responses sr
      LEFT JOIN Users u ON sr.shared_with_instructor_id = u.id
      LEFT JOIN instructors i ON u.id = i.user_id
      WHERE sr.form_id = ?
    `,
      [formId]
    );

    form.shared_instructors = sharedInstructors;

    // Get deployment data (if any)
    const deployments = await queryDatabase(
      db,
      `
      SELECT
        id,
        start_date,
        end_date,
        start_time,
        end_time,
        target_filters,
        deployment_status
      FROM form_deployments
      WHERE form_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `,
      [formId]
    );

    if (deployments.length > 0) {
      form.deployment = deployments[0];
      // Parse target_filters JSON if available
      if (deployments[0].target_filters) {
        try {
          form.deployment.target_filters = JSON.parse(deployments[0].target_filters);
        } catch (e) {
          console.error("Failed to parse target_filters JSON:", e);
          form.deployment.target_filters = null;
        }
      }
    }

    return { success: true, form };
  } catch (error) {
    console.error("Get form error:", error);
    return { success: false, message: "Failed to get form" };
  }
};

/**
 * Create new form
 * @param {object} formData - Form data
 * @param {number} userId - User ID creating the form
 * @returns {Promise<object>} Result with success status and form ID
 */
const createForm = async (formData, userId) => {
  try {
    const {
      title,
      description,
      ai_description,
      category,
      targetAudience,
      startDate,
      endDate,
      startTime,
      endTime,
      questions = [],
      sections = [],
      imageUrl,
      isTemplate = false,
    } = formData;
    
    console.log('🔍 SERVER formService createForm: ai_description received:', ai_description);

    // Validate form data
    const validation = validateFormData(formData);
    if (!validation.isValid) {
      return { success: false, message: validation.errors.join(", ") };
    }

    // Validate questions
    for (const question of questions) {
      const questionValidation = validateQuestion(question);
      if (!questionValidation.isValid) {
        return {
          success: false,
          message: `Question validation failed: ${questionValidation.errors.join(", ")}`,
        };
      }
    }

    // Combine date and time for start_date and end_date
    const combinedStartDate = (startDate && startTime) ? `${startDate}T${startTime}` : (startDate || null);
    const combinedEndDate = (endDate && endTime) ? `${endDate}T${endTime}` : (endDate || null);

    // Insert form
    const insertResult = await queryDatabase(
      db,
      `
      INSERT INTO Forms (
        title, description, ai_description, category, target_audience, 
        start_date, end_date, image_url, is_template, 
        status, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, NOW(), NOW())
    `,
      [
        title,
        description,
        ai_description || null,
        category,
        targetAudience,
        combinedStartDate,
        combinedEndDate,
        imageUrl || null,
        isTemplate,
        userId,
      ]
    );

    const formId = insertResult.insertId;

    // Create a map of section IDs for questions
    const sectionIdMap = {};

    // Insert sections
    if (sections && sections.length > 0) {
      for (const section of sections) {
        const sectionResult = await queryDatabase(
          db,
          `
          INSERT INTO sections (
            form_id, title, description, order_index
          ) VALUES (?, ?, ?, ?)
        `,
          [
            formId,
            section.title || 'New Section',
            section.description || null,
            section.order || 0,
          ]
        );
        sectionIdMap[section.id] = sectionResult.insertId;
      }
    }

    // Insert questions
    if (questions.length > 0) {
      for (const question of questions) {
        // Get the mapped section ID if question has a sectionId
        let mappedSectionId = null;
        if (question.sectionId && sectionIdMap[question.sectionId]) {
          mappedSectionId = sectionIdMap[question.sectionId];
        }

        const questionResult = await queryDatabase(
          db,
          `
          INSERT INTO Questions (
            form_id, section_id, question_text, question_type, description, 
            required, order_index, min_value, max_value
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
          [
            formId,
            mappedSectionId,
            question.question,
            question.type,
            question.description || null,
            question.required ? 1 : 0,
            question.order_index || 0,
            question.min || question.minValue || null,
            question.max || question.maxValue || null,
          ]
        );

        const questionId = questionResult.insertId;

        // Insert options for choice-based questions
        if (
          ["multiple-choice", "checkbox", "dropdown"].includes(question.type) &&
          question.options &&
          question.options.length > 0
        ) {
          for (const option of question.options) {
            await queryDatabase(
              db,
              `
              INSERT INTO Question_Options (question_id, option_text, order_index)
              VALUES (?, ?, ?)
            `,
              [questionId, option.option_text || option, option.order_index || 0]
            );
          }
        }
      }
    }

    return {
      success: true,
      message: "Form created successfully",
      formId,
    };
  } catch (error) {
    console.error("Create form error:", error);
    return { success: false, message: "Failed to create form" };
  }
};

/**
 * Update existing form
 * @param {number} formId - Form ID
 * @param {object} updates - Fields to update
 * @param {number} userId - User ID making the update
 * @returns {Promise<object>} Result with success status
 */
const updateForm = async (formId, updates, userId) => {
  try {
    // Check if user owns the form
    const forms = await queryDatabase(
      db,
      "SELECT created_by FROM Forms WHERE id = ?",
      [formId]
    );

    if (forms.length === 0) {
      return { success: false, message: "Form not found" };
    }

    if (forms[0].created_by !== userId) {
      return { success: false, message: "Access denied" };
    }

    // Build update query
    const allowedFields = [
      "title",
      "description",
      "ai_description",
      "category",
      "target_audience",
      "start_date",
      "end_date",
      "image_url",
      "status",
    ];
    
    console.log('🔍 SERVER formService: updates object:', JSON.stringify(updates));
    console.log('🔍 SERVER formService: ai_description value:', updates.ai_description);
    
    const updateFields = [];
    const updateValues = [];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        console.log('🔍 SERVER formService: Adding field to update:', field, '=', updates[field]);
        updateFields.push(`${field} = ?`);
        updateValues.push(updates[field]);
      }
    }

    // Handle date and time combination
    if (updates.startDate !== undefined || updates.startTime !== undefined) {
      const startDate = updates.startDate || "";
      const startTime = updates.startTime || "";
      const combinedStartDate = (startDate && startTime) ? `${startDate}T${startTime}` : (startDate || null);
      updateFields.push("start_date = ?");
      updateValues.push(combinedStartDate);
    }

    if (updates.endDate !== undefined || updates.endTime !== undefined) {
      const endDate = updates.endDate || "";
      const endTime = updates.endTime || "";
      const combinedEndDate = (endDate && endTime) ? `${endDate}T${endTime}` : (endDate || null);
      updateFields.push("end_date = ?");
      updateValues.push(combinedEndDate);
    }

    if (updateFields.length === 0) {
      return { success: false, message: "No valid fields to update" };
    }

    updateFields.push("updated_at = NOW()");
    updateValues.push(formId);

    await queryDatabase(
      db,
      `UPDATE Forms SET ${updateFields.join(", ")} WHERE id = ?`,
      updateValues
    );

    // Also update the form_deployments table with the new time values
    if (updates.startDate !== undefined || updates.startTime !== undefined || updates.endDate !== undefined || updates.endTime !== undefined) {
      // Format time values to HH:MM:SS format for MySQL TIME type
      const deploymentStartTime = updates.startTime ? (updates.startTime.includes(':') ? (updates.startTime.split(':').length === 2 ? `${updates.startTime}:00` : updates.startTime) : null) : null;
      const deploymentEndTime = updates.endTime ? (updates.endTime.includes(':') ? (updates.endTime.split(':').length === 2 ? `${updates.endTime}:00` : updates.endTime) : null) : null;

      // Get the current deployment data to preserve other fields
      const currentDeployment = await queryDatabase(
        db,
        "SELECT * FROM form_deployments WHERE form_id = ?",
        [formId]
      );

      if (currentDeployment.length > 0) {
        // Update existing deployment
        const deploymentUpdateFields = [];
        const deploymentUpdateValues = [];

        if (updates.startDate !== undefined) {
          deploymentUpdateFields.push("start_date = ?");
          deploymentUpdateValues.push(updates.startDate);
        }
        if (updates.endDate !== undefined) {
          deploymentUpdateFields.push("end_date = ?");
          deploymentUpdateValues.push(updates.endDate);
        }
        if (updates.startTime !== undefined) {
          deploymentUpdateFields.push("start_time = ?");
          deploymentUpdateValues.push(deploymentStartTime);
        }
        if (updates.endTime !== undefined) {
          deploymentUpdateFields.push("end_time = ?");
          deploymentUpdateValues.push(deploymentEndTime);
        }

        if (deploymentUpdateFields.length > 0) {
          deploymentUpdateValues.push(formId);

          await queryDatabase(
            db,
            `UPDATE form_deployments SET ${deploymentUpdateFields.join(", ")} WHERE form_id = ?`,
            deploymentUpdateValues
          );
        }
      }
    }

    // Update sections if provided
    if (updates.sections && Array.isArray(updates.sections)) {
      // Get existing section IDs for this form
      const existingSections = await queryDatabase(
        db,
        "SELECT id FROM sections WHERE form_id = ?",
        [formId]
      );
      const existingSectionIds = new Set(existingSections.map(s => s.id));
      const newSectionIds = new Set();

      // Create a map for section ID mapping (old ID -> new ID)
      const sectionIdMap = {};

      // Insert or update sections
      for (const section of updates.sections) {
        if (section.id && section.id.toString().startsWith('section_')) {
          // This is a new section (client-generated ID)
          const result = await queryDatabase(
            db,
            `INSERT INTO sections (form_id, title, description, order_index) VALUES (?, ?, ?, ?)`,
            [formId, section.title || 'New Section', section.description || null, section.order || 0]
          );
          sectionIdMap[section.id] = result.insertId;
          newSectionIds.add(result.insertId);
        } else if (section.id) {
          // This is an existing section (has numeric ID) - update it
          const numericId = parseInt(section.id);
          if (!isNaN(numericId) && existingSectionIds.has(numericId)) {
            // Update existing section
            await queryDatabase(
              db,
              `UPDATE sections SET title = ?, description = ?, order_index = ? WHERE id = ?`,
              [section.title || 'New Section', section.description || null, section.order || 0, numericId]
            );
            sectionIdMap[section.id] = numericId;
            newSectionIds.add(numericId);
          }
        }
      }

      // Delete sections that are no longer in the update
      for (const existingSection of existingSections) {
        if (!newSectionIds.has(existingSection.id)) {
          await queryDatabase(
            db,
            "DELETE FROM sections WHERE id = ?",
            [existingSection.id]
          );
        }
      }

      // Update questions with section IDs
      if (updates.questions && Array.isArray(updates.questions)) {
        // Get all existing questions for this form
        const existingQuestions = await queryDatabase(
          db,
          "SELECT id FROM questions WHERE form_id = ?",
          [formId]
        );
        const existingQuestionIds = new Set(existingQuestions.map(q => q.id));
        const newQuestionIds = new Set();

        // Delete questions that are no longer in the update
        const questionIdsInUpdate = new Set(updates.questions.filter(q => !q.id.toString().startsWith('q_')).map(q => parseInt(q.id)));
        
        for (const existingQuestion of existingQuestions) {
          if (!questionIdsInUpdate.has(existingQuestion.id)) {
            await queryDatabase(
              db,
              "DELETE FROM questions WHERE id = ?",
              [existingQuestion.id]
            );
            await queryDatabase(
              db,
              "DELETE FROM question_options WHERE question_id = ?",
              [existingQuestion.id]
            );
          }
        }

        // Update or insert questions
        for (let i = 0; i < updates.questions.length; i++) {
          const question = updates.questions[i];
          let mappedSectionId = null;
          
          // Map section ID if question has a sectionId
          if (question.sectionId && sectionIdMap[question.sectionId]) {
            mappedSectionId = sectionIdMap[question.sectionId];
          } else if (question.sectionId) {
            // Section already exists in database, use it directly
            mappedSectionId = parseInt(question.sectionId) || null;
          }

          const questionIdNum = parseInt(question.id);
          
          if (!isNaN(questionIdNum) && existingQuestionIds.has(questionIdNum)) {
            // Update existing question
            await queryDatabase(
              db,
              `UPDATE questions SET 
                section_id = ?,
                question_text = ?, 
                question_type = ?, 
                description = ?, 
                required = ?, 
                order_index = ?,
                min_value = ?,
                max_value = ?
              WHERE id = ?`,
              [
                mappedSectionId,
                question.question,
                question.type,
                question.description || null,
                question.required ? 1 : 0,
                i,
                question.min || question.minValue || null,
                question.max || question.maxValue || null,
                questionIdNum
              ]
            );

            // Delete existing options and re-insert
            await queryDatabase(
              db,
              "DELETE FROM question_options WHERE question_id = ?",
              [questionIdNum]
            );

            // Insert options for choice-based questions
            if (
              ["multiple-choice", "checkbox", "dropdown"].includes(question.type) &&
              question.options &&
              question.options.length > 0
            ) {
              for (let j = 0; j < question.options.length; j++) {
                await queryDatabase(
                  db,
                  "INSERT INTO question_options (question_id, option_text, order_index) VALUES (?, ?, ?)",
                  [questionIdNum, question.options[j], j]
                );
              }
            }
            newQuestionIds.add(questionIdNum);
          } else {
            // Insert new question
            const result = await queryDatabase(
              db,
              `INSERT INTO questions (
                form_id, section_id, question_text, question_type, description, 
                required, order_index, min_value, max_value
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                formId,
                mappedSectionId,
                question.question,
                question.type,
                question.description || null,
                question.required ? 1 : 0,
                i,
                question.min || question.minValue || null,
                question.max || question.maxValue || null,
              ]
            );

            const newQuestionId = result.insertId;
            newQuestionIds.add(newQuestionId);

            // Insert options for choice-based questions
            if (
              ["multiple-choice", "checkbox", "dropdown"].includes(question.type) &&
              question.options &&
              question.options.length > 0
            ) {
              for (let j = 0; j < question.options.length; j++) {
                await queryDatabase(
                  db,
                  "INSERT INTO question_options (question_id, option_text, order_index) VALUES (?, ?, ?)",
                  [newQuestionId, question.options[j], j]
                );
              }
            }
          }
        }
      }
    }

    return { success: true, message: "Form updated successfully" };
  } catch (error) {
    console.error("Update form error:", error);
    return { success: false, message: "Failed to update form" };
  }
};

/**
 * Delete form
 * @param {number} formId - Form ID
 * @param {number} userId - User ID deleting the form
 * @returns {Promise<object>} Result with success status
 */
const deleteForm = async (formId, userId) => {
  try {
    // Check if user owns the form
    const forms = await queryDatabase(
      db,
      "SELECT created_by, image_url FROM Forms WHERE id = ?",
      [formId]
    );

    if (forms.length === 0) {
      return { success: false, message: "Form not found" };
    }

    if (forms[0].created_by !== userId) {
      return { success: false, message: "Access denied" };
    }

    // Delete the form image if it exists
    const imageUrl = forms[0].image_url;
    if (imageUrl) {
      const fs = require('fs');
      const path = require('path');
      const fullImagePath = path.join(__dirname, '../public', imageUrl);
      if (fs.existsSync(fullImagePath)) {
        try {
          fs.unlinkSync(fullImagePath);
          console.log('[DELETE] Form image deleted:', fullImagePath);
        } catch (err) {
          console.error('[DELETE] Failed to delete form image:', err);
        }
      }
    }

    // Delete form (cascade will handle related records)
    await queryDatabase(db, "DELETE FROM Forms WHERE id = ?", [formId]);

    return { success: true, message: "Form deleted successfully" };
  } catch (error) {
    console.error("Delete form error:", error);
    return { success: false, message: "Failed to delete form" };
  }
};

/**
 * Duplicate form
 * @param {number} formId - Form ID to duplicate
 * @param {number} userId - User ID duplicating the form
 * @returns {Promise<object>} Result with success status and new form ID
 */
const duplicateForm = async (formId, userId) => {
  try {
    // Get original form
    const originalForm = await getFormById(formId);
    if (!originalForm.success) {
      return { success: false, message: "Form not found" };
    }

    const form = originalForm.form;

    // Create new form with copied data
    const newFormData = {
      title: `${form.title} (Copy)`,
      description: form.description,
      category: form.category,
      targetAudience: form.target_audience,
      startDate: form.start_date,
      endDate: form.end_date,
      questions: form.questions,
      imageUrl: form.image_url,
      isTemplate: false,
    };

    const result = await createForm(newFormData, userId);

    if (result.success) {
      return {
        success: true,
        message: "Form duplicated successfully",
        formId: result.formId,
      };
    }

    return result;
  } catch (error) {
    console.error("Duplicate form error:", error);
    return { success: false, message: "Failed to duplicate form" };
  }
};

/**
 * Save form as template
 * @param {number} formId - Form ID
 * @param {number} userId - User ID saving as template
 * @returns {Promise<object>} Result with success status
 */
const saveAsTemplate = async (formId, userId) => {
  try {
    // Check if user owns the form
    const forms = await queryDatabase(
      db,
      "SELECT created_by FROM Forms WHERE id = ?",
      [formId]
    );

    if (forms.length === 0) {
      return { success: false, message: "Form not found" };
    }

    if (forms[0].created_by !== userId) {
      return { success: false, message: "Access denied" };
    }

    // Update form to be a template
    await queryDatabase(
      db,
      "UPDATE Forms SET is_template = TRUE, status = 'active' WHERE id = ?",
      [formId]
    );

    return {
      success: true,
      message: "Form saved as template successfully",
      templateId: formId,
    };
  } catch (error) {
    console.error("Save as template error:", error);
    return { success: false, message: "Failed to save as template" };
  }
};

/**
 * Deploy form (change status to active and create assignments)
 */
const deployForm = async (formId, userId, deploymentData = {}) => {
  try {
    // Check if form exists and user owns it
    const forms = await queryDatabase(
      db,
      "SELECT * FROM Forms WHERE id = ?",
      [formId]
    );

    if (forms.length === 0) {
      return { success: false, message: "Form not found" };
    }

    if (forms[0].created_by !== userId) {
      return { success: false, message: "Access denied" };
    }

    const form = forms[0];
    const { targetFilters, startDate, endDate, startTime, endTime, targetAudience } = deploymentData;

    // Support both targetFilters.target_audience and direct targetAudience
    const effectiveTargetAudience = targetFilters?.target_audience || targetAudience;

    // Format time values to HH:MM:SS format for MySQL TIME type
    const deploymentStartTime = startTime ? (startTime.includes(':') ? (startTime.split(':').length === 2 ? `${startTime}:00` : startTime) : null) : null;
    const deploymentEndTime = endTime ? (endTime.includes(':') ? (endTime.split(':').length === 2 ? `${endTime}:00` : endTime) : null) : null;

    // Update form status to active and set dates
    await queryDatabase(
      db,
      "UPDATE Forms SET status = 'active', start_date = ?, end_date = ?, updated_at = NOW() WHERE id = ?",
      [startDate || form.start_date, endDate || form.end_date, formId]
    );

    // Remove all existing assignments for this form before creating new ones
    await queryDatabase(
      db,
      "DELETE FROM form_assignments WHERE form_id = ?",
      [formId]
    );

    // Create assignment records for all matching users
    let assignedCount = 0;

    // Handle direct user IDs if provided
    if (deploymentData.userIds && Array.isArray(deploymentData.userIds) && deploymentData.userIds.length > 0) {
      const assignments = deploymentData.userIds.map(userId => [formId, userId, new Date()]);
      
      await queryDatabase(
        db,
        "INSERT INTO form_assignments (form_id, user_id, assigned_at) VALUES ? ON DUPLICATE KEY UPDATE assigned_at = VALUES(assigned_at)",
        [assignments]
      );
      
      assignedCount = deploymentData.userIds.length;
    } else if (effectiveTargetAudience) {
      const targetAudience = effectiveTargetAudience;

      // Build query to get users matching target audience
      let userQuery = "";
      let queryParams = [];

      if (targetAudience === "All Users") {
        userQuery = `
          SELECT u.id
          FROM Users u
          WHERE u.status = 'active'
        `;
      } else if (targetAudience === "Students") {
        userQuery = `
          SELECT u.id
          FROM Users u
          LEFT JOIN students s ON u.id = s.user_id
          LEFT JOIN course_management cm ON s.program_id = cm.id
          WHERE u.role = 'student' AND u.status = 'active'
        `;
      } else if (targetAudience === "Instructors") {
        userQuery = `
          SELECT u.id
          FROM Users u
          LEFT JOIN instructors i ON u.id = i.user_id
          WHERE u.role = 'instructor' AND u.status = 'active'
        `;
      } else if (targetAudience === "Alumni") {
        userQuery = `
          SELECT u.id
          FROM Users u
          LEFT JOIN alumni a ON u.id = a.user_id
          WHERE u.role = 'alumni' AND u.status = 'active'
        `;
      } else if (targetAudience.startsWith("Students - ")) {
        // Specific course/year/section
        const courseSection = targetAudience.replace("Students - ", "");
        userQuery = `
          SELECT u.id
          FROM Users u
          LEFT JOIN students s ON u.id = s.user_id
          LEFT JOIN course_management cm ON s.program_id = cm.id
          WHERE u.role = 'student' AND u.status = 'active' AND cm.course_section = ?
        `;
        queryParams.push(courseSection);
      } else if (targetAudience.startsWith("Instructors - ")) {
        // Specific department
        const department = targetAudience.replace("Instructors - ", "");
        userQuery = `
          SELECT u.id
          FROM Users u
          LEFT JOIN instructors i ON u.id = i.user_id
          WHERE u.role = 'instructor' AND u.status = 'active' AND i.department = ?
        `;
        queryParams.push(department);
      } else if (targetAudience.startsWith("Alumni - ")) {
        // Specific company
        const company = targetAudience.replace("Alumni - ", "");
        userQuery = `
          SELECT u.id
          FROM Users u
          LEFT JOIN alumni a ON u.id = a.user_id
          WHERE u.role = 'alumni' AND u.status = 'active' AND a.company = ?
        `;
        queryParams.push(company);
      }

      if (userQuery) {
        const users = await queryDatabase(db, userQuery, queryParams);

        // Create assignment records for each user
        if (users.length > 0) {
          const assignments = users.map(user => [formId, user.id, new Date()]);
          
          // Use INSERT ... ON DUPLICATE KEY UPDATE to handle duplicates gracefully
          await queryDatabase(
            db,
            "INSERT INTO form_assignments (form_id, user_id, assigned_at) VALUES ? ON DUPLICATE KEY UPDATE assigned_at = VALUES(assigned_at)",
            [assignments]
          );
          
          assignedCount = users.length;
        }
      }
    }

    // Create deployment record to store deployment data
    // Extract department and course_year_section from target_audience if not provided
    let deploymentDepartment = targetFilters?.department || null;
    let deploymentCourseYearSection = targetFilters?.course_year_section || null;
    let deploymentCompany = targetFilters?.company || null;

    // If target_audience contains " - ", extract the parts
    if (effectiveTargetAudience && effectiveTargetAudience.includes(" - ")) {
      const parts = effectiveTargetAudience.split(" - ");
      const audienceType = parts[0];
      const courseYearSection = parts.slice(1).join(" - ");

      if (audienceType === "Students") {
        deploymentCourseYearSection = courseYearSection;
        // Get department from course_management table
        try {
          const courseData = await queryDatabase(
            db,
            "SELECT department FROM course_management WHERE course_section = ?",
            [courseYearSection]
          );
          if (courseData.length > 0) {
            deploymentDepartment = courseData[0].department;
          }
        } catch (e) {
          console.error("Failed to get department from course_management:", e);
        }
      } else if (audienceType === "Instructors") {
        deploymentDepartment = courseYearSection;
      } else if (audienceType === "Alumni") {
        deploymentCompany = courseYearSection;
      }
    }

    const deploymentFilters = {
      target_audience: effectiveTargetAudience,
      department: deploymentDepartment,
      course_year_section: deploymentCourseYearSection,
      company: deploymentCompany,
    };

    // Check if deployment already exists for this form
    const existingDeployment = await queryDatabase(
      db,
      "SELECT id FROM form_deployments WHERE form_id = ?",
      [formId]
    );

    if (existingDeployment.length > 0) {
      // Update existing deployment
      await queryDatabase(
        db,
        `UPDATE form_deployments SET
          start_date = ?,
          end_date = ?,
          start_time = ?,
          end_time = ?,
          target_filters = ?,
          deployment_status = 'active'
        WHERE form_id = ?`,
        [
          startDate || form.start_date,
          endDate || form.end_date,
          deploymentStartTime,
          deploymentEndTime,
          JSON.stringify(deploymentFilters),
          formId
        ]
      );
    } else {
      // Insert new deployment
      await queryDatabase(
        db,
        `INSERT INTO form_deployments (
          form_id, deployed_by, start_date, end_date, start_time, end_time, target_filters, deployment_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
        [
          formId,
          userId,
          startDate || form.start_date,
          endDate || form.end_date,
          deploymentStartTime,
          deploymentEndTime,
          JSON.stringify(deploymentFilters)
        ]
      );
    }

    return {
      success: true,
      message: `Form deployed successfully and assigned to ${assignedCount} users`,
      formId,
      assignedCount,
    };
  } catch (error) {
    console.error("Deploy form error:", error);
    console.error("Error details:", {
      formId,
      userId,
      deploymentData,
      errorMessage: error.message,
      errorCode: error.code,
      sqlMessage: error.sqlMessage
    });
    return {
      success: false,
      message: error.sqlMessage || error.message || "Failed to deploy form"
    };
  }
};

/**
 * Share form responses with instructors
 * @param {number} formId - Form ID
 * @param {number} userId - User ID making the request
 * @param {array} instructorIds - Array of instructor IDs to share with
 * @returns {Promise<object>} Result with success status and message
 */
const shareResponsesWithInstructors = async (formId, userId, instructorIds = []) => {
  try {
    // Check if form exists and user owns it
    const forms = await queryDatabase(
      db,
      "SELECT * FROM Forms WHERE id = ?",
      [formId]
    );

    if (forms.length === 0) {
      return { success: false, message: "Form not found" };
    }

    if (forms[0].created_by !== userId) {
      return { success: false, message: "Access denied" };
    }

    // Insert shared_responses records
    const shares = instructorIds.map(instructorId => [formId, instructorId, userId, new Date()]);

    await new Promise((resolve, reject) => {
      db.query(
        "INSERT IGNORE INTO shared_responses (form_id, shared_with_instructor_id, shared_by, shared_at) VALUES ?",
        [shares],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });

    return {
      success: true,
      message: `Responses shared with ${instructorIds.length} instructor${instructorIds.length !== 1 ? "s" : ""}`,
    };
  } catch (error) {
    console.error("Share responses error:", error);
    return {
      success: false,
      message: "Failed to share responses",
    };
  }
};

/**
 * Get all form categories
 */
const getFormCategories = async () => {
  try {
    const categories = await queryDatabase(
      db,
      "SELECT * FROM form_categories ORDER BY name ASC"
    );
    return { success: true, categories };
  } catch (error) {
    console.error("Get form categories error:", error);
    return { success: false, message: "Failed to get categories", categories: [] };
  }
};

/**
 * Add a new form category
 */
const addFormCategory = async (name) => {
  try {
    // Check if category already exists
    const existing = await queryDatabase(
      db,
      "SELECT * FROM form_categories WHERE name = ?",
      [name]
    );
    if (existing.length > 0) {
      return { success: false, message: "Category already exists" };
    }
    const result = await queryDatabase(
      db,
      "INSERT INTO form_categories (name) VALUES (?)",
      [name]
    );
    return {
      success: true,
      message: "Category added successfully",
      category: { id: result.insertId, name },
    };
  } catch (error) {
    console.error("Add form category error:", error);
    return { success: false, message: "Failed to add category" };
  }
};

/**
 * Delete a form category
 */
const deleteFormCategory = async (id) => {
  try {
    await queryDatabase(
      db,
      "DELETE FROM form_categories WHERE id = ?",
      [id]
    );
    return { success: true, message: "Category deleted successfully" };
  } catch (error) {
    console.error("Delete form category error:", error);
    return { success: false, message: "Failed to delete category" };
  }
};

module.exports = {
  getAllForms,
  getFormById,
  createForm,
  updateForm,
  deleteForm,
  duplicateForm,
  saveAsTemplate,
  deployForm,
  getFormCategories,
  addFormCategory,
  deleteFormCategory,
  shareResponsesWithInstructors,
};
