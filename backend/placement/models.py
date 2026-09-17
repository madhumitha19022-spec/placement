from decimal import Decimal
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator


class Student(models.Model):
    """
    Represents a student enrolled in college applying for campus placements.
    Optionally linked to Django User for authentication and profile management.
    """
    DEPARTMENT_CHOICES = [
        ('CSE', 'Computer Science and Engineering'),
        ('IT', 'Information Technology'),
        ('ECE', 'Electronics and Communication'),
        ('EEE', 'Electrical and Electronics'),
        ('MECH', 'Mechanical Engineering'),
        ('CIVIL', 'Civil Engineering'),
        ('AIDS', 'Artificial Intelligence & Data Science'),
    ]

    YEAR_CHOICES = [
        (1, '1st Year'),
        (2, '2nd Year'),
        (3, '3rd Year'),
        (4, '4th Year / Final Year'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile', null=True, blank=True)
    register_number = models.CharField(max_length=30, unique=True, help_text="College registration or roll number")
    name = models.CharField(max_length=120)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15)
    department = models.CharField(max_length=50, choices=DEPARTMENT_CHOICES)
    year = models.IntegerField(default=4, choices=YEAR_CHOICES)
    cgpa = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00')), MaxValueValidator(Decimal('10.00'))],
        help_text="Cumulative GPA between 0.00 and 10.00"
    )
    skills = models.TextField(blank=True, help_text="Comma-separated or listed skills, e.g. Python, React, SQL")
    resume = models.CharField(max_length=255, blank=True, help_text="Resume link or document URL")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['register_number']

    def __str__(self):
        return f"{self.register_number} - {self.name} ({self.department})"


class Company(models.Model):
    """
    Represents a recruiting organization participating in campus placement drives.
    """
    company_name = models.CharField(max_length=150, unique=True)
    description = models.TextField(help_text="Overview of company, domain, and culture")
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    website = models.URLField(blank=True)
    location = models.CharField(max_length=150)
    industry = models.CharField(max_length=100, help_text="e.g. Information Technology, FinTech, Consulting")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Companies"
        ordering = ['company_name']

    def __str__(self):
        return self.company_name


class PlacementDrive(models.Model):
    """
    Represents an active or upcoming campus recruitment drive hosted by a company.
    """
    STATUS_CHOICES = [
        ('Upcoming', 'Upcoming'),
        ('Ongoing', 'Ongoing'),
        ('Completed', 'Completed'),
        ('Cancelled', 'Cancelled'),
    ]

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='drives')
    job_role = models.CharField(max_length=150)
    description = models.TextField()
    package = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text="CTC Package in Lakhs Per Annum (LPA), e.g. 8.50"
    )
    eligibility_cgpa = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00')), MaxValueValidator(Decimal('10.00'))],
        help_text="Minimum CGPA required to apply"
    )
    eligible_department = models.CharField(
        max_length=120,
        default='All',
        help_text="Comma-separated departments or 'All' (e.g. 'CSE,IT,ECE' or 'All')"
    )
    drive_date = models.DateField(help_text="Date when recruitment drive begins")
    application_deadline = models.DateField(help_text="Last date for students to submit applications")
    vacancies = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Upcoming')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-drive_date', '-created_at']

    def __str__(self):
        return f"{self.company.company_name} - {self.job_role} ({self.status})"


class Application(models.Model):
    """
    Represents a student's application for a specific placement drive.
    Constrained to prevent duplicate applications.
    """
    STATUS_CHOICES = [
        ('Applied', 'Applied'),
        ('Shortlisted', 'Shortlisted'),
        ('Interview', 'Interview'),
        ('Selected', 'Selected'),
        ('Rejected', 'Rejected'),
    ]

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='applications')
    placement_drive = models.ForeignKey(PlacementDrive, on_delete=models.CASCADE, related_name='applications')
    application_date = models.DateField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Applied')
    remarks = models.TextField(blank=True, help_text="Officer or reviewer comments")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('student', 'placement_drive')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.student.register_number} applied for {self.placement_drive.company.company_name} ({self.status})"


class PlacementResult(models.Model):
    """
    Records the final selection result, offered CTC, and joining details for an application.
    """
    RESULT_STATUS_CHOICES = [
        ('Selected', 'Selected'),
        ('Not Selected', 'Not Selected'),
    ]

    application = models.OneToOneField(Application, on_delete=models.CASCADE, related_name='result')
    result_status = models.CharField(max_length=20, choices=RESULT_STATUS_CHOICES, default='Selected')
    package = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Final Offered CTC in LPA"
    )
    joining_date = models.DateField(null=True, blank=True, help_text="Expected date of joining")
    remarks = models.TextField(blank=True, help_text="Placement cell or HR comments")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.application.student.name} - {self.application.placement_drive.company.company_name}: {self.result_status}"
