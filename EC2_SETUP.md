# AWS EC2 Setup Guide for Simplifly Backend

This guide will walk you through deploying your Simplifly backend to AWS EC2.

## Prerequisites

- AWS account (free tier eligible)
- Your backend code ready
- MongoDB Atlas connection string
- Google OAuth Client ID

---

## Step 1: Launch EC2 Instance

### 1.1 Go to EC2 Console

1. Log in to [AWS Console](https://console.aws.amazon.com/)
2. Search for "EC2" in the services search bar
3. Click on **EC2**

### 1.2 Launch Instance

1. Click **"Launch Instance"** button (orange button)
2. **Name**: `simplifly-backend` (or any name you prefer)

### 1.3 Choose AMI (Amazon Machine Image)

1. Select **"Ubuntu Server 22.04 LTS"** (Free tier eligible)
2. Architecture: **64-bit (x86)**

### 1.4 Choose Instance Type

1. Select **"t2.micro"** (Free tier eligible)
   - 1 vCPU, 1 GB RAM
   - Free for 750 hours/month for first year
2. Click **"Next: Configure Instance Details"**

### 1.5 Configure Instance Details

1. **Number of instances**: `1`
2. Leave other settings as default
3. Click **"Next: Add Storage"**

### 1.6 Add Storage

1. **Size**: `8 GB` (free tier includes 30 GB)
2. **Volume Type**: `gp3` (General Purpose SSD)
3. Click **"Next: Add Tags"** (optional, you can skip)

### 1.7 Configure Security Group

**This is important for allowing connections!**

1. **Security group name**: `simplifly-backend-sg`
2. **Description**: `Security group for Simplifly backend`

3. **Add Inbound Rules**:
   - **SSH (22)**: 
     - Type: SSH
     - Protocol: TCP
     - Port: 22
     - Source: My IP (or `0.0.0.0/0` for testing, but restrict later)
   
   - **HTTP (80)**:
     - Type: HTTP
     - Protocol: TCP
     - Port: 80
     - Source: `0.0.0.0/0`
   
   - **HTTPS (443)**:
     - Type: HTTPS
     - Protocol: TCP
     - Port: 443
     - Source: `0.0.0.0/0`
   
   - **Custom TCP (3002)**:
     - Type: Custom TCP
     - Protocol: TCP
     - Port: 3002
     - Source: `0.0.0.0/0` (or restrict to your Netlify IPs later)

4. Click **"Review and Launch"**

### 1.8 Review and Launch

1. Review your settings
2. Click **"Launch"**

### 1.9 Create/Select Key Pair

1. **Create a new key pair** (if you don't have one):
   - Key pair name: `simplifly-key`
   - Key pair type: `RSA`
   - Private key file format: `.pem`
   - Click **"Create key pair"**
   - **IMPORTANT**: The `.pem` file will download automatically. Save it securely!

2. **OR** Select an existing key pair

3. Check the acknowledgment checkbox
4. Click **"Launch Instances"**

### 1.10 Wait for Instance to Launch

1. Click **"View Instances"**
2. Wait 1-2 minutes for the instance to be in **"Running"** state
3. Note the **Public IPv4 address** (e.g., `54.123.45.67`)

---

## Step 2: Connect to EC2 Instance

### 2.1 On macOS/Linux

1. **Make key file executable**:
   ```bash
   chmod 400 ~/Downloads/simplifly-key.pem
   # Or wherever you saved the key file
   ```

2. **Connect to instance**:
   ```bash
   ssh -i ~/Downloads/simplifly-key.pem ubuntu@YOUR_EC2_IP
   # Replace YOUR_EC2_IP with your actual Public IPv4 address
   ```

3. If you see a warning about authenticity, type `yes`

### 2.2 On Windows

Use **PuTTY** or **Windows Subsystem for Linux (WSL)**:

**Option A: Using WSL**
```bash
chmod 400 simplifly-key.pem
ssh -i simplifly-key.pem ubuntu@YOUR_EC2_IP
```

**Option B: Using PuTTY**
1. Download [PuTTY](https://www.putty.org/)
2. Convert `.pem` to `.ppk` using PuTTYgen
3. Use PuTTY to connect with the `.ppk` file

---

## Step 3: Update System

Once connected, run:

```bash
sudo apt update
sudo apt upgrade -y
```

---

## Step 4: Install Node.js

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

You should see:
- Node.js version: `v18.x.x` or higher
- npm version: `9.x.x` or higher

---

## Step 5: Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

PM2 will keep your Node.js app running even after you disconnect.

---

## Step 6: Install Git

```bash
sudo apt install -y git
```

---

## Step 7: Clone Your Repository

### Option A: Using Git (Recommended)

```bash
# Create a directory for your app
cd ~
mkdir simplifly
cd simplifly

# Clone your repository
git clone https://github.com/YOUR_USERNAME/simplifly.git .
# Replace YOUR_USERNAME with your GitHub username

# OR if you haven't pushed to GitHub yet, you can use SCP (see Option B)
```

### Option B: Using SCP (If not using Git)

**On your local machine**:

```bash
# From your local machine, compress the backend folder
cd /Users/umorjyoti/Projects/simplifly
tar -czf backend.tar.gz backend/

# Copy to EC2
scp -i ~/Downloads/simplifly-key.pem backend.tar.gz ubuntu@YOUR_EC2_IP:~/

# Then on EC2, extract it
ssh -i ~/Downloads/simplifly-key.pem ubuntu@YOUR_EC2_IP
cd ~
mkdir simplifly
cd simplifly
tar -xzf ~/backend.tar.gz
mv backend/* .
rm -rf backend backend.tar.gz
```

---

## Step 8: Install Dependencies

```bash
cd ~/simplifly/backend
npm install
```

---

## Step 9: Create .env File

```bash
cd ~/simplifly/backend
nano .env
```

Add the following (replace with your actual values):

```env
NODE_ENV=production
PORT=3002

# MongoDB Atlas
MONGODB_URI=mongodb+srv://simplifly_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/simplifly?retryWrites=true&w=majority

# JWT Secret (use the same one from your local .env)
JWT_SECRET=faae0042a14e06a6158748600d84c94ce680d3c586c8828640e60d682f6fa366af3c8d883c79ca65993e0d15088a5f5b85576771e4b4b0433549d19d193e1e2d

# Google OAuth
GOOGLE_CLIENT_ID=548309445196-17n10jq58mngd95oha0bg0vcmv57i814.apps.googleusercontent.com

# Frontend URL (your Netlify URL)
FRONTEND_URL=https://your-app.netlify.app
```

**Save and exit**: `Ctrl + X`, then `Y`, then `Enter`

---

## Step 10: Update MongoDB Atlas IP Whitelist

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Go to **Network Access**
3. Click **"Add IP Address"**
4. Add your EC2 instance's **Public IPv4 address**
5. Click **"Confirm"**

---

## Step 11: Start Application with PM2

```bash
cd ~/simplifly/backend
pm2 start server.js --name simplifly-backend
```

### PM2 Commands

```bash
# View status
pm2 status

# View logs
pm2 logs simplifly-backend

# Restart
pm2 restart simplifly-backend

# Stop
pm2 stop simplifly-backend

# Delete
pm2 delete simplifly-backend
```

### Save PM2 Configuration

```bash
pm2 save
```

### Setup PM2 to Start on Boot

```bash
pm2 startup
```

This will output a command. **Copy and run that command** (it will be something like `sudo env PATH=...`).

---

## Step 12: Test Your Backend

```bash
# From your local machine, test the API
curl http://YOUR_EC2_IP:3002/api/auth/me
# Should return 401 (unauthorized) - this means the server is running!
```

---

## Step 13: Setup Nginx (Optional but Recommended)

Nginx will act as a reverse proxy and can handle SSL.

### 13.1 Install Nginx

```bash
sudo apt install nginx -y
```

### 13.2 Create Nginx Configuration

```bash
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

**Save and exit**: `Ctrl + X`, `Y`, `Enter`

### 13.3 Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/simplifly /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

### 13.4 Setup SSL with Let's Encrypt (Optional)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com -d api.your-domain.com
```

Follow the prompts. SSL will be set up automatically!

---

## Step 14: Update Frontend Environment Variables

In your Netlify dashboard:

1. Go to your site → **Site settings** → **Environment variables**
2. Update `VITE_API_URL`:
   - If using Nginx: `https://api.your-domain.com/api`
   - If not using Nginx: `http://YOUR_EC2_IP:3002/api`

---

## Step 15: Update Google OAuth Settings

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Go to **APIs & Services** → **Credentials**
3. Edit your OAuth client
4. Add to **Authorized JavaScript origins**:
   - `https://your-app.netlify.app`
5. Add to **Authorized redirect URIs**:
   - `https://your-app.netlify.app`

---

## Troubleshooting

### Can't connect via SSH
- Check security group allows SSH (port 22) from your IP
- Verify you're using the correct key file
- Check the instance is in "Running" state

### Application not starting
```bash
# Check PM2 logs
pm2 logs simplifly-backend

# Check if port is in use
sudo lsof -i :3002

# Restart PM2
pm2 restart simplifly-backend
```

### MongoDB connection error
- Verify IP is whitelisted in MongoDB Atlas
- Check connection string in `.env`
- Test connection: `curl http://localhost:3002/api/auth/me`

### CORS errors
- Verify `FRONTEND_URL` in backend `.env` matches your Netlify URL exactly
- Check backend logs for CORS errors

---

## Security Checklist

- [ ] Security group only allows necessary ports
- [ ] SSH key is secured (chmod 400)
- [ ] `.env` file is not committed to git
- [ ] MongoDB Atlas IP whitelist is restricted
- [ ] PM2 is set up to auto-start
- [ ] SSL is configured (if using domain)
- [ ] Regular backups are configured

---

## Cost Estimation

- **EC2 t2.micro**: Free tier (750 hours/month) or ~$8/month
- **EBS Storage (8GB)**: Free tier (30GB) or ~$0.80/month
- **Data Transfer**: First 100GB free, then ~$0.09/GB

**Total**: Free for first year, then ~$8-10/month

---

## Next Steps

1. ✅ Backend is running on EC2
2. ✅ Frontend is deployed on Netlify
3. ✅ MongoDB Atlas is configured
4. ✅ Google OAuth is set up
5. 🎉 Your app is live!

Good luck! 🚀
