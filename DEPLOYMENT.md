# Deployment Guide

This guide covers deploying Simplifly to production:
- Frontend: Netlify
- Database: MongoDB Atlas
- Backend: EC2 (AWS)

## Prerequisites

1. Google Cloud Console account (for OAuth)
2. MongoDB Atlas account
3. Netlify account
4. AWS account with EC2 access
5. Domain name (optional but recommended)

## Step 1: Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Configure OAuth consent screen:
   - User Type: External
   - App name: Simplifly
   - Support email: your-email@example.com
   - Authorized domains: your-domain.com (or localhost for testing)
6. Create OAuth client:
   - Application type: Web application
   - Name: Simplifly Web Client
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - `https://your-domain.netlify.app` (for production)
   - Authorized redirect URIs:
     - `http://localhost:3000` (for development)
     - `https://your-domain.netlify.app` (for production)
7. Copy the Client ID - you'll need this for both frontend and backend

## Step 2: MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (Free tier is fine for starters)
3. Create a database user:
   - Database Access → Add New Database User
   - Username: simplifly-admin
   - Password: Generate secure password (save it!)
   - Database User Privileges: Read and write to any database
4. Whitelist IP addresses:
   - Network Access → Add IP Address
   - For EC2: Add your EC2 instance IP
   - For development: Add "0.0.0.0/0" (temporary, restrict later)
5. Get connection string:
   - Clusters → Connect → Connect your application
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Example: `mongodb+srv://simplifly-admin:<password>@cluster0.xxxxx.mongodb.net/simplifly?retryWrites=true&w=majority`

## Step 3: Backend Deployment (EC2)

### 3.1 Launch EC2 Instance

1. Go to AWS Console → EC2
2. Launch Instance:
   - AMI: Ubuntu Server 22.04 LTS (Free tier eligible)
   - Instance type: t2.micro (Free tier)
   - Key pair: Create new or use existing
   - Security Group: Create new with rules:
     - SSH (22): Your IP
     - HTTP (80): 0.0.0.0/0
     - HTTPS (443): 0.0.0.0/0
     - Custom TCP (3002): 0.0.0.0/0 (or restrict to Netlify IPs)
3. Launch and save your key pair file

### 3.2 Connect to EC2 Instance

```bash
# Make key file executable
chmod 400 your-key.pem

# Connect to instance
ssh -i your-key.pem ubuntu@your-ec2-ip
```

### 3.3 Setup Node.js and PM2

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version

# Install PM2 globally
sudo npm install -g pm2
```

### 3.4 Deploy Backend Code

```bash
# Clone your repository (or use git pull if already cloned)
git clone https://github.com/your-username/simplifly.git
cd simplifly/backend

# Install dependencies
npm install

# Create .env file
nano .env
```

Add the following to `.env`:

```env
NODE_ENV=production
PORT=3002
MONGODB_URI=mongodb+srv://simplifly-admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/simplifly?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this-to-random-string
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
FRONTEND_URL=https://your-domain.netlify.app
```

Generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3.5 Start Backend with PM2

```bash
# Start application
pm2 start server.js --name simplifly-backend

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions it provides

# Check status
pm2 status
pm2 logs simplifly-backend
```

### 3.6 Setup Nginx (Optional but Recommended)

```bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/simplifly
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com api.your-domain.com;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/simplifly /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 3.7 Setup SSL with Let's Encrypt (Optional)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d api.your-domain.com

# Auto-renewal is set up automatically
```

## Step 4: Frontend Deployment (Netlify)

### 4.1 Build Frontend Locally

```bash
cd frontend

# Create .env file
cat > .env << EOF
VITE_API_URL=https://your-ec2-domain.com/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
EOF

# Build
npm run build
```

### 4.2 Deploy to Netlify

**Option A: Netlify CLI**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
cd frontend
netlify deploy --prod
```

**Option B: Netlify Dashboard**

1. Go to [Netlify](https://app.netlify.com/)
2. Click "Add new site" → "Import an existing project"
3. Connect your Git repository
4. Build settings:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`
5. Environment variables:
   - `VITE_API_URL`: `https://your-ec2-domain.com/api`
   - `VITE_GOOGLE_CLIENT_ID`: Your Google Client ID
6. Deploy!

### 4.3 Update Google OAuth Settings

1. Go back to Google Cloud Console
2. Update authorized JavaScript origins and redirect URIs with your Netlify URL
3. Update backend `.env` with your Netlify URL in `FRONTEND_URL`

## Step 5: Update CORS and Environment Variables

### Backend (.env)
```env
FRONTEND_URL=https://your-app.netlify.app
```

### Frontend (Netlify Environment Variables)
```
VITE_API_URL=https://your-ec2-ip-or-domain:3002/api
# OR if using Nginx:
VITE_API_URL=https://api.your-domain.com/api
```

## Step 6: Security Checklist

- [ ] Change default JWT_SECRET to a strong random string
- [ ] Restrict MongoDB Atlas IP whitelist to only EC2 IP
- [ ] Use HTTPS for all connections
- [ ] Set up firewall rules on EC2 (only allow necessary ports)
- [ ] Enable MongoDB Atlas authentication
- [ ] Regularly update dependencies
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy for MongoDB

## Step 7: Monitoring

### PM2 Monitoring
```bash
# View logs
pm2 logs simplifly-backend

# Monitor resources
pm2 monit

# Restart application
pm2 restart simplifly-backend
```

### MongoDB Atlas Monitoring
- Monitor in MongoDB Atlas dashboard
- Set up alerts for unusual activity

## Troubleshooting

### Backend not starting
```bash
# Check logs
pm2 logs simplifly-backend

# Check if port is in use
sudo lsof -i :3002

# Restart
pm2 restart simplifly-backend
```

### CORS errors
- Verify `FRONTEND_URL` in backend `.env` matches your Netlify URL exactly
- Check browser console for exact error

### Google OAuth not working
- Verify Client ID is correct in both frontend and backend
- Check authorized origins in Google Cloud Console
- Ensure redirect URIs match exactly

### MongoDB connection issues
- Verify connection string is correct
- Check IP whitelist in MongoDB Atlas
- Verify database user credentials

## Maintenance

### Update Backend
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
cd simplifly/backend
git pull
npm install
pm2 restart simplifly-backend
```

### Update Frontend
- Push to Git, Netlify will auto-deploy
- Or use Netlify CLI: `netlify deploy --prod`

## Cost Estimation

- **EC2 t2.micro**: Free tier (750 hours/month) or ~$8/month
- **MongoDB Atlas**: Free tier (512MB) or ~$9/month for M0
- **Netlify**: Free tier (100GB bandwidth) or $19/month for Pro
- **Domain**: ~$10-15/year

**Total**: Free tier covers most needs, or ~$20-30/month for production use.
