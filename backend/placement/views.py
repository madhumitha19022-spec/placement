from rest_framework import viewsets, status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action
from django.db.models import Count, Q, Avg, Max
from django.shortcuts import get_object_or_404

from .models import Student, Company, PlacementDrive, Application, PlacementResult
from .serializers import (
    UserSerializer,
    LoginSerializer,
    StudentRegisterSerializer,
    StudentSerializer,
    CompanySerializer,
    PlacementDriveSerializer,
    ApplicationSerializer,
    PlacementResultSerializer
)


# =====================================================================
# 1. AUTHENTICATION & PROFILE VIEWS
# =====================================================================

class LoginView(APIView):
    """
    POST /api/auth/login/
    Authenticates admin or student credentials and returns a secure auth Token.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.validated_data['user']
        token, _ = Token.objects.get_or_create(user=user)

        role = 'admin' if user.is_staff or user.is_superuser else 'student'
        student_data = None

        if role == 'student' and hasattr(user, 'student_profile'):
            student_data = StudentSerializer(user.student_profile).data

        return Response({
            "message": "Login successful",
            "token": token.key,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "name": user.get_full_name() or user.username,
                "role": role,
            },
            "student_profile": student_data
        }, status=status.HTTP_200_OK)


class RegisterStudentView(APIView):
    """
    POST /api/auth/register/
    Self-service student registration. Creates User and Student records atomically.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = StudentRegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        student = serializer.save()
        token, _ = Token.objects.get_or_create(user=student.user)

        return Response({
            "message": "Student registered successfully",
            "token": token.key,
            "user": {
                "id": student.user.id,
                "username": student.user.username,
                "email": student.user.email,
                "name": student.name,
                "role": "student",
            },
            "student_profile": StudentSerializer(student).data
        }, status=status.HTTP_201_CREATED)


class CurrentUserView(APIView):
    """
    GET /api/auth/me/
    Returns currently logged-in user profile and permissions.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        role = 'admin' if user.is_staff or user.is_superuser else 'student'
        student_data = None

        if hasattr(user, 'student_profile'):
            student_data = StudentSerializer(user.student_profile).data

        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "name": user.get_full_name() or user.username,
            "role": role,
            "student_profile": student_data
        })


# =====================================================================
# 2. DASHBOARD & ANALYTICS VIEW
# =====================================================================

class DashboardStatsView(APIView):
    """
    GET /api/dashboard/stats/
    Returns high-level placement KPIs, statistics, and recent activity records.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        total_students = Student.objects.count()
        total_companies = Company.objects.count()
        active_drives = PlacementDrive.objects.filter(status__in=['Upcoming', 'Ongoing']).count()
        total_drives = PlacementDrive.objects.count()
        total_applications = Application.objects.count()

        # Placed students (distinct students who got 'Selected' in PlacementResult)
        placed_students_count = PlacementResult.objects.filter(
            result_status='Selected'
        ).values('application__student').distinct().count()

        placement_percentage = round((placed_students_count / total_students * 100), 1) if total_students > 0 else 0.0

        # Maximum CTC package offered
        max_package = PlacementResult.objects.filter(result_status='Selected').aggregate(Max('package'))['package__max'] or 0.0
        avg_package = PlacementResult.objects.filter(result_status='Selected').aggregate(Avg('package'))['package__avg'] or 0.0

        # Department distribution of placed students
        dept_summary = []
        for dept_code, dept_name in Student.DEPARTMENT_CHOICES:
            dept_total = Student.objects.filter(department=dept_code).count()
            dept_placed = PlacementResult.objects.filter(
                result_status='Selected',
                application__student__department=dept_code
            ).values('application__student').distinct().count()

            if dept_total > 0:
                dept_summary.append({
                    "department": dept_code,
                    "name": dept_name,
                    "total": dept_total,
                    "placed": dept_placed,
                    "percentage": round((dept_placed / dept_total * 100), 1)
                })

        # Recent drives
        recent_drives = PlacementDriveSerializer(
            PlacementDrive.objects.all().order_by('-created_at')[:5],
            many=True
        ).data

        # Recent applications
        recent_applications = ApplicationSerializer(
            Application.objects.all().order_by('-created_at')[:5],
            many=True
        ).data

        return Response({
            "total_students": total_students,
            "total_companies": total_companies,
            "total_drives": total_drives,
            "active_drives": active_drives,
            "total_applications": total_applications,
            "placed_students": placed_students_count,
            "placement_percentage": placement_percentage,
            "max_package": float(max_package),
            "avg_package": round(float(avg_package), 2),
            "department_summary": dept_summary,
            "recent_drives": recent_drives,
            "recent_applications": recent_applications,
        })


# =====================================================================
# 3. CORE CRUD VIEWSETS
# =====================================================================

