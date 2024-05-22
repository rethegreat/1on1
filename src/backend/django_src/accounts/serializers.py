from rest_framework import serializers
from django.contrib.auth import get_user_model

user_model = get_user_model()


class ProfileUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = user_model
        fields = ('username', 'email', 'first_name', 'last_name', 
                  'password', 'streak_count', 'analytics_data',)

    def create(self, validated_data):
        user_instance = user_model.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
        )
        user_instance.set_password(validated_data['password'])
        user_instance.save()
        return user_instance
    
    def update(self, instance, validated_data):
        # Password update is handled separately
        validated_data.pop('analytics_data', None)
        validated_data.pop('streak_count', None)
        
        instance = super(ProfileUserSerializer, self).update(instance, validated_data)
        
        password = validated_data.pop('password', None)

        if password:
            instance.set_password(password)
        instance.save()
        return instance

class LoginUserSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True)