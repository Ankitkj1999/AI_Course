# 🔧 Troubleshooting Guide

Common issues and solutions for AiCourse application.

## Installation Issues

### Node.js Version Conflicts

**Problem:** Application fails to start with Node.js version errors.

**Solution:**
```bash
# Check Node.js version
node --version

# Should be v16.0.0 or higher
# If not, install latest LTS version
nvm install --lts
nvm use --lts
```

### npm Install Failures

**Problem:** Dependencies fail to install.

**Solutions:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Try with legacy peer deps
npm install --legacy-peer-deps
```

### Permission Denied Errors

**Problem:** EACCES permission errors during installation.

**Solution:**
```bash
# Fix npm permissions (macOS/Linux)
sudo chown -R $(whoami) ~/.npm

# Or use npx instead of global installs
npx create-react-app my-app
```

## Server Issues

### Port Already in Use

**Problem:** `Error: listen EADDRINUSE: address already in use :::5010`

**Solutions:**
```bash
# Find process using port 5010
lsof -i :5010

# Kill the process
kill -9 <PID>

# Or use different port in .env
PORT=5011
```

### MongoDB Connection Issues

**Problem:** `MongoNetworkError: failed to connect to server`

**Solutions:**

1. **Check Connection String:**
   ```env
   # Correct format
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
   
   # Common mistakes
   # ❌ Missing password
   # ❌ Wrong cluster name
   # ❌ Missing database name
   ```

2. **MongoDB Atlas Issues:**
   - Verify IP whitelist (add 0.0.0.0/0 for development)
   - Check username/password are correct
   - Ensure cluster is running

3. **Local MongoDB:**
   ```bash
   # Start MongoDB service
   brew services start mongodb/brew/mongodb-community
   # or
   sudo systemctl start mongod
   ```

### Environment Variables Not Loading

**Problem:** API keys or config not working.

**Solutions:**

1. **Check .env file location:**
   ```
   server/.env  ✅ Correct location
   .env         ❌ Wrong location
   ```

2. **Verify .env format:**
   ```env
   # ✅ Correct
   API_KEY=your_key_here
   
   # ❌ Wrong (spaces around =)
   API_KEY = your_key_here
   ```

3. **Restart server after .env changes:**
   ```bash
   # Stop server (Ctrl+C)
   # Start again
   npm run dev:full
   ```

## Frontend Issues

### CORS Errors

**Problem:** `Access to fetch at 'http://localhost:5010' from origin 'http://localhost:8080' has been blocked by CORS policy`

**Solutions:**

1. **Check server CORS configuration:**
   ```javascript
   // server/server.js
   const corsOptions = {
       origin: ['http://localhost:8080'], // Add your frontend URL
       methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
       allowedHeaders: ['Content-Type', 'Authorization'],
       credentials: true
   };
   ```

2. **Verify frontend URL in constants:**
   ```typescript
   // src/constants.tsx
   export const serverURL = 'http://localhost:5010'; // Match server port
   ```

### Build Failures

**Problem:** `npm run build` fails with TypeScript errors.

**Solutions:**
```bash
# Check for TypeScript errors
npm run lint

# Fix common issues
# 1. Missing type definitions
npm install @types/node @types/react @types/react-dom

