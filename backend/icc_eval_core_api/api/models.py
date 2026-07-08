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
        if self.core_projects and '*' in self.core_projects:
            return f"{self.orcid} -> all projects"
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


class Opportunity(models.Model):
    """
    Represents an opportunity from opportunities.json.
    """
    id = models.CharField(max_length=20, primary_key=True)
    prefix = models.CharField(max_length=20)
    activity_code = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        db_table = 'opportunities'

    def __str__(self):
        return self.id


class Project(models.Model):
    """
    Represents an individual grant project from projects.json.
    """
    id = models.CharField(max_length=32, primary_key=True)
    core_project = models.ForeignKey(
        CoreProject,
        on_delete=models.CASCADE,
        related_name='project_records',
        db_column='core_project_id',
    )
    name = models.TextField()
    opportunity = models.ForeignKey(
        Opportunity,
        on_delete=models.SET_NULL,
        related_name='projects',
        db_column='opportunity_id',
        blank=True,
        null=True,
    )
    application = models.BigIntegerField(unique=True)
    award_amount = models.DecimalField(max_digits=15, decimal_places=2)
    activity_code = models.CharField(max_length=20)
    agency_code = models.CharField(max_length=20)
    date_start = models.DateTimeField()
    date_end = models.DateTimeField()
    is_active = models.BooleanField(default=False)

    class Meta:
        db_table = 'projects'

    def __str__(self):
        return f"{self.id} - {self.name}"


class Journal(models.Model):
    """
    Represents a journal from journals.json.
    """
    abbrev = models.CharField(max_length=64, primary_key=True)
    name = models.TextField()
    issn = models.CharField(max_length=32, blank=True, null=True)
    title = models.CharField(max_length=255)
    rank = models.FloatField(default=0)

    class Meta:
        db_table = 'journals'

    def __str__(self):
        return self.abbrev


class Publication(models.Model):
    """
    Represents a publication from publications.json.
    """
    id = models.BigIntegerField(primary_key=True)
    core_project = models.ForeignKey(
        CoreProject,
        on_delete=models.CASCADE,
        related_name='publication_records',
        db_column='core_project_id',
    )
    application = models.BigIntegerField()
    title = models.TextField()
    authors = models.JSONField(default=list)
    journal = models.ForeignKey(
        Journal,
        on_delete=models.SET_NULL,
        related_name='publications',
        db_column='journal_abbrev',
        to_field='abbrev',
        blank=True,
        null=True,
    )
    year = models.PositiveIntegerField()
    modified = models.DateTimeField()
    doi = models.CharField(max_length=255, blank=True, null=True)
    relative_citation_ratio = models.FloatField(default=0)
    citations = models.IntegerField(default=0)
    citations_per_year = models.FloatField(default=0)

    class Meta:
        db_table = 'publications'

    def __str__(self):
        return f"{self.id} - {self.title}"


class DRCCode(models.Model):
    """
    Represents DRC code entries from drc-code.json.
    """
    url = models.TextField()
    dir = models.TextField()
    name = models.CharField(max_length=255)
    ext = models.CharField(max_length=32, blank=True)
    type = models.CharField(max_length=100)
    date = models.DateTimeField(blank=True, null=True)
    files = models.JSONField(default=list)

    class Meta:
        db_table = 'drc_code'
        verbose_name_plural = 'DRC Code'

    def __str__(self):
        return self.name


class DRCDCC(models.Model):
    """
    Represents DRC DCC entries from drc-dcc.json.
    """
    url = models.TextField()
    dir = models.TextField()
    name = models.CharField(max_length=255, blank=True)
    ext = models.CharField(max_length=32, blank=True)
    date = models.DateTimeField(blank=True, null=True)
    files = models.JSONField(default=list)

    class Meta:
        db_table = 'drc_dcc'
        verbose_name_plural = 'DRC DCC'

    def __str__(self):
        return self.name or self.url


class DRCFile(models.Model):
    """
    Represents DRC file entries from drc-file.json.
    """
    url = models.TextField()
    dir = models.TextField()
    name = models.CharField(max_length=255)
    ext = models.CharField(max_length=32, blank=True)
    size = models.BigIntegerField(default=0)
    date = models.DateTimeField(blank=True, null=True)
    files = models.JSONField(default=list)

    class Meta:
        db_table = 'drc_file'
        verbose_name_plural = 'DRC Files'

    def __str__(self):
        return self.name


class AnalyticsOverview(models.Model):
    """
    Represents aggregate analytics metrics from analytics-overview.json.
    """
    over_time = models.JSONField(default=dict)
    top_continents = models.JSONField(default=dict)
    top_countries = models.JSONField(default=dict)
    top_regions = models.JSONField(default=dict)
    top_cities = models.JSONField(default=dict)
    top_languages = models.JSONField(default=dict)
    top_devices = models.JSONField(default=dict)
    top_oses = models.JSONField(default=dict)

    class Meta:
        db_table = 'analytics_overview'
        verbose_name_plural = 'Analytics Overview'

    def __str__(self):
        return f"AnalyticsOverview {self.pk}"


class RepositoryOverview(models.Model):
    """
    Represents aggregate repository metrics from repos-overview.json.
    """
    repos = models.IntegerField(default=0)
    stars = models.IntegerField(default=0)
    forks = models.IntegerField(default=0)
    watchers = models.IntegerField(default=0)
    commits = models.IntegerField(default=0)
    open_issues = models.IntegerField(default=0)
    closed_issues = models.IntegerField(default=0)
    open_pull_requests = models.IntegerField(default=0)
    closed_pull_requests = models.IntegerField(default=0)
    readme = models.IntegerField(default=0)
    contributing = models.IntegerField(default=0)
    code_of_conduct = models.IntegerField(default=0)
    contributors = models.IntegerField(default=0)
    licenses = models.JSONField(default=dict)
    languages = models.JSONField(default=dict)

    class Meta:
        db_table = 'repository_overview'
        verbose_name_plural = 'Repository Overview'

    def __str__(self):
        return f"RepositoryOverview {self.pk}"


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
    
    # Dimension metrics
    continents = models.JSONField(default=dict)
    countries = models.JSONField(default=dict)
    regions = models.JSONField(default=dict)
    cities = models.JSONField(default=dict)
    languages = models.JSONField(default=dict)
    devices = models.JSONField(default=dict)
    operating_systems = models.JSONField(default=dict)
    page_views = models.JSONField(default=dict)

    class Meta:
        db_table = 'analytics'
        verbose_name_plural = "Analytics"

    def __str__(self):
        return f"{self.property_name} - {self.core_project_id}"
