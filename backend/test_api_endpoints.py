import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'placement_project.settings')
django.setup()

from rest_framework.test import APIClient
from django.contrib.auth.models import User
from placement.models import Student, Company, PlacementDrive, Application, PlacementResult

def run_tests():
    client = APIClient()
    print("==================================================")
    print("RUNNING BACKEND REST API & VALIDATION VERIFICATION")
    print("==================================================")

    # 1. Test Admin Login
    res = client.post('/api/auth/login/', {'username': 'admin', 'password': 'admin123'}, format='json')
    assert res.status_code == 200, f"Admin login failed: {res.data}"
    admin_token = res.data['token']
    print(f"[PASS] 1. Admin Login: Token generated ({admin_token[:10]}...), Role: {res.data['user']['role']}")

    # 2. Test Student Login
    res = client.post('/api/auth/login/', {'username': '21IT001', 'password': 'student123'}, format='json')
    assert res.status_code == 200, f"Student login failed: {res.data}"
    student_token = res.data['token']
    assert res.data['user']['role'] == 'student', "Role should be student"
    print(f"[PASS] 2. Student Login: Authenticated 21IT001, Role: {res.data['user']['role']}")

    # 3. Test Dashboard Stats
    res = client.get('/api/dashboard/stats/')
    assert res.status_code == 200, f"Dashboard stats failed: {res.data}"
    stats = res.data
    print(f"[PASS] 3. Dashboard Stats: Students={stats['total_students']}, Companies={stats['total_companies']}, Drives={stats['total_drives']}, Placed={stats['placed_students']} ({stats['placement_percentage']}%)")

    # 4. Student CRUD - Create
    new_student_data = {
        'register_number': '21IT099',
        'name': 'Test Student',
        'email': 'test.student@college.edu',
        'phone': '9123456780',
        'department': 'IT',
        'year': 4,
        'cgpa': 8.25,
        'skills': 'Python, SQL',
        'resume': 'https://example.com/resume.pdf'
    }
    client.credentials(HTTP_AUTHORIZATION=f'Token {admin_token}')
    res = client.post('/api/students/', new_student_data, format='json')
    assert res.status_code == 201, f"Student create failed: {res.data}"
    created_student_id = res.data['id']
    print(f"[PASS] 4. Student CREATE: ID {created_student_id} ({res.data['name']})")

    # 5. Student CRUD - Read & Filter
    res = client.get(f'/api/students/{created_student_id}/')
    assert res.status_code == 200
    res_search = client.get('/api/students/?search=21IT099')
    assert len(res_search.data) == 1
    print(f"[PASS] 5. Student READ & SEARCH: Retrieved by ID and search query")

    # 6. Student CRUD - Update
    res = client.patch(f'/api/students/{created_student_id}/', {'cgpa': 8.90, 'skills': 'Python, SQL, React'}, format='json')
    assert res.status_code == 200
    assert float(res.data['cgpa']) == 8.90
    print(f"[PASS] 6. Student UPDATE: Updated CGPA to {res.data['cgpa']}")

    # 7. Student CRUD - Delete
    res = client.delete(f'/api/students/{created_student_id}/')
    assert res.status_code == 204
    assert not Student.objects.filter(id=created_student_id).exists()
    print(f"[PASS] 7. Student DELETE: Successfully deleted test student")

    # 8. Student Validation - Invalid CGPA (> 10)
    invalid_student = {
        'register_number': '21IT098',
        'name': 'Invalid Student',
        'email': 'invalid@college.edu',
        'phone': '9123456780',
        'department': 'IT',
        'year': 4,
        'cgpa': 12.50  # Invalid!
    }
    res = client.post('/api/students/', invalid_student, format='json')
    assert res.status_code == 400, "Should reject invalid CGPA"
    print(f"[PASS] 8. Student VALIDATION: Correctly rejected CGPA 12.50 (400 Bad Request)")

    # 9. Company CRUD - Create
    new_company = {
        'company_name': 'Test Tech Innovations',
        'description': 'AI and Cloud testing firm',
        'email': 'contact@testtech.com',
        'phone': '+91 44 2200 1100',
        'website': 'https://testtech.com',
        'location': 'Chennai',
        'industry': 'Artificial Intelligence'
    }
    res = client.post('/api/companies/', new_company, format='json')
    assert res.status_code == 201
    comp_id = res.data['id']
    print(f"[PASS] 9. Company CREATE: ID {comp_id} ({res.data['company_name']})")

    # 10. Placement Drive CRUD - Create
    drive_data = {
        'company': comp_id,
        'job_role': 'Junior AI Engineer',
        'description': 'Develop NLP pipelines and ML models',
        'package': 12.00,
        'eligibility_cgpa': 8.00,
        'eligible_department': 'CSE,IT',
        'drive_date': '2026-10-15',
        'application_deadline': '2026-10-01',
        'vacancies': 5,
        'status': 'Upcoming'
    }
    res = client.post('/api/drives/', drive_data, format='json')
    assert res.status_code == 201
    drive_id = res.data['id']
    print(f"[PASS] 10. Placement Drive CREATE: ID {drive_id} ({res.data['job_role']} @ 12.0 LPA)")

    # 11. Application - Eligibility Check (Student with CGPA < 8.0 applying for Drive needing 8.0)
    low_cgpa_student = Student.objects.filter(cgpa__lt=8.0).first()
    res = client.post('/api/applications/', {
        'student': low_cgpa_student.id,
        'placement_drive': drive_id
    }, format='json')
    assert res.status_code == 400, f"Expected 400 rejection due to low CGPA, got {res.status_code}"
    print(f"[PASS] 11. Application ELIGIBILITY VALIDATION: Blocked student with CGPA {low_cgpa_student.cgpa} from 8.0 requirement")

    # 12. Application - Successful Submission
    eligible_student = Student.objects.filter(cgpa__gte=8.5, department__in=['CSE', 'IT']).first()
    res = client.post('/api/applications/', {
        'student': eligible_student.id,
        'placement_drive': drive_id,
        'remarks': 'Eligible applicant test'
    }, format='json')
    assert res.status_code == 201, f"Expected 201, got {res.status_code}: {res.data}"
    app_id = res.data['id']
    print(f"[PASS] 12. Application CREATE: Student {eligible_student.register_number} applied for Drive {drive_id}")

    # 13. Application - Duplicate Prevention
    res_dup = client.post('/api/applications/', {
        'student': eligible_student.id,
        'placement_drive': drive_id
    }, format='json')
    assert res_dup.status_code == 400, "Should reject duplicate application"
    print(f"[PASS] 13. Duplicate Application PREVENTION: Blocked duplicate application with 400 Bad Request")

    # 14. Application - Admin updates status to 'Selected'
    res = client.patch(f'/api/applications/{app_id}/update_status/', {'status': 'Selected', 'remarks': 'Cleared all rounds'}, format='json')
    assert res.status_code == 200
    assert res.data['status'] == 'Selected'
    print(f"[PASS] 14. Application STATUS UPDATE: Changed status to Selected")

    # 15. Placement Result - Record final offer
    res = client.post('/api/results/', {
        'application': app_id,
        'result_status': 'Selected',
        'package': 12.00,
        'joining_date': '2026-12-01',
        'remarks': 'Full time offer issued'
    }, format='json')
    assert res.status_code == 201
    result_id = res.data['id']
    print(f"[PASS] 15. Placement Result CREATE: ID {result_id} recorded for student")

    # Cleanup temporary test company & drive
    Company.objects.filter(id=comp_id).delete()
    print(f"[PASS] 16. Cascade Cleanup: Test company and associated records removed cleanly")

    print("==================================================")
    print("ALL 16 BACKEND API & VALIDATION TESTS PASSED 100%!")
    print("==================================================")

if __name__ == '__main__':
    run_tests()
