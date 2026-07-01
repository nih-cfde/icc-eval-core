import json
import tempfile
from datetime import date
from pathlib import Path

from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from .models import (
	Analytics,
	AnalyticsOverview,
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
	User,
)


class APIEndpointSmokeTests(TestCase):
	"""
	Smoke tests to ensure each registered read endpoint responds for
	an authenticated user.
	"""

	@classmethod
	def setUpTestData(cls):
		cls.user = User.objects.create_superuser(
			username='smoke-admin',
			email='smoke@example.com',
			password='not-used-in-force-auth',
		)

		core_project = CoreProject.objects.create(
			id='U54OD000001',
			name='Smoke Core Project',
			activity_code='U54',
			projects=['1U54OD000001-01'],
			award_amount='123456.78',
			publications=1,
			repos=1,
			analytics=1,
		)

		opportunity = Opportunity.objects.create(
			id='RFA-RM-99-999',
			prefix='RFA',
			activity_code='R01 Research Project Grant',
		)

		Project.objects.create(
			id='1U54OD000001-01',
			core_project=core_project,
			name='Smoke Project',
			opportunity=opportunity,
			application=10000001,
			award_amount='123456.78',
			activity_code='U54',
			agency_code='NIH',
			date_start=date(2025, 1, 1),
			date_end=date(2026, 1, 1),
			is_active=True,
		)

		journal = Journal.objects.create(
			abbrev='SmokeJ',
			name='Smoke Journal Name',
			issn='12345678',
			title='Smoke Journal',
			rank=1.23,
		)

		Publication.objects.create(
			id=9000001,
			core_project=core_project,
			application=10000001,
			title='Smoke Publication',
			authors=['Author, One'],
			journal=journal,
			year=2026,
			modified=timezone.now(),
			doi='10.9999/smoke.1',
			relative_citation_ratio=0.5,
			citations=10,
			citations_per_year=5,
		)

		Repository.objects.create(
			id=8000001,
			core_project=core_project,
			owner='smoke-owner',
			name='smoke-repo',
			description='Smoke repository',
			topics=['smoke'],
			created=timezone.now(),
			modified=timezone.now(),
			stars=[],
			forks=[],
			watchers=[],
			commits=[],
			issues=[],
			pull_requests=[],
			contributors=[],
			open_issues=0,
			closed_issues=0,
			issue_time_open={},
			open_pull_requests=0,
			closed_pull_requests=0,
			pull_request_time_open={},
			readme=True,
			contributing=False,
			code_of_conduct=False,
			license='MIT License',
			languages={'Python': 1000},
			dependencies={},
		)

		Analytics.objects.create(
			property='properties/123456789',
			property_name='Smoke Analytics',
			core_project=core_project,
			over_time={'activeUsers': []},
			top_continents={},
			top_countries={},
			top_regions={},
			top_cities={},
			top_languages={},
			top_devices={},
			top_oses={},
		)

		DRCCode.objects.create(
			url='https://example.org/code',
			dir='https://example.org',
			name='Smoke Code',
			ext='md',
			type='DOC',
			date=timezone.now(),
			files=[],
		)

		DRCDCC.objects.create(
			url='https://example.org/dcc',
			dir='https://example.org',
			name='Smoke DCC',
			ext='zip',
			date=timezone.now(),
			files=[],
		)

		DRCFile.objects.create(
			url='https://example.org/file.zip',
			dir='https://example.org',
			name='smoke-file.zip',
			ext='zip',
			size=100,
			date=timezone.now(),
			files=[],
		)

		RepositoryOverview.objects.create(
			repos=1,
			stars=2,
			forks=3,
			watchers=4,
			commits=5,
			open_issues=6,
			closed_issues=7,
			open_pull_requests=8,
			closed_pull_requests=9,
			readme=1,
			contributing=0,
			code_of_conduct=0,
			contributors=2,
			licenses={'MIT License': 1},
			languages={'Python': 1},
		)

		AnalyticsOverview.objects.create(
			over_time={'activeUsers': []},
			top_continents={},
			top_countries={},
			top_regions={},
			top_cities={},
			top_languages={},
			top_devices={},
			top_oses={},
		)

	def setUp(self):
		self.client = APIClient()
		self.client.force_authenticate(user=self.user)

	def assert_endpoint_ok(self, endpoint):
		response = self.client.get(endpoint)
		self.assertEqual(
			response.status_code,
			200,
			msg=f'Expected 200 for {endpoint}, got {response.status_code}',
		)

	def test_core_projects_endpoint(self):
		self.assert_endpoint_ok('/api/core-projects/')

	def test_opportunities_endpoint(self):
		self.assert_endpoint_ok('/api/opportunities/')

	def test_projects_endpoint(self):
		self.assert_endpoint_ok('/api/projects/')

	def test_journals_endpoint(self):
		self.assert_endpoint_ok('/api/journals/')

	def test_publications_endpoint(self):
		self.assert_endpoint_ok('/api/publications/')

	def test_drc_code_endpoint(self):
		self.assert_endpoint_ok('/api/drc-code/')

	def test_drc_dcc_endpoint(self):
		self.assert_endpoint_ok('/api/drc-dcc/')

	def test_drc_file_endpoint(self):
		self.assert_endpoint_ok('/api/drc-file/')

	def test_repositories_endpoint(self):
		self.assert_endpoint_ok('/api/repositories/')

	def test_analytics_endpoint(self):
		self.assert_endpoint_ok('/api/analytics/')

	def test_repo_overview_endpoint(self):
		self.assert_endpoint_ok('/api/repositories-overview/')

	def test_analytics_overview_endpoint(self):
		self.assert_endpoint_ok('/api/analytics-overview/')

	def test_me_endpoint(self):
		self.assert_endpoint_ok('/api/me')