class StudentViewSet(viewsets.ModelViewSet):
    """
    CRUD API for Student records.
    Supports filtering by register_number, name, and department.
    """
    queryset = Student.objects.all()
    serializer_class = StudentSerializer

    def get_queryset(self):
        queryset = Student.objects.all()
        search = self.request.query_params.get('search', None)
        dept = self.request.query_params.get('department', None)

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(register_number__icontains=search) |
                Q(email__icontains=search) |
                Q(skills__icontains=search)
            )
        if dept:
            queryset = queryset.filter(department__iexact=dept)

        return queryset

    @action(detail=False, methods=['get', 'put', 'patch'], permission_classes=[IsAuthenticated])
    def profile(self, request):
        """Allows logged-in student to retrieve or update their profile"""
        if not hasattr(request.user, 'student_profile'):
            return Response({"error": "No student profile linked to this user account."}, status=status.HTTP_404_NOT_FOUND)

        student = request.user.student_profile
        if request.method in ['PUT', 'PATCH']:
            serializer = StudentSerializer(student, data=request.data, partial=(request.method == 'PATCH'))
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        serializer = StudentSerializer(student)
        return Response(serializer.data)


class CompanyViewSet(viewsets.ModelViewSet):
    """
    CRUD API for Company records.
    Supports searching by company name, industry, and location.
    """
    queryset = Company.objects.all()
    serializer_class = CompanySerializer

    def get_queryset(self):
        queryset = Company.objects.all()
        search = self.request.query_params.get('search', None)
        industry = self.request.query_params.get('industry', None)

        if search:
            queryset = queryset.filter(
                Q(company_name__icontains=search) |
                Q(location__icontains=search) |
                Q(description__icontains=search)
            )
        if industry:
            queryset = queryset.filter(industry__icontains=industry)

        return queryset


class PlacementDriveViewSet(viewsets.ModelViewSet):
    """
    CRUD API for Placement Drives.
    Supports filtering by status, company, role, and department.
    Includes custom action for student to apply.
    """
    queryset = PlacementDrive.objects.all()
    serializer_class = PlacementDriveSerializer

    def get_queryset(self):
        queryset = PlacementDrive.objects.all()
        search = self.request.query_params.get('search', None)
        status_param = self.request.query_params.get('status', None)
        company_id = self.request.query_params.get('company', None)

        if search:
            queryset = queryset.filter(
                Q(job_role__icontains=search) |
                Q(company__company_name__icontains=search) |
                Q(description__icontains=search)
            )
        if status_param:
            queryset = queryset.filter(status__iexact=status_param)
        if company_id:
            queryset = queryset.filter(company_id=company_id)

        return queryset

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def apply(self, request, pk=None):
        """
        Shortcut endpoint: /api/drives/<id>/apply/
        Logged-in student applies directly to this drive.
        """
        drive = self.get_object()

        # Check if user has student profile
        if not hasattr(request.user, 'student_profile'):
            return Response({"error": "Only registered students can apply for placement drives."}, status=status.HTTP_403_FORBIDDEN)

        student = request.user.student_profile

        # Validate application using ApplicationSerializer
        data = {
            'student': student.id,
            'placement_drive': drive.id,
            'remarks': request.data.get('remarks', 'Applied via portal')
        }

        serializer = ApplicationSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Application submitted successfully!",
                "application": serializer.data
            }, status=status.HTTP_201_CREATED)

        return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class ApplicationViewSet(viewsets.ModelViewSet):
    """
    CRUD API for Applications.
    Supports filtering by student, drive, and status.
    """
    queryset = Application.objects.all()
    serializer_class = ApplicationSerializer

    def get_queryset(self):
        queryset = Application.objects.all()
        student_id = self.request.query_params.get('student', None)
        drive_id = self.request.query_params.get('placement_drive', None)
        status_param = self.request.query_params.get('status', None)
        search = self.request.query_params.get('search', None)

        # If logged in as student and not admin, default to showing their own applications
        if self.request.user.is_authenticated and not (self.request.user.is_staff or self.request.user.is_superuser):
            if hasattr(self.request.user, 'student_profile'):
                queryset = queryset.filter(student=self.request.user.student_profile)

        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if drive_id:
            queryset = queryset.filter(placement_drive_id=drive_id)
        if status_param:
            queryset = queryset.filter(status__iexact=status_param)
        if search:
            queryset = queryset.filter(
                Q(student__name__icontains=search) |
                Q(student__register_number__icontains=search) |
                Q(placement_drive__company__company_name__icontains=search) |
                Q(placement_drive__job_role__icontains=search)
            )

        return queryset

    @action(detail=True, methods=['patch', 'put'])
    def update_status(self, request, pk=None):
        """
        Convenience endpoint to update application status and optional remarks.
        """
        application = self.get_object()
        new_status = request.data.get('status')
        remarks = request.data.get('remarks', application.remarks)

        valid_statuses = [choice[0] for choice in Application.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response(
                {"error": f"Invalid status '{new_status}'. Allowed: {', '.join(valid_statuses)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        application.status = new_status
        application.remarks = remarks
        application.save()

        return Response(ApplicationSerializer(application).data)


class PlacementResultViewSet(viewsets.ModelViewSet):
    """
    CRUD API for Placement Results.
    """
    queryset = PlacementResult.objects.all()
    serializer_class = PlacementResultSerializer

    def get_queryset(self):
        queryset = PlacementResult.objects.all()
        result_status = self.request.query_params.get('result_status', None)
        search = self.request.query_params.get('search', None)

        if result_status:
            queryset = queryset.filter(result_status__iexact=result_status)
        if search:
            queryset = queryset.filter(
                Q(application__student__name__icontains=search) |
                Q(application__student__register_number__icontains=search) |
                Q(application__placement_drive__company__company_name__icontains=search)
            )

        return queryset