# 2. Update TypeScript
npm install typescript@latest
```

### Vite Dev Server Issues

**Problem:** Vite server won't start or shows blank page.

**Solutions:**
```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Check for port conflicts
# Change port in vite.config.js
export default {
  server: {
    port: 8081
  }
}
```

## API Issues

### Google AI API Errors

**Problem:** AI content generation fails.

**Common Errors & Solutions:**

1. **Invalid API Key:**
   ```
   Error: API key not valid
   ```
   - Verify API key in Google AI Studio
   - Check for extra spaces in .env file

2. **Quota Exceeded:**
   ```
   Error: Quota exceeded
   ```
   - Check usage in Google Cloud Console
   - Upgrade to paid plan if needed

3. **Safety Filter Triggered:**
   ```
   Error: Content blocked by safety filters
   ```
   - Modify prompt to be more educational
   - Adjust safety settings in code

### Email Service Issues

**Problem:** Password reset emails not sending.

**Solutions:**

1. **Gmail App Password Issues:**
   ```env
   # ❌ Using regular Gmail password
   PASSWORD=your_gmail_password
   
   # ✅ Using app-specific password
   PASSWORD=abcd efgh ijkl mnop
   ```

2. **2FA Not Enabled:**
   - Enable 2-Factor Authentication on Gmail
   - Generate new app password

3. **SMTP Configuration:**
   ```javascript
   // Verify SMTP settings in server.js
   const transporter = nodemailer.createTransporter({
       host: 'smtp.gmail.com',
       port: 465,
       secure: true, // true for 465, false for other ports
       auth: {
           user: process.env.EMAIL,
           pass: process.env.PASSWORD,
       },
   });
   ```

## Payment Gateway Issues

### Stripe Integration

**Problem:** Payment processing fails.

**Solutions:**

1. **Test vs Live Keys:**
   ```env
   # ✅ Test key for development
   STRIPE_SECRET_KEY=sk_test_...
   
   # ❌ Live key in development
   STRIPE_SECRET_KEY=sk_live_...
   ```

2. **Webhook Configuration:**
   - Set up webhooks in Stripe Dashboard
   - Use correct endpoint URL
   - Verify webhook secret

### PayPal Integration

**Problem:** PayPal subscription creation fails.

**Solutions:**

1. **Sandbox vs Live:**
   - Use sandbox credentials for development
   - Switch to live for production

2. **Plan ID Issues:**
   ```typescript
   // Verify plan IDs exist in PayPal
   export const paypalPlanIdOne = "P-existing-plan-id";
   ```

## Database Issues

### Slow Query Performance

**Problem:** API responses are slow.

**Solutions:**

1. **Add Database Indexes:**
   ```javascript
   // Add indexes for frequently queried fields
   db.users.createIndex({ "email": 1 })
   db.courses.createIndex({ "user": 1 })
   ```

2. **Optimize Queries:**
   ```javascript
   // ❌ Loading all fields
   Course.find({ user: userId })
   
   // ✅ Select only needed fields
   Course.find({ user: userId }).select('title mainTopic date')
   ```

### Data Validation Errors

**Problem:** Database operations fail with validation errors.

**Solutions:**

1. **Check Schema Requirements:**
   ```javascript
   // Ensure required fields are provided
   const newUser = new User({
       email: email,        // required
       mName: mName,       // required
       password: password, // required
       type: type         // required
   });
   ```

2. **Handle Unique Constraints:**
   ```javascript
   try {
       await newUser.save();
   } catch (error) {
       if (error.code === 11000) {
           // Handle duplicate email
           return res.json({ success: false, message: 'Email already exists' });
       }
   }
   ```

## Performance Issues

### Slow AI Generation

**Problem:** Course generation takes too long.

**Solutions:**

1. **Optimize Prompts:**
   ```javascript
   // ❌ Too verbose
   const prompt = "Please create a very detailed comprehensive course about..."
   
   // ✅ Concise and specific
   const prompt = "Create a 5-lesson course outline for JavaScript basics"
   ```

2. **Implement Caching:**
   ```javascript
   // Cache AI responses for common topics
   const cachedResponse = await redis.get(`course:${topic}`);
   if (cachedResponse) {
       return JSON.parse(cachedResponse);
   }
   ```

### Memory Issues

**Problem:** Application crashes with out of memory errors.

**Solutions:**

1. **Increase Node.js Memory:**
   ```bash
   # Increase memory limit
   node --max-old-space-size=4096 server.js
   ```

2. **Optimize Image Handling:**
   ```javascript
   // Limit image sizes
   app.use(bodyParser.json({ limit: '10mb' }));
   ```

## Deployment Issues

### Environment Variables in Production

**Problem:** App works locally but fails in production.

**Solutions:**

1. **Check Production Environment:**
   ```bash
   # Verify all env vars are set
   echo $MONGODB_URI
   echo $API_KEY
   ```

2. **Use Production URLs:**
   ```env
   # ❌ Development URLs in production
   WEBSITE_URL=http://localhost:8080
   
   # ✅ Production URLs
   WEBSITE_URL=https://yourdomain.com
   ```

### SSL/HTTPS Issues

**Problem:** Mixed content errors in production.

**Solutions:**

1. **Update API URLs:**
   ```typescript
   // Use HTTPS in production
   export const serverURL = 'https://api.yourdomain.com';
   ```

2. **Configure Reverse Proxy:**
   ```nginx
   # nginx configuration
   location /api {
       proxy_pass http://localhost:5010;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
   }
   ```

## Getting Help

### Debug Information to Collect

When reporting issues, include:

1. **System Information:**
   ```bash
   node --version
   npm --version
   cat package.json | grep version
   ```

2. **Error Logs:**
   - Browser console errors
   - Server terminal output
   - Network tab in DevTools

3. **Configuration:**
   - Relevant .env variables (without secrets)
   - Package.json dependencies
   - Browser and OS version

### Where to Get Help

1. **Check Documentation:**
   - [Installation Guide](installation.md)
   - [Configuration Guide](configuration.md)
   - [FAQ](faq.md)

2. **Community Support:**
   - GitHub Issues
   - Stack Overflow (tag: aicourse)
   - Discord/Slack community

3. **Professional Support:**
   - Email: spacester.app@gmail.com
   - Priority support for paid plans

## Prevention Tips

### Regular Maintenance

1. **Keep Dependencies Updated:**
   ```bash
   npm audit
   npm update
   ```

2. **Monitor Logs:**
   - Set up error logging
   - Monitor API usage
   - Track performance metrics

3. **Backup Data:**
   - Regular database backups
   - Environment variable backups
   - Code repository backups

### Best Practices

1. **Use Version Control:**
   - Commit changes regularly
   - Use meaningful commit messages
   - Tag releases

2. **Test Before Deploy:**
   - Run tests locally
   - Test in staging environment
   - Verify all features work

3. **Monitor Production:**
   - Set up health checks
   - Monitor error rates
   - Track user feedback