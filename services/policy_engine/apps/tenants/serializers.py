from rest_framework import serializers
from shared.models import Tenant, TenantSetting


class TenantSerializer(serializers.ModelSerializer):
    user_count = serializers.SerializerMethodField()
    active_policies = serializers.SerializerMethodField()

    class Meta:
        model = Tenant
        fields = [
            "id", "name", "slug", "is_active",
            "user_count", "active_policies", "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def get_user_count(self, obj):
        return obj.users.filter(is_active=True).count()

    def get_active_policies(self, obj):
        return obj.sla_policies.filter(is_active=True).count()


class TenantCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = ["name", "slug"]

    def validate_slug(self, value):
        value = value.lower().strip()
        if Tenant.objects.filter(slug=value).exists():
            raise serializers.ValidationError("This slug is already taken.")
        return value


class TenantSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = TenantSetting
        fields = ["id", "key", "value", "updated_at"]
        read_only_fields = ["id", "updated_at"]
