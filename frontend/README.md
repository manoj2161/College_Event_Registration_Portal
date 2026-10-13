# Campusly — College Event Registration Portal

Full-stack React/Vite + Express/MongoDB college event portal. The interface uses black/charcoal surfaces, yellow accents, and glassmorphism. The Campus AI UI calls the existing external Project Assistant API from the frontend with Axios; this backend does not implement a second AI/Gemini service.

## Included features

- Student and organizer registration/login; admin self-registration is disabled.
- Password hashing, JWT access tokens, rotating refresh tokens in an HTTP-only cookie, and role-based API permissions.
- Brevo registration verification email. Users are signed in immediately after successful registration and `emailVerified` remains `false` until they use the verification link. Verification tokens are hashed in MongoDB and expire after 24 hours.
- Student event discovery and registration, duplicate/capacity checks, own-registration cancellation.
- Organizer event submissions for admin review.
- Admin event approval/rejection/deletion, registration directory, and CSV export.
- Campus AI connects directly from React to the external Project Assistant API using Axios; no duplicate AI backend or Gemini key is required here.
- Responsive black/yellow glassmorphism styling, reusable UI components, toasts, loading states, and reduced-motion support.

## Requirements

- Node.js 20+ recommended.
- MongoDB running locally or a MongoDB Atlas connection string.
- Brevo API key and a verified sender address for registration email verification.
- Your external Project Assistant API must accept `{ project: "campusly", message }`, return `message`, `response`, or `reply`, and allow the frontend origin through CORS.

## One-time setup

1. Extract the ZIP. The `.env` and `backend/.env` template files are already included.
2. Fill in `backend/.env`: `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `BREVO_API_KEY`, and `BREVO_SENDER_EMAIL`. Use your actual Brevo verified sender. The optional admin seed requires both `ADMIN_EMAIL` and `ADMIN_PASSWORD` (12+ characters); leave both blank to skip it.
3. Check the root `.env` and confirm `VITE_API_URL` and `VITE_PROJECT_ASSISTANT_API_URL` are correct.
4. If using MongoDB Atlas, replace the local default `MONGODB_URI` with your Atlas connection string. If using local MongoDB, make sure the MongoDB service is running.

## Run everything

Run these commands **once from the project root after adding your credentials**:

```bash
npm install
npm run dev
```

The root script starts Vite and the Express backend together. Open the Vite URL shown in the terminal (usually `http://localhost:5173`). The API runs at `http://localhost:5000` by default.

To build the frontend for production:

```bash
npm run build
```

## Notes

- `npm install` installs both frontend and backend dependencies through npm workspaces.
- Never commit `.env` or `backend/.env`; the actual credentials are not included in this archive.
- If port 5000 is already occupied, change `PORT` in `backend/.env` and update `VITE_API_URL` in the root `.env` to match.
- Set `CLIENT_URL` to the frontend origin when running on a different host/port.
- The external assistant may take time to respond if its hosting service is waking up. If it fails, check its CORS configuration and that the `campusly` project context is configured on that service.
- Email verification depends on a working MongoDB connection and valid Brevo credentials. Do not use placeholder values in the `.env` files.
