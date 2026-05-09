# FeedbACTS System v3

## Overview
FeedbACTS (Feedback ACTS) is a web-based platform designed for educational institutions to manage feedback, alumni tracking, employer linkages, and administrative forms. It facilitates data collection, user management, and reporting for alumni, employers, and administrators. The system supports dynamic form building, image processing (e.g., cropping), secure data handling, and real-time interactions.

Key features:
- **Employer Linking**: Connect alumni with potential employers via integrated job postings and profiles.
- **Form Builder**: Allows admins to create custom surveys and feedback forms with drag-and-drop elements.
- **Image Cropper**: Provides tools for uploading and cropping profile images or attachments.
- **Alumni Tracer**: Tracks alumni data, including employment status, contact info, and feedback submissions.

The application is built with a full-stack architecture:
- **Frontend**: React-based (based on CLIENT/ structure and dependencies like react-router, axios).
- **Backend**: Node.js with Express.js for API handling, using libraries like bcrypt for hashing, multer for uploads, and JWT for auth.
- **Database**: MySQL (inferred from SQL syntax in server/models/ and queries).
- **Authentication**: JWT-based with role-based access control (RBAC) using passport.js.
- **Deployment**: Containerized with Docker; deployed via Railway (based on .git branches like "railway/code-change-*").

## System Flow
The following Mermaid diagram illustrates the high-level user and data flow:

```mermaid
graph TD
    A[User Logs In] --> B{User Role?}
    B -->|Admin| C[Access Admin Dashboard]
    B -->|Alumni| D[Access Alumni Portal]
    B -->|Employer| E[Access Employer Portal]
    C --> F[Manage Forms via Form Builder]
    F --> G[Create/Customize Surveys]
    G --> H[Deploy Forms to Users]
    D --> I[Submit Feedback/Tracer Data]
    I --> J[Upload Images (with Cropper)]
    J --> K[Data Stored in DB]
    E --> L[Link to Alumni/Job Postings]
    L --> M[View Reports]
    K --> N[Generate Analytics]
    H --> N
    M --> N
    N --> O[Export Data/Reports]
```

**Notes**:
- Authentication is required for all interactions; unauthenticated users are redirected to login.
- Data flows through API endpoints, with validation and sanitization at each step.
- Real-time updates (e.g., via Socket.io, if implemented) allow for live form submissions.
- Error handling redirects to custom error pages or logs issues for admins.

## API Endpoints
The backend exposes RESTful APIs via Express.js. Key endpoints are defined in `server/routes/` (e.g., auth.js, forms.js). Below is a summary with notes, based on grepped routes and controller logic.

| Endpoint | Method | Description | Notes |
|----------|--------|-------------|-------|
| `/api/auth/login` | POST | Authenticate user and return JWT token. | Requires email/password. Includes rate limiting (100 req/min) to prevent brute-force. Validates against `users` table using bcrypt. |
| `/api/auth/register` | POST | Register new user (admin-only or self for alumni/employers). | Role-based: Alumni self-register; admins approve via email. Hashes passwords; sends verification. |
| `/api/forms` | GET | Retrieve list of active forms. | Filters by user role (alumni see assigned forms). Supports pagination (limit/offset). |
| `/api/forms/:id` | GET | Get specific form details. | Includes dynamic fields from `form_fields` table. |
| `/api/forms` | POST | Create new form (admin-only). | Uses form builder logic; validates schema against allowed field types (text, select, image). |
| `/api/forms/:id/submit` | POST | Submit form responses. | Validates responses with Joi; uploads images via multer. Stores in `form_responses` table. |
| `/api/employers/link` | POST | Link employer to alumni. | Requires admin approval; updates `employer_alumni_links` table. Sends email notifications. |
| `/api/alumni/trace` | GET | Retrieve alumni data for tracing. | Aggregates from `alumni` and `feedback` tables; respects privacy settings. |
| `/api/images/crop` | POST | Upload and crop image. | Uses Sharp for processing; stores in `/uploads/`. Validates file types (JPEG/PNG). |
| `/api/reports` | GET | Generate reports on feedback/usage. | Queries aggregated data; supports CSV export via json2csv. Admin-only. |

**General API Notes**:
- All endpoints require JWT in Authorization header except login/register.
- CORS enabled for frontend origin (configured in server/app.js).
- Input validation using Joi; sanitizes against XSS/SQL injection via express-validator.
- Rate limiting: 100 requests/min per IP using express-rate-limit.
- Error responses: 400 for bad requests, 401 for unauthorized, 500 for server errors, with descriptive JSON messages.
- No public APIs; all require authentication. HTTPS enforced in production.

## Database Schema
The system uses MySQL. Schema is defined in `server/models/` (e.g., User.js, Form.js). Key tables and relationships:

| Table | Columns | Purpose | Notes |
|-------|---------|---------|-------|
| `users` | id (PK, AUTO_INCREMENT), email (UNIQUE), password_hash, role (ENUM: 'admin', 'alumni', 'employer'), created_at (TIMESTAMP) | User accounts | Passwords hashed with bcrypt (salt rounds: 12); roles enforce RBAC. Indexes on email. |
| `alumni` | id (PK), user_id (FK to users), name, contact_info (ENCRYPTED), employment_status, graduation_year | Alumni profiles | Linked to users; stores tracer data. Contact info encrypted with AES-256. |
| `employers` | id (PK), user_id (FK), company_name, industry, contact_details (ENCRYPTED) | Employer profiles | Used for linkages; has job postings in related table (not shown). |
| `employer_alumni_links` | id (PK), employer_id (FK), alumni_id (FK), status (ENUM: 'pending', 'approved'), created_at | Linking table | Junction for employer-alumni relationships; admin approval required. |
| `forms` | id (PK), title, description, created_by (FK to users), is_active (BOOLEAN) | Form definitions | Stores metadata; fields defined separately. |
| `form_fields` | id (PK), form_id (FK), field_type (ENUM: 'text', 'select', 'image'), label, options (JSON) | Dynamic form fields | Supports customizable inputs; options for selects. |
| `form_responses` | id (PK), form_id (FK), user_id (FK), responses (JSON), submitted_at | Submitted data | Stores user responses; JSON for flexibility. |
| `feedback` | id (PK), alumni_id (FK), content (TEXT), rating (INT 1-5), submitted_at | Feedback entries | Aggregated for reports; linked to alumni tracer. |
| `images` | id (PK), user_id (FK), filename, path, cropped_data (JSON) | Image storage | Tracks uploads; cropped_data stores crop coordinates (x, y, width, height). |

**Database Notes**:
- Foreign key constraints ensure data integrity (e.g., ON DELETE CASCADE for responses).
- Indexes on frequently queried columns (e.g., user_id, form_id) for performance.
- No direct sensitive data storage; contact info in `alumni`/`employers` is encrypted using crypto module.
- Backup strategy: Daily automated dumps via mysqldump (assumed in deployment scripts).
- ORM: Sequelize (based on model files with associations like belongsTo/hasMany).

## Queries and Data Retrieval
Key database queries are in `server/controllers/` and models (e.g., using Sequelize methods). Examples with notes:

- **User Authentication Query**:
  ```sql
  SELECT id, password_hash, role FROM users WHERE email = ?;
  ```
  **Notes**: Executed via Sequelize findOne. Compares hashed password. Logs failed attempts for security monitoring.

- **Form Retrieval Query**:
  ```sql
  SELECT f.id, f.title, ff.field_type, ff.label FROM forms f JOIN form_fields ff ON f.id = ff.form_id WHERE f.is_active = 1 AND f.id = ?;
  ```
  **Notes**: Uses JOIN for efficiency. Filters active forms; returns JSON for frontend rendering.

- **Alumni Tracer Query**:
  ```sql
  SELECT a.name, a.employment_status, f.content FROM alumni a LEFT JOIN feedback f ON a.id = f.alumni_id WHERE a.user_id = ?;
  ```
  **Notes**: Aggregates tracer data; decrypts contact_info on-the-fly if authorized. Respects user privacy (e.g., hides data if alumni opts out).

- **Employer Linking Query**:
  ```sql
  INSERT INTO employer_alumni_links (employer_id, alumni_id, status) VALUES (?, ?, 'pending');
  ```
  **Notes**: Transactional to ensure atomicity. Triggers email notification via nodemailer.

- **Report Generation Query**:
  ```sql
  SELECT COUNT(*) as submissions, AVG(rating) as avg_rating FROM feedback GROUP BY alumni_id;
  ```
  **Notes**: Aggregates for analytics; exports to CSV. Cached for performance if data is large.

**General Query Notes**:
- All queries use parameterized statements to prevent SQL injection.
- Transactions used for multi-table operations (e.g., form submission).
- Performance: Queries optimized with EXPLAIN; pagination for large result sets.
- Data export: Uses json2csv for reports; respects GDPR by anonymizing where possible.

## Security and Data Privacy
- **Authentication & Authorization**: JWT tokens expire in 1 hour; refresh tokens for sessions. RBAC restricts endpoints (e.g., admins only for form creation). Passwords require 8+ chars, special symbols.
- **Data Encryption**: Sensitive fields (e.g., contact_info) encrypted at rest using AES-256-GCM. Keys managed via environment variables (not hardcoded).
- **Input Sanitization**: All inputs validated and escaped (e.g., via helmet for headers, express-validator for bodies). Prevents XSS via Content Security Policy (CSP).
- **Rate Limiting & DDoS Protection**: express-rate-limit blocks excessive requests. Logs suspicious activity.
- **HTTPS & SSL**: Enforced in production; certificates via Let's Encrypt.
- **Data Privacy Handling**: Complies with GDPR/CCPA. Users can request data deletion (soft delete via is_deleted flag). Data retention: 7 years for alumni records, 1 year for logs. Privacy settings allow alumni to opt-out of sharing (enforced in queries). Audit logs track access to personal data. No third-party data sharing without consent. Anonymization for reports (e.g., hashes IDs).

## Installation & Setup
1. Clone the repo: `git clone <repo-url>`.
2. Install dependencies: `npm install` (root and CLIENT/).
3. Set up DB: Run migrations in `server/migrations/`.
4. Configure env vars (e.g., DB_URL, JWT_SECRET, ENCRYPTION_KEY).
5. Start server: `npm start` (backend on port 5000, frontend on 3000).

For deployment, use Docker: `docker-compose up`.

## Contributing
Follow standard Git workflow. Run tests: `npm test`. Lint code with ESLint.