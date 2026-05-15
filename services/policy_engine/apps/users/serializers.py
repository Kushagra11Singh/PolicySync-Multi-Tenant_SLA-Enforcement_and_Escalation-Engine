from rest_framework import serializers
from shared.models import User, UserRole


class UserSerializer(serializers.ModelSerializer):
    tenant_name = serializers.CharField(source="tenant.name", read_only=True)

    class Meta:
        model = User
        fields = [
            "id", "email", "full_name", "role",
            "tenant_name", "is_active", "created_at",
        ]
        read_only_fields = ["id", "created_at", "tenant_name"]


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["email", "full_name", "password", "role"]

    def validate_role(self, value):
        requesting_user = self.context["request"].user
        if value == UserRole.ADMIN and not requesting_user.is_superuser:
            raise serializers.ValidationError("Cannot self-assign admin role.")
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        tenant = self.context["request"].user.tenant
        return User.objects.create_user(
            tenant=tenant, password=password, **validated_data
        )


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, data):
        from django.contrib.auth import authenticate
        user = authenticate(username=data["email"], password=data["password"])
        if not user:
            raise serializers.ValidationError("Invalid email or password.")
        if not user.is_active:
            raise serializers.ValidationError("This account is disabled.")
        data["user"] = user
        return data
