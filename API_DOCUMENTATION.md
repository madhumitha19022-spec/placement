# REST API Reference - Placement Management System

Base URL for all API endpoints:
```
http://127.0.0.1:8000/api
```

All authenticated requests should pass the Authorization header:
```http
Authorization: Token <your_auth_token_here>
```

---

## 1. Authentication & User Endpoints

### 1.1 Login
- **Endpoint**: `POST /api/auth/login/`
- **Access**: Public
- **Request Body**:
```json
{
  "username": "admin",
  "password": "admin123"
}
```
*(Note: Supports login with `username`, `email`, or Student `register_number`)*
- **Response (200 OK)**:
```json
{
  "message": "Login successful",
  "token": "8823913766a5518b...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@placement.edu",
    "name": "Placement Officer",
    "role": "admin"
  },
  "student_profile": null
}
```

### 1.2 Student Registration
- **Endpoint**: `POST /api/auth/register/`
- **Access**: Public
- **Request Body**:
```json
{
  "register_number": "21IT055",
  "name": "Priya Sharma",
  "email": "priya@college.edu",
  "phone": "9876543210",
  "department": "IT",
  "year": 4,
  "cgpa": "8.85",
  "skills": "Python, React, SQL",
  "resume": "https://example.com/resumes/priya.pdf",
  "password": "studentpassword"
}
```
- **Response (201 Created)**:
```json
{
  "message": "Student registered successfully",
  "token": "...",
  "user": {
    "id": 10,
    "username": "21IT055",
    "email": "priya@college.edu",
    "name": "Priya Sharma",
    "role": "student"
  },
  "student_profile": { ... }
}
```

### 1.3 Current User Info
- **Endpoint**: `GET /api/auth/me/`
- **Access**: Authenticated (`Token`)
- **Response (200 OK)**: Returns profile, role, and linked student object if student.

---

## 2. Dashboard Analytics

### 2.1 Placement Statistics & KPIs
- **Endpoint**: `GET /api/dashboard/stats/`
- **Access**: Public / Authenticated
- **Response (200 OK)**:
```json
{
  "total_students": 8,
  "total_companies": 5,
  "total_drives": 5,
  "active_drives": 4,
  "total_applications": 12,
  "placed_students": 3,
  "placement_percentage": 37.5,
  "max_package": 9.5,
  "avg_package": 9.5,
  "department_summary": [
    {
      "department": "IT",
      "name": "Information Technology",
      "total": 3,
      "placed": 2,
      "percentage": 66.7
    }
  ],
  "recent_drives": [ ... ],
  "recent_applications": [ ... ]
}
```

---

## 3. Students API (`/api/students/`)

| Method | URL | Description | Query Params |
|---|---|---|---|
| `GET` | `/api/students/` | List all students | `?search=...`, `?department=...` |
| `POST` | `/api/students/` | Register new student | None |
| `GET` | `/api/students/<id>/` | Retrieve student details | None |
| `PUT` / `PATCH` | `/api/students/<id>/` | Update student fields | None |
| `DELETE` | `/api/students/<id>/` | Delete student record | None |
| `GET` | `/api/students/profile/` | Fetch logged-in student profile | None |
| `PATCH` | `/api/students/profile/` | Update logged-in student profile | None |

---

## 4. Companies API (`/api/companies/`)

| Method | URL | Description | Query Params |
|---|---|---|---|
| `GET` | `/api/companies/` | List partner companies | `?search=...`, `?industry=...` |
| `POST` | `/api/companies/` | Add recruiting company | None |
| `GET` | `/api/companies/<id>/` | Retrieve company info | None |
| `PUT` / `PATCH` | `/api/companies/<id>/` | Update company record | None |
| `DELETE` | `/api/companies/<id>/` | Delete company record | None |

---

## 5. Placement Drives API (`/api/drives/`)

| Method | URL | Description | Query Params |
|---|---|---|---|
| `GET` | `/api/drives/` | List placement drives | `?search=...`, `?status=...`, `?company=...` |
| `POST` | `/api/drives/` | Schedule new recruitment drive | None |
| `GET` | `/api/drives/<id>/` | Retrieve drive details | None |
| `PUT` / `PATCH` | `/api/drives/<id>/` | Update drive details | None |
| `DELETE` | `/api/drives/<id>/` | Delete placement drive | None |
| `POST` | `/api/drives/<id>/apply/` | Student one-click apply | None |

---

## 6. Applications API (`/api/applications/`)

| Method | URL | Description | Query Params |
|---|---|---|---|
| `GET` | `/api/applications/` | List applications | `?status=...`, `?search=...`, `?student=...`, `?placement_drive=...` |
| `POST` | `/api/applications/` | Submit application | None |
| `GET` | `/api/applications/<id>/` | Retrieve application details | None |
| `PATCH` | `/api/applications/<id>/update_status/` | Update application status & remarks | None |
| `DELETE` | `/api/applications/<id>/` | Remove application | None |

---

## 7. Placement Results API (`/api/results/`)

| Method | URL | Description | Query Params |
|---|---|---|---|
| `GET` | `/api/results/` | List placed students & offers | `?result_status=...`, `?search=...` |
| `POST` | `/api/results/` | Record official placement result | None |
| `GET` | `/api/results/<id>/` | Retrieve result details | None |
| `PUT` / `PATCH` | `/api/results/<id>/` | Update CTC, joining date, or remarks | None |
| `DELETE` | `/api/results/<id>/` | Delete placement result | None |
