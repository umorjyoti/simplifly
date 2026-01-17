# Google Sign In Troubleshooting Guide

## Quick Checks

### 1. Check Browser Console
Open browser DevTools (F12) → Console tab and look for errors:
- `Google Identity Services not loaded` → Script not loading
- `Invalid client ID` → Client ID mismatch
- `redirect_uri_mismatch` → Redirect URI not configured correctly
- CORS errors → Backend CORS configuration issue

### 2. Check Network Tab
Open DevTools → Network tab:
- Look for requests to `accounts.google.com`
- Check if `client_id` in the request matches your actual Client ID
- Look for 400/403 errors

### 3. Verify Environment Variables
```bash
# Frontend
cd frontend
cat .env | grep VITE_GOOGLE_CLIENT_ID

# Backend  
cd backend
cat .env | grep GOOGLE_CLIENT_ID
```

Both should show the same Client ID (not "your-client-id-here")

### 4. Restart Servers
After changing `.env` files, you MUST restart:
```bash
# Stop both servers (Ctrl+C)
# Then restart:

# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 5. Check Google Cloud Console Settings

**OAuth Consent Screen:**
- Go to: APIs & Services → OAuth consent screen
- Make sure scopes are added: `userinfo.email`, `userinfo.profile`, `openid`
- For development: Add your email as a test user

**OAuth Client:**
- Go to: APIs & Services → Credentials
- Click on your OAuth client
- Verify:
  - **Authorized JavaScript origins**: `http://localhost:3000`
  - **Authorized redirect URIs**: `http://localhost:3000`

### 6. Common Errors & Solutions

#### Error: "Can't continue with google.com. Something went wrong"
**Causes:**
- Client ID not set correctly
- Redirect URI mismatch
- OAuth consent screen not configured
- Script not loaded

**Solutions:**
1. Verify Client ID in both `.env` files
2. Check redirect URIs in Google Console
3. Make sure OAuth consent screen is configured
4. Hard refresh browser (Cmd+Shift+R)

#### Error: "redirect_uri_mismatch"
**Solution:**
- Go to Google Cloud Console → Credentials
- Edit your OAuth client
- Add `http://localhost:3000` to Authorized redirect URIs
- Make sure there's no trailing slash
- Wait 5 minutes for changes to propagate

#### Error: "access_denied" or "Error 403"
**Solution:**
- Go to OAuth consent screen
- Add your email as a test user (for development)
- Make sure the app is in "Testing" mode (not "In production")

#### Error: "Invalid client ID"
**Solution:**
- Check that Client ID is correct in `.env` files
- No quotes around the Client ID
- No extra spaces
- Restart servers after changing `.env`

#### Google Sign In button doesn't appear
**Solution:**
- Check browser console for errors
- Verify `VITE_GOOGLE_CLIENT_ID` is set
- Make sure frontend server was restarted
- Check Network tab - is the Google script loading?

#### Sign in works but backend fails
**Solution:**
- Check backend logs for errors
- Verify `GOOGLE_CLIENT_ID` in backend `.env`
- Check backend is running on port 3002
- Verify `FRONTEND_URL` in backend `.env` matches frontend URL

## Step-by-Step Debugging

1. **Open browser console** (F12)
2. **Go to Network tab**
3. **Click "Sign in with Google"**
4. **Check for errors:**
   - Red errors in Console?
   - Failed requests in Network?
   - What's the error message?

5. **Check the request:**
   - Find request to `accounts.google.com`
   - Check the `client_id` parameter
   - Is it your actual Client ID or "your-client-id-here"?

6. **Verify environment:**
   ```bash
   # In frontend directory
   echo $VITE_GOOGLE_CLIENT_ID
   # Should show your Client ID
   ```

7. **Test the backend:**
   ```bash
   # Check if backend is running
   curl http://localhost:3002/api/auth/me
   # Should return 401 (unauthorized) not 404 (not found)
   ```

## Still Not Working?

1. **Clear browser cache and cookies**
2. **Try incognito/private window**
3. **Check if MongoDB is running** (if using local MongoDB)
4. **Verify backend is running:**
   ```bash
   curl http://localhost:3002/api/auth/me
   ```
5. **Check backend logs** for errors
6. **Try a different browser**

## Getting Help

When asking for help, provide:
1. Browser console errors (screenshot)
2. Network tab errors (screenshot)
3. Backend logs
4. Your `.env` files (with Client ID redacted)
5. Steps you've already tried
