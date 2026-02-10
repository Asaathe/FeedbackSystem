# Form Deployment Time Support

## Overview
This document describes the changes made to support start time and end time for form availability in the `form_deployments` table.

## Problem
Previously, the `form_deployments` table only stored `start_date` and `end_date` (DATE type), which meant that time information was lost when forms were deployed. When editing a form, the start time and end time fields would be empty because they were not persisted in the database.

## Solution
Added `start_time` and `end_time` columns to the `form_deployments` table to store the specific time when a form becomes available and when it expires.

## Database Changes

### New Columns
- `start_time` (TIME, DEFAULT NULL) - The time when the form becomes available
- `end_time` (TIME, DEFAULT NULL) - The time when the form expires

### New Index
- `idx_time_range` - Index on `(start_time, end_time)` for efficient time-based queries

## Code Changes

### Server-Side

#### 1. Migration Script
- **File**: `server/migrations/add_deployment_times.js`
- **Purpose**: Adds the new columns and index to the database
- **Usage**: Run `node server/migrations/add_deployment_times.js`

#### 2. Form Controller
- **File**: `server/controllers/formController.js`
- **Changes**:
  - Updated `assignFormToUsers` to accept `startTime` and `endTime` parameters
  - Updated deployment insertion to store `start_time` and `end_time` values

#### 3. Form Service
- **File**: `server/services/formService.js`
- **Changes**:
  - Updated `getFormById` to include `start_time` and `end_time` in deployment data query

### Client-Side

#### 1. Form Management Service
- **File**: `CLIENT/src/services/formManagementService.ts`
- **Changes**:
  - Updated `assignFormToUsers` function to accept and send `startTime` and `endTime` parameters

#### 2. Use Recipients Hook
- **File**: `CLIENT/src/components/Forms/hooks/useRecipients.ts`
- **Changes**:
  - Updated `assignToUsers` function to accept and pass `startTime` and `endTime` parameters

#### 3. Use Form Settings Hook
- **File**: `CLIENT/src/components/Forms/hooks/useFormSettings.ts`
- **Changes**:
  - Updated form data loading to retrieve `start_time` and `end_time` from deployment data
  - Time values are now properly loaded when editing a form

#### 4. Form Builder
- **File**: `CLIENT/src/components/Forms/form-builder.tsx`
- **Changes**:
  - Updated `assignToUsers` call to pass `startTime` and `endTime` separately instead of combined datetime

## Usage

### When Creating/Deploying a Form
1. Set the start date and time in the submission schedule
2. Set the end date and time in the submission schedule
3. When deploying, the time values are stored in `form_deployments.start_time` and `form_deployments.end_time`

### When Editing a Form
1. The form data is loaded from the database
2. The deployment data includes `start_time` and `end_time`
3. The time fields are populated with the stored values

### Example Data Flow

**Creating a Form:**
```javascript
// Client sends
{
  startDate: "2026-02-10",
  startTime: "09:00",
  endDate: "2026-02-20",
  endTime: "17:00"
}

// Server stores in form_deployments
{
  start_date: "2026-02-10",
  start_time: "09:00",
  end_date: "2026-02-20",
  end_time: "17:00"
}
```

**Loading a Form:**
```javascript
// Server returns
{
  deployment: {
    start_date: "2026-02-10",
    start_time: "09:00",
    end_date: "2026-02-20",
    end_time: "17:00"
  }
}

// Client populates
{
  submissionSchedule: {
    startDate: "2026-02-10",
    startTime: "09:00",
    endDate: "2026-02-20",
    endTime: "17:00"
  }
}
```

## Future Enhancements

With the time columns now available, you can implement:

1. **Time-based form availability**: Check if current time is within the deployment time range
2. **Scheduled deployments**: Automatically activate/deactivate forms based on time
3. **Time-based analytics**: Track submission patterns by time of day
4. **Time zone support**: Store times in UTC and convert to user's local time

## Example Query for Active Forms

```sql
SELECT * FROM form_deployments
WHERE deployment_status = 'active'
  AND (
    (start_date < CURDATE() OR (start_date = CURDATE() AND start_time <= CURTIME()))
    AND
    (end_date > CURDATE() OR (end_date = CURDATE() AND end_time >= CURTIME()))
  )
```

## Rollback

If needed, you can remove the columns with:

```sql
ALTER TABLE form_deployments DROP INDEX idx_time_range;
ALTER TABLE form_deployments DROP COLUMN start_time;
ALTER TABLE form_deployments DROP COLUMN end_time;
```
