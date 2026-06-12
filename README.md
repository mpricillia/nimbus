# Nimbus.ai - Machine Learning Power Consumption Forecaster

Nimbus.ai is a full-stack Machine Learning application designed to forecast electricity consumption. It features a modern, interactive React frontend and a powerful FastAPI + Scikit-Learn + CatBoost backend.

## 📁 Project Structure

The repository is divided into two main parts:
- `/frontend` - React + Vite (UI/UX)
- `/backend` - FastAPI + Python (Machine Learning Engine)

```text
FINPRO_ML/
│
├── frontend/                 # React Frontend Application
│   ├── src/                  # Source code (Components, Pages, Context)
│   ├── public/               # Static assets (Logos, etc.)
│   ├── package.json          # Node.js dependencies
│   ├── vite.config.js        # Vite configuration
│   └── vercel.json           # (Optional) Vercel deployment config
│
├── backend/                  # FastAPI Backend Application
│   ├── main.py               # API Endpoints
│   ├── pipeline.py           # Machine Learning Pipeline
│   ├── requirements.txt      # Python dependencies
│   └── .env                  # Environment variables (Supabase Keys)
│
├── data/                     # Dataset (train.csv, test.csv)
└── README.md                 # Project documentation
```

## 🚀 Running Locally

### 1. Backend Setup
1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Create a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/Scripts/activate  # On Windows
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the `backend` folder and add your Supabase credentials:
   ```env
   SUPABASE_URL=https://your-project-url.supabase.co
   SUPABASE_KEY=your-service-role-key
   ```
5. Run the FastAPI server:
   ```bash
   uvicorn main:app --reload
   ```
   The backend will be running at `http://localhost:8000`.

### 2. Frontend Setup
1. Open a new terminal and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `frontend` folder to connect to the backend:
   ```env
   VITE_API_URL=http://localhost:8000
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend will be running at `http://localhost:5173`.

## 🌐 Deployment Guide

### Frontend Deployment (Vercel)
Vercel is highly recommended for deploying the React frontend.
1. Push this repository to your GitHub account.
2. Go to [Vercel](https://vercel.com/) and click **Add New Project**.
3. Import your GitHub repository.
4. **Important Configuration:**
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend` (Make sure to select the `frontend` folder, not the root!).
   - **Build Command:** `npm run build`
   - **Install Command:** `npm install`
5. In the **Environment Variables** section, add:
   - `VITE_API_URL`: `https://your-backend-url.com` (If you haven't deployed the backend yet, you can leave it out or put your localhost URL for now).
6. Click **Deploy**.

### Backend Deployment (Render / Railway)
*Note: Vercel is not ideal for Python ML backends due to the 250MB serverless size limit (Libraries like Pandas and CatBoost are very heavy). We recommend deploying the backend on [Render](https://render.com/) or [Railway](https://railway.app/).*

1. On Render, create a new **Web Service**.
2. Connect your GitHub repository.
3. **Root Directory:** `backend`
4. **Environment:** Python
5. **Build Command:** `pip install -r requirements.txt`
6. **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
7. Add your `SUPABASE_URL` and `SUPABASE_KEY` to the Environment Variables.
8. Deploy! (Don't forget to update the `VITE_API_URL` on Vercel with your new Render URL once finished).
