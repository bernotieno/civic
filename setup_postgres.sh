#!/bin/bash

# Script to set up PostgreSQL database civicAI_db and user civicAI_user

# Exit on error
set -e

# Install pgvector extension
echo "Installing pgvector extension..."
sudo apt install -y postgresql-17-pgvector || sudo apt install -y postgresql-pgvector

# Run PostgreSQL commands as the postgres user
sudo -u postgres psql <<EOF
SELECT 'CREATE DATABASE civicai_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'civicai_db')\gexec
DO \$\$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'civicai_user') THEN
      CREATE USER civicai_user WITH PASSWORD '2222';
   END IF;
END
\$\$;
ALTER DATABASE civicai_db OWNER TO civicai_user;
GRANT ALL PRIVILEGES ON DATABASE civicai_db TO civicai_user;
EOF

# Enable pgvector extension in the civicai_db database
sudo -u postgres psql -d civicai_db <<EOF
CREATE EXTENSION IF NOT EXISTS vector;
EOF

echo "Database civicAI_db created, user civicAI_user created, ownership transferred, and privileges granted."
