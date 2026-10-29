# Full-Stack App

This repository contains a simple full-stack Node.js application with:
- Express backend API
- Static frontend served from the same server
- Basic health check and message endpoint

## Local run

```bash
npm install
npm start
```

Then open:
- http://localhost:3000

## Deploy to Render

1. Push this repo to GitHub.
2. Go to https://dashboard.render.com/
3. Click "New" -> "Web Service"
4. Connect this GitHub repo
5. Use the following values:
   - Name: your-app-name
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
6. Click "Create Web Service"

Render will automatically detect the app and serve it on a public URL.

## Deploy to Railway

1. Go to https://railway.app/
2. Create a new project
3. Deploy from GitHub
4. Select this repo
5. Railway will run `npm install` and `npm start`

## API endpoints

- `GET /api/health` -> returns app status
- `GET /api/message` -> returns sample message
- `POST /api/message` -> accepts JSON body `{ "message": "Hello" }`

## Notes

This is a production-ready starter app for learning and deployment, with a single Express server serving both the frontend and the API.
