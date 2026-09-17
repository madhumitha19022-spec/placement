from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from datetime import date, timedelta
from placement.models import Student, Company, PlacementDrive, Application, PlacementResult


class Command(BaseCommand):
    help = "Seeds database with initial sample data for viva and local testing."

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.NOTICE("Seeding Placement Management System database..."))

        # 1. Create or reset Admin User
        admin_user, created = User.objects.get_or_create(username="admin")
        admin_user.set_password("admin123")
        admin_user.email = "admin@placement.edu"
        admin_user.first_name = "Placement"
        admin_user.last_name = "Officer"
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.save()
        self.stdout.write(self.style.SUCCESS("  [OK] Admin account ready: username='admin', password='admin123'"))

        # 2. Seed Companies
        companies_data = [
            {
                "company_name": "Google",
                "description": "Global technology leader in search, cloud computing, artificial intelligence, and software products.",
                "email": "campus-india@google.com",
                "phone": "+91 80 6721 8000",
                "website": "https://careers.google.com",
                "location": "Bengaluru / Hyderabad",
                "industry": "Information Technology / AI"
            },
            {
                "company_name": "Microsoft",
                "description": "Multinational technology corporation producing computer software, consumer electronics, and cloud services.",
                "email": "university-hiring@microsoft.com",
                "phone": "+91 80 4010 3000",
                "website": "https://careers.microsoft.com",
                "location": "Bengaluru / Noida",
                "industry": "Software / Cloud Solutions"
            },
            {
                "company_name": "Amazon",
                "description": "Focuses on e-commerce, cloud computing (AWS), digital streaming, and artificial intelligence.",
                "email": "campus-recruitment@amazon.in",
                "phone": "+91 44 6701 5000",
                "website": "https://amazon.jobs",
                "location": "Chennai / Hyderabad",
                "industry": "Cloud & E-Commerce"
            },
            {
                "company_name": "Tata Consultancy Services",
                "description": "Leading Indian multinational information technology services and consulting company.",
                "email": "careers@tcs.com",
                "phone": "+91 22 6778 9999",
                "website": "https://www.tcs.com/careers",
                "location": "Chennai / Pune / Pan-India",
                "industry": "IT Services & Consulting"
            },
            {
                "company_name": "Infosys",
                "description": "Global leader in next-generation digital services and consulting across diverse enterprise domains.",
                "email": "talentacquisition@infosys.com",
                "phone": "+91 80 2852 0261",
                "website": "https://www.infosys.com/careers",
                "location": "Bengaluru / Mysuru",
                "industry": "Enterprise IT Services"
            }
        ]

        companies = {}
        for cdata in companies_data:
            company, _ = Company.objects.update_or_create(
                company_name=cdata["company_name"],
                defaults=cdata
            )
            companies[cdata["company_name"]] = company
        self.stdout.write(self.style.SUCCESS(f"  [OK] Seeded {len(companies)} recruiting companies."))

        # 3. Seed Students
        students_data = [
            {
                "register_number": "21IT001",
                "name": "Aarav Sharma",
                "email": "aarav.sharma@college.edu",
                "phone": "9876543210",
                "department": "IT",
                "year": 4,
                "cgpa": 9.20,
                "skills": "Python, Django, React, PostgreSQL, Docker",
                "resume": "https://example.com/resumes/21it001.pdf"
            },
            {
                "register_number": "21IT002",
                "name": "Diya Patel",
                "email": "diya.patel@college.edu",
                "phone": "9876543211",
                "department": "IT",
                "year": 4,
                "cgpa": 8.75,
                "skills": "JavaScript, React, Node.js, REST APIs, Git",
                "resume": "https://example.com/resumes/21it002.pdf"
            },
            {
                "register_number": "21CS015",
                "name": "Rohan Verma",
                "email": "rohan.verma@college.edu",
                "phone": "9876543212",
                "department": "CSE",
                "year": 4,
                "cgpa": 9.50,
                "skills": "C++, Data Structures, Algorithms, System Design",
                "resume": "https://example.com/resumes/21cs015.pdf"
            },
            {
                "register_number": "21CS042",
                "name": "Sneha Reddy",
                "email": "sneha.reddy@college.edu",
                "phone": "9876543213",
                "department": "CSE",
                "year": 4,
                "cgpa": 7.80,
                "skills": "Java, Spring Boot, MySQL, HTML/CSS",
                "resume": "https://example.com/resumes/21cs042.pdf"
            },
            {
                "register_number": "21EC008",
                "name": "Vikram Sundaram",
                "email": "vikram.sundaram@college.edu",
                "phone": "9876543214",
                "department": "ECE",
                "year": 4,
                "cgpa": 8.10,
                "skills": "Embedded C, IoT, Python, Verilog",
                "resume": "https://example.com/resumes/21ec008.pdf"
            },
            {
                "register_number": "21AD020",
                "name": "Ananya Iyer",
                "email": "ananya.iyer@college.edu",
                "phone": "9876543215",
                "department": "AIDS",
                "year": 4,
                "cgpa": 9.15,
                "skills": "Python, Machine Learning, PyTorch, SQL, Pandas",
                "resume": "https://example.com/resumes/21ad020.pdf"
            },
            {
                "register_number": "21IT030",
                "name": "Karthik Raja",
                "email": "karthik.raja@college.edu",
                "phone": "9876543216",
                "department": "IT",
                "year": 4,
                "cgpa": 6.85,
                "skills": "HTML, CSS, JavaScript, Basic Python",
                "resume": "https://example.com/resumes/21it030.pdf"
            },
            {
                "register_number": "21ME012",
                "name": "Manoj Kumar",
                "email": "manoj.kumar@college.edu",
                "phone": "9876543217",
                "department": "MECH",
                "year": 4,
                "cgpa": 7.40,
                "skills": "AutoCAD, SolidWorks, Python Basics, ANSYS",
                "resume": "https://example.com/resumes/21me012.pdf"
            }
        ]

        students = {}
        for sdata in students_data:
            # Create auth User for each student
            u, _ = User.objects.get_or_create(username=sdata["register_number"])
            u.set_password("student123")
            u.email = sdata["email"]
            u.first_name = sdata["name"]
            u.save()

            student, _ = Student.objects.update_or_create(
                register_number=sdata["register_number"],
                defaults={
                    "user": u,
                    **sdata
                }
            )
            students[sdata["register_number"]] = student
        self.stdout.write(self.style.SUCCESS(f"  [OK] Seeded {len(students)} students (Password: 'student123')."))

        # 4. Seed Placement Drives
        today = date.today()
        drives_data = [
            {
                "company": companies["Google"],
                "job_role": "Software Development Engineer - I",
                "description": "Design and build high-performance scalable web systems and cloud infrastructure.",
                "package": 24.00,
                "eligibility_cgpa": 8.50,
                "eligible_department": "CSE,IT,AIDS",
                "drive_date": today + timedelta(days=14),
                "application_deadline": today + timedelta(days=7),
                "vacancies": 8,
                "status": "Upcoming"
            },
            {
                "company": companies["Microsoft"],
                "job_role": "Cloud Solutions Engineer",
                "description": "Architect enterprise cloud implementations on Microsoft Azure.",
                "package": 18.50,
                "eligibility_cgpa": 8.00,
                "eligible_department": "CSE,IT,ECE,AIDS",
                "drive_date": today + timedelta(days=20),
                "application_deadline": today + timedelta(days=10),
                "vacancies": 12,
                "status": "Upcoming"
            },
            {
                "company": companies["Amazon"],
                "job_role": "Software Development Engineer (AWS)",
                "description": "Develop core cloud storage and compute services.",
                "package": 20.00,
                "eligibility_cgpa": 8.00,
                "eligible_department": "CSE,IT,AIDS",
                "drive_date": today + timedelta(days=5),
                "application_deadline": today + timedelta(days=2),
                "vacancies": 10,
                "status": "Ongoing"
            },
            {
                "company": companies["Tata Consultancy Services"],
                "job_role": "TCS Digital Specialist",
                "description": "Full-stack application development, data analytics, and cloud engineering.",
                "package": 7.20,
                "eligibility_cgpa": 6.50,
                "eligible_department": "All",
                "drive_date": today + timedelta(days=25),
                "application_deadline": today + timedelta(days=15),
                "vacancies": 35,
                "status": "Upcoming"
            },
            {
                "company": companies["Infosys"],
                "job_role": "Specialist Programmer (Power Programmer)",
                "description": "Competitive coding, agile software delivery, and microservices architecture.",
                "package": 9.50,
                "eligibility_cgpa": 7.00,
                "eligible_department": "CSE,IT,ECE,AIDS",
                "drive_date": today - timedelta(days=10),
                "application_deadline": today - timedelta(days=15),
                "vacancies": 20,
                "status": "Completed"
            }
        ]

        drives = []
        for ddata in drives_data:
            drive, _ = PlacementDrive.objects.update_or_create(
                company=ddata["company"],
                job_role=ddata["job_role"],
                defaults=ddata
            )
            drives.append(drive)
        self.stdout.write(self.style.SUCCESS(f"  [OK] Seeded {len(drives)} placement drives."))

        # 5. Seed Applications
        google_drive = drives[0]
        ms_drive = drives[1]
        amazon_drive = drives[2]
        tcs_drive = drives[3]
        infosys_drive = drives[4]

        applications_seed = [
            (students["21IT001"], google_drive, "Shortlisted", "Cleared round 1 technical coding assessment."),
            (students["21CS015"], google_drive, "Interview", "Interview scheduled for technical round 2."),
            (students["21AD020"], google_drive, "Applied", "Resume screened and shortlisted for online test."),
            (students["21IT001"], ms_drive, "Applied", "Applied on campus portal."),
            (students["21IT002"], ms_drive, "Shortlisted", "Shortlisted based on coding contest rank."),
            (students["21CS015"], ms_drive, "Interview", "Technical round scheduled."),
            (students["21EC008"], ms_drive, "Applied", "Awaiting online assessment."),
            (students["21IT001"], infosys_drive, "Selected", "Offered Specialist Programmer role!"),
            (students["21CS015"], infosys_drive, "Selected", "Offered Specialist Programmer role!"),
            (students["21IT002"], infosys_drive, "Selected", "Offered Specialist Programmer role!"),
            (students["21IT030"], tcs_drive, "Applied", "Application under review."),
            (students["21ME012"], tcs_drive, "Applied", "Application submitted."),
        ]

        created_apps = {}
        for student, drive, status_val, remarks in applications_seed:
            app, _ = Application.objects.update_or_create(
                student=student,
                placement_drive=drive,
                defaults={"status": status_val, "remarks": remarks}
            )
            created_apps[(student.register_number, drive.job_role)] = app

        self.stdout.write(self.style.SUCCESS(f"  [OK] Seeded {len(created_apps)} student applications."))

        # 6. Seed Placement Results for selected applications
        results_seed = [
            {
                "app_key": ("21IT001", infosys_drive.job_role),
                "result_status": "Selected",
                "package": 9.50,
                "joining_date": today + timedelta(days=90),
                "remarks": "Offer Letter issued. Joining location: Bengaluru."
            },
            {
                "app_key": ("21CS015", infosys_drive.job_role),
                "result_status": "Selected",
                "package": 9.50,
                "joining_date": today + timedelta(days=90),
                "remarks": "Offer Letter issued. Joining location: Mysuru."
            },
            {
                "app_key": ("21IT002", infosys_drive.job_role),
                "result_status": "Selected",
                "package": 9.50,
                "joining_date": today + timedelta(days=90),
                "remarks": "Offer Letter issued. Joining location: Bengaluru."
            }
        ]

        for rdata in results_seed:
            app = created_apps.get(rdata["app_key"])
            if app:
                PlacementResult.objects.update_or_create(
                    application=app,
                    defaults={
                        "result_status": rdata["result_status"],
                        "package": rdata["package"],
                        "joining_date": rdata["joining_date"],
                        "remarks": rdata["remarks"]
                    }
                )
        self.stdout.write(self.style.SUCCESS(f"  [OK] Seeded {len(results_seed)} official placement results."))
        self.stdout.write(self.style.SUCCESS("\n[SUCCESS] Database seed complete! Ready for demo and viva."))
