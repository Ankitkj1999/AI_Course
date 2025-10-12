# 🛠️ Installation Guide

This guide will walk you through setting up AiCourse on your local development environment.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16.0.0 or higher)
- **npm** (v7.0.0 or higher) or **yarn**
- **Git**
- **MongoDB** (local installation or MongoDB Atlas account)

## Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/aicourse.git
cd aicourse
```

## Step 2: Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

## Step 3: Environment Configuration

1. Copy the environment template:
```bash
cp server/.env.example server/.env
```

2. Edit `server/.env` with your configuration:

### Required Variables
```env
PORT=5010
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/aicourse
API_KEY=your_google_ai_api_key
EMAIL=your_gmail_address
PASSWORD=your_gmail_app_password
WEBSITE_URL=http://localhost:8080
COMPANY=Your Company Name
```

### Optional Variables (for full functionality)
```env
UNSPLASH_ACCESS_KEY=your_unsplash_key
STRIPE_SECRET_KEY=your_stripe_key
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_APP_SECRET_KEY=your_paypal_secret
# ... other payment gateways
```

## Step 4: Database Setup

### Option A: MongoDB Atlas (Recommended)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get connection string and add to `MONGODB_URI`

### Option B: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. Use local connection string: `mongodb://localhost:27017/aicourse`

## Step 5: API Keys Setup

### Google AI API (Required)
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create new API key
3. Add to `API_KEY` in .env

### Gmail SMTP (Required)
1. Enable 2-Factor Authentication on Gmail
2. Generate App Password: [Google Account Settings](https://myaccount.google.com/apppasswords)
3. Add email and app password to .env

### Unsplash API (Optional)
1. Create account at [Unsplash Developers](https://unsplash.com/developers)
2. Create new application
3. Add access key to `UNSPLASH_ACCESS_KEY`

## Step 6: Frontend Configuration

Edit `src/constants.tsx` to match your setup:

```typescript
export const websiteURL = 'http://localhost:8080';
export const serverURL = 'http://localhost:5010';
export const appName = 'Your App Name';
export const companyName = 'Your Company';
```

## Step 7: Start the Application

### Option A: Start Both (Recommended)
```bash
npm run dev:full
```

### Option B: Start Separately
```bash
# Terminal 1 - Backend
cd server
npm start

# Terminal 2 - Frontend
npm run dev
```

## Step 8: Verify Installation

1. Open browser to http://localhost:8080
2. You should see the AiCourse homepage
3. Try creating an account to test functionality
4. Check browser console and terminal for any errors

## Common Installation Issues

### Port Already in Use
```bash
# Find process using port
lsof -i :5010
# Kill process
kill -9 <PID>
```

### MongoDB Connection Issues
- Verify connection string format
- Check network access in MongoDB Atlas
- Ensure IP whitelist includes your IP

### API Key Issues
- Verify API keys are correct
- Check API quotas and limits
- Ensure services are enabled

## Next Steps

- Read the [Quick Start Guide](quick-start.md)
- Check [Configuration Guide](configuration.md) for advanced setup
- Review [API Reference](api-reference.md) for development

## Need Help?

If you encounter issues:
1. Check [Troubleshooting Guide](troubleshooting.md)
2. Review [FAQ](faq.md)
3. Create an issue on GitHub