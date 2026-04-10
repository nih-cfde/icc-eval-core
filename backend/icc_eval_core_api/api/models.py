from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    """
    Adds project-specific fields to the default Django user model.

    At the moment this is a placeholder, but it's easier to start with a custom
    user model from the beginning to avoid complications later on.
    """
    
    orcid = models.CharField(
        max_length=19,
        blank=True,
        null=True,
        unique=True,
        help_text="ORCID identifier (e.g., 0000-0002-1825-0097)"
    )

    def __str__(self):
        if self.orcid:
            return f"{self.username} (ORCID: {self.orcid})"
        return self.username
    
class ORCIDProjectMap(models.Model):
    """
    Maps ORCID identifiers to lists of core project IDs.
    This model is used to store the data from orcid-project-map.json.
    """
    orcid = models.CharField(max_length=19, primary_key=True)
    core_projects = models.JSONField(default=list)

    class Meta:
        db_table = 'orcid_project_map'
        verbose_name_plural = "ORCID-Project Maps"

    def __str__(self):
        return f"{self.orcid} -> {len(self.core_projects)} projects"


class CoreProject(models.Model):
    """
    Represents a core project from core-projects.json.
    """
    id = models.CharField(max_length=50, primary_key=True)
    name = models.TextField()
    activity_code = models.CharField(max_length=10)
    projects = models.JSONField(default=list)
    award_amount = models.DecimalField(max_digits=15, decimal_places=2)
    publications = models.IntegerField(default=0)
    repos = models.IntegerField(default=0)
    analytics = models.IntegerField(default=0)

    class Meta:
        db_table = 'core_projects'

    def __str__(self):
        return f"{self.id} - {self.name}"


class Repository(models.Model):
    """
    Represents a repository from repos.json.
    """
    core_project = models.ForeignKey(
        CoreProject,
        on_delete=models.CASCADE,
        related_name='repositories',
        db_column='core_project_id'
    )
    id = models.BigIntegerField(primary_key=True)
    owner = models.CharField(max_length=255)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    topics = models.JSONField(default=list)
    created = models.DateTimeField()
    modified = models.DateTimeField()
    
    # Array fields stored as JSON
    stars = models.JSONField(default=list)
    forks = models.JSONField(default=list)
    watchers = models.JSONField(default=list)
    commits = models.JSONField(default=list)
    issues = models.JSONField(default=list)
    pull_requests = models.JSONField(default=list)
    contributors = models.JSONField(default=list)
    
    # Metrics
    open_issues = models.IntegerField(default=0)
    closed_issues = models.IntegerField(default=0)
    issue_time_open = models.JSONField(default=dict)
    open_pull_requests = models.IntegerField(default=0)
    closed_pull_requests = models.IntegerField(default=0)
    pull_request_time_open = models.JSONField(default=dict)
    
    # Repository files
    readme = models.BooleanField(default=False)
    contributing = models.BooleanField(default=False)
    code_of_conduct = models.BooleanField(default=False)
    license = models.CharField(max_length=255, blank=True, null=True)
    
    # Languages and dependencies
    languages = models.JSONField(default=dict)
    dependencies = models.JSONField(default=dict)

    class Meta:
        db_table = 'repositories'
        verbose_name_plural = "Repositories"

    def __str__(self):
        return f"{self.owner}/{self.name}"


class Analytics(models.Model):
    """
    Represents analytics data from analytics.json.
    """
    property = models.CharField(max_length=255)
    property_name = models.CharField(max_length=255)
    core_project = models.ForeignKey(
        CoreProject,
        on_delete=models.SET_NULL,
        related_name='analytics_data',
        db_column='core_project_id',
        blank=True,
        null=True,
    )
    
    # Time-series data
    over_time = models.JSONField(default=dict)
    
    # Top metrics
    top_continents = models.JSONField(default=dict)
    top_countries = models.JSONField(default=dict)
    top_regions = models.JSONField(default=dict)
    top_cities = models.JSONField(default=dict)
    top_languages = models.JSONField(default=dict)
    top_devices = models.JSONField(default=dict)
    top_oses = models.JSONField(default=dict)

    class Meta:
        db_table = 'analytics'
        verbose_name_plural = "Analytics"

    def __str__(self):
        return f"{self.property_name} - {self.core_project_id}"
