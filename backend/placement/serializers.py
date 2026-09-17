import re
from datetime import date
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework import serializers
from .models import Student, Company, PlacementDrive, Application, PlacementResult


# =====================================================================
# 1. USER & AUTHENTICATION SERIALIZERS
# =====================================================================

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff']


class LoginSerializer(serializers.Serializer):
    """
    Validates user credentials (accepts username or email/register number).
    """
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        username = data.get('username').strip()
        password = data.get('password')

        # Allow logging in with either username, student register_number, or email
        user = authenticate(username=username, password=password)
        if not user:
            # Check if username is an email
            user_by_email = User.objects.filter(email__iexact=username).first()
            if user_by_email and user_by_email.check_password(password):
                user = user_by_email
            else:
                # Check if it's a student's register number
                student = Student.objects.filter(register_number__iexact=username).first()
                if student and student.user and student.user.check_password(password):
                    user = student.user

        if not user:
            raise serializers.ValidationError("Invalid credentials. Please check your username and password.")

        if not user.is_active:
            raise serializers.ValidationError("This user account is inactive.")

        data['user'] = user
        return data


class StudentRegisterSerializer(serializers.Serializer):
    """
    Handles student registration by creating both the Django User and Student profile.
    """
    register_number = serializers.CharField(max_length=30)
    name = serializers.CharField(max_length=120)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=15)
    department = serializers.CharField(max_length=50)
    year = serializers.IntegerField(default=4)
    cgpa = serializers.DecimalField(max_digits=4, decimal_places=2)
    skills = serializers.CharField(required=False, allow_blank=True)
    resume = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, min_length=6)

    def validate_register_number(self, value):
        reg = value.strip().upper()
        if Student.objects.filter(register_number__iexact=reg).exists():
            raise serializers.ValidationError("A student with this Register Number already exists.")
        if User.objects.filter(username__iexact=reg).exists():
            raise serializers.ValidationError("Username with this Register Number is already taken.")
        return reg

    def validate_email(self, value):
        email = value.strip().lower()
        if Student.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("A student with this Email already exists.")
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("An account with this Email already exists.")
        return email

    def validate_cgpa(self, value):
        if value < 0.0 or value > 10.0:
            raise serializers.ValidationError("CGPA must be between 0.00 and 10.00.")
        return value

    def validate_phone(self, value):
        digits = re.sub(r'\D', '', value)
        if len(digits) < 7 or len(digits) > 15:
            raise serializers.ValidationError("Phone number must contain between 7 and 15 digits.")
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        register_number = validated_data['register_number']
        email = validated_data['email']
        name = validated_data['name']

        # Create auth user
        user = User.objects.create_user(
            username=register_number,
            email=email,
            password=password,
            first_name=name
        )

        # Create linked Student record
        student = Student.objects.create(
            user=user,
            **validated_data
        )
        return student


# =====================================================================
# 2. CORE CRUD SERIALIZERS
# =====================================================================

