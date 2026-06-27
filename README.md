# Vanga-Padikalam--ai
StudyMate AI solves this by letting a student upload their syllabus (PDF or text), enter how many hours they can study per day and their exam date — and within seconds, Claude AI reads the syllabus, breaks it into topics and subtasks, and generates a realistic weekly study plan.

## GitHub Hosting / Deployment
This repository is already linked to GitHub at `https://github.com/Aathavanvalan/Vanga-Padikalam--ai`.

### Frontend deployment
- The frontend can be deployed to GitHub Pages using the workflow in `.github/workflows/deploy-frontend.yml`.
- The site will be published from the `frontend/build` output.
- After pushing to `main`, GitHub Pages will deploy the app automatically.

### Backend requirement
- The frontend requires the backend API at `http://localhost:5000` for full functionality.
- For a public demo, host the backend separately on a cloud service (Render, Vercel, Railway, etc.) and update the frontend API base URL accordingly.

## How to run locally
1. Install dependencies in the root, backend, and frontend.
2. Start the backend with `npm start` in `backend`.
3. Start the frontend with `npm start` in `frontend`.

## Notes
- If you want people to try the app instantly, GitHub Pages can host the UI.
- To make the full app live for everyone, the backend must be hosted on a server too.
