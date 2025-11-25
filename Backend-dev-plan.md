# 1️⃣ Executive Summary

This document outlines the backend development plan for the Anesthesia Risk Score 2.0 dashboard. The backend will be a FastAPI (Python 3.13) application with a MongoDB Atlas database, designed to support the frontend's features for patient risk assessment.

Key constraints include:
- Authentication will be handled via **Google Login**.
- No Docker for deployment.
- Manual testing via the frontend after every task.
- A single `main` branch for Git workflow.
- Adherence to a dynamic sprint plan (S0...Sn) to cover all frontend-visible features.

# 2️⃣ In-Scope & Success Criteria

- **In-Scope Features:**
  - Secure user authentication via **Google Login**.
  - Ingestion of patient intake data (simulated Truform API).
  - CRUD operations for patient records.
  - Automated calculation of risk scores (ASA, STOP-Bang, RCRI, METs).
  - Generation of critical alerts and pre-operative recommendations.
  - Storage and retrieval of clinician notes and manual exam findings.
  - Audit trail for patient data modifications.
  - PDF report generation of patient risk profiles.

- **Success Criteria:**
  - All frontend features are fully functional and connected to the live backend.
  - All task-level manual tests pass successfully through UI interactions.
  - Each sprint's code is committed and pushed to the `main` branch after verification.

# 3️⃣ API Design

- **Base Path:** `/api/v1`
- **Error Envelope:** `{ "error": "message" }`

---

### Authentication

- **POST /api/v1/auth/google**
  - **Purpose:** Handles the Google OAuth callback. Receives an authorization code from the frontend, exchanges it for a Google access token, fetches the user's profile, creates a user in the DB if they don't exist, and returns a session JWT.
  - **Request:** `{ "code": "google_authorization_code" }`
  - **Response:** `{ "access_token": "jwt_token", "token_type": "bearer" }`
  - **Validation:** Verifies the authorization code with Google.

- **GET /api/v1/auth/me**
  - **Purpose:** Get the current authenticated user's details.
  - **Request:** (Requires Authorization header with JWT)
  - **Response:** `{ "id": "user_id", "email": "user@gmail.com", "name": "Dr. Smith", "google_id": "google_user_id" }`

- **POST /api/v1/auth/logout**
  - **Purpose:** Logs the user out. (Note: This will be a client-side token clearing, but an endpoint can be provided for future server-side session management if needed).
  - **Request:** (Requires Authorization header with JWT)
  - **Response:** `{ "message": "Successfully logged out" }`

---

### Patients

- **GET /api/v1/patients**
  - **Purpose:** Retrieve a list of all patients. Supports searching and sorting.
  - **Query Params:** `search` (string), `sortBy` (string, e.g., 'name'), `sortDir` ('asc' or 'desc').
  - **Response:** `[ { patient_object_1 }, { patient_object_2 } ]`

- **GET /api/v1/patients/{patient_id}**
  - **Purpose:** Retrieve a single patient's details.
  - **Response:** `{ patient_object }`

- **POST /api/v1/patients**
  - **Purpose:** Create a new patient record. This endpoint will also handle the "Truform ingestion".
  - **Request:** `{ patient_creation_object }` (without calculated fields).
  - **Response:** `{ created_patient_object }` (with calculated fields).
  - **Validation:** Required fields like `name` and `dateOfBirth`.

- **PUT /api/v1/patients/{patient_id}**
  - **Purpose:** Update an existing patient's record.
  - **Request:** `{ fields_to_update }`
  - **Response:** `{ updated_patient_object }`
  - **Validation:** Ensure patient exists.

- **DELETE /api/v1/patients/{patient_id}**
  - **Purpose:** Delete a patient record.
  - **Response:** `204 No Content`

- **POST /api/v1/patients/{patient_id}/generate-report**
  - **Purpose:** Generate a PDF report for a patient.
  - **Response:** A PDF file stream.

# 4️⃣ Data Model (MongoDB Atlas)

### `users` collection
- `_id`: ObjectId (auto-generated)
- `name`: String, required
- `email`: String, required, unique
- `google_id`: String, required, unique
- **Example Document:**
  ```json
  {
    "_id": "60c72b2f9b1d8e001f8e4c5e",
    "name": "Dr. Jane Doe",
    "email": "jane.doe@gmail.com",
    "google_id": "10987654321"
  }
  ```

