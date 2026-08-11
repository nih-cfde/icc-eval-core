import os

from django.db import migrations

# allow list of tables, at the time of migration, that the mcp_reader role will be granted access to
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
    # omitted b/c these are restricted to specific users
    # 'repositories',
    # 'analytics',
    # omitted b/c they're referenced from forbidden table, 'analytics'
    # 'analytics_breakdown_users',
    # 'analytics_breakdown_users_events',
]

def configure_mcp_reader(apps, schema_editor):
    role_name = os.environ["POSTGRES_MCP_READER_USER"]
    role_password = os.environ["POSTGRES_MCP_READER_PASSWORD"]
    database_name = schema_editor.connection.settings_dict["NAME"]

    quote_name = schema_editor.connection.ops.quote_name
    quoted_role = quote_name(role_name)
    quoted_database = quote_name(database_name)

    with schema_editor.connection.cursor() as cursor:
        cursor.execute(
            "SELECT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = %s)",
            [role_name],
        )

        if not cursor.fetchone()[0]:
            cursor.execute(f"CREATE ROLE {quoted_role}")

        # Always update the existing or newly created role.
        cursor.execute(
            f"ALTER ROLE {quoted_role} WITH LOGIN PASSWORD %s",
            [role_password],
        )

        cursor.execute(
            f"GRANT CONNECT ON DATABASE {quoted_database} TO {quoted_role}"
        )
        cursor.execute(
            f"GRANT USAGE ON SCHEMA public TO {quoted_role}"
        )

        # grant only the allowed tables
        for table in MCP_READER_TABLES_ALLOWED:
            quoted_table = quote_name(table)
            cursor.execute(
                f"GRANT SELECT ON TABLE public.{quoted_table} TO {quoted_role}"
            )


def remove_mcp_reader(apps, schema_editor):
    role_name = os.environ["POSTGRES_MCP_READER_USER"]
    database_name = schema_editor.connection.settings_dict["NAME"]

    quote_name = schema_editor.connection.ops.quote_name
    quoted_role = quote_name(role_name)
    quoted_database = quote_name(database_name)

    with schema_editor.connection.cursor() as cursor:
        cursor.execute(
            "SELECT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = %s)",
            [role_name],
        )

        if not cursor.fetchone()[0]:
            return

        cursor.execute(
            f"""
            ALTER DEFAULT PRIVILEGES IN SCHEMA public
            REVOKE SELECT ON TABLES FROM {quoted_role}
            """
        )
        cursor.execute(
            f"REVOKE SELECT ON ALL TABLES IN SCHEMA public FROM {quoted_role}"
        )
        cursor.execute(
            f"REVOKE USAGE ON SCHEMA public FROM {quoted_role}"
        )
        cursor.execute(
            f"REVOKE CONNECT ON DATABASE {quoted_database} FROM {quoted_role}"
        )
        cursor.execute(f"DROP ROLE {quoted_role}")


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0002_alter_publication_modified"),
    ]

    operations = [
        migrations.RunPython(
            configure_mcp_reader,
            reverse_code=remove_mcp_reader,
        ),
    ]
