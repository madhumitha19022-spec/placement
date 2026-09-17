from django.contrib import admin
from .models import Student, Company, PlacementDrive, Application, PlacementResult


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('register_number', 'name', 'department', 'year', 'cgpa', 'phone', 'email')
    search_fields = ('register_number', 'name', 'email', 'skills')
    list_filter = ('department', 'year')
    ordering = ('register_number',)


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ('company_name', 'industry', 'location', 'email', 'phone', 'website')
    search_fields = ('company_name', 'industry', 'location')
    list_filter = ('industry',)


@admin.register(PlacementDrive)
class PlacementDriveAdmin(admin.ModelAdmin):
    list_display = ('company', 'job_role', 'package', 'eligibility_cgpa', 'drive_date', 'application_deadline', 'status')
    search_fields = ('job_role', 'company__company_name')
    list_filter = ('status', 'company')
    date_hierarchy = 'drive_date'


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ('student', 'placement_drive', 'status', 'application_date')
    search_fields = ('student__name', 'student__register_number', 'placement_drive__job_role', 'placement_drive__company__company_name')
    list_filter = ('status', 'placement_drive')


@admin.register(PlacementResult)
class PlacementResultAdmin(admin.ModelAdmin):
    list_display = ('get_student', 'get_company', 'result_status', 'package', 'joining_date')
    search_fields = ('application__student__name', 'application__placement_drive__company__company_name')
    list_filter = ('result_status',)

    def get_student(self, obj):
        return obj.application.student.name
    get_student.short_description = 'Student'

    def get_company(self, obj):
        return obj.application.placement_drive.company.company_name
    get_company.short_description = 'Company'