### `patients` collection
- `_id`: ObjectId (auto-generated)
- `name`: String, required
- `dateOfBirth`: String, required
- `medicalHistory`: Array of Strings
- `medications`: Array of Strings
- `allergies`: Array of Strings
- `surgicalHistory`: Array of Strings
- `mallampatiScore`: Number
- `airwayExamFindings`: String
- `clinicianNotes`: String
- `asaScore`: Number
- `stopBangScore`: Number
- `rcriScore`: Number
- `metsScore`: Number
- `riskCategory`: String ('Low', 'Moderate', 'High')
- `criticalAlerts`: Array of Strings
- `preOpRecommendations`: Array of Strings
- `completedRecommendations`: Array of Strings
- `lastModified`: ISODate
- `modifiedBy`: ObjectId (references `users` collection)
- **Example Document:**
  ```json
  {
    "_id": "60c72b2f9b1d8e001f8e4c5f",
    "name": "John Smith",
    "dateOfBirth": "1975-05-10",
    "medicalHistory": ["Hypertension"],
    "medications": ["Lisinopril"],
    "allergies": [],
    "surgicalHistory": [],
    "mallampatiScore": 2,
    "riskCategory": "Moderate",
    "lastModified": "2023-10-27T10:00:00Z",
    "modifiedBy": "60c72b2f9b1d8e001f8e4c5e"
  }
  ```

# 5️⃣ Frontend Audit & Feature Map

- **`Login.tsx`**
  - **Purpose:** User authentication via Google Login.
  - **Endpoint:** `POST /api/v1/auth/google`
  - **Models:** `users`

- **`Dashboard.tsx` / `PatientList.tsx`**
  - **Purpose:** Display, search, and sort a list of patients. Select a patient for viewing/editing.
  - **Endpoints:** `GET /api/v1/patients`
  - **Models:** `patients`

- **`PatientForm.tsx`**
  - **Purpose:** Create and update patient data. Handles simulated Truform ingestion.
  - **Endpoints:** `POST /api/v1/patients`, `PUT /api/v1/patients/{patient_id}`
  - **Models:** `patients`

- **`Dashboard.tsx` (Patient Details view)**
  - **Purpose:** Display full patient details, including calculated scores, alerts, and recommendations.
  - **Endpoints:** `GET /api/v1/patients/{patient_id}`
  - **Models:** `patients`

- **`Dashboard.tsx` (Reporting section)**
  - **Purpose:** Generate and download a PDF report.
  - **Endpoint:** `POST /api/v1/patients/{patient_id}/generate-report`
  - **Models:** `patients`

# 6️⃣ Configuration & ENV Vars

- `APP_ENV`: `development` or `production`
- `PORT`: `8000`
- `MONGODB_URI`: MongoDB Atlas connection string.
- `JWT_SECRET`: A long, random string for signing JWTs.
- `JWT_EXPIRES_IN`: `3600` (1 hour)
- `CORS_ORIGINS`: The frontend URL (e.g., `http://localhost:5173`).
- `GOOGLE_CLIENT_ID`: Your Google OAuth Client ID.
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth Client Secret.

# 7️⃣ Background Work

- None identified for the MVP. All risk calculations can be done synchronously upon patient creation/update.

# 8️⃣ Integrations

- **Truform API (Simulated):** The `POST /api/v1/patients` endpoint will accept a JSON payload that mimics the data structure from Truform. No actual API integration is needed for the MVP.
- **Google OAuth:** For user authentication.

# 9️⃣ Testing Strategy (Manual via Frontend)

- Validation will be performed exclusively through the frontend UI.
- Every task will include a **Manual Test Step** and a **User Test Prompt**.
- After all tasks in a sprint pass, the code will be committed and pushed to the `main` branch.

# 🔟 Dynamic Sprint Plan & Backlog

---

## S0 – Environment Setup & Frontend Connection

- **Objectives:**
  - Create a FastAPI skeleton with `/api/v1` base path and a `/healthz` endpoint.
  - Connect to MongoDB Atlas using `MONGODB_URI`.
  - `/healthz` should perform a database ping and return a JSON status.
  - Enable CORS for the frontend application.
  - Replace dummy API URLs in the frontend with real backend URLs.
  - Initialize a Git repository at the project root, set the default branch to `main`, and create a `.gitignore` file.
- **Definition of Done:**
  - The backend runs locally and successfully connects to MongoDB Atlas.
  - The `/healthz` endpoint returns a success status.
  - The frontend can make requests to the backend.
  - The repository is live on GitHub on the `main` branch.
- **Manual Test Step:**
  - Run the backend server, open the frontend application, and check the browser's developer tools. The Network tab should show a successful request to `/healthz` with a 200 OK status and a JSON response indicating a successful DB connection.
- **User Test Prompt:**
  > "Start the backend and refresh the app. Confirm that the status shows a successful DB connection."

---

