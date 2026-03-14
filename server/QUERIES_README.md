# FeedbACTS System - Database Queries Documentation

This document provides a comprehensive overview of all database queries used in the FeedbACTS feedback and evaluation system.

---

## Table of Contents

1. [User Management Queries](#user-management-queries)
2. [Course Management Queries](#course-management-queries)
3. [Subject Management Queries](#subject-management-queries)
4. [Evaluation Forms Queries](#evaluation-forms-queries)
5. [Feedback System Queries](#feedback-system-queries)
6. [Student Promotion Queries](#student-promotion-queries)
7. [Form & Response Queries](#form--response-queries)

---

## User Management Queries

### Authentication & Users

| Query | Description |
|-------|-------------|
| `SELECT * FROM users` | Retrieves all users from the system |
| `SELECT * FROM users WHERE id = ?` | Gets a specific user by ID |
| `SELECT * FROM users WHERE email = ?` | Finds a user by email for login |
| `INSERT INTO users (email, password_hash, full_name, role, registration_date, status)` | Creates a new user account |
| `UPDATE users SET password_hash = ? WHERE id = ?` | Updates user password |
| `UPDATE users SET full_name = ?, role = ?, status = ? WHERE id = ?` | Updates user details |

### Student Management

| Query | Description |
|-------|-------------|
| `SELECT * FROM students` | Retrieves all student profiles |
| `SELECT * FROM students WHERE user_id = ?` | Gets student profile by user ID |
| `INSERT INTO students (user_id, studentID, contact_number, program_id, academic_year)` | Creates a new student profile |
| `UPDATE students SET program_id = ?, academic_year = ? WHERE user_id = ?` | Updates student program assignment |
| `SELECT s.*, u.full_name, u.email FROM students s JOIN users u ON s.user_id = u.id` | Gets all students with user details |

### Instructor Management

| Query | Description |
|-------|-------------|
| `SELECT * FROM instructors` | Retrieves all instructor profiles |
| `SELECT * FROM instructors WHERE user_id = ?` | Gets instructor by user ID |
| `INSERT INTO instructors (user_id, instructor_id, department, school_role)` | Creates instructor profile |
| `UPDATE instructors SET department = ?, school_role = ? WHERE user_id = ?` | Updates instructor details |

---

## Course Management Queries

| Query | Description |
|-------|-------------|
| `SELECT * FROM course_management ORDER BY department, program_code, year_level, section` | Gets all courses with ordering |
| `SELECT * FROM course_management WHERE id = ?` | Gets specific course by ID |
| `INSERT INTO course_management (department, program_name, program_code, year_level, section, status)` | Creates new course |
| `UPDATE course_management SET department = ?, program_name = ?, program_code = ?, year_level = ?, section = ?, status = ? WHERE id = ?` | Updates course details |
| `UPDATE course_management SET status = ? WHERE id = ?` | Changes course status (active/inactive) |
| `UPDATE course_management SET status = 'inactive' WHERE id = ?` | Deactivates a course |
| `SELECT DISTINCT department FROM course_management WHERE status = 'active' ORDER BY department` | Gets active departments |

---

## Subject Management Queries

### Subjects Table

| Query | Description |
|-------|-------------|
| `SELECT * FROM subjects WHERE status = 'active' ORDER BY subject_code` | Gets all active subjects |
| `SELECT * FROM subjects WHERE id = ?` | Gets subject by ID |
| `SELECT id FROM evaluation_subjects WHERE subject_code = ?` | Checks if subject code exists |
| `INSERT INTO subjects (subject_code, subject_name, department, units, status)` | Creates new subject |
| `UPDATE subjects SET subject_code = ?, subject_name = ?, department = ?, status = ?, units = ? WHERE id = ?` | Updates subject details |
| `DELETE FROM subjects WHERE id = ?` | Removes a subject |

### Evaluation Subjects

| Query | Description |
|-------|-------------|
| `SELECT * FROM evaluation_subjects` | Gets all evaluation subjects |
| `SELECT id, subject_code, subject_name FROM evaluation_subjects WHERE id = ?` | Validates subject exists |
| `INSERT INTO evaluation_subjects (subject_code, subject_name, department, units, description, status)` | Creates evaluation subject |
| `UPDATE evaluation_subjects SET subject_code = ?, subject_name = ?, department = ?, units = ?, description = ?, status = ? WHERE id = ?` | Updates evaluation subject |

### Subject Instructors

| Query | Description |
|-------|-------------|
| `SELECT * FROM subject_instructors WHERE subject_id = ?` | Gets instructors for a subject |
| `SELECT id FROM subject_instructors WHERE subject_id = ? AND instructor_id = ? AND academic_year = ? AND semester = ?` | Checks instructor assignment exists |
| `INSERT INTO subject_instructors (subject_id, instructor_id, academic_year, semester)` | Assigns instructor to subject |
| `DELETE FROM subject_instructors WHERE id = ?` | Removes instructor from subject |

### Subject Students

| Query | Description |
|-------|-------------|
| `SELECT * FROM subject_students WHERE subject_id = ?` | Gets students enrolled in subject |
| `SELECT id FROM subject_students WHERE subject_id = ? AND student_id = ? AND academic_year = ? AND semester = ?` | Checks student enrollment |
| `INSERT INTO subject_students (subject_id, student_id, academic_year, semester, status)` | Enrolls student in subject |
| `UPDATE subject_students SET status = 'dropped' WHERE id = ?` | Drops student from subject |

### Subject Offerings

| Query | Description |
|-------|-------------|
| `SELECT * FROM subject_offerings` | Gets all subject offerings |
| `SELECT * FROM subject_offerings WHERE id = ?` | Gets specific offering |
| `SELECT id FROM subject_offerings WHERE subject_id = ? AND program_id = ? AND year_level = ? AND section = ? AND academic_year = ? AND semester = ?` | Checks if offering exists |
| `INSERT INTO subject_offerings (subject_id, program_id, year_level, section, academic_year, semester, instructor_id, status)` | Creates subject offering |
| `UPDATE subject_offerings SET instructor_id = ?, status = ? WHERE id = ?` | Updates offering details |
| `DELETE FROM subject_offerings WHERE id = ?` | Deletes subject offering |

### Instructor Courses

| Query | Description |
|-------|-------------|
| `SELECT * FROM instructor_courses WHERE instructor_id = ?` | Gets courses for instructor |
| `SELECT id FROM instructor_courses WHERE instructor_id = ? AND subject_id = ?` | Checks instructor-course link |
| `INSERT INTO instructor_courses (instructor_id, subject_id)` | Links instructor to course |
| `DELETE FROM instructor_courses WHERE id = ?` | Removes instructor from course |
| `UPDATE subjects SET instructor_id = NULL WHERE id = ? AND instructor_id = ?` | Clears subject instructor |

### Student Enrollments

| Query | Description |
|-------|-------------|
| `SELECT * FROM student_enrollments WHERE subject_id = ?` | Gets enrollments for subject |
| `SELECT id FROM student_enrollments WHERE subject_id = ? AND student_id = ?` | Checks enrollment exists |
| `INSERT INTO student_enrollments (student_id, subject_id, status)` | Creates enrollment |
| `UPDATE student_enrollments SET status = 'unenrolled' WHERE id = ?` | Unenrolls student |
| `DELETE FROM student_enrollments WHERE subject_id = ? AND student_id = ?` | Removes enrollment |

### Subject Sections

| Query | Description |
|-------|-------------|
| `SELECT * FROM subject_sections` | Gets all subject sections |
| `SELECT * FROM subject_sections WHERE program_id = ?` | Gets sections for program |
| `SELECT * FROM subject_sections WHERE id = ?` | Gets specific section |
| `INSERT INTO subject_sections (subject_id, program_id, year_level, section, academic_year, semester, instructor_id, status)` | Creates section |
| `DELETE FROM subject_sections WHERE id = ?` | Deletes section |

---

## Evaluation Forms Queries

| Query | Description |
|-------|-------------|
| `SELECT * FROM evaluation_forms` | Gets all evaluation forms |
| `SELECT * FROM evaluation_forms WHERE id = ?` | Gets evaluation form by ID |
| `SELECT COUNT(*) as count FROM subject_evaluation_forms` | Counts evaluation forms |
| `SELECT id, title, status FROM Forms LIMIT 10` | Gets form titles and status |
| `SELECT id FROM evaluation_forms WHERE form_id = ? AND subject_id = ?` | Checks form-subject link |
| `INSERT INTO evaluation_forms (form_id, subject_id, instructor_id, academic_year, semester)` | Creates evaluation form |
| `UPDATE evaluation_forms SET instructor_id = ?, academic_year = ?, semester = ? WHERE form_id = ? AND subject_id = ?` | Updates evaluation form |
| `UPDATE evaluation_forms SET is_active = FALSE WHERE id = ?` | Deactivates evaluation form |

### Subject Evaluation Responses

| Query | Description |
|-------|-------------|
| `SELECT * FROM subject_evaluation_responses` | Gets all evaluation responses |
| `SELECT * FROM subject_evaluation_responses WHERE student_id = ? AND evaluation_form_id = ?` | Gets student response for form |
| `SELECT id FROM subject_evaluation_responses WHERE student_id = ? AND evaluation_form_id = ?` | Checks if student already responded |
| `INSERT INTO subject_evaluation_responses (evaluation_form_id, subject_id, instructor_id, student_id, responses, subject_rating, instructor_rating, academic_year, semester)` | Saves evaluation response |
| `SELECT * FROM subject_evaluation_responses WHERE subject_id = ? AND academic_year = ? AND semester = ?` | Gets responses for subject |
| `SELECT * FROM subject_evaluation_responses WHERE instructor_id = ?` | Gets responses for instructor |

---

## Feedback System Queries

### Feedback Template Categories

| Query | Description |
|-------|-------------|
| `SELECT * FROM feedback_template_categories` | Gets all feedback categories |
| `SELECT * FROM feedback_template_categories ORDER BY display_order` | Gets categories in order |
| `SELECT id FROM feedback_template_categories WHERE category_name = ? AND (feedback_type = ? OR feedback_type IS NULL)` | Checks category exists |
| `SELECT MAX(display_order) as max_order FROM feedback_template_categories` | Gets highest display order |
| `INSERT INTO feedback_template_categories (category_name, description, display_order, feedback_type)` | Creates feedback category |
| `UPDATE feedback_template_categories SET category_name = ?, description = ?, display_order = ?, is_active = ?, feedback_type = ? WHERE id = ?` | Updates category |
| `DELETE FROM feedback_template_categories WHERE id = ?` | Deletes category |

### Evaluation Periods

| Query | Description |
|-------|-------------|
| `SELECT * FROM evaluation_periods` | Gets all evaluation periods |
| `SELECT * FROM evaluation_periods WHERE is_active = TRUE` | Gets active periods |
| `SELECT id FROM evaluation_periods WHERE (start_date <= ? AND end_date >= ?) OR (start_date <= ? AND end_date >= ?) OR (start_date >= ? AND end_date <= ?)` | Checks date overlap |
| `INSERT INTO evaluation_periods (name, start_date, end_date, academic_year, semester)` | Creates evaluation period |
| `UPDATE evaluation_periods SET is_active = FALSE` | Deactivates all periods |
| `UPDATE evaluation_periods SET name = ?, start_date = ?, end_date = ?, academic_year = ?, semester = ?, is_active = ? WHERE id = ?` | Updates period |
| `DELETE FROM evaluation_periods WHERE id = ?` | Deletes period |

### Subject Feedback

| Query | Description |
|-------|-------------|
| `SELECT * FROM subject_feedback` | Gets all subject feedback |
| `SELECT * FROM subject_feedback WHERE student_id = ? AND academic_year = ? AND semester = ?` | Gets student feedback |
| `SELECT id FROM evaluation_subjects WHERE id = ?` | Validates subject exists |
| `INSERT INTO subject_feedback (student_id, subject_id, instructor_id, responses, overall_rating, academic_year, semester)` | Submits subject feedback |
| `UPDATE subject_feedback SET responses = ?, overall_rating = ? WHERE id = ?` | Updates feedback |

### Instructor Feedback

| Query | Description |
|-------|-------------|
| `SELECT * FROM instructor_feedback` | Gets all instructor feedback |
| `SELECT * FROM instructor_feedback WHERE student_id = ? AND academic_year = ? AND semester = ?` | Gets student instructor feedback |
| `INSERT INTO instructor_feedback (student_id, instructor_id, subject_id, responses, overall_rating, academic_year, semester)` | Submits instructor feedback |

---

## Student Promotion Queries

### Graduation Records

| Query | Description |
|-------|-------------|
| `SELECT * FROM graduation_records` | Gets all graduation records |
| `SELECT * FROM graduation_records WHERE student_id = ?` | Gets student graduation record |
| `INSERT INTO graduation_records (student_id, user_id, program_id, graduation_year, degree, honors)` | Records graduation |
| `UPDATE graduation_records SET program_id = ?, graduation_year = ?, honors = ? WHERE student_id = ?` | Updates graduation |

### Promotion History

| Query | Description |
|-------|-------------|
| `SELECT * FROM student_promotion_history` | Gets promotion history |
| `SELECT * FROM student_promotion_history WHERE student_id = ?` | Gets student promotions |
| `INSERT INTO student_promotion_history (student_id, user_id, promotion_type, promotion_date, previous_program_id, new_program_id, promoted_by, notes)` | Records promotion |
| `SELECT * FROM promotion_history_view` | Gets promotion history view |

---

## Form & Response Queries

### Forms

| Query | Description |
|-------|-------------|
| `SELECT * FROM Forms` | Gets all forms |
| `SELECT * FROM Forms WHERE id = ?` | Gets form by ID |
| `SELECT * FROM Forms WHERE status = 'published'` | Gets published forms |
| `INSERT INTO Forms (title, description, category, target_audience, status, created_by)` | Creates new form |
| `UPDATE Forms SET title = ?, description = ?, status = ? WHERE id = ?` | Updates form |
| `DELETE FROM Forms WHERE id = ?` | Deletes form |

### Form Deployments

| Query | Description |
|-------|-------------|
| `SELECT * FROM form_deployments` | Gets all form deployments |
| `SELECT id FROM form_deployments WHERE form_id = ?` | Checks if form deployed |
| `INSERT INTO form_deployments (form_id, deployed_by, start_date, end_date, target_users)` | Deploys form |
| `UPDATE form_deployments SET start_date = ?, end_date = ?, target_users = ? WHERE form_id = ?` | Updates deployment |

### Form Assignments

| Query | Description |
|-------|-------------|
| `SELECT * FROM form_assignments` | Gets form assignments |
| `INSERT IGNORE INTO form_assignments (form_id, user_id, assigned_at) VALUES ?` | Bulk assigns users to form |
| `DELETE FROM form_assignments WHERE form_id = ?` | Removes assignments |

### Form Responses

| Query | Description |
|-------|-------------|
| `SELECT * FROM form_responses` | Gets all form responses |
| `SELECT * FROM form_responses WHERE form_id = ?` | Gets responses for form |
| `SELECT * FROM form_responses WHERE user_id = ?` | Gets user's responses |
| `INSERT INTO form_responses (form_id, user_id, responses, submitted_at)` | Saves form response |
| `UPDATE form_responses SET responses = ? WHERE id = ?` | Updates response |

### Shared Responses

| Query | Description |
|-------|-------------|
| `SELECT * FROM shared_responses` | Gets shared responses |
| `INSERT IGNORE INTO shared_responses (form_id, shared_with_instructor_id, shared_by, shared_at) VALUES ?` | Bulk shares responses |

### Questions & Sections

| Query | Description |
|-------|-------------|
| `SELECT * FROM questions WHERE form_id = ?` | Gets questions for form |
| `SELECT * FROM questions WHERE section_id = ?` | Gets questions for section |
| `INSERT INTO questions (form_id, question_text, question_type, required, order_index)` | Creates question |
| `UPDATE questions SET question_text = ?, question_type = ?, required = ? WHERE id = ?` | Updates question |
| `DELETE FROM questions WHERE id = ?` | Deletes question |
| `SELECT * FROM sections WHERE form_id = ?` | Gets sections for form |
| `INSERT INTO sections (form_id, title, description, order_index)` | Creates section |
| `UPDATE sections SET title = ?, description = ? WHERE id = ?` | Updates section |
| `DELETE FROM sections WHERE id = ?` | Deletes section |

### Question Options

| Query | Description |
|-------|-------------|
| `SELECT * FROM question_options WHERE question_id = ?` | Gets options for question |
| `INSERT INTO question_options (question_id, option_text, order_index)` | Creates question option |
| `DELETE FROM question_options WHERE question_id = ?` | Deletes question options |

---

## System Settings Queries

| Query | Description |
|-------|-------------|
| `SELECT * FROM system_settings` | Gets all system settings |
| `SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('current_semester', 'current_academic_year')` | Gets current academic settings |
| `INSERT INTO system_settings (setting_key, setting_value, department, description)` | Creates setting |
| `UPDATE system_settings SET setting_value = ? WHERE setting_key = ?` | Updates setting |
| `DELETE FROM system_settings WHERE id = ?` | Deletes setting |

---

## View Queries (Pre-built Summary Views)

| View Name | Description |
|-----------|-------------|
| `department_evaluation_summary` | Aggregates evaluation data by department |
| `form_summary` | Provides summary of all forms with response counts |
| `instructor_evaluation_summary` | Aggregates instructor evaluation data |
| `promotion_history_view` | Shows student promotion history with details |
| `question_details` | Shows questions with their options as JSON |

---

## JOIN Tables Queries

### User-Related Joins

| Query | Description |
|-------|-------------|
| `SELECT u.*, s.*, cm.* FROM Users u LEFT JOIN students s ON u.id = s.user_id LEFT JOIN course_management cm ON s.program_id = cm.id` | Get users with student and course details |
| `SELECT u.*, i.* FROM Users u LEFT JOIN instructors i ON u.id = i.user_id` | Get users with instructor details |
| `SELECT u.*, e.* FROM Users u LEFT JOIN employers e ON u.id = e.user_id` | Get users with employer details |
| `SELECT u.*, a.* FROM Users u LEFT JOIN alumni a ON u.id = a.user_id` | Get users with alumni details |
| `SELECT u.*, s.*, i.* FROM Users u LEFT JOIN students s ON u.id = s.user_id LEFT JOIN instructors i ON u.id = i.user_id` | Get users with both student and instructor info |
| `SELECT u.*, s.*, cm.*, i.* FROM Users u LEFT JOIN students s ON u.id = s.user_id LEFT JOIN course_management cm ON s.program_id = cm.id LEFT JOIN instructors i ON u.id = i.user_id` | Get users with student, course, and instructor info |

### Form & Response Joins

| Query | Description |
|-------|-------------|
| `SELECT fa.*, f.*, u.* FROM form_assignments fa LEFT JOIN Forms f ON fa.form_id = f.id LEFT JOIN Users u ON f.created_by = u.id WHERE fa.user_id = ?` | Get form assignments with form and creator details |
| `SELECT fr.*, f.* FROM Form_Responses fr LEFT JOIN Forms f ON fr.form_id = f.id WHERE fr.user_id = ?` | Get form responses with form details |
| `SELECT fr.*, u.*, s.*, cm.* FROM Form_Responses fr LEFT JOIN Users u ON fr.user_id = u.id LEFT JOIN students s ON u.id = s.user_id LEFT JOIN course_management cm ON s.program_id = cm.id WHERE fr.form_id = ?` | Get responses with user, student, and program details |
| `SELECT sr.*, f.*, ub.*, fr.* FROM shared_responses sr INNER JOIN Forms f ON sr.form_id = f.id LEFT JOIN Users ub ON sr.shared_by = ub.id LEFT JOIN Form_Responses fr ON f.id = fr.form_id WHERE sr.shared_with_instructor_id = ?` | Get shared responses with all related details |

### Subject & Evaluation Joins

| Query | Description |
|-------|-------------|
| `SELECT ef.*, f.*, u.* FROM evaluation_forms ef INNER JOIN Forms f ON ef.form_id = f.id LEFT JOIN users u ON ef.instructor_id = u.id WHERE ef.subject_id = ?` | Get evaluation forms with form and instructor details |
| `SELECT se.*, s.*, si.*, u.*, inst.*, ic.*, u2.*, inst2.*, f.* FROM student_enrollments se INNER JOIN subjects s ON se.subject_id = s.id LEFT JOIN subject_instructors si ON s.id = si.subject_id LEFT JOIN users siu ON si.instructor_id = siu.id LEFT JOIN instructor_courses ic ON s.id = ic.subject_id LEFT JOIN users iu ON ic.instructor_id = iu.id LEFT JOIN subject_evaluation_forms sef ON sef.subject_id = s.id INNER JOIN Forms f ON sef.form_id = f.id WHERE se.student_id = ?` | Get student enrollments with all related subject, instructor, and form details |
| `SELECT es.*, si.*, u.*, ss.*, ser.* FROM evaluation_subjects es LEFT JOIN subject_instructors si ON es.id = si.subject_id AND si.academic_year = COALESCE(?, si.academic_year) AND si.semester = COALESCE(?, si.semester) LEFT JOIN users u ON si.instructor_id = u.id LEFT JOIN subject_students ss ON es.id = ss.subject_id AND ss.status = 'enrolled' LEFT JOIN subject_evaluation_responses ser ON es.id = ser.subject_id` | Get subjects with instructors, students, and responses |
| `SELECT si.*, es.* FROM subject_instructors si INNER JOIN evaluation_subjects es ON si.subject_id = es.id WHERE si.instructor_id = ?` | Get subject instructors with subject details |
| `SELECT ss.*, st.*, p.* FROM subject_students ss LEFT JOIN students st ON ss.student_id = st.user_id LEFT JOIN programs p ON st.program_id = p.id WHERE ss.subject_id = ?` | Get subject students with program details |
| `SELECT ser.*, st.*, cm.* FROM subject_evaluation_responses ser LEFT JOIN students st ON ser.student_id = st.user_id LEFT JOIN course_management cm ON st.program_id = cm.id WHERE ser.subject_id = ?` | Get evaluation responses with student and program details |

### Course & Program Joins

| Query | Description |
|-------|-------------|
| `SELECT so.*, es.*, s.*, u.*, inst.* FROM subject_offerings so LEFT JOIN evaluation_subjects es ON so.subject_id = es.id LEFT JOIN subjects s ON so.subject_id = s.id LEFT JOIN users u ON so.instructor_id = u.id LEFT JOIN instructors inst ON u.id = inst.user_id WHERE so.program_id = ?` | Get subject offerings with subject and instructor details |
| `SELECT ss.*, es.*, si.*, inst.*, u.*, ic.*, inst2.*, u2.* FROM subject_sections ss INNER JOIN evaluation_subjects es ON ss.subject_id = es.id LEFT JOIN subject_instructors si ON es.id = si.subject_id LEFT JOIN instructors inst ON si.instructor_id = inst.user_id LEFT JOIN users u ON inst.user_id = u.id LEFT JOIN instructor_courses ic ON es.id = ic.subject_id LEFT JOIN instructors inst2 ON ic.instructor_id = inst2.user_id LEFT JOIN users u2 ON inst2.user_id = u2.id WHERE ss.program_id = ? AND ss.status = 'active'` | Get subject sections with all instructor associations |
| `SELECT s.*, si.*, u.*, ic.*, u2.*, se.* FROM subjects s LEFT JOIN subject_instructors si ON s.id = si.subject_id LEFT JOIN users u ON si.instructor_id = u.id LEFT JOIN instructor_courses ic ON s.id = ic.subject_id LEFT JOIN users u2 ON ic.instructor_id = u2.id LEFT JOIN student_enrollments se ON s.id = se.subject_id AND se.status = 'enrolled' WHERE s.status = 'active'` | Get subjects with all instructor and enrollment info |
| `SELECT se.*, s.*, u.*, st.* FROM student_enrollments se INNER JOIN subjects s ON se.subject_id = s.id LEFT JOIN users u ON se.student_id = u.id LEFT JOIN students st ON u.id = st.user_id WHERE se.status = 'enrolled' AND s.status = 'active'` | Get student enrollments with subject and student details |
| `SELECT s.*, cm.* FROM subject_offerings so LEFT JOIN subjects s ON so.subject_id = s.id LEFT JOIN course_management c ON so.program_id = c.id LEFT JOIN users u ON so.instructor_id = u.id` | Get subject offerings with course and instructor |
| `SELECT st.*, u.*, cm.* FROM students st INNER JOIN users u ON st.user_id = u.id LEFT JOIN course_management cm ON st.program_id = cm.id WHERE st.program_id = ? AND u.status = 'active'` | Get students with user and program details |

### Instructor & Course Joins

| Query | Description |
|-------|-------------|
| `SELECT ic.*, s.*, u.* FROM instructor_courses ic INNER JOIN subjects s ON ic.subject_id = s.id LEFT JOIN users u ON ic.instructor_id = u.id WHERE s.status = 'active'` | Get instructor courses with subject and user details |
| `SELECT ic.*, s.*, sef.*, f.*, u.*, inst.* FROM instructor_courses ic INNER JOIN subjects s ON ic.subject_id = s.id LEFT JOIN subject_evaluation_forms sef ON s.id = sef.subject_id LEFT JOIN forms f ON sef.form_id = f.id LEFT JOIN users u ON ic.instructor_id = u.id LEFT JOIN instructors inst ON u.id = inst.user_id WHERE ic.instructor_id = ?` | Get instructor courses with evaluation forms |
| `SELECT so.*, s.*, u.*, inst.* FROM subject_offerings so INNER JOIN subjects s ON so.subject_id = s.id LEFT JOIN users u ON so.instructor_id = u.id LEFT JOIN instructors inst ON u.id = inst.user_id WHERE so.program_id = ?` | Get subject offerings for a program with instructor details |
| `SELECT s.*, si.*, u.* FROM subjects s LEFT JOIN subject_instructors si ON s.id = si.subject_id LEFT JOIN users u ON si.instructor_id = u.id ORDER BY s.subject_code, u.full_name` | Get subjects with assigned instructors |

### Feedback & Summary Joins

| Query | Description |
|-------|-------------|
| `SELECT sf.*, s.*, u.* FROM subject_feedback sf LEFT JOIN subjects s ON sf.subject_id = s.id LEFT JOIN users u ON sf.instructor_id = u.id` | Get subject feedback with subject and instructor details |
| `SELECT sph.*, u.*, s.*, cm_old.*, cm_new.*, promoter.* FROM student_promotion_history sph INNER JOIN users u ON sph.user_id = u.id INNER JOIN students s ON sph.student_id = s.id LEFT JOIN course_management cm_old ON sph.previous_program_id = cm_old.id LEFT JOIN course_management cm_new ON sph.new_program_id = cm_new.id INNER JOIN users promoter ON sph.promoted_by = promoter.id` | Get promotion history with all related user and program details |
| `SELECT s.*, u.*, cm.* FROM students s INNER JOIN users u ON s.user_id = u.id LEFT JOIN course_management cm ON s.program_id = cm.id` | Get students with user and course details |
| `SELECT i.*, u.* FROM instructors i INNER JOIN users u ON i.user_id = u.id WHERE u.role = 'instructor'` | Get instructors with user details |

---

## Common Query Patterns

### Check if Record Exists
```sql
SELECT id FROM table_name WHERE condition LIMIT 1
```

### Bulk Insert with Ignore
```sql
INSERT IGNORE INTO table_name (columns) VALUES ?
```

### Soft Delete (Status Update)
```sql
UPDATE table_name SET status = 'inactive' WHERE id = ?
```

### Get Records with Join
```sql
SELECT t1.*, t2.* FROM table1 t1 
JOIN table2 t2 ON t1.id = t2.foreign_id 
WHERE condition
```

---

## Notes

- All queries use parameterized queries (`?` placeholders) to prevent SQL injection
- The system uses MySQL database with `db.query()` for async operations
- Foreign key constraints are enforced for data integrity
- Timestamps are automatically managed with `DEFAULT CURRENT_TIMESTAMP` and `ON UPDATE CURRENT_TIMESTAMP`