class StudentSerializer(serializers.ModelSerializer):
    """
    Full CRUD serializer for Student records.
    """
    class Meta:
        model = Student
        fields = [
            'id', 'user', 'register_number', 'name', 'email', 'phone',
            'department', 'year', 'cgpa', 'skills', 'resume',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Student name cannot be empty.")
        return value.strip()

    def validate_register_number(self, value):
        reg = value.strip().upper()
        if not reg:
            raise serializers.ValidationError("Register number cannot be empty.")
        instance = getattr(self, 'instance', None)
        if Student.objects.filter(register_number__iexact=reg).exclude(pk=instance.pk if instance else None).exists():
            raise serializers.ValidationError("This register number is already registered.")
        return reg

    def validate_email(self, value):
        email = value.strip().lower()
        instance = getattr(self, 'instance', None)
        if Student.objects.filter(email__iexact=email).exclude(pk=instance.pk if instance else None).exists():
            raise serializers.ValidationError("This email address is already in use.")
        return email

    def validate_phone(self, value):
        digits = re.sub(r'\D', '', value)
        if len(digits) < 7 or len(digits) > 15:
            raise serializers.ValidationError("Phone number must contain between 7 and 15 digits.")
        return value

    def validate_cgpa(self, value):
        if value < 0.0 or value > 10.0:
            raise serializers.ValidationError("CGPA must be between 0.00 and 10.00.")
        return value


class CompanySerializer(serializers.ModelSerializer):
    """
    Full CRUD serializer for Company records.
    """
    total_drives = serializers.IntegerField(source='drives.count', read_only=True)

    class Meta:
        model = Company
        fields = [
            'id', 'company_name', 'description', 'email', 'phone',
            'website', 'location', 'industry', 'total_drives',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'total_drives']

    def validate_company_name(self, value):
        name = value.strip()
        if not name:
            raise serializers.ValidationError("Company name cannot be empty.")
        instance = getattr(self, 'instance', None)
        if Company.objects.filter(company_name__iexact=name).exclude(pk=instance.pk if instance else None).exists():
            raise serializers.ValidationError("A company with this name already exists.")
        return name


class PlacementDriveSerializer(serializers.ModelSerializer):
    """
    Full CRUD serializer for Placement Drives.
    Includes nested company details for read operations.
    """
    company_name = serializers.CharField(source='company.company_name', read_only=True)
    company_location = serializers.CharField(source='company.location', read_only=True)
    company_website = serializers.CharField(source='company.website', read_only=True)
    total_applications = serializers.IntegerField(source='applications.count', read_only=True)

    class Meta:
        model = PlacementDrive
        fields = [
            'id', 'company', 'company_name', 'company_location', 'company_website',
            'job_role', 'description', 'package', 'eligibility_cgpa',
            'eligible_department', 'drive_date', 'application_deadline',
            'vacancies', 'status', 'total_applications',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'total_applications', 'company_name']

    def validate_job_role(self, value):
        if not value.strip():
            raise serializers.ValidationError("Job role cannot be empty.")
        return value.strip()

    def validate_package(self, value):
        if value <= 0:
            raise serializers.ValidationError("Package must be a positive number greater than 0.")
        return value

    def validate_eligibility_cgpa(self, value):
        if value < 0.0 or value > 10.0:
            raise serializers.ValidationError("Eligibility CGPA must be between 0.00 and 10.00.")
        return value

    def validate_vacancies(self, value):
        if value < 1:
            raise serializers.ValidationError("Vacancies must be at least 1.")
        return value

    def validate(self, data):
        drive_date = data.get('drive_date')
        deadline = data.get('application_deadline')
        if drive_date and deadline and deadline > drive_date:
            raise serializers.ValidationError({
                "application_deadline": "Application deadline cannot be after the drive date."
            })
        return data


class ApplicationSerializer(serializers.ModelSerializer):
    """
    Serializer for Applications with eligibility verification and detailed read data.
    """
    # Read-only helper fields for easy UI presentation
    student_name = serializers.CharField(source='student.name', read_only=True)
    student_register_number = serializers.CharField(source='student.register_number', read_only=True)
    student_department = serializers.CharField(source='student.department', read_only=True)
    student_cgpa = serializers.DecimalField(source='student.cgpa', max_digits=4, decimal_places=2, read_only=True)
    student_email = serializers.CharField(source='student.email', read_only=True)
    student_phone = serializers.CharField(source='student.phone', read_only=True)

    company_name = serializers.CharField(source='placement_drive.company.company_name', read_only=True)
    job_role = serializers.CharField(source='placement_drive.job_role', read_only=True)
    package = serializers.DecimalField(source='placement_drive.package', max_digits=6, decimal_places=2, read_only=True)
    drive_status = serializers.CharField(source='placement_drive.status', read_only=True)

    has_result = serializers.SerializerMethodField()
    result_status = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = [
            'id', 'student', 'placement_drive', 'application_date', 'status', 'remarks',
            'student_name', 'student_register_number', 'student_department', 'student_cgpa',
            'student_email', 'student_phone',
            'company_name', 'job_role', 'package', 'drive_status',
            'has_result', 'result_status',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'application_date', 'created_at', 'updated_at']

    def get_has_result(self, obj):
        return hasattr(obj, 'result')

    def get_result_status(self, obj):
        return obj.result.result_status if hasattr(obj, 'result') else None

    def validate(self, data):
        student = data.get('student')
        drive = data.get('placement_drive')

        # Check for creation only (not updates of status)
        if not self.instance:
            if not student or not drive:
                raise serializers.ValidationError("Both student and placement drive are required.")

            # 1. Prevent duplicate applications
            if Application.objects.filter(student=student, placement_drive=drive).exists():
                raise serializers.ValidationError("You have already applied for this placement drive.")

            # 2. Check CGPA eligibility
            if student.cgpa < drive.eligibility_cgpa:
                raise serializers.ValidationError(
                    f"Eligibility criteria not met: Required CGPA is {drive.eligibility_cgpa}, but student's CGPA is {student.cgpa}."
                )

            # 3. Check Department eligibility
            eligible_depts = [d.strip().upper() for d in drive.eligible_department.split(',') if d.strip()]
            if 'ALL' not in [d.upper() for d in eligible_depts] and student.department.upper() not in eligible_depts:
                raise serializers.ValidationError(
                    f"Department '{student.department}' is not eligible for this drive ({drive.eligible_department})."
                )

            # 4. Check Application Deadline
            if drive.application_deadline < date.today():
                raise serializers.ValidationError("The application deadline for this placement drive has passed.")

            # 5. Check Drive Status
            if drive.status in ['Completed', 'Cancelled']:
                raise serializers.ValidationError(f"Cannot apply to a placement drive that is '{drive.status}'.")

        return data


class PlacementResultSerializer(serializers.ModelSerializer):
    """
    Full CRUD serializer for final placement results.
    """
    student_name = serializers.CharField(source='application.student.name', read_only=True)
    student_register_number = serializers.CharField(source='application.student.register_number', read_only=True)
    student_department = serializers.CharField(source='application.student.department', read_only=True)
    company_name = serializers.CharField(source='application.placement_drive.company.company_name', read_only=True)
    job_role = serializers.CharField(source='application.placement_drive.job_role', read_only=True)

    class Meta:
        model = PlacementResult
        fields = [
            'id', 'application', 'result_status', 'package', 'joining_date',
            'remarks', 'student_name', 'student_register_number',
            'student_department', 'company_name', 'job_role',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_package(self, value):
        if value < 0:
            raise serializers.ValidationError("Package cannot be negative.")
        return value
