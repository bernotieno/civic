-- Initialize CivicAI Database
-- This script runs when the PostgreSQL container starts for the first time

-- Create database if it doesn't exist (handled by POSTGRES_DB env var)
-- CREATE DATABASE IF NOT EXISTS civicai_db;

-- Create user if it doesn't exist (handled by POSTGRES_USER env var)
-- CREATE USER IF NOT EXISTS civicai_user WITH PASSWORD 'civicai_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE civicai_db TO civicai_user;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Set timezone
SET timezone = 'Africa/Nairobi';