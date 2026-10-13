# Campusly API

Express and MongoDB API for the College Event Registration Portal.

## Setup

1. Run `npm install` in this directory.
2. Copy `.env.example` to `.env` and configure MongoDB, JWT secrets, Brevo, and the frontend URL.
3. Run `npm run dev` for development or `npm start` for production.

## Environment variables

- `MONGODB_URI`: MongoDB connection string.
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`: long, unique secrets.
- `CLIENT_URL`: exact frontend origin allowed by CORS and used in verification links.
- `BREVO_API_KEY`: Brevo API key with transactional email access.
- `BREVO_SENDER_EMAIL`: sender address verified in Brevo.
- `BREVO_SENDER_NAME`: optional display name for outgoing email.
- `ACCESS_TOKEN_MINUTES` and `REFRESH_TOKEN_DAYS`: session lifetimes.
- `ADMIN_EMAIL` and `ADMIN_PASSWORD`: optional initial administrator account configuration.

The backend does not run Gemini or provide an AI chat endpoint. The Campus AI UI calls the existing Project Assistant API directly from the frontend.
