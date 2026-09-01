# Student ERP Platform

A full-stack Student ERP (Enterprise Resource Planning) system built with **HTML, CSS, JavaScript**, **Node.js/Express**, and **MongoDB**. Designed as an **academic / educational project** — it ships with seeded demo accounts so anyone can explore all roles out of the box.

## Features

- **Authentication** — Role-based login for Students, Faculty, and Admin (JWT + bcrypt)
- **Fee Payment** — View fees, pay online (simulated), track payment history
- **One-on-One Scheduling** — Students book sessions with faculty; faculty confirm/complete sessions with conflict detection to prevent double-booking
- **Academic Records** — Semester-wise grades, automatic GPA calculation, subject-wise marks

## Tech Stack

| Layer    | Technology                      |
|----------|---------------------------------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend  | Node.js, Express.js             |
| Database | MongoDB (Mongoose ODM)          |
| Auth     | JWT + bcrypt                    |

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB](https://www.mongodb.com/try/download/community) running locally on port 27017

## Quick Start

```bash
# 1. Navigate to project
cd student-erp

# 2. Install dependencies
npm install

# 3. Create environment file
copy .env.example .env

# 4. Set a strong JWT secret in .env, then seed demo data
npm run seed

# 5. Start the server
npm start
```

Open **http://localhost:3000** in your browser.

## Demo Accounts (from seed)

| Role    | Email              | Password    |
|---------|--------------------|-------------|
| Student | student@erp.edu    | student123  |
| Faculty | faculty@erp.edu    | faculty123  |
| Admin   | admin@erp.edu      | admin123    |

> **Note:** These are demo credentials for academic use only. Change them before any real deployment.

## Environment Variables

| Variable      | Description                       | Default                                      |
|---------------|-----------------------------------|----------------------------------------------|
| `PORT`        | Server port                       | `3000`                                       |
| `MONGODB_URI` | MongoDB connection string         | `mongodb://localhost:27017/student_erp`      |
| `JWT_SECRET`  | Secret used to sign JWT tokens    | *(required — set a strong value)*            |

## API Endpoints

### Auth
| Method | Endpoint                  | Description                    | Access     |
|--------|---------------------------|--------------------------------|------------|
| POST   | `/api/auth/register`      | Register user (student/faculty)| Public     |
| POST   | `/api/auth/login`         | Login                          | Public     |
| GET    | `/api/auth/me`            | Get current user               | Authenticated |
| GET    | `/api/auth/faculty`       | List faculty                   | Authenticated |
| GET    | `/api/auth/students`      | List students                  | Authenticated |

### Fees
| Method | Endpoint                | Description                  | Access      |
|--------|-------------------------|------------------------------|-------------|
| GET    | `/api/fees`             | List fees                    | Authenticated |
| GET    | `/api/fees/summary`     | Fee summary stats            | Authenticated |
| POST   | `/api/fees`             | Create fee                   | Admin       |
| POST   | `/api/fees/:id/pay`     | Pay fee                      | Student     |

### Schedules
| Method | Endpoint                      | Description               | Access      |
|--------|-------------------------------|---------------------------|-------------|
| GET    | `/api/schedules`              | List sessions             | Authenticated |
| POST   | `/api/schedules`              | Book session              | Student     |
| PATCH  | `/api/schedules/:id/status`   | Update status             | Owner/Admin |
| DELETE | `/api/schedules/:id`          | Cancel session            | Owner/Admin |

### Academics
| Method | Endpoint                        | Description              | Access         |
|--------|---------------------------------|--------------------------|----------------|
| GET    | `/api/academics`                | List records             | Authenticated  |
| GET    | `/api/academics/student/:id`    | Records for a student    | Authenticated  |
| POST   | `/api/academics`                | Create record            | Admin/Faculty  |
| PATCH  | `/api/academics/:id/grade`      | Update a subject grade   | Admin/Faculty  |

## Role Permissions

| Action                | Student | Faculty | Admin |
|-----------------------|---------|---------|-------|
| View own fees         | ✅      | —       | ✅    |
| Pay fees              | ✅      | —       | —     |
| Create fees           | —       | —       | ✅    |
| Book sessions         | ✅      | —       | —     |
| Confirm sessions      | —       | ✅      | —     |
| View academic records | ✅      | ✅      | ✅    |
| Add academic records  | —       | ✅      | ✅    |

## Project Structure

```
student-erp/
├── public/
│   ├── css/styles.css
│   ├── js/api.js
│   ├── js/dashboard.js
│   ├── index.html
│   ├── register.html
│   └── dashboard.html
├── models/
│   ├── User.js
│   ├── Fee.js
│   ├── Schedule.js
│   └── AcademicRecord.js
├── routes/
│   ├── auth.js
│   ├── fees.js
│   ├── schedules.js
│   └── academics.js
├── middleware/
│   └── auth.js
├── server.js
├── seed.js
└── package.json
```

## Security Notes

This project implements several security best practices:

- **Role restrictions on registration** — The public `/register` endpoint only allows `student`/`faculty` roles. Admin accounts are created via the `seed` script only, so users cannot self-register as admin or escalate privileges.
- **Input validation** — Email format, password length, fee amounts, grade values, and academic credits are validated server-side before being stored.
- **XSS protection** — All user-supplied data is HTML-escaped before being rendered into the DOM on the frontend.
- **Rate limiting** — Login/register endpoints are rate-limited (`express-rate-limit`, 10 requests/min/IP) to mitigate brute-force attacks.
- **Password hashing** — Passwords are hashed with bcrypt (cost factor 10) and never stored or returned in plaintext.
- **JWT expiry** — Tokens expire after 24 hours.
- **Secrets hygiene** — `.env` is excluded from version control via `.gitignore`; `.env.example` ships with empty placeholders.

### For production use

- Set a **strong, unique `JWT_SECRET`** (generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).
- Replace all **demo credentials** in `seed.js`.
- Consider restricting **CORS** to your frontend origin(s) — currently open (`*`) for demo convenience.
- Review the **implicit allowance** of who can view fee/schedule/academic data for non-students.

## License

MIT — free to use for academic and educational purposes.
