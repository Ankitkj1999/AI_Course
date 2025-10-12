# ⚡ Quick Start Guide

Get AiCourse running in 5 minutes! This guide assumes you have Node.js and npm installed.

## 🚀 1-Minute Setup

```bash
# Clone and install
git clone https://github.com/yourusername/aicourse.git
cd aicourse
npm install

# Setup environment
cp server/.env.example server/.env
```

## ⚙️ 2-Minute Configuration

Edit `server/.env` with minimal required settings:

```env
PORT=5010
MONGODB_URI=mongodb+srv://your-connection-string
API_KEY=your-google-ai-api-key
EMAIL=your-gmail@gmail.com
PASSWORD=your-gmail-app-password
WEBSITE_URL=http://localhost:8080
COMPANY=AiCourse
```

### Get API Keys Quickly:

1. **MongoDB Atlas** (2 minutes):
   - Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
   - Create free cluster → Get connection string

2. **Google AI API** (1 minute):
   - Visit [makersuite.google.com](https://makersuite.google.com/app/apikey)
   - Create API key

3. **Gmail App Password** (2 minutes):
   - Enable 2FA on Gmail
   - Generate app password in [Google Account Settings](https://myaccount.google.com/apppasswords)

## 🏃‍♂️ 3-Minute Launch

```bash
# Start both frontend and backend
npm run dev:full
```

Open http://localhost:8080 - You're ready! 🎉

## ✅ Quick Test

1. **Sign Up**: Create a new account
2. **Generate Course**: Try "JavaScript Basics" as topic
3. **View Course**: Check the generated content
4. **Complete Course**: Mark as finished and get certificate

## 🎯 What You Get

- ✅ AI-powered course generation
- ✅ User authentication
- ✅ Course management
- ✅ Email notifications
- ✅ Certificate generation
- ✅ Responsive UI

## 🔧 Optional Enhancements

Add these later for full functionality:

### Payment Gateways
```env
STRIPE_SECRET_KEY=sk_test_...
PAYPAL_CLIENT_ID=...
```

### Media Services
```env
UNSPLASH_ACCESS_KEY=...  # For course images
```

### Social Login
Update `src/constants.tsx`:
```typescript
export const googleClientId = "your-google-client-id";
export const facebookClientId = "your-facebook-app-id";
```

## 🚨 Common Quick Issues

### Port Already in Use
```bash
# Kill process on port 5010
lsof -i :5010
kill -9 <PID>
```

### MongoDB Connection Failed
- Check connection string format
- Verify network access in MongoDB Atlas
- Ensure IP is whitelisted

### AI API Not Working
- Verify Google AI API key is correct
- Check API quotas in Google Cloud Console

## 📚 Next Steps

Now that you're running:

1. **Customize**: Edit `src/constants.tsx` for branding
2. **Deploy**: Check [Deployment Guide](deployment.md)
3. **Integrate**: Add payment gateways from [Payment Guide](payment-gateways.md)
4. **Develop**: Read [API Reference](api-reference.md)

## 🆘 Need Help?

- 📖 Full setup: [Installation Guide](installation.md)
- 🔧 Issues: [Troubleshooting](troubleshooting.md)
- ❓ Questions: [FAQ](faq.md)

---

**Pro Tip**: Use `npm run dev:full` to start both frontend and backend with one command! 🚀