class CoreProjectAccessPermissionTests(TestCase):
	"""
	Ensures only repository and analytics endpoints are scoped by ORCID mapping
	for non-superusers.
	"""

	@classmethod
	def setUpTestData(cls):
		cls.user_mapped = User.objects.create_user(
			username='mapped-user',
			email='mapped@example.com',
			password='not-used-in-force-auth',
			orcid='0000-0000-0000-0001',
		)
		cls.user_wildcard = User.objects.create_user(
			username='wildcard-user',
			email='wildcard@example.com',
			password='not-used-in-force-auth',
			orcid='0000-0000-0000-0002',
		)
		cls.user_unmapped = User.objects.create_user(
			username='unmapped-user',
			email='unmapped@example.com',
			password='not-used-in-force-auth',
			orcid='0000-0000-0000-0003',
		)

		ORCIDProjectMap.objects.create(
			orcid=cls.user_mapped.orcid,
			core_projects=['CP1'],
		)
		ORCIDProjectMap.objects.create(
			orcid=cls.user_wildcard.orcid,
			core_projects=['*'],
		)

		cls.cp1 = CoreProject.objects.create(
			id='CP1',
			name='Core Project 1',
			activity_code='U54',
			projects=['P1'],
			award_amount='100.00',
			publications=1,
			repos=1,
			analytics=1,
		)
		cls.cp2 = CoreProject.objects.create(
			id='CP2',
			name='Core Project 2',
			activity_code='U54',
			projects=['P2'],
			award_amount='200.00',
			publications=1,
			repos=1,
			analytics=1,
		)

		opportunity = Opportunity.objects.create(
			id='RFA-RM-00-001',
			prefix='RFA',
			activity_code='R01 Research Project Grant',
		)

		Project.objects.create(
			id='P1',
			core_project=cls.cp1,
			name='Project 1',
			opportunity=opportunity,
			application=20000001,
			award_amount='100.00',
			activity_code='U54',
			agency_code='NIH',
			date_start=date(2025, 1, 1),
			date_end=date(2026, 1, 1),
			is_active=True,
		)
		Project.objects.create(
			id='P2',
			core_project=cls.cp2,
			name='Project 2',
			opportunity=opportunity,
			application=20000002,
			award_amount='200.00',
			activity_code='U54',
			agency_code='NIH',
			date_start=date(2025, 1, 1),
			date_end=date(2026, 1, 1),
			is_active=True,
		)

		journal = Journal.objects.create(
			abbrev='J1',
			name='Journal 1',
			issn='12345678',
			title='Journal 1',
			rank=1.0,
		)

		Publication.objects.create(
			id=9100001,
			core_project=cls.cp1,
			application=20000001,
			title='Publication 1',
			authors=['Author 1'],
			journal=journal,
			year=2026,
			modified=timezone.now(),
			doi='10.9999/test.1',
			relative_citation_ratio=0.5,
			citations=10,
			citations_per_year=5,
		)
		Publication.objects.create(
			id=9100002,
			core_project=cls.cp2,
			application=20000002,
			title='Publication 2',
			authors=['Author 2'],
			journal=journal,
			year=2026,
			modified=timezone.now(),
			doi='10.9999/test.2',
			relative_citation_ratio=0.5,
			citations=10,
			citations_per_year=5,
		)

		cls.repo_cp1 = Repository.objects.create(
			id=8100001,
			core_project=cls.cp1,
			owner='owner',
			name='repo-1',
			description='Repo 1',
			topics=['one'],
			created=timezone.now(),
			modified=timezone.now(),
			stars=[],
			forks=[],
			watchers=[],
			commits=[],
			issues=[],
			pull_requests=[],
			contributors=[],
			open_issues=0,
			closed_issues=0,
			issue_time_open={},
			open_pull_requests=0,
			closed_pull_requests=0,
			pull_request_time_open={},
			readme=True,
			contributing=False,
			code_of_conduct=False,
			license='MIT',
			languages={'Python': 1},
			dependencies={},
		)
		cls.repo_cp2 = Repository.objects.create(
			id=8100002,
			core_project=cls.cp2,
			owner='owner',
			name='repo-2',
			description='Repo 2',
			topics=['two'],
			created=timezone.now(),
			modified=timezone.now(),
			stars=[],
			forks=[],
			watchers=[],
			commits=[],
			issues=[],
			pull_requests=[],
			contributors=[],
			open_issues=0,
			closed_issues=0,
			issue_time_open={},
			open_pull_requests=0,
			closed_pull_requests=0,
			pull_request_time_open={},
			readme=True,
			contributing=False,
			code_of_conduct=False,
			license='MIT',
			languages={'Python': 1},
			dependencies={},
		)

		cls.analytics_cp1 = Analytics.objects.create(
			property='properties/1',
			property_name='Analytics 1',
			core_project=cls.cp1,
			over_time={},
			top_continents={},
			top_countries={},
			top_regions={},
			top_cities={},
			top_languages={},
			top_devices={},
			top_oses={},
		)
		cls.analytics_cp2 = Analytics.objects.create(
			property='properties/2',
			property_name='Analytics 2',
			core_project=cls.cp2,
			over_time={},
			top_continents={},
			top_countries={},
			top_regions={},
			top_cities={},
			top_languages={},
			top_devices={},
			top_oses={},
		)

	def setUp(self):
		self.client = APIClient()

	def _extract_ids(self, endpoint, payload):
		items = payload.get('results', payload)

		if endpoint == '/api/core-projects/':
			return {item['id'] for item in items}

		return {item.get('coreProject') or item.get('core_project') for item in items}

	def _assert_endpoint_ids(self, endpoint, expected_ids):
		response = self.client.get(endpoint)
		self.assertEqual(response.status_code, 200)
		self.assertSetEqual(self._extract_ids(endpoint, response.json()), expected_ids)

	def test_mapped_user_only_sees_mapped_core_project_data(self):
		self.client.force_authenticate(user=self.user_mapped)

		for endpoint in [
			'/api/core-projects/',
			'/api/projects/',
			'/api/publications/',
		]:
			self._assert_endpoint_ids(endpoint, {'CP1', 'CP2'})

		for endpoint in [
			'/api/repositories/',
			'/api/analytics/',
		]:
			self._assert_endpoint_ids(endpoint, {'CP1'})

		# Detail routes for inaccessible records should not resolve on restricted endpoints.
		self.assertEqual(self.client.get(f'/api/repositories/{self.repo_cp2.id}/').status_code, 404)
		self.assertEqual(self.client.get(f'/api/analytics/{self.analytics_cp2.id}/').status_code, 404)

		# Unrestricted detail routes should remain accessible.
		self.assertEqual(self.client.get('/api/core-projects/CP2/').status_code, 200)
		self.assertEqual(self.client.get('/api/projects/P2/').status_code, 200)

	def test_wildcard_mapping_user_sees_all_core_project_data(self):
		self.client.force_authenticate(user=self.user_wildcard)

		for endpoint in [
			'/api/core-projects/',
			'/api/projects/',
			'/api/publications/',
			'/api/repositories/',
			'/api/analytics/',
		]:
			self._assert_endpoint_ids(endpoint, {'CP1', 'CP2'})

	def test_unmapped_user_sees_no_core_project_data(self):
		self.client.force_authenticate(user=self.user_unmapped)

		for endpoint in [
			'/api/core-projects/',
			'/api/projects/',
			'/api/publications/',
		]:
			self._assert_endpoint_ids(endpoint, {'CP1', 'CP2'})

		for endpoint in [
			'/api/repositories/',
			'/api/analytics/',
		]:
			self._assert_endpoint_ids(endpoint, set())

		self.assertEqual(self.client.get(f'/api/repositories/{self.repo_cp1.id}/').status_code, 404)
		self.assertEqual(self.client.get(f'/api/analytics/{self.analytics_cp1.id}/').status_code, 404)


