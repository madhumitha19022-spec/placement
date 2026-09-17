# API Testing Documentation - Placement Management System

This document outlines the testing strategy, Postman collection guide, automated test suite, and validation test matrix for the **Placement Management System**.

---

## 1. Test Environment Setup

- **Backend Base URL**: `http://127.0.0.1:8000/api`
- **Frontend App URL**: `http://localhost:5173`
- **Database**: SQLite3 (`backend/db.sqlite3`)
- **Authentication**: Token Authentication passed in the HTTP Header:
  ```http
  Authorization: Token <your_token_here>
  Content-Type: application/json
  ```

---

## 2. Postman Collection Reference

### 2.1 Authentication Endpoints

#### 1. Admin Login
- **Method**: `POST`
- **URL**: `{{base_url}}/auth/login/`
- **Body (raw JSON)**:
```json
{
  "username": "admin",
  "password": "admin123"
}
```
- **Expected Status**: `200 OK`
- **Response**: Returns `token`, `user` object with `role: "admin"`.

#### 2. Student Login
- **Method**: `POST`
- **URL**: `{{base_url}}/auth/login/`
- **Body (raw JSON)**:
```json
{
  "username": "21IT001",
  "password": "student123"
}
```
- **Expected Status**: `200 OK`
- **Response**: Returns `token`, `user` object with `role: "student"`, and linked `student_profile`.

#### 3. Student Self-Registration
- **Method**: `POST`
- **URL**: `{{base_url}}/auth/register/`
- **Body (raw JSON)**:
```json
{
  "register_number": "21CS099",
  "name": "Kavya Ramesh",
  "email": "kavya.ramesh@college.edu",
  "phone": "9876543299",
  "department": "CSE",
  "year": 4,
  "cgpa": "8.70",
  "skills": "Java, Spring Boot, React, MySQL",
  "resume": "https://example.com/resumes/kavya.pdf",
  "password": "kavyapassword"
}
```
- **Expected Status**: `201 Created`
- **Response**: Creates Django User and Student atomically; returns auth token.

#### 4. Current User Session
- **Method**: `GET`
- **URL**: `{{base_url}}/auth/me/`
- **Headers**: `Authorization: Token {{token}}`
- **Expected Status**: `200 OK`

---

### 2.2 Dashboard Analytics

#### 1. Placement Statistics & Metrics
- **Method**: `GET`
- **URL**: `{{base_url}}/dashboard/stats/`
- **Expected Status**: `200 OK`
- **Key Fields**: `total_students`, `total_companies`, `total_drives`, `placed_students`, `placement_percentage`, `max_package`, `avg_package`, `department_summary`.

---

### 2.3 Student Management (`/api/students/`)

| Method | Endpoint | Query / Body | Expected Code |
|---|---|---|---|
| `GET` | `{{base_url}}/students/` | `?search=Aarav&department=IT` | `200 OK` |
| `POST` | `{{base_url}}/students/` | `{ "register_number": "21EC040", "name": "Vikas S", "email": "vikas@college.edu", "phone": "9123456780", "department": "ECE", "year": 4, "cgpa": 8.10 }` | `201 Created` |
| `GET` | `{{base_url}}/students/<id>/` | None | `200 OK` |
| `PATCH` | `{{base_url}}/students/<id>/` | `{ "cgpa": 8.65, "skills": "C++, Embedded Systems" }` | `200 OK` |
| `DELETE` | `{{base_url}}/students/<id>/` | None | `204 No Content` |
| `GET` | `{{base_url}}/students/profile/` | Headers: `Authorization: Token {{student_token}}` | `200 OK` |
| `PATCH` | `{{base_url}}/students/profile/` | `{ "phone": "9988776655", "skills": "Updated skills list" }` | `200 OK` |

---

### 2.4 Company Management (`/api/companies/`)

| Method | Endpoint | Query / Body | Expected Code |
|---|---|---|---|
| `GET` | `{{base_url}}/companies/` | `?search=Google&industry=IT` | `200 OK` |
| `POST` | `{{base_url}}/companies/` | `{ "company_name": "Oracle", "description": "Enterprise cloud infrastructure", "location": "Bengaluru", "industry": "Cloud Software", "email": "campus@oracle.com", "phone": "080-40001111", "website": "https://oracle.com" }` | `201 Created` |
| `GET` | `{{base_url}}/companies/<id>/` | None | `200 OK` |
| `PATCH` | `{{base_url}}/companies/<id>/` | `{ "location": "Bengaluru / Hyderabad" }` | `200 OK` |
| `DELETE` | `{{base_url}}/companies/<id>/` | None | `204 No Content` |

---

### 2.5 Placement Drives (`/api/drives/`)

| Method | Endpoint | Query / Body | Expected Code |
|---|---|---|---|
| `GET` | `{{base_url}}/drives/` | `?status=Upcoming&search=Developer` | `200 OK` |
| `POST` | `{{base_url}}/drives/` | `{ "company": 1, "job_role": "Software Engineer", "package": 14.50, "eligibility_cgpa": 8.00, "eligible_department": "CSE,IT", "drive_date": "2026-11-20", "application_deadline": "2026-11-10", "vacancies": 10, "status": "Upcoming" }` | `201 Created` |
| `GET` | `{{base_url}}/drives/<id>/` | None | `200 OK` |
| `PATCH` | `{{base_url}}/drives/<id>/` | `{ "vacancies": 15, "package": 15.00 }` | `200 OK` |
| `DELETE` | `{{base_url}}/drives/<id>/` | None | `204 No Content` |
| `POST` | `{{base_url}}/drives/<id>/apply/` | `{ "remarks": "Applying with relevant project experience" }` | `201 Created` |

