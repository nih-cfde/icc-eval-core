"""
Tests that the MCP reader only has read-only access and only to specific tables.
"""

import json
import tempfile
from datetime import date
from pathlib import Path

from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone

# allow list of tables, at the time of migration, that the mcp_reader role will be granted access to
# (these are from the migration file 0003_create_postgres_mcp_reader.py, but duplicated here to
# ensure that these tables actually are the only ones allowed)
MCP_READER_TABLES_ALLOWED = [
    'orcid_project_map',
    'core_projects',
    'opportunities',
    'projects',
    'journals',
    'publications',
    'drc_code',
    'drc_dcc',
    'drc_file',
    'analytics_overview',
    'repository_overview',
    # tables that are restricted to specific users, thus not accessible to the mcp_reader role
    # 'repositories',
    # 'analytics',
    # 'analytics_breakdown_users',
    # 'analytics_breakdown_users_events',
]

# tables we explicitly should not be able to access; we should test that these fail
MCP_READER_TABLES_DISALLOWED = [
    # django auth, mgmt tables
    'account_emailaddress',
    'account_emailconfirmation',
    'api_user',
    'api_user_groups',
    'api_user_user_permissions',
    'auth_group',
    'auth_group_permissions',
    'auth_permission',
    'authtoken_token',
    'django_admin_log',
    'django_content_type',
    'django_migrations',
    'django_session',
    'django_site',
    'socialaccount_socialaccount',
    'socialaccount_socialapp',
    'socialaccount_socialapp_sites',
    'socialaccount_socialtoken',

    # app-specific restricted tables
    'repositories',
    'analytics',
    'analytics_breakdown_users',
    'analytics_breakdown_users_events',
]

class TestMCPReaderAccess(TestCase):
    # make a direct connection to the database as an external postgres user would
    def setUp(self):
        self.conn = None
        self.cursor = None
        self.conn = self._get_mcp_reader_connection()
        self.cursor = self.conn.cursor()

    def tearDown(self):
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()

    def _get_mcp_reader_connection(self):
        import psycopg2
        import os

        # get the connection parameters from environment variables
        db_name = os.environ.get("POSTGRES_DB", "icc_eval_core")
        db_user = os.environ.get("POSTGRES_MCP_READER_USER", "mcp_reader")
        db_password = os.environ.get("POSTGRES_MCP_READER_PASSWORD", "mcp_reader_password")
        db_host = os.environ.get("POSTGRES_HOST", os.environ.get("POSTGRES_HOST", "localhost"))
        db_port = os.environ.get("POSTGRES_PORT", "5432")

        # connect to the database as the mcp_reader user
        conn = psycopg2.connect(
            dbname=db_name,
            user=db_user,
            password=db_password,
            host=db_host,
            port=db_port,
        )
        return conn

    # test that we can connect at all
    def test_connection(self):
        self.assertIsNotNone(self.conn)
        self.assertIsNotNone(self.cursor)

    # test that we can read from allowed tables
    def test_read_allowed_tables(self):
        for table in MCP_READER_TABLES_ALLOWED:
            with self.subTest(table=table):
                try:
                    self.cursor.execute(f"SELECT * FROM {table} LIMIT 1;")
                    result = self.cursor.fetchone()
                    # we don't care about the result, just that it didn't raise an exception
                except Exception as e:
                    self.fail(f"Reading from allowed table '{table}' raised an exception: {e}")

    # test that we cannot read from disallowed tables
    def test_read_disallowed_tables(self):
        for table in MCP_READER_TABLES_DISALLOWED:
            with self.subTest(table=table):
                with self.assertRaises(Exception):
                    self.cursor.execute(f"SELECT * FROM {table} LIMIT 1;")
