from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'ceo')
        return self.create_user(email, password, **extra_fields)


class Department(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=10, unique=True)
    description = models.TextField(blank=True)
    head = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, blank=True, related_name='headed_departments')
    location = models.CharField(max_length=100, default='Mumbai')  # Indian cities
    budget = models.DecimalField(max_digits=12, decimal_places=2, default=0)  # INR
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']


class Designation(models.Model):
    title = models.CharField(max_length=100)
    level = models.IntegerField(default=1)  # 1=Entry, 2=Mid, 3=Senior, 4=Lead, 5=Manager, 6=Director, 7=VP, 8=C-Level
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='designations', null=True)
    min_salary = models.DecimalField(max_digits=10, decimal_places=2, default=300000)  # INR Annual
    max_salary = models.DecimalField(max_digits=10, decimal_places=2, default=1200000)  # INR Annual

    def __str__(self):
        return self.title


class User(AbstractUser):
    ROLE_CHOICES = [
        ('ceo', 'Chief Executive Officer'),
        ('stakeholder', 'Stakeholder/Board Member'),
        ('hr', 'HR Manager'),
        ('project_manager', 'Project Manager'),
        ('employee', 'Employee'),
    ]

    username = None
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15, blank=True)  # Indian format: +91-XXXXXXXXXX
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='employee')
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True)
    designation = models.ForeignKey(Designation, on_delete=models.SET_NULL, null=True, blank=True)
    avatar = models.CharField(max_length=5, blank=True)  # Initials
    avatar_image = models.ImageField(upload_to='avatars/', null=True, blank=True)  # Profile photo
    date_of_birth = models.DateField(null=True, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=50, blank=True)  # Mumbai, Delhi, Bangalore, etc.
    state = models.CharField(max_length=50, blank=True)  # Maharashtra, Karnataka, etc.
    pincode = models.CharField(max_length=10, blank=True)  # Indian PIN code
    
    # India-specific fields
    pan_number = models.CharField(max_length=10, blank=True)  # PAN Card
    aadhaar_number = models.CharField(max_length=12, blank=True)  # Aadhaar
    bank_account = models.CharField(max_length=20, blank=True)
    ifsc_code = models.CharField(max_length=11, blank=True)
    pf_number = models.CharField(max_length=22, blank=True)  # Provident Fund
    uan_number = models.CharField(max_length=12, blank=True)  # Universal Account Number
    esi_number = models.CharField(max_length=17, blank=True)  # ESI Number

    # Salary in INR
    base_salary = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # Annual INR
    
    joining_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def monthly_salary(self):
        return self.base_salary / 12 if self.base_salary else 0


class Skill(models.Model):
    name = models.CharField(max_length=50)
    category = models.CharField(max_length=50, blank=True)

    def __str__(self):
        return self.name


class UserSkill(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='skills')
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE)
    proficiency = models.IntegerField(default=3)  # 1-5 scale

    class Meta:
        unique_together = ['user', 'skill']
