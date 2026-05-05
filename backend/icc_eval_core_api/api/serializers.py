from rest_framework import serializers
from .models import User, CoreProject, Repository, Analytics


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for the User model.
    """
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'orcid', 'is_staff', 'is_active', 'date_joined']
        read_only_fields = ['id', 'date_joined', 'orcid']


class CoreProjectSerializer(serializers.ModelSerializer):
    """
    Serializer for the CoreProject model.
    """

    award_amount = serializers.DecimalField(max_digits=15, decimal_places=2, coerce_to_string=False)

    class Meta:
        model = CoreProject
        fields = [
            'id',
            'name',
            'activity_code',
            'projects',
            'award_amount',
            'publications',
            'repos',
            'analytics',
        ]

class RepositoryListSerializer(serializers.ModelSerializer):
    """
    Serializer for the Repository model (list view).

    Removes the followng lengthy list fields for a faster response:
    - stars
    - forks
    - commits
    - issues
    - pull_requests
    """
    core_project = serializers.CharField(source='core_project.id', read_only=True)
    
    class Meta:
        model = Repository
        fields = [
            'id',
            'core_project',
            'owner',
            'name',
            'description',
            'topics',
            'created',
            'modified',
            'watchers',
            'contributors',
            'open_issues',
            'closed_issues',
            'issue_time_open',
            'open_pull_requests',
            'closed_pull_requests',
            'pull_request_time_open',
            'readme',
            'contributing',
            'code_of_conduct',
            'license',
            'languages',
            'dependencies',
        ]


class RepositorySerializer(serializers.ModelSerializer):
    """
    Serializer for the Repository model.
    """
    core_project = serializers.CharField(source='core_project.id', read_only=True)
    
    class Meta:
        model = Repository
        fields = [
            'id',
            'core_project',
            'owner',
            'name',
            'description',
            'topics',
            'created',
            'modified',
            'stars',
            'forks',
            'watchers',
            'commits',
            'issues',
            'pull_requests',
            'contributors',
            'open_issues',
            'closed_issues',
            'issue_time_open',
            'open_pull_requests',
            'closed_pull_requests',
            'pull_request_time_open',
            'readme',
            'contributing',
            'code_of_conduct',
            'license',
            'languages',
            'dependencies',
        ]


class AnalyticsSerializer(serializers.ModelSerializer):
    """
    Serializer for the Analytics model.
    """
    core_project = serializers.CharField(source='core_project.id', read_only=True)
    
    class Meta:
        model = Analytics
        fields = [
            'id',
            'property',
            'property_name',
            'core_project',
            'over_time',
            'top_continents',
            'top_countries',
            'top_regions',
            'top_cities',
            'top_languages',
            'top_devices',
            'top_oses',
        ]
