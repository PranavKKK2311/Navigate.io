# Deployment Guide

## Step 1: Set Up MongoDB Atlas (Free)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account and a new cluster
3. Create a database user (username + password)
4. Add `0.0.0.0/0` to IP Whitelist (allows all IPs)
5. Get your connection string:
   ```
   mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/navigate?retryWrites=true&w=majority
   ```

---

## Step 2: Deploy Backend to Render

1. Go to [Render](https://render.com) and sign up with GitHub
2. Click **New** → **Web Service**
3. Connect your GitHub repo: `PranavKKK2311/Navigate.io`
4. Configure:
   - **Name:** `navigate-backend`
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
5. Add Environment Variables:
   - `MONGO_URI` = Your MongoDB Atlas connection string
   - `JWT_SECRET` = Any random string (e.g., `mySecretKey123`)
   - `GEMINI_API_KEY` = Your Gemini API key
   - `NODE_ENV` = `production`
6. Click **Create Web Service**
7. Wait for deployment (2-3 minutes)
8. Copy your backend URL: `https://navigate-backend.onrender.com`

---

## Step 3: Deploy Frontend to Vercel

1. Go to [Vercel](https://vercel.com) and sign up with GitHub
2. Click **Add New** → **Project**
3. Import your GitHub repo: `PranavKKK2311/Navigate.io`
4. Configure:
   - **Framework Preset:** Create React App
   - **Root Directory:** `frontend`
5. Add Environment Variable:
   - `REACT_APP_API_URL` = `https://navigate-backend.onrender.com/api`
   (Use the URL from Step 2)
6. Click **Deploy**
7. Wait for build (1-2 minutes)
8. Your frontend is live at: `https://navigate-io.vercel.app`

---

## Step 4: Update CORS (Important!)

After deployment, update your backend to allow the Vercel domain:

In `backend/server.js`, update CORS:
```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://navigate-io.vercel.app',
    'https://your-custom-domain.com'
  ],
  credentials: true
}));
```

---

## Quick Reference

| Service | URL |
|---------|-----|
| Frontend (Vercel) | `https://navigate-io.vercel.app` |
| Backend (Render) | `https://navigate-backend.onrender.com` |
| Database (Atlas) | MongoDB Atlas Dashboard |

---

## Troubleshooting

**Frontend shows "Network Error"**
- Check that `REACT_APP_API_URL` is set correctly in Vercel
- Ensure backend is running on Render

**Backend fails to start**
- Check Render logs for errors
- Verify `MONGO_URI` is correct

**Login doesn't work**
- Ensure `JWT_SECRET` is set in Render environment variables
