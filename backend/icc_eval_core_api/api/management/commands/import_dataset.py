import json
import os
from datetime import datetime, time
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from django.utils.dateparse import parse_date, parse_datetime
from api.models import (
    Analytics,
    AnalyticsOverview,
    AnalyticsBreakdownUsers,
    AnalyticsBreakdownUsersEvents,
    CoreProject,
    DRCDCC,
    DRCCode,
    DRCFile,
    Journal,
    Opportunity,
    ORCIDProjectMap,
    Project,
    Publication,
    Repository,
    RepositoryOverview,
)


class Command(BaseCommand):
    help = 'Import dataset from JSON files in a specified folder'

    def add_arguments(self, parser):
        parser.add_argument(
            'folder_path',
            type=str,
            help='Path to the folder containing JSON files'
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before importing'
        )

    def handle(self, *args, **options):
        folder_path = options['folder_path']
        
        if not os.path.isdir(folder_path):
            self.stdout.write(self.style.ERROR(f'Error: {folder_path} is not a valid directory'))
            return
        
        if options['clear']:
            self.stdout.write(self.style.WARNING('Clearing existing data...'))
            with transaction.atomic():
                AnalyticsBreakdownUsers.objects.all().delete()
                AnalyticsBreakdownUsersEvents.objects.all().delete()
                AnalyticsOverview.objects.all().delete()
                Analytics.objects.all().delete()
                RepositoryOverview.objects.all().delete()
                Repository.objects.all().delete()
                Publication.objects.all().delete()
                Project.objects.all().delete()
                Journal.objects.all().delete()
                Opportunity.objects.all().delete()
                DRCCode.objects.all().delete()
                DRCDCC.objects.all().delete()
                DRCFile.objects.all().delete()
                ORCIDProjectMap.objects.all().delete()
                CoreProject.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('Existing data cleared'))
        
        # Import in order of dependencies
        self.import_core_projects(folder_path)
        self.import_opportunities(folder_path)
        self.import_projects(folder_path)
        self.import_journals(folder_path)
        self.import_publications(folder_path)
        self.import_repositories(folder_path)
        AnalyticsBreakdownUsersEvents.objects.all().delete()
        AnalyticsBreakdownUsers.objects.all().delete()
        self.import_analytics(folder_path)
        self.import_repository_overview(folder_path)
        self.import_analytics_overview(folder_path)
        self.import_drc_code(folder_path)
        self.import_drc_dcc(folder_path)
        self.import_drc_file(folder_path)
        self.import_orcid_project_map(folder_path)
        
        self.stdout.write(self.style.SUCCESS('All data imported successfully'))


    # =====================================================================================
    # === methods for loading JSON files into database models
    # =====================================================================================

    def _to_datetime_or_none(self, value):
        """
        Convert imported values into timezone-aware datetimes.
        Date-only inputs are interpreted as midnight in Django's default timezone.
        """
        if not value:
            return None

        if isinstance(value, datetime):
            dt = value
        elif isinstance(value, str):
            dt = parse_datetime(value)
            if dt is None:
                parsed_date = parse_date(value)
                if parsed_date is None:
                    return value
                dt = datetime.combine(parsed_date, time.min)
        else:
            return value

        if timezone.is_naive(dt):
            return timezone.make_aware(dt, timezone.get_default_timezone())
        return dt

    def get_analytics_breakdown_users(self, item, key):
        data = item.get(key, {})
        return AnalyticsBreakdownUsers.objects.create(
            active_users=data.get('activeUsers', {}),
            new_users=data.get('newUsers', {}),
            returning_users=data.get('returningUsers', {}),
        )

    def get_analytics_breakdown_users_events(self, item, key):
        data = item.get(key, {})
        return AnalyticsBreakdownUsersEvents.objects.create(
            active_users=data.get('activeUsers', {}),
            new_users=data.get('newUsers', {}),
            returning_users=data.get('returningUsers', {}),
            engaged_sessions=data.get('engagedSessions', {}),
        )

    def import_core_projects(self, folder_path):
        file_path = os.path.join(folder_path, 'core-projects.json')
        
        if not os.path.exists(file_path):
            self.stdout.write(self.style.WARNING(f'Skipping: {file_path} not found'))
            return
        
        self.stdout.write(f'Importing core projects from {file_path}...')
        
        with open(file_path, 'r') as file:
            data = json.load(file)
        
        with transaction.atomic():
            for item in data:
                CoreProject.objects.update_or_create(
                    id=item['id'],
                    defaults={
                        'name': item['name'],
                        'activity_code': item['activityCode'],
                        'projects': item['projects'],
                        'award_amount': item['awardAmount'],
                        'publications': item.get('publications', 0),
                        'repositories': item.get('repositories', 0),
                        'analytics': item.get('analytics', 0),
                    }
                )
        
        self.stdout.write(self.style.SUCCESS(f'Imported {len(data)} core projects'))

    def import_repositories(self, folder_path):
        try:
            file_path = os.path.join(folder_path, 'repositories.json')

            if not os.path.exists(file_path):
                raise FileNotFoundError('repositories.json')

        except FileNotFoundError:
            self.stdout.write(self.style.WARNING(f'Skipping: {file_path} not found'))
            return
        
        self.stdout.write(f'Importing repositories from {file_path}...')
        
        with open(file_path, 'r') as file:
            data = json.load(file)
        
        count = 0

        with transaction.atomic():
            for item in data:
                # Get or skip if core project doesn't exist
                try:
                    core_project = CoreProject.objects.get(id=item['coreProject'])
                except CoreProject.DoesNotExist:
                    self.stdout.write(
                        self.style.WARNING(
                            f'Skipping repository {item["owner"]}/{item["name"]}: '
                            f'Core project {item["coreProject"]} not found'
                        )
                    )
                    continue
                
                Repository.objects.update_or_create(
                    id=item['id'],
                    defaults={
                        'core_project': core_project,
                        'owner': item['owner'],
                        'name': item['name'],
                        'description': item.get('description', ''),
                        'topics': item.get('topics', []),
                        'created': self._to_datetime_or_none(item.get('created')),
                        'modified': self._to_datetime_or_none(item.get('modified')),
                        'stars': item.get('stars', 0),
                        'forks': item.get('forks', []),
                        'watchers': item.get('watchers', 0),
                        'commits': item.get('commits', []),
                        'issues': item.get('issues', []),
                        'pull_requests': item.get('pullRequests', []),
                        'contributors': item.get('contributors', []),
                        'open_issues': item.get('openIssues', 0),
                        'closed_issues': item.get('closedIssues', 0),
                        'issue_time_open': item.get('issueTimeOpen', {}),
                        'open_pull_requests': item.get('openPullRequests', 0),
                        'closed_pull_requests': item.get('closedPullRequests', 0),
                        'pull_request_time_open': item.get('pullRequestTimeOpen', {}),
                        'readme': item.get('readme', False),
                        'contributing': item.get('contributing', False),
                        'code_of_conduct': item.get('codeOfConduct', False),
                        'license': item.get('license'),
                        'languages': item.get('languages', {}),
                        'dependencies': item.get('dependencies', {}),
                    }
                )
                count += 1
        
        self.stdout.write(self.style.SUCCESS(f'Imported {count} repositories'))

    def import_opportunities(self, folder_path):
        file_path = os.path.join(folder_path, 'opportunities.json')

        if not os.path.exists(file_path):
            self.stdout.write(self.style.WARNING(f'Skipping: {file_path} not found'))
            return

        self.stdout.write(f'Importing opportunities from {file_path}...')

        with open(file_path, 'r') as file:
            data = json.load(file)

        with transaction.atomic():
            for item in data:
                Opportunity.objects.update_or_create(
                    id=item['id'],
                    defaults={
                        'prefix': item.get('prefix', ''),
                        'activity_code': item.get('activityCode') or None,
                    }
                )

        self.stdout.write(self.style.SUCCESS(f'Imported {len(data)} opportunities'))

    def import_projects(self, folder_path):
        file_path = os.path.join(folder_path, 'projects.json')

        if not os.path.exists(file_path):
            self.stdout.write(self.style.WARNING(f'Skipping: {file_path} not found'))
            return

        self.stdout.write(f'Importing projects from {file_path}...')

        with open(file_path, 'r') as file:
            data = json.load(file)

        count = 0

        with transaction.atomic():
            for item in data:
                try:
                    core_project = CoreProject.objects.get(id=item['coreProject'])
                except CoreProject.DoesNotExist:
                    self.stdout.write(
                        self.style.WARNING(
                            f'Project {item["id"]}: Core project {item["coreProject"]} not found, skipping'
                        )
                    )
                    continue

                opportunity = None
                if item.get('opportunity'):
                    try:
                        opportunity = Opportunity.objects.get(id=item['opportunity'])
                    except Opportunity.DoesNotExist:
                        self.stdout.write(
                            self.style.WARNING(
                                f'Project {item["id"]}: Opportunity {item["opportunity"]} not found, setting to null'
                            )
                        )

                Project.objects.update_or_create(
                    id=item['id'],
                    defaults={
                        'core_project': core_project,
                        'name': item['name'],
                        'opportunity': opportunity,
                        'application': item['application'],
                        'award_amount': item.get('awardAmount', 0),
                        'fiscal_year': item.get('fiscalYear', 0),
                        'activity_code': item.get('activityCode', ''),
                        'agency_code': item.get('agencyCode', ''),
                        'date_start': self._to_datetime_or_none(item.get('dateStart')),
                        'date_end': self._to_datetime_or_none(item.get('dateEnd')),
                        'is_active': bool(item.get('isActive', False)),
                    }
                )
                count += 1

        self.stdout.write(self.style.SUCCESS(f'Imported {count} projects'))

    def import_journals(self, folder_path):
        file_path = os.path.join(folder_path, 'journals.json')

        if not os.path.exists(file_path):
            self.stdout.write(self.style.WARNING(f'Skipping: {file_path} not found'))
            return

        self.stdout.write(f'Importing journals from {file_path}...')

        with open(file_path, 'r') as file:
            data = json.load(file)

        with transaction.atomic():
            for item in data:
                Journal.objects.update_or_create(
                    abbrev=item['abbrev'],
                    defaults={
                        'name': item.get('name', ''),
                        'issn': item.get('issn') or None,
                        'title': item.get('title', ''),
                        'rank': item.get('rank', 0),
                    }
                )

        self.stdout.write(self.style.SUCCESS(f'Imported {len(data)} journals'))

    def import_publications(self, folder_path):
        file_path = os.path.join(folder_path, 'publications.json')

        if not os.path.exists(file_path):
            self.stdout.write(self.style.WARNING(f'Skipping: {file_path} not found'))
            return

        self.stdout.write(f'Importing publications from {file_path}...')

        with open(file_path, 'r') as file:
            data = json.load(file)

        count = 0

        with transaction.atomic():
            for item in data:
                try:
                    core_project = CoreProject.objects.get(id=item['coreProject'])
                except CoreProject.DoesNotExist:
                    self.stdout.write(
                        self.style.WARNING(
                            f'Publication {item["id"]}: Core project {item["coreProject"]} not found, skipping'
                        )
                    )
                    continue

                journal = None
                if item.get('journal'):
                    journal = Journal.objects.filter(abbrev=item['journal']).first()

                Publication.objects.update_or_create(
                    id=item['id'],
                    defaults={
                        'core_project': core_project,
                        'application': item['application'],
                        'title': item['title'],
                        'authors': item.get('authors', []),
                        'journal': journal,
                        'year': item.get('year', 0),
                        'modified': self._to_datetime_or_none(item.get('modified')),
                        'doi': item.get('doi') or None,
                        'relative_citation_ratio': item.get('relativeCitationRatio', 0),
                        'citations': item.get('citations', 0),
                        'citations_per_year': item.get('citationsPerYear', 0),
                    }
                )
                count += 1

        self.stdout.write(self.style.SUCCESS(f'Imported {count} publications'))

    def import_analytics(self, folder_path):
        file_path = os.path.join(folder_path, 'analytics.json')
        
        if not os.path.exists(file_path):
            self.stdout.write(self.style.WARNING(f'Skipping: {file_path} not found'))
            return
        
        self.stdout.write(f'Importing analytics from {file_path}...')
        
        with open(file_path, 'r') as file:
            data = json.load(file)
        
        count = 0

        with transaction.atomic():
            for item in data:
                # Get or skip if core project doesn't exist
                try:
                    core_project = CoreProject.objects.get(id=item['coreProject'])
                except CoreProject.DoesNotExist:
                    self.stdout.write(
                        self.style.WARNING(
                            f'Analytics "{item["property"]}": '
                            f'Core project "{item["coreProject"]}" not found, setting to null'
                        )
                    )
                    core_project = None



                Analytics.objects.update_or_create(
                    property=item['property'],
                    defaults={
                        'property': item['property'],
                        'property_name': item['propertyName'],
                        'core_project': core_project,
                        'over_time': self.get_analytics_breakdown_users_events(item, 'overTime'),
                        'continents': self.get_analytics_breakdown_users_events(item, 'continents'),
                        'countries': self.get_analytics_breakdown_users_events(item, 'countries'),
                        'regions': self.get_analytics_breakdown_users_events(item, 'regions'),
                        'cities': self.get_analytics_breakdown_users_events(item, 'cities'),
                        'languages': self.get_analytics_breakdown_users_events(item, 'languages'),
                        'devices': self.get_analytics_breakdown_users_events(item, 'devices'),
                        'operating_systems': self.get_analytics_breakdown_users_events(item, 'operatingSystems'),
                        'page_views': self.get_analytics_breakdown_users(item, 'pageViews'),
                    }
                )

                count += 1
        
        self.stdout.write(self.style.SUCCESS(f'Imported {count} analytics records'))

    def import_orcid_project_map(self, folder_path):
        file_path = os.path.join(folder_path, 'users.json')

        if not os.path.exists(file_path):
            self.stdout.write(self.style.WARNING(f'Skipping: {file_path} not found'))
            return
        
        self.stdout.write(f'Importing ORCID project map from {file_path}...')
        
        with open(file_path, 'r') as file:
            data = json.load(file)
        
        with transaction.atomic():
            for orcid, core_projects in data.items():
                ORCIDProjectMap.objects.update_or_create(
                    orcid=orcid,
                    defaults={'core_projects': core_projects}
                )
        
        self.stdout.write(self.style.SUCCESS(f'Imported ORCID project map for {len(data)} ORCID identifiers'))

    def import_repository_overview(self, folder_path):
        file_path = os.path.join(folder_path, 'repositories-overview.json')

        if not os.path.exists(file_path):
            self.stdout.write(self.style.WARNING(f'Skipping: {file_path} not found'))
            return

        self.stdout.write(f'Importing repository overview from {file_path}...')

        with open(file_path, 'r') as file:
            item = json.load(file)

        RepositoryOverview.objects.update_or_create(
            id=1,
            defaults={
                'repositories': item.get('repositories', 0),
                'stars': item.get('stars', 0),
                'forks': item.get('forks', 0),
                'watchers': item.get('watchers', 0),
                'commits': item.get('commits', 0),
                'open_issues': item.get('openIssues', 0),
                'closed_issues': item.get('closedIssues', 0),
                'open_pull_requests': item.get('openPullRequests', 0),
                'closed_pull_requests': item.get('closedPullRequests', 0),
                'readme': item.get('readme', 0),
                'contributing': item.get('contributing', 0),
                'code_of_conduct': item.get('codeOfConduct', 0),
                'contributors': item.get('contributors', 0),
                'licenses': item.get('licenses', {}),
                'languages': item.get('languages', {}),
            }
        )

        self.stdout.write(self.style.SUCCESS('Imported repository overview'))

    def import_analytics_overview(self, folder_path):
        file_path = os.path.join(folder_path, 'analytics-overview.json')

        if not os.path.exists(file_path):
            self.stdout.write(self.style.WARNING(f'Skipping: {file_path} not found'))
            return

        self.stdout.write(f'Importing analytics overview from {file_path}...')

        with open(file_path, 'r') as file:
            item = json.load(file)

        AnalyticsOverview.objects.update_or_create(
            id=1,
            defaults={
                'over_time': self.get_analytics_breakdown_users_events(item, 'overTime'),
                'continents': self.get_analytics_breakdown_users_events(item, 'continents'),
                'countries': self.get_analytics_breakdown_users_events(item, 'countries'),
                'regions': self.get_analytics_breakdown_users_events(item, 'regions'),
                'cities': self.get_analytics_breakdown_users_events(item, 'cities'),
                'languages': self.get_analytics_breakdown_users_events(item, 'languages'),
                'devices': self.get_analytics_breakdown_users_events(item, 'devices'),
                'operating_systems': self.get_analytics_breakdown_users_events(item, 'operatingSystems'),
                'page_views': self.get_analytics_breakdown_users(item, 'pageViews'),
            }
        )

        self.stdout.write(self.style.SUCCESS('Imported analytics overview'))

    def import_drc_code(self, folder_path):
        file_path = os.path.join(folder_path, 'drc-code.json')

        if not os.path.exists(file_path):
            self.stdout.write(self.style.WARNING(f'Skipping: {file_path} not found'))
            return

        self.stdout.write(f'Importing DRC code from {file_path}...')

        with open(file_path, 'r') as file:
            data = json.load(file)

        with transaction.atomic():
            for item in data:
                DRCCode.objects.update_or_create(
                    url=item['url'],
                    defaults={
                        'dir': item.get('dir', ''),
                        'name': item.get('name', ''),
                        'ext': item.get('ext', ''),
                        'type': item.get('type', ''),
                        'date': self._to_datetime_or_none(item.get('date')),
                        'files': item.get('files', []),
                    }
                )

        self.stdout.write(self.style.SUCCESS(f'Imported {len(data)} DRC code entries'))

    def import_drc_dcc(self, folder_path):
        file_path = os.path.join(folder_path, 'drc-dcc.json')

        if not os.path.exists(file_path):
            self.stdout.write(self.style.WARNING(f'Skipping: {file_path} not found'))
            return

        self.stdout.write(f'Importing DRC DCC from {file_path}...')

        with open(file_path, 'r') as file:
            data = json.load(file)

        with transaction.atomic():
            for item in data:
                DRCDCC.objects.update_or_create(
                    url=item['url'],
                    defaults={
                        'dir': item.get('dir', ''),
                        'name': item.get('name', ''),
                        'ext': item.get('ext', ''),
                        'date': self._to_datetime_or_none(item.get('date')),
                        'files': item.get('files', []),
                    }
                )

        self.stdout.write(self.style.SUCCESS(f'Imported {len(data)} DRC DCC entries'))

    def import_drc_file(self, folder_path):
        file_path = os.path.join(folder_path, 'drc-file.json')

        if not os.path.exists(file_path):
            self.stdout.write(self.style.WARNING(f'Skipping: {file_path} not found'))
            return

        self.stdout.write(f'Importing DRC file entries from {file_path}...')

        with open(file_path, 'r') as file:
            data = json.load(file)

        with transaction.atomic():
            for item in data:
                DRCFile.objects.update_or_create(
                    url=item['url'],
                    defaults={
                        'dir': item.get('dir', ''),
                        'name': item.get('name', ''),
                        'ext': item.get('ext', ''),
                        'size': item.get('size', 0),
                        'date': self._to_datetime_or_none(item.get('date')),
                        'files': item.get('files', []),
                    }
                )

        self.stdout.write(self.style.SUCCESS(f'Imported {len(data)} DRC file entries'))
