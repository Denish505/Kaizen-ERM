from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Department, Designation, Skill, UserSkill

User = get_user_model()


class DepartmentSerializer(serializers.ModelSerializer):
    employee_count = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = '__all__'

    def get_employee_count(self, obj):
        return obj.user_set.filter(is_active=True).count()


class DesignationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Designation
        fields = '__all__'


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = '__all__'


class UserSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    designation_title = serializers.CharField(source='designation.title', read_only=True)
    full_name = serializers.SerializerMethodField()
    monthly_salary = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name', 'phone',
            'role', 'department', 'department_name', 'designation', 'designation_title',
            'avatar', 'avatar_image', 'date_of_birth', 'address', 'city', 'state', 'pincode',
            'pan_number', 'aadhaar_number', 'bank_account', 'ifsc_code',
            'pf_number', 'uan_number', 'esi_number', 'base_salary', 'monthly_salary',
            'joining_date', 'is_active', 'date_joined'
        ]
        extra_kwargs = {
            'pan_number': {'write_only': True},
            'aadhaar_number': {'write_only': True},
            'bank_account': {'write_only': True},
        }

    def get_full_name(self, obj):
        return obj.get_full_name()


class UserMinimalSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'full_name', 'avatar', 'role']

    def get_full_name(self, obj):
        return obj.get_full_name()


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'email', 'password', 'first_name', 'last_name', 'phone', 'role',
            'department', 'designation', 'date_of_birth', 'address', 'city',
            'state', 'pincode', 'pan_number', 'aadhaar_number', 'bank_account',
            'ifsc_code', 'pf_number', 'uan_number', 'esi_number', 'base_salary', 'joining_date'
        ]

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        # Generate avatar from initials
        user.avatar = f"{user.first_name[0]}{user.last_name[0]}".upper() if user.first_name and user.last_name else "U"
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is not correct")
        return value
