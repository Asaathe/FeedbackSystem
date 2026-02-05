# Form Assignment and Deployment Tracking Implementation

## Overview
This document describes the implementation of proper form assignment and deployment tracking in the FeedbACTS system. The changes ensure that all form assignments (both specific user assignments and group deployments) are recorded in the `form_assignments` table, and user dashboards display forms based on actual assignments rather than role matching.

**Note**: The `form_deployments` table exists in the database schema but is not used in this implementation. All deployment information is stored in the `Forms` table (`start_date`, `end_date`, `status`, `target_audience`), and individual assignments are tracked in the `form_assignments` table.

## Changes Made

### 1. Updated `deployForm` Function in `server/services/formService.js`

**Location**: Lines 458-494

**Changes**:
- Modified function signature to accept `deploymentData` parameter containing `targetFilters`, `startDate`, and `endDate`
- Added logic to query all users matching the target audience criteria
- Creates individual assignment records in `form_assignments` table for each matching user
- Returns count of assigned users in the response

**Target Audience Support**:
- `All Users`: Assigns to all active users
- `Students`: Assigns to all active students
- `Instructors`: Assigns to all active instructors
- `Alumni`: Assigns to all active alumni
- `Students - [Course/Year/Section]`: Assigns to students in specific course/year/section
- `Instructors - [Department]`: Assigns to instructors in specific department
- `Alumni - [Company]`: Assigns to alumni from specific company

**Example Usage**:
```javascript
const deploymentData = {
  startDate: '2025-01-01',
  endDate: '2025-01-31',
  targetFilters: {
    roles: ['student'],
    target_audience: 'Students - BSIT - 1A'
  }
};
const result = await formService.deployForm(formId, userId, deploymentData);
```

### 2. Updated `deployForm` Controller in `server/controllers/formController.js`

**Location**: Lines 175-197

**Changes**:
- Modified to pass `req.body` (deployment data) to the service function
- This allows the deployment data from the frontend to be processed

### 3. Updated `getAssignedForms` Function in `server/services/userService.js`

**Location**: Lines 139-209

**Changes**:
- Changed from querying Forms table based on `target_audience` matching
- Now queries `form_assignments` table to get actual assignments for the user
- Joins with Forms table to get form details
- Returns `assignment_status` from the `form_assignments` table (pending/completed/expired)
- Includes `assigned_at` timestamp in the response

**New Query**:
```sql
SELECT 
  f.*,
  u.full_name as creator_name,
  (SELECT COUNT(*) FROM Questions WHERE form_id = f.id) as question_count,
  (SELECT COUNT(*) FROM Form_Responses WHERE form_id = f.id AND user_id = ?) as submission_count,
  fa.status as assignment_status,
  fa.assigned_at
FROM form_assignments fa
LEFT JOIN Forms f ON fa.form_id = f.id
LEFT JOIN Users u ON f.created_by = u.id
WHERE fa.user_id = ?
  AND f.status = 'active'
ORDER BY fa.assigned_at DESC
```

### 4. Updated `submitFormResponse` Function in `server/services/responseService.js`

**Location**: Lines 5-67

**Changes**:
- Added query to update assignment status to 'completed' after successful form submission
- This ensures the `form_assignments` table reflects the current state of each assignment

**New Query**:
```sql
UPDATE form_assignments SET status = 'completed' 
WHERE form_id = ? AND user_id = ?
```

## How It Works Now

### Form Deployment Flow

1. **Admin creates/publishes a form** with target audience selection
2. **Frontend calls** `deployToGroup()` or `assignToUsers()` function
3. **Backend processes deployment**:
   - Updates form status to 'active'
   - Sets start_date and end_date
   - Queries all users matching target audience
   - Creates assignment records for each user in `form_assignments` table
4. **Response includes** count of assigned users

### User Dashboard Flow

1. **User logs in** and navigates to dashboard
2. **Frontend calls** `getFormsForUserRole()` function
3. **Backend queries** `form_assignments` table for the user's ID
4. **Returns only forms** that have actual assignment records
5. **Dashboard displays** forms with their assignment status (pending/completed)

### Form Submission Flow

1. **User submits a form**
2. **Backend validates** form and checks for duplicate submissions
3. **Inserts response** into `Form_Responses` table
4. **Updates assignment status** to 'completed' in `form_assignments` table
5. **User dashboard** now shows the form as completed

## Benefits

