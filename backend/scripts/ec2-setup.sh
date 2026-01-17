#!/bin/bash

# EC2 Setup Script for Simplifly Backend
# Run this script on your EC2 instance after connecting via SSH

echo "🚀 Starting Simplifly Backend Setup on EC2..."

# Update system
echo "📦 Updating system packages..."
sudo apt update
sudo apt upgrade -y

# Install Node.js 18.x
echo "📦 Installing Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify Node.js installation
echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Install PM2
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install Git
echo "📦 Installing Git..."
sudo apt install -y git

# Install Nginx (optional)
read -p "Do you want to install Nginx? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "📦 Installing Nginx..."
    sudo apt install nginx -y
    echo "✅ Nginx installed"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Clone your repository: git clone <your-repo-url>"
echo "2. cd into backend directory"
echo "3. Run: npm install"
echo "4. Create .env file with your configuration"
echo "5. Start with PM2: pm2 start server.js --name simplifly-backend"
echo "6. Save PM2: pm2 save"
echo "7. Setup auto-start: pm2 startup (then run the command it outputs)"
echo ""
