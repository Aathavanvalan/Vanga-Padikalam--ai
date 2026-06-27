# Vanga-Padikalam--ai
StudyMate AI solves this by letting a student upload their syllabus (PDF or text), enter how many hours they can study per day and their exam date — and within seconds, Claude AI reads the syllabus, breaks it into topics and subtasks, and generates a realistic weekly study plan.

## GitHub Hosting / Deployment
This repository is already linked to GitHub at `https://github.com/Aathavanvalan/Vanga-Padikalam--ai`.

### Frontend deployment
- The frontend is configured for GitHub Pages using `.github/workflows/deploy-frontend.yml`.
- The expected published URL is `https://Aathavanvalan.github.io/Vanga-Padikalam--ai`.
- The GitHub Action will build the frontend from `frontend/build` and publish it automatically on pushes to `main` or `av-backend`.

### Backend requirement for testing
- The frontend UI needs the backend API to generate plans and explanations.
- For local testing, run the backend on `http://localhost:5000` and the frontend on `http://localhost:3000`.
- For public testing, the backend can be hosted on Render with the included `render.yaml` config. Set the `GEMINI_API_KEY` secret in Render and then update the frontend API URL using the `REACT_APP_API_URL` secret in GitHub Actions.

### One-click backend deployment on Render
1. Push this repo to GitHub.
2. Open Render and create a new Web Service from this repository.
3. Choose the `backend` folder as the root or use the provided `render.yaml` config.
4. Add a secret environment variable named `GEMINI_API_KEY`.
5. Deploy. Your backend will be available at a Render URL such as `https://your-app.onrender.com`.
6. Set `REACT_APP_API_URL` in GitHub Actions or your local frontend build to that public backend URL.

## How to run locally
1. In `backend`: install dependencies and run `npm start`.
2. In `frontend`: install dependencies and run `npm start`.
3. Open `http://localhost:3000` in the browser.
4. Upload a syllabus PDF and generate a plan.

## Notes for testers
- The UI is hosted at the GitHub Pages URL above if the workflow completes successfully.
- If you want testers to use the full app, the backend must also be deployed and the frontend configured with the deployed backend URL.
- The `.vscode/launch.json` file is configured for `http://localhost:3000` so this app can be launched locally in Chrome from VS Code.