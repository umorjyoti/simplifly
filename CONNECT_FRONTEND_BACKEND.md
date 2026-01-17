# Connecting Frontend (Netlify) to Backend (EC2)

## Overview

Your setup:
- **Frontend**: Netlify (will be at `https://your-app.netlify.app`)
- **Backend**: EC2 at `13.233.81.23:3002`
- **API URL**: `http://13.233.81.23:3002/api`

---

## Step 1: Update Backend .env on EC2

On your EC2 instance, update the `.env` file:

```bash
cd ~/simplifly/backend
nano .env
```

Update `FRONTEND_URL` to your Netlify URL:

```env
NODE_ENV=production
PORT=3002

# MongoDB Atlas
MONGODB_URI=mongodb+srv://simplifly_admin:iXtWElJjoe70OGhs@cluster0.hqwoexx.mongodb.net/simplifly?retryWrites=true&w=majority

# JWT Secret
JWT_SECRET=faae0042a14e06a6158748600d84c94ce680d3c586c8828640e60d682f6fa366af3c8d883c79ca65993e0d15088a5f5b85576771e4b4b0433549d19d193e1e2d

# Google OAuth
GOOGLE_CLIENT_ID=548309445196-17n10jq58mngd95oha0bg0vcmv57i814.apps.googleusercontent.com

# Frontend URL (UPDATE THIS with your Netlify URL)
FRONTEND_URL=https://your-app.netlify.app
```

**Important**: Replace `https://your-app.netlify.app` with your actual Netlify URL.

Save and restart PM2:
```bash
pm2 restart simplifly-backend
```

---

## Step 2: Set Environment Variables in Netlify

### Option A: Via Netlify Dashboard (Recommended)

1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Select your site
3. Go to **Site settings** → **Environment variables**
4. Click **"Add a variable"**
5. Add these variables:

   **Variable 1:**
   - Key: `VITE_API_URL`
   - Value: `http://13.233.81.23:3002/api`
   - Scopes: All scopes (or Production)

   **Variable 2:**
   - Key: `VITE_GOOGLE_CLIENT_ID`
   - Value: `548309445196-17n10jq58mngd95oha0bg0vcmv57i814.apps.googleusercontent.com`
   - Scopes: All scopes (or Production)

6. Click **"Save"**

### Option B: Via netlify.toml (Alternative)

Create `netlify.toml` in your frontend directory:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  VITE_API_URL = "http://13.233.81.23:3002/api"
  VITE_GOOGLE_CLIENT_ID = "548309445196-17n10jq58mngd95oha0bg0vcmv57i814.apps.googleusercontent.com"
```

**Note**: Environment variables in `netlify.toml` are public. Use the dashboard for sensitive values.

---

## Step 3: Update Google OAuth Settings

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Go to **APIs & Services** → **Credentials**
3. Click on your OAuth client
4. **Authorized JavaScript origins**:
   - Add: `https://your-app.netlify.app`
   - Keep: `http://localhost:3000` (for local development)
5. **Authorized redirect URIs**:
   - Add: `https://your-app.netlify.app`
   - Keep: `http://localhost:3000` (for local development)
6. Click **"Save"**

---

## Step 4: Deploy to Netlify

### Option A: Via Netlify Dashboard

1. Go to Netlify Dashboard
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect your Git repository
4. Build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
5. Click **"Deploy site"**

### Option B: Via Netlify CLI

```bash
cd frontend
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

---

## Step 5: Verify Connection

After deployment:

1. **Test the API**:
   ```bash
   curl http://13.233.81.23:3002/api/auth/me
   # Should return 401 (unauthorized) - means server is running
   ```

2. **Test from browser**:
   - Go to your Netlify site
   - Open browser console (F12)
   - Try to sign in with Google
   - Check for CORS errors

3. **Check backend logs**:
   ```bash
   # On EC2
   pm2 logs simplifly-backend
   ```

---

## Troubleshooting

### CORS Errors

If you see CORS errors:

1. **Check `FRONTEND_URL` in backend `.env`**:
   - Must match your Netlify URL exactly
   - No trailing slash
   - Use `https://` not `http://`

2. **Restart backend**:
   ```bash
   pm2 restart simplifly-backend
   ```

### API Not Reachable

1. **Check security group**:
   - EC2 Console → Security Groups
   - Ensure port 3002 is open to `0.0.0.0/0` (or your IP)

2. **Check if backend is running**:
   ```bash
   pm2 status
   ```

3. **Test from local machine**:
   ```bash
   curl http://13.233.81.23:3002/api/auth/me
   ```

### Environment Variables Not Working

1. **Redeploy Netlify** after adding environment variables
2. **Check variable names**: Must start with `VITE_` for Vite
3. **Clear Netlify cache**: Site settings → Build & deploy → Clear cache

---

## Production Best Practices

### Use HTTPS (Recommended)

For production, set up a domain and use HTTPS:

1. **Get a domain** (optional)
2. **Point domain to EC2** (A record: `13.233.81.23`)
3. **Setup Nginx** with SSL (Let's Encrypt)
4. **Update `VITE_API_URL`** to `https://api.yourdomain.com/api`

### Security Group

Restrict port 3002 to only Netlify IPs (if possible) or use a domain with Nginx.

---

## Quick Checklist

- [ ] Backend `.env` has correct `FRONTEND_URL` (Netlify URL)
- [ ] Backend restarted with PM2
- [ ] Netlify environment variables set (`VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`)
- [ ] Google OAuth settings updated with Netlify URL
- [ ] Frontend deployed to Netlify
- [ ] Tested sign-in from Netlify site
- [ ] No CORS errors in browser console

---

## Summary

**Backend (EC2):**
- `FRONTEND_URL=https://your-app.netlify.app`

**Frontend (Netlify):**
- `VITE_API_URL=http://13.233.81.23:3002/api`
- `VITE_GOOGLE_CLIENT_ID=your-client-id`

**Google OAuth:**
- Add Netlify URL to authorized origins and redirect URIs

Good luck! 🚀