---

### 2.6 Applications (`/api/applications/`)

| Method | Endpoint | Query / Body | Expected Code |
|---|---|---|---|
| `GET` | `{{base_url}}/applications/` | `?status=Applied&search=Aarav` | `200 OK` |
| `POST` | `{{base_url}}/applications/` | `{ "student": 1, "placement_drive": 2, "remarks": "Applied via portal" }` | `201 Created` |
| `GET` | `{{base_url}}/applications/<id>/` | None | `200 OK` |
| `PATCH` | `{{base_url}}/applications/<id>/update_status/` | `{ "status": "Shortlisted", "remarks": "Cleared Round 1 Online Assessment" }` | `200 OK` |
| `DELETE` | `{{base_url}}/applications/<id>/` | None | `204 No Content` |

---

### 2.7 Placement Results (`/api/results/`)

| Method | Endpoint | Query / Body | Expected Code |
|---|---|---|---|
| `GET` | `{{base_url}}/results/` | `?result_status=Selected` | `200 OK` |
| `POST` | `{{base_url}}/results/` | `{ "application": 1, "result_status": "Selected", "package": 14.50, "joining_date": "2027-06-15", "remarks": "Offer letter dispatched" }` | `201 Created` |
| `GET` | `{{base_url}}/results/<id>/` | None | `200 OK` |
| `PATCH` | `{{base_url}}/results/<id>/` | `{ "joining_date": "2027-07-01" }` | `200 OK` |
| `DELETE` | `{{base_url}}/results/<id>/` | None | `204 No Content` |

---

## 3. Validation Test Matrix (Boundary & Negative Tests)

| Test ID | Scenario | Input Data | Expected Result | HTTP Status |
|---|---|---|---|---|
| **VAL-01** | Invalid Login Credentials | Username: `admin`, Password: `wrongpassword` | `"Invalid credentials"` error | `400 Bad Request` |
| **VAL-02** | Duplicate Student Registration | Existing Register Number: `21IT001` | `"Student with this Register Number already exists"` | `400 Bad Request` |
| **VAL-03** | Invalid CGPA Out of Range | `cgpa: 12.50` (> 10.00) or `-1.5` (< 0.00) | `"CGPA must be between 0.00 and 10.00"` | `400 Bad Request` |
| **VAL-04** | Invalid Phone Digits | `phone: "123"` (< 7 digits) | `"Phone number must contain between 7 and 15 digits"` | `400 Bad Request` |
| **VAL-05** | Negative Package in Drive | `package: -5.00` | `"Package must be a positive number greater than 0"` | `400 Bad Request` |
| **VAL-06** | Zero Vacancies in Drive | `vacancies: 0` | `"Vacancies must be at least 1"` | `400 Bad Request` |
| **VAL-07** | Deadline after Drive Date | `drive_date: "2026-10-01"`, `deadline: "2026-10-15"` | `"Application deadline cannot be after the drive date"` | `400 Bad Request` |
| **VAL-08** | Ineligible CGPA Application | Student CGPA `7.20` applying for drive requiring `8.00` | `"Eligibility criteria not met: Required CGPA is 8.00"` | `400 Bad Request` |
| **VAL-09** | Ineligible Branch Application | MECH student applying for drive restricted to `CSE,IT` | `"Department 'MECH' is not eligible for this drive"` | `400 Bad Request` |
| **VAL-10** | Duplicate Drive Application | Student applying a second time to the same drive | `"You have already applied for this placement drive"` | `400 Bad Request` |
| **VAL-11** | Applying to Completed Drive | Drive status = `Completed` | `"Cannot apply to a placement drive that is 'Completed'"` | `400 Bad Request` |
| **VAL-12** | Student Self-Withdrawal | Student deletes own application while status is `Applied` | Record removed cleanly | `204 No Content` |

---

## 4. Automated Test Script

The project includes an automated backend test script that executes 16 comprehensive integration checks using DRF's `APIClient`.

### Running the Tests:
```powershell
cd backend
python test_api_endpoints.py
```

### Verified Test Assertions in Script:
1. Admin authentication & token generation
2. Student authentication & role verification
3. Placement dashboard analytics computation
4. Student record creation
5. Student search & filtering
6. Student record update
7. Student deletion
8. CGPA bounds validation rejection (CGPA 12.50)
9. Company record creation
10. Placement drive scheduling with eligibility rules
11. CGPA eligibility rejection enforcement
12. Valid drive application submission
13. Duplicate application prevention
14. Application status advance to `Selected`
15. Official placement result offer creation
16. Cascade deletion cleanup of test company and associated records

---

## 5. Frontend End-to-End Checklist

| Flow | Steps to Verify | Expected Outcome | Status |
|---|---|---|---|
| **Admin Flow** | 1. Sign in as `admin` / `admin123`<br/>2. Open Dashboard<br/>3. Create Company & Drive<br/>4. Review Applications & change status to `Selected`<br/>5. Record placement offer | All metrics update in real-time. Modals open and save cleanly. | Verified |
| **Student Flow** | 1. Sign in as `21IT001` / `student123`<br/>2. Navigate to Companies (`/student/companies`)<br/>3. Click "Details" on Company<br/>4. Navigate to Drives (`/student/drives`)<br/>5. Click "Details" on Drive<br/>6. Apply for eligible drive<br/>7. View Application Status (`/student/applications`)<br/>8. Withdraw pending application | Student accesses company list, inspects details, applies, tracks visual status stepper, and withdraws smoothly. | Verified |
