from rest_framework import serializers
from api.models import Officer
from .user_serializer import PublicUserSerializer


class OfficerSerializer(serializers.ModelSerializer):
    """Serializer for Officer model."""
    
    user = PublicUserSerializer(read_only=True)
    full_name = serializers.CharField(source='user.full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = Officer
        fields = [
            'id',
            'user',
            'name',
            'full_name',
            'user_email',
            'position',
            'bio',
            'image_url',
            'linkedin_url',
            'email',
            'order_index'
        ]
        read_only_fields = ['id', 'user', 'full_name', 'user_email']
    
    def to_representation(self, instance):
        """Custom representation to handle null user fields."""
        data = super().to_representation(instance)
        
        # If no user is linked, set user fields to None
        if not instance.user:
            data['user'] = None
            data['full_name'] = None
            data['user_email'] = None
        
        return data
    
    def validate_position(self, value):
        """Validate position length and content."""
        if not value or len(value.strip()) < 2:
            raise serializers.ValidationError("Position must be at least 2 characters long.")
        return value.strip()
    
    def validate_image_url(self, value):
        """Validate image URL format."""
        if value and not (value.startswith('http://') or value.startswith('https://')):
            raise serializers.ValidationError("Image URL must start with http:// or https://")
        return value
    
    def validate_linkedin_url(self, value):
        """Validate LinkedIn URL format."""
        if value and not (value.startswith('http://') or value.startswith('https://')):
            raise serializers.ValidationError("LinkedIn URL must start with http:// or https://")
        return value


class OfficerCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating officer profiles."""
    
    class Meta:
        model = Officer
        fields = ['name', 'position', 'bio', 'image_url', 'linkedin_url', 'email', 'order_index'] 
    
    def validate_name(self, value):
        """Validate name length and content."""
        if not value or len(value.strip()) < 2:
            raise serializers.ValidationError("Name must be at least 2 characters long.")
        return value.strip()
    
    def validate_position(self, value):
        """Validate position length and content."""
        if not value or len(value.strip()) < 2:
            raise serializers.ValidationError("Position must be at least 2 characters long.")
        return value.strip()
    
    def validate_image_url(self, value):
        """Validate image URL format - allow base64 data URLs and regular URLs."""
        if value:
            # Allow base64 data URLs for uploaded images
            if value.startswith('data:image/'):
                return value
            # Allow regular HTTP/HTTPS URLs
            elif value.startswith(('http://', 'https://')):
                return value
            # Allow empty string
            elif value.strip() == '':
                return ''
            else:
                raise serializers.ValidationError("Image must be a valid HTTP/HTTPS URL or base64 data URL")
        return value
    
    def validate_linkedin_url(self, value):
        """Validate LinkedIn URL format."""
        if value and value.strip() and not (value.startswith('http://') or value.startswith('https://')):
            raise serializers.ValidationError("LinkedIn URL must start with http:// or https://")
        return value


class OfficerUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating officer profiles."""
    
    class Meta:
        model = Officer
        fields = ['name', 'position', 'bio', 'image_url', 'linkedin_url', 'email', 'order_index']
    
    def validate_position(self, value):
        """Validate position length and content."""
        if value is not None and len(value.strip()) < 2:
            raise serializers.ValidationError("Position must be at least 2 characters long.")
        return value.strip() if value else value
    
    def validate_image_url(self, value):
        """Validate image URL format."""
        if value and not (value.startswith('http://') or value.startswith('https://')):
            raise serializers.ValidationError("Image URL must start with http:// or https://")
        return value
    
    def validate_linkedin_url(self, value):
        """Validate LinkedIn URL format."""
        if value and not (value.startswith('http://') or value.startswith('https://')):
            raise serializers.ValidationError("LinkedIn URL must start with http:// or https://")
        return value


class OfficerReorderSerializer(serializers.Serializer):
    """Serializer for reordering officers."""
    
    officer_orders = serializers.ListField(
        child=serializers.DictField(
            child=serializers.IntegerField()
        )
    )
    
    def validate_officer_orders(self, value):
        """Validate officer order data."""
        for item in value:
            if 'id' not in item or 'order_index' not in item:
                raise serializers.ValidationError(
                    "Each item must have 'id' and 'order_index' fields."
                )
        return value 