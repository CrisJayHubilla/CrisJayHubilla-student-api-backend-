# Combined Student + Attendance API

One MongoDB Atlas connection serves both portals.

## Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check backend and MongoDB connection |
| GET/POST | `/api/students` | List/create student records |
| GET/PUT/PATCH/DELETE | `/api/students/:id` | Read/update/delete one student |
| GET/POST | `/api/attendance` | List/create attendance records |
| GET/PUT/PATCH/DELETE | `/api/attendance/:id` | Read/update/delete one attendance record |
| GET | `/api/attendance?info=1` | Show the database and attendance collection selected |
| GET/POST | `/api` | Compatibility alias for student records |

## Database defaults

- Database: `LabAttendanceDB`
- Student collection: `students`
- Attendance collection: `attendance`

These are configurable through Vercel environment variables. The attendance API never silently falls back to an unrelated collection: it auto-detects a collection whose name contains `attend`, or returns a helpful error listing the available collections. Set `MONGODB_ATTENDANCE_COLLECTION` to the exact existing collection name if it is not `attendance`.

The Student model preserves the original Student Portal fields: `name`, `studentId`, `course`, `year`, and `email`. Attendance documents are handled as raw MongoDB documents so existing field names and nested data are preserved.

## Local setup

1. Copy `.env.example` to `.env`.
2. Replace `MONGODB_URI` with your Atlas connection string and confirm `MONGODB_DB` and collection names.
3. Run `npm install`.
4. Run `npm start`.
5. Open `http://localhost:3000/api/health`.

Never commit `.env` or expose your MongoDB credentials.

## Deploy to Vercel

Import this backend folder/repository as a Vercel project. Use the repository root as the Root Directory. No framework preset or build command is required. Add the environment variables listed below in Project Settings > Environment Variables, then redeploy.

Required variables:

- `MONGODB_URI`
- `MONGODB_DB` (usually `LabAttendanceDB` for this project)
- `MONGODB_STUDENT_COLLECTION` (usually `students`)
- `MONGODB_ATTENDANCE_COLLECTION` (must match the existing attendance collection name)
- `CORS_ORIGINS` (use `*` temporarily for testing; in production enter the exact frontend origin(s), comma-separated)

## Security note

This demo API permits create, update, and delete operations. It does not include user authentication or role-based authorization. Do not expose real student data publicly until authentication and authorization are added. CORS is not an access-control or authentication mechanism.
