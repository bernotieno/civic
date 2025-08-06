#!/bin/bash

# Script to set up PostgreSQL database civicAI_db and user civicAI_user

# Exit on error
set -e

# Run PostgreSQL commands as the postgres user
sudo -u postgres psql <<EOF
CREATE DATABASE civicAI_db;
CREATE USER civicAI_user WITH PASSWORD '2222';
ALTER DATABASE civicAI_db OWNER TO civicAI_user;
GRANT ALL PRIVILEGES ON DATABASE civicAI_db TO civicAI_user;
EOF

echo "Database civicAI_db created, user civicAI_user created, ownership transferred, and privileges granted."
