# Deploying Frontend to Netlify

This guide walks you through deploying the Simplifly frontend to Netlify.

## Prerequisites

- A Netlify account (sign up at [netlify.com](https://www.netlify.com))
- Your backend running on EC2 (see [DEPLOYMENT.md](./DEPLOYMENT.md))
- Google OAuth credentials configured

## Step 1: Prepare Your Repository

The following files are already configured:
- ✅ `frontend/netlify.toml` - Netlify build configuration
- ✅ `frontend/public/_redirects` - SPA routing support

Make sure these files are committed to your repository:
```bash
git add frontend/netlify.toml frontend/public/_redirects
git commit -m "Add Netlify configuration files"
git push
```

## Step 2: Deploy via Netlify Dashboard (Recommended)

### 2.1 Create New Site

1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect your Git provider (GitHub, GitLab, or Bitbucket)
4. Select your `simplifly` repository

### 2.2 Configure Build Settings

Netlify should auto-detect the settings from `netlify.toml`, but verify:

- **Base directory**: `frontend`
- **Build command**: `npm run build`
- **Publish directory**: `frontend/dist`

If auto-detection doesn't work, manually set:
- **Base directory**: `frontend`
- **Build command**: `npm run build`
- **Publish directory**: `frontend/dist`

### 2.3 Set Environment Variables

Before deploying, add environment variables:

1. In the **"Deploy site"** step, click **"Show advanced"**
2. Click **"New variable"** and add:

   **Variable 1:**
   - Key: `VITE_API_URL`
   - Value: `http://13.233.81.23:3002/api`
   - Scope: All scopes

   **Variable 2:**
   - Key: `VITE_GOOGLE_CLIENT_ID`
   - Value: `548309445196-17n10jq58mngd95oha0bg0vcmv57i814.apps.googleusercontent.com`
   - Scope: All scopes

3. Click **"Deploy site"**

### 2.4 Wait for Deployment

Netlify will:
1. Clone your repository
2. Install dependencies
3. Run the build command
4. Deploy to a URL like `https://random-name-123456.netlify.app`

**Note your site URL** - you'll need it for the next steps!

## Step 3: Update Backend Configuration

After deployment, update your backend to allow requests from your Netlify URL.

### 3.1 Update Backend .env on EC2

SSH into your EC2 instance:
```bash
ssh -i your-key.pem ubuntu@13.233.81.23
```

Update the `.env` file:
```bash
cd ~/simplifly/backend
nano .env
```

Update `FRONTEND_URL` to your Netlify URL:
```env
FRONTEND_URL=https://your-app-name.netlify.app
```

**Important**: 
- Use `https://` not `http://`
- No trailing slash
- Replace `your-app-name.netlify.app` with your actual Netlify URL

Save and exit (Ctrl+X, then Y, then Enter).

### 3.2 Restart Backend

```bash
pm2 restart simplifly-backend
pm2 logs simplifly-backend
```

Check the logs to ensure the server restarted successfully.

## Step 4: Update Google OAuth Settings

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Under **Authorized JavaScript origins**, add:
   - `https://your-app-name.netlify.app`
   - Keep `http://localhost:3000` for local development
5. Under **Authorized redirect URIs**, add:
   - `https://your-app-name.netlify.app`
   - Keep `http://localhost:3000` for local development
6. Click **"Save"**

## Step 5: Verify Deployment

### 5.1 Test the Site

1. Visit your Netlify URL: `https://your-app-name.netlify.app`
2. Check that the landing page loads correctly
3. Open browser console (F12) and check for errors

### 5.2 Test Google Sign-In

1. Click "Sign in with Google"
2. Complete the OAuth flow
3. Verify you're redirected to the dashboard
4. Check browser console for any CORS or API errors

### 5.3 Check Backend Logs

On EC2:
```bash
pm2 logs simplifly-backend --lines 50
```

Look for successful API requests from your Netlify URL.

## Step 6: Set Up Custom Domain (Optional)

If you have a custom domain:

1. In Netlify Dashboard → **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Enter your domain name
4. Follow Netlify's DNS configuration instructions
5. Update `FRONTEND_URL` in backend `.env` to your custom domain
6. Update Google OAuth settings with your custom domain
7. Restart backend: `pm2 restart simplifly-backend`

## Troubleshooting

### Build Fails

**Error**: Build command failed
- Check Netlify build logs
- Ensure `frontend/package.json` has correct build script
- Verify Node.js version (should be 18+)

**Error**: Environment variables not found
- Ensure variables start with `VITE_` prefix
- Redeploy after adding variables
- Check variable names match exactly

### CORS Errors

**Error**: CORS policy blocked
- Verify `FRONTEND_URL` in backend `.env` matches Netlify URL exactly
- Check backend restarted: `pm2 restart simplifly-backend`
- Ensure no trailing slash in `FRONTEND_URL`

### Google Sign-In Not Working

**Error**: OAuth redirect mismatch
- Verify Netlify URL is in Google OAuth authorized origins
- Check redirect URI matches exactly
- Clear browser cache and cookies

### API Not Reachable

**Error**: Network error or timeout
- Verify EC2 security group allows port 3002 from `0.0.0.0/0`
- Test API directly: `curl http://13.233.81.23:3002/api/auth/me`
- Check backend is running: `pm2 status`

### SPA Routing Not Working

**Error**: 404 on page refresh
- Verify `frontend/public/_redirects` exists with `/* /index.html 200`
- Check `netlify.toml` has redirects configured
- Redeploy after adding `_redirects` file

## Environment Variables Reference

### Required in Netlify

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_API_URL` | `http://13.233.81.23:3002/api` | Backend API URL |
| `VITE_GOOGLE_CLIENT_ID` | Your Google Client ID | Google OAuth client ID |

### Required in Backend (.env on EC2)

| Variable | Value | Description |
|----------|-------|-------------|
| `FRONTEND_URL` | `https://your-app.netlify.app` | Your Netlify URL |

## Quick Checklist

- [ ] Repository pushed with `netlify.toml` and `_redirects`
- [ ] Netlify site created and connected to repository
- [ ] Build settings configured (base: `frontend`, publish: `frontend/dist`)
- [ ] Environment variables set in Netlify (`VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`)
- [ ] Site deployed successfully
- [ ] Backend `.env` updated with Netlify URL
- [ ] Backend restarted with PM2
- [ ] Google OAuth settings updated with Netlify URL
- [ ] Tested sign-in from Netlify site
- [ ] No CORS errors in browser console
- [ ] SPA routing works (test by refreshing a page)

## Next Steps

After successful deployment:

1. **Monitor**: Check Netlify analytics and backend logs
2. **Optimize**: Enable Netlify's CDN and caching features
3. **Secure**: Consider setting up a custom domain with HTTPS
4. **Scale**: Monitor backend performance and scale EC2 if needed

## Support

If you encounter issues:
1. Check Netlify build logs
2. Check browser console for errors
3. Check backend PM2 logs
4. Verify all environment variables are set correctly
5. Review [CONNECT_FRONTEND_BACKEND.md](./CONNECT_FRONTEND_BACKEND.md) for connection troubleshooting

---

**Congratulations!** 🎉 Your frontend is now live on Netlify!
