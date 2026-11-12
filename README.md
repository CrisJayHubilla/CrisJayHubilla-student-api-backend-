# Attendance Portal Backend

Vercel serverless API (Node.js + Mongoose + MongoDB Atlas) for the attendance portal.

| Method | Route | Purpose |
|---|---|---|
| GET | /api/attendance | List all records |
| GET | /api/attendance?id=ID | Get one record |
| POST | /api/attendance | Create a record |
| PUT/PATCH | /api/attendance?id=ID | Update a record |
| DELETE | /api/attendance?id=ID | Delete a record |

`/api/attendance/ID` also works (see `vercel.json`).

## Deploy
1. Push this folder as its own GitHub repo.
2. Vercel: Add New > Project > import the repo (Framework preset: Other).
3. Settings > Environment Variables: add `MONGODB_URI` (and optionally `MONGODB_DB`). Redeploy.
4. MongoDB Atlas > Network Access: allow `0.0.0.0/0`.
5. Test: `https://<project>.vercel.app/api/attendance` should return JSON.

## Local development
Copy `.env.example` to `.env`, fill in `MONGODB_URI`, then:
```
npm install
npm start
```
Runs at http://localhost:3000/api/attendance (`server.js` is local only; Vercel uses `api/attendance.js`).

## Security
Never commit `.env` or `MONGODB_URI`.
