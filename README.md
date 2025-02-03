# htn-2025-backend-developer-challenge

Hack the North 2025 Backend Developer Challenge

## Table of Contents

- [Tech Stack](#tech-stack)
- [Live Demo](#live-demo)
- [Setup Instructions](#setup-instructions)
- [Running Tests](#running-tests)
- [Database Access](#database-access)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Design Decisions and Assumptions](#design-decisions-and-assumptions)

---

## Tech Stack

| Category          | Technologies                        |
| ----------------- | ----------------------------------- |
| Backend Framework | Express.js with TypeScript          |
| Database          | PostgreSQL                          |
| ORM               | Prisma                              |
| API Documentation | Swagger/OpenAPI (via swagger-jsdoc) |
| Testing           | Jest, Supertest                     |
| Containerization  | Docker, Docker Compose              |
| Development Tools | Node.js, npm                        |
| Deployment        | Railway                             |

---

## Live Demo

The API is deployed and available at:  
[https://htn-2025-backend-dev-challenge-production.up.railway.app](https://htn-2025-backend-dev-challenge-production.up.railway.app)

API Documentation (Swagger UI) for the deployed version:  
[https://htn-2025-backend-dev-challenge-production.up.railway.app/api-docs](https://htn-2025-backend-dev-challenge-production.up.railway.app/api-docs)

---

## Local Setup Instructions

1. Clone the repository:

   ```bash
   git clone https://github.com/Ri-Hong/htn-2025-backend-developer-challenge.git
   cd htn-2025-backend-developer-challenge
   ```

2. Start the Docker containers:

   ```bash
   docker-compose up -d
   ```

   This will:

   - Start a PostgreSQL database container
   - Build and start the backend application (including installing dependencies)
   - Run Prisma migrations
   - Seed the database with example data from [example_data.json](https://github.com/Ri-Hong/htn-2025-backend-developer-challenge/blob/main/example_data.json)

   The API will be available at `http://localhost:3000`  
   Swagger documentation will be available at `http://localhost:3000/api-docs`

---

## Running Tests

You can run tests either locally or within Docker:

### Local Testing

1. Install dependencies first:

   ```bash
   npm install
   ```

2. Run the test suite:

   ```bash
   npm test
   ```

### Testing in Docker

```bash
docker exec htn_backend npm test
```

---

## Database Access

To connect to the PostgreSQL database running in Docker:

```bash
# Connect to the postgres container
docker exec -it htn_postgres psql -U postgres -d hackathon

# Common PSQL commands:
# \dt - List all tables
# \d+ table_name - Describe table
# \q - Quit psql
```

---

## API Endpoints

For detailed API documentation and interactive testing, make sure you have the docker container running and visit the Swagger UI at:  
[http://localhost:3000/api-docs](http://localhost:3000/api-docs)

![Swagger Documentation](images/swagger.png)

The API provides the following categories of endpoints:

### Users API

- Get all users
- Get user by ID/email/badge code
- Update user data

### Scans API

- Record activity scans
- Get scan statistics
- View activity timelines

### Attendance API

- Check in attendees
- Check out attendees

### Social API

- Record badge scans between users
- View scanned badge history

For complete endpoint specifications including request/response formats, query parameters, and examples, please refer to the Swagger documentation.

---

## Database Schema

The database schema is defined in [`prisma/schema.prisma`](prisma/schema.prisma). Here's a visual representation of the database structure:

![Database Schema](images/schema_diagram.png)

---

## Design Decisions and Assumptions

- **User Identification:**

  - `id`, `email` and `badge_code` are unique identifiers for users
  - Users can be looked up by `id`, `email`, or `badge_code` in most endpoints
  - Badge scanning endpoints specifically use `badge_code` as the identifier

- **Data Validation:**

  - Badge codes must be unique across all users
  - Empty string badge codes are not allowed during seeding
  - When duplicate badge codes are encountered during seeding, the operation is skipped and a warning is logged

- **Update Handling:**

  - Updatable user fields:
    - `name`
    - `email`
    - `phone`
    - `badge_code`
  - Protected fields (cannot be modified):
    - `id`
    - `updated_at`
    - `scans`

- **Activity Scanning:**

  - Activities are identified by both `activity_name` and `category`
  - Each scan must reference both an existing user and activity
  - Badge code is required for recording scans

- **Data Storage:**
  - `updated_at` is automatically updated whenever user data or scans change

---
