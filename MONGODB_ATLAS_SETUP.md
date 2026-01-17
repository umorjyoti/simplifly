# MongoDB Atlas Setup Guide

This guide will walk you through setting up MongoDB Atlas for Simplifly.

## Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Click **"Try Free"** or **"Sign Up"**
3. Sign up with:
   - Email: `umorjyotichetia@gmail.com`
   - Or use Google Sign In
4. Verify your email address

---

## Step 2: Create a New Cluster

1. After logging in, you'll see the **"Deploy a cloud database"** screen
2. Choose **"M0 FREE"** (Free tier - perfect for development)
3. Select a **Cloud Provider**:
   - **AWS** (recommended)
   - **Google Cloud**
   - **Azure**
4. Choose a **Region**:
   - Select the region closest to you (or where your EC2 will be)
   - For example: `N. Virginia (us-east-1)` or `Mumbai (ap-south-1)`
5. Click **"Create"** (or **"Create Cluster"**)
6. Wait 3-5 minutes for the cluster to be created

---

## Step 3: Create Database User

1. While the cluster is being created, you'll see a **"Create Database User"** screen
2. **Authentication Method**: Choose **"Password"**
3. **Username**: `simplifly-admin` (or any username you prefer)
4. **Password**: 
   - Click **"Autogenerate Secure Password"** (recommended)
   - **OR** create your own strong password
   - **IMPORTANT**: Copy and save this password! You won't be able to see it again.
5. **Database User Privileges**: 
   - Select **"Atlas admin"** (for full access)
   - Or **"Read and write to any database"**
6. Click **"Create Database User"**

**Save the password securely!** You'll need it for the connection string.

---

## Step 4: Configure Network Access (IP Whitelist)

1. You'll see **"Where would you like to connect from?"** screen
2. For development, click **"Add My Current IP Address"**
3. Click **"Add IP Address"**
4. For production (EC2), you'll need to add your EC2 instance IP later
5. Click **"Finish and Close"**

**Note**: For development, you can also add `0.0.0.0/0` to allow from anywhere (less secure, but convenient for testing). Remove this before production!

---

## Step 5: Get Your Connection String

1. Once your cluster is created, click **"Connect"** button (next to your cluster name)
2. Choose **"Connect your application"**
3. **Driver**: Select **"Node.js"**
4. **Version**: Select the latest version (e.g., `5.5 or later`)
5. You'll see a connection string that looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. **Copy this connection string**

---

## Step 6: Update Your Connection String

1. Replace `<username>` with your database username (e.g., `simplifly-admin`)
2. Replace `<password>` with your database password (the one you saved!)
3. Add your database name at the end:
   ```
   mongodb+srv://simplifly-admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/simplifly?retryWrites=true&w=majority
   ```

**Example:**
```
mongodb+srv://simplifly-admin:MySecurePass123@cluster0.abc123.mongodb.net/simplifly?retryWrites=true&w=majority
```

---

## Step 7: Update Backend .env File

1. Open your backend `.env` file:
   ```bash
   cd backend
   nano .env
   # or use your preferred editor
   ```

2. Update the `MONGODB_URI` line:
   ```env
   MONGODB_URI=mongodb+srv://simplifly-admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/simplifly?retryWrites=true&w=majority
   ```

3. Replace:
   - `YOUR_PASSWORD` with your actual database password
   - `cluster0.xxxxx` with your actual cluster address
   - Keep `simplifly` as the database name (or change it if you prefer)

4. Save the file

---

## Step 8: Test the Connection

1. Make sure your backend server is running:
   ```bash
   cd backend
   npm run dev
   ```

2. You should see:
   ```
   MongoDB connected
   Server running on port 3002
   ```

3. If you see an error, check:
   - Password is correct (no extra spaces)
   - Username is correct
   - IP address is whitelisted
   - Connection string format is correct

---

## Troubleshooting

### Error: "Authentication failed"
**Solution:**
- Check username and password are correct
- Make sure there are no extra spaces in the connection string
- URL-encode special characters in password (e.g., `@` becomes `%40`)

### Error: "IP not whitelisted"
**Solution:**
1. Go to MongoDB Atlas → **Network Access**
2. Click **"Add IP Address"**
3. Add your current IP or `0.0.0.0/0` for development
4. Wait 1-2 minutes for changes to take effect

### Error: "Connection timeout"
**Solution:**
- Check your internet connection
- Verify the cluster is running (not paused)
- Check firewall settings

### Error: "Invalid connection string"
**Solution:**
- Make sure the connection string format is correct
- Check for typos in username/password
- Ensure the database name is included

---

## For Production (EC2)

When deploying to EC2:

1. **Get your EC2 IP address:**
   ```bash
   # On your EC2 instance
   curl ifconfig.me
   ```

2. **Add IP to MongoDB Atlas:**
   - Go to MongoDB Atlas → **Network Access**
   - Click **"Add IP Address"**
   - Enter your EC2 IP address
   - Click **"Confirm"**

3. **Update connection string in production .env:**
   - Same format as development
   - Make sure password is correct

---

## Security Best Practices

1. **Never commit `.env` files to git** ✅ (Already done)
2. **Use strong passwords** for database users
3. **Restrict IP access** - Remove `0.0.0.0/0` in production
4. **Use environment variables** - Never hardcode connection strings
5. **Rotate passwords** periodically
6. **Enable MongoDB Atlas monitoring** and alerts

---

## Quick Checklist

- [ ] Created MongoDB Atlas account
- [ ] Created M0 FREE cluster
- [ ] Created database user (saved password!)
- [ ] Whitelisted IP address
- [ ] Got connection string
- [ ] Updated `MONGODB_URI` in backend `.env`
- [ ] Tested connection (backend starts without errors)
- [ ] Verified "MongoDB connected" message

---

## Next Steps

After MongoDB Atlas is configured:
1. Your backend will automatically connect when you start it
2. Users can sign in with Google
3. Data will be stored in MongoDB Atlas cloud database
4. You can view your data in MongoDB Atlas → **Collections**

Good luck! 🚀
