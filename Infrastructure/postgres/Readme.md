# PostgreSQL Database Documentation

## Overview
This document provides instructions for connecting to the PostgreSQL container and common database operations for the ft_transcendence project.

## Connection Instructions

### Connecting to the PostgreSQL Container

To connect to the PostgreSQL container via terminal:

```bash
# Connect to the running PostgreSQL container
docker exec -it ft_transcendence_postgres bash

# Once inside the container, connect to PostgreSQL as the postgres user
psql -U postgres
```

Alternatively, connect directly to the PostgreSQL instance without entering the container:

```bash
docker exec -it ft_transcendence_postgres psql -U postgres
```

### Connection Parameters

- **Host**: localhost (from host) or postgres (from other containers)
- **Port**: 5432 (default PostgreSQL port)
- **Username**: postgres
- **Password**: As specified in your .env file
- **Default Database**: postgres

## Common PostgreSQL Commands

### Database Management

```sql
-- List all databases
\l

-- Create a new database
CREATE DATABASE dbname;

-- Connect to a database
\c dbname

-- Drop a database
DROP DATABASE dbname;
```

### Table Operations

```sql
-- List tables in current database
\dt

-- Describe a table structure
\d tablename

-- Create a new table
CREATE TABLE tablename (
    id SERIAL PRIMARY KEY,
    column1 VARCHAR(255),
    column2 INTEGER
);

-- Drop a table
DROP TABLE tablename;
```

### Data Manipulation

```sql
-- Insert data
INSERT INTO tablename (column1, column2) VALUES ('value1', 123);

-- Select data
SELECT * FROM tablename;
SELECT column1, column2 FROM tablename WHERE condition;

-- Update data
UPDATE tablename SET column1 = 'new_value' WHERE condition;

-- Delete data
DELETE FROM tablename WHERE condition;
```

### User Management

```sql
-- Create a new user
CREATE USER username WITH PASSWORD 'password';

-- Grant privileges to a user
GRANT ALL PRIVILEGES ON DATABASE dbname TO username;

-- List all users
\du
```

### Backup and Restore

```bash
# From host machine, backup a database
docker exec ft_transcendence_postgres pg_dump -U postgres dbname > backup.sql

# Restore a database
docker exec -i ft_transcendence_postgres psql -U postgres dbname < backup.sql
```

## Exiting PostgreSQL

To exit the PostgreSQL prompt, type:
```sql
\q
```

To exit the container bash shell, type:
```bash
exit
```

## Troubleshooting

If you encounter connection issues:
1. Ensure the PostgreSQL container is running
2. Verify the credentials in the .env file
3. Check if the port is correctly mapped in your docker-compose.yml file
