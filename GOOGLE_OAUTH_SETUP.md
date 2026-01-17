# Google OAuth Setup Guide - Step by Step

This guide will walk you through setting up Google Sign In for Simplifly.

## Prerequisites
- A Google account
- Access to Google Cloud Console

---

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top (next to "Google Cloud")
3. Click **"New Project"**
4. Enter project details:
   - **Project name**: `Simplifly` (or any name you prefer)
   - **Organization**: Leave as default (or select if you have one)
   - **Location**: Leave as default
5. Click **"Create"**
6. Wait for the project to be created (usually takes a few seconds)
7. Make sure your new project is selected in the project dropdown

---

## Step 2: Enable Google+ API

1. In the Google Cloud Console, go to **"APIs & Services"** → **"Library"** (or search for "API Library" in the search bar)
2. Search for **"Google+ API"** or **"Google Identity Services"**
3. Click on **"Google Identity Services API"** (or "Google+ API" if that's what shows up)
4. Click **"Enable"**
5. Wait for the API to be enabled

**Note**: Google Identity Services is the newer API. If you see both options, use "Google Identity Services API".

---

## Step 3: Configure OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"** (in the left sidebar)
2. Choose **"External"** user type (unless you have a Google Workspace account)
3. Click **"Create"**

### Fill in the OAuth consent screen form:

**App information:**
- **App name**: `Simplifly`
- **User support email**: Select your email (`umorjyotichetia@gmail.com`)
- **App logo**: (Optional) Upload your logo if you have one
- **App domain**: Leave blank for now (or add your domain if you have one)
- **Application home page**: 
  - For development: `http://localhost:3000`
  - For production: `https://your-app.netlify.app`
- **Authorized domains**: 
  - For development: Leave blank
  - For production: Add your domain (e.g., `netlify.app` or your custom domain)

**Developer contact information:**
- **Email addresses**: `umorjyotichetia@gmail.com`

4. Click **"Save and Continue"**

### Scopes (Step 2):
1. Click **"Add or Remove Scopes"**
2. Select these scopes:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`
3. Click **"Update"**
4. Click **"Save and Continue"**

### Test users (Step 3):
- For development, you can add test users (your email)
- For production, you can skip this
- Click **"Save and Continue"**

### Summary (Step 4):
- Review your settings
- Click **"Back to Dashboard"**

---

## Step 4: Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** → **"Credentials"** (in the left sidebar)
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"OAuth client ID"**

### Configure OAuth client:

**Application type**: Select **"Web application"**

**Name**: `Simplifly Web Client`

**Authorized JavaScript origins**:
Click **"+ ADD URI"** and add:
- For development: `http://localhost:3000`
- For production: `https://your-app.netlify.app` (replace with your actual Netlify URL)

**Authorized redirect URIs**:
Click **"+ ADD URI"** and add:
- For development: `http://localhost:3000`
- For production: `https://your-app.netlify.app` (replace with your actual Netlify URL)

**Note**: The redirect URI should match your frontend URL exactly.

4. Click **"CREATE"**

---

## Step 5: Copy Your Client ID

After creating the OAuth client, a popup will appear with your credentials:

1. **Copy the Client ID** - You'll need this for both frontend and backend
   - It looks like: `123456789-abcdefghijklmnop.apps.googleusercontent.com`
2. **Copy the Client secret** (optional, but save it somewhere safe)
   - You might need this later for server-side operations

**Important**: Save these credentials securely. You won't be able to see the client secret again.

---

## Step 6: Configure Frontend Environment Variables

1. Navigate to your frontend directory:
```bash
cd frontend
```

2. Create a `.env` file (if it doesn't exist):
```bash
touch .env
```

3. Open the `.env` file and add:
```env
VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
VITE_API_URL=http://localhost:3002/api
```

**Replace `your-client-id-here` with the actual Client ID you copied in Step 5.**

**Example:**
```env
VITE_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
VITE_API_URL=http://localhost:3002/api
```

4. Save the file

---

## Step 7: Configure Backend Environment Variables

1. Navigate to your backend directory:
```bash
cd backend
```

2. Open or create the `.env` file:
```bash
nano .env
# or use your preferred editor
```

3. Add or update these variables:
```env
NODE_ENV=development
PORT=3002
MONGODB_URI=mongodb://localhost:27017/simplifly
JWT_SECRET=your-secret-key-change-this-in-production
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
FRONTEND_URL=http://localhost:3000
```

**Replace `your-client-id-here` with the same Client ID you used in the frontend.**

**Note**: The `GOOGLE_CLIENT_ID` should be the same in both frontend and backend.

4. Save the file

---

## Step 8: Restart Your Development Servers

### Backend:
1. Stop your backend server (Ctrl+C if running)
2. Restart it:
```bash
cd backend
npm run dev
```

### Frontend:
1. Stop your frontend server (Ctrl+C if running)
2. Restart it:
```bash
cd frontend
npm run dev
```

**Important**: Environment variables are loaded when the server starts, so you must restart after changing them.

---

## Step 9: Test Google Sign In

1. Open your browser and go to `http://localhost:3000`
2. You should see the landing page with "Sign in with Google" button
3. Click the button
4. You should see a Google sign-in popup
5. Select your Google account
6. Grant permissions if prompted
7. You should be redirected to the dashboard after successful sign-in

---

## Troubleshooting

### Issue: "Error 400: redirect_uri_mismatch"
**Solution**: 
- Check that your redirect URI in Google Console exactly matches your frontend URL
- Make sure there's no trailing slash: `http://localhost:3000` not `http://localhost:3000/`
- Update the authorized redirect URIs in Google Cloud Console

### Issue: "Error 403: access_denied"
**Solution**:
- Make sure you've added your email as a test user in OAuth consent screen (for development)
- Check that the OAuth consent screen is properly configured

### Issue: Google Sign In button doesn't appear
**Solution**:
- Check browser console for errors
- Verify `VITE_GOOGLE_CLIENT_ID` is set correctly in `.env`
- Make sure you restarted the frontend server after adding the env variable
- Check that the Google Identity Services script is loading (check Network tab in DevTools)

### Issue: "Invalid client ID"
**Solution**:
- Verify the Client ID is correct in both frontend and backend `.env` files
- Make sure there are no extra spaces or quotes around the Client ID
- The Client ID should look like: `123456789-abcdefghijklmnop.apps.googleusercontent.com`

### Issue: Backend authentication fails
**Solution**:
- Verify `GOOGLE_CLIENT_ID` is set in backend `.env`
- Check backend logs for specific error messages
- Make sure the backend server was restarted after adding the env variable

---

## For Production Deployment

When deploying to production:

1. **Update Google Cloud Console**:
   - Add your production URLs to "Authorized JavaScript origins"
   - Add your production URLs to "Authorized redirect URIs"
   - Example: `https://your-app.netlify.app`

2. **Update Frontend Environment Variables** (in Netlify):
   - Go to Netlify Dashboard → Your Site → Site settings → Environment variables
   - Add/Update:
     - `VITE_GOOGLE_CLIENT_ID`: Your Client ID
     - `VITE_API_URL`: Your backend API URL (e.g., `https://api.yourdomain.com/api`)

3. **Update Backend Environment Variables** (on EC2):
   - Update `.env` file on your EC2 instance:
     - `GOOGLE_CLIENT_ID`: Your Client ID
     - `FRONTEND_URL`: Your Netlify URL (e.g., `https://your-app.netlify.app`)

4. **OAuth Consent Screen**:
   - Update "Application home page" with production URL
   - Add your domain to "Authorized domains"
   - Submit for verification if you want to make it public (optional for now)

---

## Quick Checklist

- [ ] Created Google Cloud Project
- [ ] Enabled Google Identity Services API
- [ ] Configured OAuth consent screen
- [ ] Created OAuth 2.0 Client ID
- [ ] Copied Client ID
- [ ] Added `VITE_GOOGLE_CLIENT_ID` to frontend `.env`
- [ ] Added `GOOGLE_CLIENT_ID` to backend `.env`
- [ ] Restarted both servers
- [ ] Tested Google Sign In
- [ ] Successfully logged in!

---

## Need Help?

If you encounter any issues:
1. Check the browser console (F12 → Console tab)
2. Check backend logs
3. Verify all environment variables are set correctly
4. Make sure URLs match exactly in Google Console

Good luck! 🚀
