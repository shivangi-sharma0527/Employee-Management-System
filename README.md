# Employee Management System

A professional full-stack Employee Management System created for **Task 4 (Medium)**. It manages employee records and organizational data and provides searchable records, department management, reports and CSV export.

## Features
- Dashboard with total employees, active employees, average salary and active payroll
- Employee registration with validation
- Employee CRUD: create, view, update and delete
- Search and filter by employee, department and status
- Department-wise workforce summary
- Reports and CSV export
- Responsive, clean UI
- PostgreSQL database with relational department/employee structure

## Tech Stack
- Frontend: HTML5, CSS3, Vanilla JavaScript
- Backend: Node.js, Express.js
- Database: PostgreSQL

## Run Locally

### 1. Requirements
Install Node.js 18+ and PostgreSQL 14+.

### 2. Create database
Create a PostgreSQL database named `employee_management`.

Then run `db/schema.sql` against that database.

### 3. Configure environment
Copy `.env.example` to `.env` and set your PostgreSQL connection string:

```env
PORT=3000
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/employee_management
```

### 4. Install and start
```bash
npm install
npm start
```
Open `http://localhost:3000`.

## API Endpoints
- `GET /api/employees`
- `GET /api/employees/:id`
- `POST /api/employees`
- `PUT /api/employees/:id`
- `DELETE /api/employees/:id`
- `GET /api/departments`
- `GET /api/reports/summary`
- `GET /api/reports/employees.csv`

## Project Structure
```text
employee-management-system/
├── db/schema.sql
├── public/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── .env.example
├── package.json
├── server.js
└── README.md
```