class ImportDatasetIdempotencyTests(TestCase):
	"""
	Ensures that multiple imports of the same dataset do not create duplicate
	entries.
	"""
	def _write_dataset_files(self, folder_path):
		folder = Path(folder_path)

		files = {
			'core-projects.json': [
				{
					'id': 'U54OD000001',
					'name': 'Core Project One',
					'activityCode': 'U54',
					'projects': ['1U54OD000001-01'],
					'awardAmount': '123456.78',
					'publications': 1,
					'repos': 1,
					'analytics': 1,
				}
			],
			'opportunities.json': [
				{
					'id': 'RFA-RM-99-999',
					'prefix': 'RFA',
					'activityCode': 'R01 Research Project Grant',
				}
			],
			'projects.json': [
				{
					'id': '1U54OD000001-01',
					'coreProject': 'U54OD000001',
					'name': 'Project One',
					'opportunity': 'RFA-RM-99-999',
					'application': 10000001,
					'awardAmount': '123456.78',
					'activityCode': 'U54',
					'agencyCode': 'NIH',
					'dateStart': '2025-01-01',
					'dateEnd': '2026-01-01',
					'isActive': True,
				}
			],
			'journals.json': [
				{
					'abbrev': 'SmokeJ',
					'name': 'Smoke Journal Name',
					'issn': '12345678',
					'title': 'Smoke Journal',
					'rank': 1.23,
				}
			],
			'publications.json': [
				{
					'id': 9000001,
					'coreProject': 'U54OD000001',
					'application': 10000001,
					'title': 'Publication One',
					'authors': ['Author, One'],
					'journal': 'SmokeJ',
					'year': 2026,
					'modified': '2026-01-01T00:00:00Z',
					'doi': '10.9999/smoke.1',
					'relativeCitationRatio': 0.5,
					'citations': 10,
					'citationsPerYear': 5,
				}
			],
			'repos.json': [
				{
					'id': 8000001,
					'coreProject': 'U54OD000001',
					'owner': 'owner',
					'name': 'repo-one',
					'description': 'Repository One',
					'topics': ['topic'],
					'created': '2026-01-01T00:00:00Z',
					'modified': '2026-01-02T00:00:00Z',
					'stars': [],
					'forks': [],
					'watchers': [],
					'commits': [],
					'issues': [],
					'pullRequests': [],
					'contributors': [],
					'openIssues': 0,
					'closedIssues': 0,
					'issueTimeOpen': {},
					'openPullRequests': 0,
					'closedPullRequests': 0,
					'pullRequestTimeOpen': {},
					'readme': True,
					'contributing': False,
					'codeOfConduct': False,
					'license': 'MIT License',
					'languages': {'Python': 1000},
					'dependencies': {},
				}
			],
			'analytics.json': [
				{
					'property': 'properties/123456789',
					'propertyName': 'Analytics One',
					'coreProject': 'U54OD000001',
					'overTime': {'activeUsers': []},
					'topContinents': {},
					'topCountries': {},
					'topRegions': {},
					'topCities': {},
					'topLanguages': {},
					'topDevices': {},
					'topOSes': {},
				}
			],
			'repos-overview.json': {
				'repos': 1,
				'stars': 2,
				'forks': 3,
				'watchers': 4,
				'commits': 5,
				'openIssues': 6,
				'closedIssues': 7,
				'openPullRequests': 8,
				'closedPullRequests': 9,
				'readme': 1,
				'contributing': 0,
				'codeOfConduct': 0,
				'contributors': 2,
				'licenses': {'MIT License': 1},
				'languages': {'Python': 1},
			},
			'analytics-overview.json': {
				'overTime': {'activeUsers': []},
				'topContinents': {},
				'topCountries': {},
				'topRegions': {},
				'topCities': {},
				'topLanguages': {},
				'topDevices': {},
				'topOSes': {},
			},
			'drc-code.json': [
				{
					'url': 'https://example.org/code',
					'dir': 'https://example.org',
					'name': 'Code Entry',
					'ext': 'md',
					'type': 'DOC',
					'date': '2026-01-03T00:00:00Z',
					'files': [],
				}
			],
			'drc-dcc.json': [
				{
					'url': 'https://example.org/dcc',
					'dir': 'https://example.org',
					'name': 'DCC Entry',
					'ext': 'zip',
					'date': '2026-01-04T00:00:00Z',
					'files': [],
				}
			],
			'drc-file.json': [
				{
					'url': 'https://example.org/file.zip',
					'dir': 'https://example.org',
					'name': 'file.zip',
					'ext': 'zip',
					'size': 100,
					'date': '2026-01-05T00:00:00Z',
					'files': [],
				}
			],
			'users.json': {
				'0000-0000-0000-0001': ['U54OD000001'],
			},
		}

		for file_name, payload in files.items():
			(folder / file_name).write_text(json.dumps(payload), encoding='utf-8')

	def test_import_dataset_is_idempotent_across_imported_models(self):
		with tempfile.TemporaryDirectory() as tmp_dir:
			self._write_dataset_files(tmp_dir)

			call_command('import_dataset', tmp_dir)

			counts_after_first_import = {
				CoreProject: CoreProject.objects.count(),
				Opportunity: Opportunity.objects.count(),
				Project: Project.objects.count(),
				Journal: Journal.objects.count(),
				Publication: Publication.objects.count(),
				Repository: Repository.objects.count(),
				Analytics: Analytics.objects.count(),
				RepositoryOverview: RepositoryOverview.objects.count(),
				AnalyticsOverview: AnalyticsOverview.objects.count(),
				DRCCode: DRCCode.objects.count(),
				DRCDCC: DRCDCC.objects.count(),
				DRCFile: DRCFile.objects.count(),
				ORCIDProjectMap: ORCIDProjectMap.objects.count(),
			}

			for model_class, count in counts_after_first_import.items():
				self.assertGreater(count, 0, msg=f'Expected at least one {model_class.__name__} after first import')

			call_command('import_dataset', tmp_dir)

			for model_class, count in counts_after_first_import.items():
				self.assertEqual(
					model_class.objects.count(),
					count,
					msg=(
						f'Expected {model_class.__name__} count to remain {count} '
						'after running import_dataset twice'
					),
				)
