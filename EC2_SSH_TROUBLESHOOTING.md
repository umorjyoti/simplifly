# EC2 SSH Connection Troubleshooting

## Issue: Permission Denied (publickey)

The verbose output shows:
- ✅ Connection established successfully
- ✅ Key file is being read
- ❌ Authentication fails - key doesn't match

This means the key file you're using doesn't match the key pair associated with the EC2 instance.

## Solution: Check Key Pair Association

### Step 1: Verify Key Pair in AWS Console

1. Go to [AWS EC2 Console](https://console.aws.amazon.com/ec2/)
2. Click on **"Instances"** (left sidebar)
3. Select your instance (`i-xxxxx`)
4. Look at the **"Key pair name"** in the details panel (bottom)
5. Note the exact name (e.g., `simplifly-key` or `my-key-pair`)

### Step 2: Check Your Key Files

```bash
# List all .pem files in Downloads
ls -la ~/Downloads/*.pem

# Check if you have the correct key file
# The filename should match or be related to the key pair name
```

### Step 3: Solutions

#### Option A: Use the Correct Key File

If you have the correct key file:
```bash
ssh -i ~/Downloads/CORRECT_KEY_NAME.pem ubuntu@13.233.81.23
```

#### Option B: Create New Key Pair and Associate It

If you don't have the correct key:

1. **Create a new key pair:**
   - EC2 Console → **Key Pairs** (left sidebar)
   - Click **"Create key pair"**
   - Name: `simplifly-key-new`
   - Type: `RSA`
   - Format: `.pem`
   - Click **"Create key pair"**
   - Download the file

2. **Terminate and relaunch instance** (if it's new and has no data):
   - Select instance → **Instance state** → **Terminate instance**
   - Launch a new instance with the new key pair

3. **OR attach the key to existing instance** (more complex):
   - You'll need to stop the instance
   - Create an AMI
   - Launch new instance from AMI with new key pair

#### Option C: Add Your Public Key to Existing Instance

If you have access via AWS Systems Manager Session Manager:

1. Enable **SSM Agent** on the instance
2. Use **Session Manager** to connect
3. Add your public key to `~/.ssh/authorized_keys`

---

## Quick Fix: Launch New Instance with Correct Key

**If this is a fresh instance with no data**, the easiest solution is:

1. **Terminate current instance:**
   - EC2 Console → Select instance → **Instance state** → **Terminate**

2. **Create new key pair:**
   - EC2 Console → **Key Pairs** → **Create key pair**
   - Name: `simplifly-key`
   - Download the `.pem` file

3. **Launch new instance:**
   - Use the same settings
   - **Select the new key pair** you just created
   - Launch

4. **Connect:**
   ```bash
   chmod 400 ~/Downloads/simplifly-key.pem
   ssh -i ~/Downloads/simplifly-key.pem ubuntu@NEW_IP_ADDRESS
   ```

---

## Verify Key Pair Name

To check which key pair your instance is using:

1. AWS Console → EC2 → Instances
2. Select your instance
3. Check **"Key pair name"** in the details (bottom panel)
4. Make sure your `.pem` file matches this name

---

## Alternative: Use EC2 Instance Connect (Browser-based)

If SSH continues to fail:

1. EC2 Console → Select your instance
2. Click **"Connect"** button (top right)
3. Choose **"EC2 Instance Connect"** tab
4. Click **"Connect"**
5. This opens a browser-based terminal (no key needed)

You can then add your SSH key manually if needed.
