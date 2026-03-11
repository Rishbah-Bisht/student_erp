# Student ERP Portal

A full-stack student management portal built with React, Node.js, and MongoDB.

## Features
- **Student Login**: Secure authentication for students.
- **Academic Dashboard**: Overview of subjects, attendance, and assignments.
- **Subject Hub**: Detailed view of subjects with assigned teachers and test averages.
- **Results Tracking**: View exam results and academic performance.
- **Fee Management**: Track and pay course fees.

## Getting Started (Local Development)

### Prerequisites
- Node.js installed.
- MongoDB (Local or Cloud URL).

### 1. Installation
Run the following command in the root directory to install all dependencies for both frontend and backend:
```bash
npm install
```

### 2. Configuration
Create a `.env` file in the `backend/` directory with the following variables:
```env
PORT=5005
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### 3. Run the App
Run the following command in the root directory:
```bash
npm run dev
```
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5005

---

## Deployment (Vercel)

This project is pre-configured for **Vercel**.

1. Connect your GitHub repository to Vercel.
2. Set the **environment variables** in the Vercel project dashboard (same as in `.env`).
3. Vercel will automatically detect the `vercel.json` and deploy both the frontend and backend.

- The backend entry point is `api/index.js`.
- The frontend is built into `frontend/dist/`.

---

## Android App (Capacitor)

This converts the existing React frontend into a native Android app with the same features, using Capacitor.

### 1. Configure API Base URL
Create `frontend/.env` and set the backend URL:
```env
VITE_API_BASE_URL=https://your-domain.com
```
The app will automatically append `/api` if it is missing.

### 2. Install Dependencies
From the repo root:
```bash
npm install
```

### 3. Add Android Project (First Time Only)
```bash
cd frontend
npm run android:add
```

### 4. Build and Sync
```bash
npm run android:build
```

### 5. Open in Android Studio
```bash
npm run android:open
```

### Notes
- For local backend access on Android emulator, use `http://10.0.2.2:5005` as `VITE_API_BASE_URL` and enable cleartext traffic in the Android app configuration.