### 1. Accurate Assignment Tracking
- Every form deployment creates individual assignment records
- Can track exactly which users received each form
- Complete audit trail of all assignments

### 2. Proper Assignment Status
- Assignment status is tracked in `form_assignments` table
- Status updates automatically when form is submitted
- Can track pending/completed/expired assignments

### 3. Better Reporting
- Generate reports on assignment completion rates
- Identify users with pending assignments
- Track assignment lifecycle

### 4. Targeted Follow-ups
- Send reminders to users with pending assignments
- Identify users who haven't submitted
- Reassign expired assignments if needed

### 5. Consistent User Experience
- Users only see forms they were actually assigned
- No confusion about which forms they should complete
- Clear indication of assignment status

## Database Schema Utilization

### `form_assignments` Table
Now properly utilized with all fields:
- `form_id`: References the assigned form
- `user_id`: References the assigned user
- `assigned_at`: Timestamp when assignment was created
- `status`: Current status (pending/completed/expired)

### `Forms` Table
- `target_audience`: Used for deployment criteria to determine which users should receive the form
- `status`: Set to 'active' when deployed
- `start_date`/`end_date`: Set during deployment to define the submission period
- `created_by`: Tracks who created the form

### `Form_Responses` Table
- Records user submissions
- Used to check for duplicate submissions
- Triggers assignment status update to 'completed'

### `form_deployments` Table
**Not used in this implementation**. This table exists in the database schema but is not utilized because:
- Deployment dates are already stored in the `Forms` table (`start_date`, `end_date`)
- Target audience is stored in the `Forms` table (`target_audience`)
- Deployment status can be inferred from the `Forms` table (`status`)
- Individual assignments are tracked in the `form_assignments` table

The `form_deployments` table could be used in the future for:
- Tracking deployment history (multiple deployments of the same form)
- Scheduling future deployments
- Tracking who deployed each form
- Independent deployment status tracking

However, for the current implementation, all necessary deployment information is available in the `Forms` and `form_assignments` tables.

## Testing Recommendations

### 1. Test Group Deployment
- Create a form targeting "All Students"
- Deploy the form
- Verify assignment records created for all students
- Check student dashboards show the form

### 2. Test Specific Course Deployment
- Create a form targeting "Students - BSIT - 1A"
- Deploy the form
- Verify only BSIT 1A students receive the form
- Check other students don't see the form

### 3. Test Form Submission
- User submits an assigned form
- Verify assignment status updates to 'completed'
- Check dashboard shows form as completed
- Verify user cannot submit again

### 4. Test Assignment Status
- Check pending assignments count
- Submit some forms
- Verify completed assignments count updates
- Check assignment status in database

## Migration Notes

### Existing Forms
Forms deployed before this implementation will not have assignment records. To migrate:

1. Identify active forms with `target_audience` set
2. Query users matching each form's target audience
3. Create assignment records for each user
4. Update assignment status based on existing submissions

### Example Migration Query
```sql
-- For a specific form targeting all students
INSERT INTO form_assignments (form_id, user_id, assigned_at, status)
SELECT 
  f.id as form_id,
  u.id as user_id,
  NOW() as assigned_at,
  CASE 
    WHEN fr.id IS NOT NULL THEN 'completed'
    ELSE 'pending'
  END as status
FROM Forms f
CROSS JOIN Users u ON u.role = 'student' AND u.status = 'active'
LEFT JOIN Form_Responses fr ON f.id = fr.form_id AND u.id = fr.user_id
WHERE f.id = ? AND f.status = 'active'
```

## Future Enhancements

### 1. Assignment Expiration
- Add scheduled job to expire assignments after end_date
- Update status to 'expired' for past-due assignments
- Remove expired forms from user dashboards

### 2. Assignment Reminders
- Send email notifications for pending assignments
- Reminder before due date
- Follow-up for overdue assignments

### 3. Bulk Assignment Management
- Allow reassigning forms to different users
- Bulk update assignment status
- Cancel assignments before submission

### 4. Assignment Analytics
- Track assignment completion rates by user role
- Identify patterns in submission behavior
- Generate assignment performance reports

## Conclusion

This implementation provides a robust form assignment and deployment tracking system that:
- Records all assignments in the database
- Tracks assignment lifecycle from creation to completion
- Provides accurate user dashboard displays
- Enables comprehensive reporting and analytics
- Supports future enhancements for reminders and expiration

The system now properly utilizes the `form_assignments` table for all form deployments, ensuring accurate tracking and reporting capabilities.
