import json
import os
from django.core.management.base import BaseCommand
from django.db import transaction
from api.models import CoreProject, ORCIDProjectMap, Repository, Analytics


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
                Analytics.objects.all().delete()
                Repository.objects.all().delete()
                CoreProject.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('Existing data cleared'))
        
        # Import in order of dependencies
        self.import_core_projects(folder_path)
        self.import_repositories(folder_path)
        self.import_analytics(folder_path)
        self.import_orcid_project_map(folder_path)
        
        self.stdout.write(self.style.SUCCESS('All data imported successfully'))


    # =====================================================================================
    # === methods for loading JSON files into database models
    # =====================================================================================

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
                        'repos': item.get('repos', 0),
                        'analytics': item.get('analytics', 0),
                    }
                )
        
        self.stdout.write(self.style.SUCCESS(f'Imported {len(data)} core projects'))

    def import_repositories(self, folder_path):
        file_path = os.path.join(folder_path, 'repos.json')
        
        if not os.path.exists(file_path):
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
                        'created': item['created'],
                        'modified': item['modified'],
                        'stars': item.get('stars', []),
                        'forks': item.get('forks', []),
                        'watchers': item.get('watchers', []),
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
                    core_project = CoreProject.objects.get(id__iexact=item['coreProject'])
                except CoreProject.DoesNotExist:
                    self.stdout.write(
                        self.style.WARNING(
                            f'Analytics "{item["property"]}": '
                            f'Core project "{item["coreProject"]}" not found, setting to null'
                        )
                    )
                    core_project = None
                
                Analytics.objects.create(
                    property=item['property'],
                    property_name=item['propertyName'],
                    core_project=core_project,
                    over_time=item.get('overTime', {}),
                    top_continents=item.get('topContinents', {}),
                    top_countries=item.get('topCountries', {}),
                    top_regions=item.get('topRegions', {}),
                    top_cities=item.get('topCities', {}),
                    top_languages=item.get('topLanguages', {}),
                    top_devices=item.get('topDevices', {}),
                    top_oses=item.get('topOSes', {}),
                )
                count += 1
        
        self.stdout.write(self.style.SUCCESS(f'Imported {count} analytics records'))

    def import_orcid_project_map(self, folder_path):
        file_path = os.path.join(folder_path, 'orcid-project-map.json')
        
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