## S1 – Google Login & User Model

- **Objectives:**
  - Implement the `users` data model in Pydantic.
  - Implement the Google Login flow, creating a user on first login.
  - Issue a JWT to the user upon successful authentication.
  - Protect the patient-related endpoints, requiring a valid JWT.
  - Connect the frontend `Login.tsx` page to the Google Login flow.
- **User Stories:**
  - As a clinician, I can log in with my Google account to securely access the dashboard.
- **Tasks:**
  - **Task 1: Create User Model and Google Auth Endpoint**
    - **Manual Test Step:** Configure Google OAuth credentials. Update the frontend to redirect to the Google consent screen. After approving, Google should redirect back to the app, and the frontend should send the authorization code to the `POST /api/v1/auth/google` endpoint. Verify the user is created in the MongoDB `users` collection.
    - **User Test Prompt:** "Click the 'Login with Google' button. You should be taken to the Google login page, and after logging in, a new user should be created in the database."
  - **Task 2: Issue JWT and Protect Routes**
    - **Manual Test Step:** After a successful Google login, the backend should return a JWT. The frontend should store it. Attempt to access `GET /api/v1/patients` using an API client (like Postman) without the JWT in the `Authorization` header; it should fail with a 401/403 error. Then, add the JWT and verify it succeeds.
    - **User Test Prompt:** "Log in via the UI. Then, try to access the patients API endpoint directly without an authorization token; it should be blocked. Try again with the token; it should work."
- **Definition of Done:**
  - Users can log in using their Google account.
  - Patient endpoints are protected and require authentication.
  - Auth flow works end-to-end in the frontend.
- **Post-sprint:**
  - Commit and push to `main`.

---

## S2 – Patient CRUD Operations

- **Objectives:**
  - Implement the `patients` data model in Pydantic.
  - Create all CRUD endpoints for patients (`GET`, `POST`, `PUT`, `DELETE`).
  - Connect the frontend `PatientList.tsx` and `PatientForm.tsx` to these endpoints.
- **User Stories:**
  - As a nurse, I can add a new patient to the system.
  - As a surgeon, I can view and edit a patient's details.
  - As an admin, I can delete a patient record.
- **Tasks:**
  - **Task 1: Implement `GET /patients` and `POST /patients`**
    - **Manual Test Step:** Add a new patient using the 'Add New Patient' button in the UI. Fill out the form and submit. The new patient should appear in the patient list.
    - **User Test Prompt:** "Create a new patient using the form. Verify the patient appears in the list on the left."
  - **Task 2: Implement `GET /patients/{id}` and `PUT /patients/{id}`**
    - **Manual Test Step:** Click the edit icon for a patient. Change a value in the form (e.g., Clinician Notes) and save. The updated information should be visible in the patient details view.
    - **User Test Prompt:** "Edit an existing patient's notes and save. Confirm the change is displayed correctly."
  - **Task 3: Implement `DELETE /patients/{id}`**
    - **Manual Test Step:** Click the trash icon for a patient. Confirm the deletion in the prompt. The patient should be removed from the list.
    - **User Test Prompt:** "Delete a patient from the list. Verify they are removed."
- **Definition of Done:**
  - Full CRUD functionality for patients is working from the frontend.
- **Post-sprint:**
  - Commit and push to `main`.

---

## S3 – Risk Scoring and PDF Generation

- **Objectives:**
  - Implement the business logic for calculating risk scores (ASA, STOP-Bang, RCRI, METs).
  - Automatically calculate and save scores when a patient is created or updated.
  - Implement the PDF generation endpoint.
- **User Stories:**
  - As a surgeon, I can see a summarized risk profile for my patient to quickly assess their status.
  - As an office staff member, I can export the PDF report for our records.
- **Tasks:**
  - **Task 1: Implement Risk Score Calculation Logic**
    - **Manual Test Step:** Create a new patient with data known to trigger a 'High' risk category (e.g., history of heart disease, high Mallampati score). Verify that the correct scores and 'High' risk badge are displayed in the UI.
    - **User Test Prompt:** "Create a high-risk patient and verify the risk score and category are calculated and displayed correctly on the dashboard."
  - **Task 2: Implement PDF Report Generation**
    - **Manual Test Step:** Select a patient and click the 'Generate PDF Report' button. A PDF file should be downloaded, containing the patient's risk assessment details.
    - **User Test Prompt:** "Generate a PDF report for a patient and check that the downloaded file contains the correct information."
- **Definition of Done:**
  - Risk scores are accurately calculated and displayed.
  - PDF reports are generated correctly.
- **Post-sprint:**
  - Commit and push to `main`.