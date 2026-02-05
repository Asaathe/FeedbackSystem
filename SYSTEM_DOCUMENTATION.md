# FeedbACTS System Documentation

## Overview

FeedbACTS is a feedback collection and management system designed for educational institutions. It allows administrators to create feedback forms, instructors to view shared responses, and students/alumni/employers to submit feedback.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [User Roles](#user-roles)
3. [API Endpoints](#api-endpoints)
4. [System Flow](#system-flow)
5. [Client-Server Interaction](#client-server-interaction)
6. [Database Schema Overview](#database-schema-overview)

---

## System Architecture

The system follows a client-server architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (React + TypeScript)              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  App.tsx (Main Router)                                     │  │
│  │  ├── LoginPage / SignupPage                               │  │
│  │  ├── DashboardLayout                                      │  │
│  │  └── Role-Based Pages:                                    │  │
│  │      ├── Admin Dashboard                                  │  │
│  │      ├── Student Dashboard                                │  │
│  │      ├── Instructor Dashboard                             │  │
│  │      ├── Alumni Dashboard                                 │  │
│  │      └── Employer Dashboard                               │  │
│  └───────────────────────────────────────────────────────────┘  │
│                        │                                         │
│                        │ HTTP Requests (JSON)                     │
│                        ▼                                         │
┌─────────────────────────────────────────────────────────────────┐
│                       SERVER (Express.js)                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  server.js (Entry Point)                                  │  │
│  │  ├── Middleware: CORS, Helmet, Rate Limiting             │  │
│  │  └── Routes:                                              │  │
│  │      ├── /api/auth                                        │  │
│  │      ├── /api/forms                                       │  │
│  │      ├── /api/users                                       │  │
│  │      ├── /api/form-categories                              │  │
│  │      ├── /api/courses                                     │  │
│  │      ├── /api/recipients                                  │  │
│  │      └── /api/instructor                                  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                        │                                         │
│                        │ MySQL Database                          │
│                        ▼                                         │
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE (MySQL)                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Tables: Users, Forms, Questions, Responses, etc.          │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## User Roles

| Role | Description | Key Features |
|------|-------------|--------------|
| **admin** | System Administrator | Create forms, manage users, manage courses, view all responses |
| **instructor** | Teaching Staff | View shared responses, submit feedback |
| **student** | Current Students | Submit assigned feedback forms |
| **alumni** | Graduates | Submit assigned feedback forms, filtered by company |
| **employer** | HR/Company Representatives | Submit employee feedback forms |

---

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| POST | `/api/auth/signup` | Register new user | No |
| POST | `/api/auth/login` | User login | No |
| GET | `/api/auth/verify` | Verify JWT token | Yes |
| GET | `/api/auth/profile` | Get user profile | Yes |
| PUT | `/api/auth/profile` | Update user profile | Yes |

### Forms (`/api/forms`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | `/api/forms` | Get all forms (with filters) | Yes |
| GET | `/api/forms/:id` | Get form by ID | Yes |
| POST | `/api/forms` | Create new form | Yes |
| PATCH | `/api/forms/:id` | Update form | Yes |
| DELETE | `/api/forms/:id` | Delete form | Yes |
| POST | `/api/forms/:id/deploy` | Deploy/activate form | Yes |
| POST | `/api/forms/:id/duplicate` | Duplicate form | Yes |
| POST | `/api/forms/:id/save-as-template` | Save as template | Yes |

### Form Responses (`/api/forms/:id/responses`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | `/api/forms/:id/responses` | Get form responses (owner only) | Yes |
| GET | `/api/forms/:id/submission-status` | Check if user submitted | Yes |
| POST | `/api/forms/:id/submit` | Submit form response | Yes |
| GET | `/api/forms/my-responses` | Get current user's responses | Yes |

### Users (`/api/users`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | `/api/users` | Get all users | Yes |
| GET | `/api/users/filter` | Get filtered users | Yes |
| GET | `/api/users/assigned-forms` | Get forms assigned to user | Yes |
| GET | `/api/users/responses` | Get user's form responses | Yes |
| POST | `/api/users/create` | Create new user | Yes |
| PATCH | `/api/users/:id` | Update user | Yes |
| PATCH | `/api/users/:id/approve` | Approve user | Yes |
| PATCH | `/api/users/:id/reject` | Reject user | Yes |
| PUT | `/api/users/:id/status` | Update user status | Yes |
| DELETE | `/api/users/:id` | Delete user | Yes |

### Form Categories (`/api/form-categories`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | `/api/form-categories` | Get all categories | Yes |

### Courses (`/api/courses`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | `/api/courses` | Get all courses | Yes |

### Recipients (`/api/recipients`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | `/api/recipients/alumni/companies` | Get alumni companies | Yes |
| GET | `/api/recipients/employers/companies` | Get employer companies | Yes |
| GET | `/api/recipients/instructors/departments` | Get instructor departments | Yes |
| GET | `/api/recipients/students/sections` | Get student sections | Yes |

### Instructor (`/api/instructor`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | `/api/instructor/shared-responses` | Get shared responses | Yes |
| GET | `/api/instructor/shared-responses/:sharedId/responses` | Get response details | Yes |

---

## System Flow

### 1. Authentication Flow

```
┌──────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌──────────────┐
│   User       │     │   Login Page   │     │    Server       │     │   Database  │
└──────┬───────┘     └────────┬────────┘     └────────┬────────┘     └──────┬───────┘
       │                     │                        │                       │
       │  Enter email/password                     │                       │
       │────────────────────>│                        │                       │
       │                     │  POST /api/auth/login │                       │
       │                     │───────────────────────>│                       │
       │                     │                        │  Query user table     │
       │                     │                        │──────────────────────>│
       │                     │                        │                       │
       │                     │  { token, user, role }│                       │
       │                     │<───────────────────────│                       │
       │                     │                        │                       │
       │  Redirect to        │                        │                       │
       │  role-based page   │                        │                       │
       │<────────────────────│                        │                       │
```

### 2. Form Creation Flow (Admin)

```
┌──────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌──────────────┐
│   Admin       │     │   Form Builder  │     │    Server       │     │   Database  │
└──────┬───────┘     └────────┬────────┘     └────────┬────────┘     └──────┬───────┘
       │                     │                        │                       │
       │  Create form        │                        │                       │
       │  (title, questions) │                        │                       │
       │────────────────────>│                        │                       │
       │                     │  POST /api/forms       │                       │
       │                     │───────────────────────>│                       │
       │                     │                        │  Insert into         │
       │                     │                        │  Forms table         │
       │                     │                        │──────────────────────>│
       │                     │                        │  Insert questions    │
       │                     │                        │  into Questions table│
       │                     │                        │──────────────────────>│
       │                     │  { formId, success }  │                       │
       │                     │<───────────────────────│                       │
       │  Form created       │                        │                       │
       │<────────────────────│                        │                       │
```

### 3. Form Submission Flow

```
┌──────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌──────────────┐
│   Student    │     │  Feedback Form  │     │    Server       │     │   Database  │
└──────┬───────┘     └────────┬────────┘     └────────┬────────┘     └──────┬───────┘
       │                     │                        │                       │
       │  View assigned      │                        │                       │
       │  forms              │                        │                       │
       │────────────────────>│                        │                       │
       │                     │  GET /api/users/       │                       │
       │                     │  assigned-forms        │                       │
       │                     │───────────────────────>│                       │
       │                     │                        │  Get user's assigned │
       │                     │                        │  forms               │
       │                     │                        │──────────────────────>│
       │                     │  [list of forms]      │                       │
       │                     │<───────────────────────│                       │
       │  Select form        │                        │                       │
       │<────────────────────│                        │                       │
       │                     │                        │                       │
       │  Submit answers     │                        │                       │
       │────────────────────>│                        │                       │
       │                     │  POST /api/forms/     │                       │
       │                     │  :id/submit            │                       │
       │                     │───────────────────────>│                       │
       │                     │                        │  Insert into         │
       │                     │                        │  Responses table     │
       │                     │                        │──────────────────────>│
       │                     │  { success, message }  │                       │
       │                     │<───────────────────────│                       │
       │  Success message    │                        │                       │
       │<────────────────────│                        │                       │
```

### 4. Response Viewing Flow (Instructor)

```
┌──────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌──────────────┐
│ Instructor   │     │ Instructor      │     │    Server       │     │   Database  │
│               │     │ Dashboard       │     │                 │     │             │
└──────┬───────┘     └────────┬────────┘     └────────┬────────┘     └──────┬───────┘
       │                     │                        │                       │
       │  View responses     │                        │                       │
       │────────────────────>│                        │                       │
       │                     │  GET /api/instructor/ │                       │
       │                     │  shared-responses      │                       │
       │                     │───────────────────────>│                       │
       │                     │                        │  Get shared responses │
       │                     │                        │  for instructor       │
       │                     │                        │──────────────────────>│
       │                     │  [response list]       │                       │
       │                     │<───────────────────────│                       │
       │  Select response   │                        │                       │
       │<────────────────────│                        │                       │
       │                     │  GET /api/instructor/  │                       │
       │                     │  shared-responses/     │                       │
       │                     │  :id/responses         │                       │
       │                     │───────────────────────>│                       │
       │                     │                        │  Get response details│
       │                     │                        │──────────────────────>│
       │                     │  [response details]    │                       │
       │                     │<───────────────────────│                       │
       │  Display answers    │                        │                       │
       │<────────────────────│                        │                       │
```

---

## Client-Server Interaction

### Token-Based Authentication

1. **Login**: User credentials sent to `/api/auth/login`
2. **Token Storage**: JWT token stored in `sessionStorage` (key: `authToken`)
3. **Token Verification**: On app load, token verified via `/api/auth/verify`
4. **Protected Requests**: All API requests include `Authorization: Bearer <token>` header
5. **Token Refresh**: Automatic refresh when token expires (checked every 60 seconds)

### API Service Files

| File | Purpose |
|------|---------|
| [`CLIENT/src/services/formManagementService.ts`](CLIENT/src/services/formManagementService.ts) | CRUD operations for forms |
| [`CLIENT/src/services/publishedFormsService.ts`](CLIENT/src/services/publishedFormsService.ts) | Fetch published/assigned forms |
| [`CLIENT/src/utils/auth.ts`](CLIENT/src/utils/auth.ts) | Token management & auth utilities |

### Client Components Structure

```
CLIENT/src/
├── App.tsx                    # Main application & routing
├── components/
│   ├── auth/
│   │   ├── login-page.tsx     # Login form
│   │   └── signup-page.tsx    # Registration form
│   ├── Admin/
│   │   ├── admin-dashboard.tsx
│   │   ├── user-management.tsx
│   │   └── course-management.tsx
│   ├── Dashboards/
│   │   ├── student-dashboard.tsx
│   │   ├── instructor-dashboard.tsx
│   │   ├── alumni-dashboard.tsx
│   │   └── employer-dashboard.tsx
│   ├── Forms/
│   │   ├── form-builder.tsx       # Create/edit forms
│   │   ├── feedback-forms-management.tsx
│   │   ├── form-responses-viewer.tsx
│   │   └── form-container.tsx
│   ├── feedback/
│   │   ├── feedback-submission.tsx
│   │   ├── alumni-feedback.tsx
│   │   └── instructor-feedback.tsx
│   └── layout/
│       └── dashboard-layout.tsx    # Main layout wrapper
```

### Server Architecture

```
server/
├── server.js                    # Express app entry point
├── config/
│   ├── database.js             # MySQL connection pool
│   ├── jwt.js                  # JWT configuration
│   └── rateLimit.js            # Rate limiting config
├── routes/
│   ├── auth.js                 # Authentication routes
│   ├── forms.js                # Form CRUD routes
│   ├── users.js                # User management routes
│   ├── formCategories.js       # Category routes
│   ├── courses.js              # Course routes
│   ├── recipients.js           # Recipient filtering routes
│   └── instructor.js           # Instructor-specific routes
├── controllers/
│   ├── authController.js       # Auth business logic
│   ├── formController.js        # Form business logic
│   ├── userController.js       # User business logic
│   └── responseController.js   # Response business logic
├── services/
│   ├── authService.js          # Auth service layer
│   ├── formService.js          # Form service layer
│   ├── userService.js          # User service layer
│   └── responseService.js      # Response service layer
└── schema/
    └── feedback_system.sql     # Database schema
```

---

## Database Schema Overview

### Main Tables

| Table | Description |
|-------|-------------|
| **Users** | All user accounts (students, alumni, instructors, employers, admins) |
| **Forms** | Feedback form definitions |
| **Questions** | Questions within each form |
| **Responses** | User submissions for forms |
| **ResponseAnswers** | Individual answers within a response |
| **FormRecipients** | Users assigned to receive specific forms |
| **Courses** | Course information |
| **Students** | Student-specific data |
| **Alumni** | Alumni-specific data |
| **Instructors** | Instructor-specific data |
| **Employers** | Employer-specific data |

### User Roles in Database

| Role | Description |
|------|-------------|
| `student` | Currently enrolled students |
| `alumni` | Graduated students |
| `instructor` | Teaching faculty |
| `employer` | HR/company representatives |
| `admin` | System administrators |

---

## Common API Flows

### Getting Forms for a Specific User Role

```javascript
// Client-side code from publishedFormsService.ts
const getFormsForUserRole = async (userRole: string) => {
  const response = await fetch('/api/users/assigned-forms', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  // Filter by target_audience matching the user's role
};
```

### Form Question Types

| Type | Description |
|------|-------------|
| `multiple-choice` | Single selection radio buttons |
| `checkbox` | Multiple selection checkboxes |
| `dropdown` | Select dropdown |
| `rating` | Star/number rating scale |
| `text` | Short text input |
| `textarea` | Long text input |
| `linear-scale` | Linear scale (e.g., 1-5) |

---

## Security Features

1. **JWT Authentication**: All protected routes require valid token
2. **Rate Limiting**: 
   - Auth endpoints: 10 requests per 15 minutes
   - Form endpoints: 100 requests per hour
   - General: 100 requests per 15 minutes
3. **CORS**: Configured to allow specified origins
4. **Helmet**: Security headers (HSTS, XSS protection, etc.)
5. **Input Validation**: Express-validator on auth endpoints

---

## Environment Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment (production/development) | development |
| `DB_HOST` | MySQL host | localhost |
| `DB_USER` | MySQL username | root |
| `DB_PASSWORD` | MySQL password | (empty) |
| `DB_NAME` | MySQL database name | feedback_system |
| `JWT_SECRET` | JWT signing secret | your-secret-key |

---

## Development Notes

1. **Server runs on**: `http://localhost:5000`
2. **Client runs on**: `http://localhost:5173` (Vite dev server)
3. **Database**: MySQL (configure in `server/config/database.js`)
4. **Token expiration**: 24 hours (configurable in `auth.ts`)

---

## File References

Key files to understand the system:

| File | Purpose |
|------|---------|
| [`server/server.js`](server/server.js) | Main server entry point |
| [`CLIENT/src/App.tsx`](CLIENT/src/App.tsx) | Main React application |
| [`CLIENT/src/services/formManagementService.ts`](CLIENT/src/services/formManagementService.ts) | Form API client |
| [`CLIENT/src/services/publishedFormsService.ts`](CLIENT/src/services/publishedFormsService.ts) | Published forms API client |
| [`CLIENT/src/utils/auth.ts`](CLIENT/src/utils/auth.ts) | Auth utilities |
| [`server/routes/forms.js`](server/routes/forms.js) | Form API routes |
| [`server/routes/auth.js`](server/routes/auth.js) | Auth API routes |
| [`server/controllers/formController.js`](server/controllers/formController.js) | Form business logic |
| [`server/services/formService.js`](server/services/formService.js) | Form service layer |
