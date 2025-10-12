# ⚙️ Configuration Guide

Comprehensive configuration guide for AiCourse application.

## Environment Variables

### Server Configuration (`server/.env`)

#### Required Variables

```env
# Server Settings
PORT=5010                    # Server port
WEBSITE_URL=http://localhost:8080  # Frontend URL

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/aicourse

# AI Service
API_KEY=your_google_ai_api_key

# Email Service
EMAIL=your_gmail@gmail.com
PASSWORD=your_gmail_app_password

# Branding
COMPANY=Your Company Name
LOGO=https://your-logo-url.com/logo.png
```

#### Optional Variables

```env
# Image Service
UNSPLASH_ACCESS_KEY=your_unsplash_access_key

# Payment Gateways
STRIPE_SECRET_KEY=sk_test_your_stripe_key
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_APP_SECRET_KEY=your_paypal_secret
RAZORPAY_KEY_ID=rzp_test_your_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
PAYSTACK_SECRET_KEY=sk_test_your_paystack_key
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-your_key
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-your_key

# Pricing
MONTH_TYPE=Monthly Plan
MONTH_COST=9
YEAR_TYPE=Yearly Plan
YEAR_COST=99
```

### Frontend Configuration (`src/constants.tsx`)

#### Basic Settings

```typescript
// Application Branding
export const appName = 'AiCourse';
export const companyName = 'Your Company';
export const websiteURL = 'http://localhost:8080';
export const serverURL = 'http://localhost:5010';
export const appLogo = 'https://your-logo-url.com/logo.png';
```

#### Payment Gateway Toggles

```typescript
// Enable/Disable Payment Methods
export const razorpayEnabled = true;
export const paypalEnabled = true;
export const stripeEnabled = true;
export const paystackEnabled = true;
export const flutterwaveEnabled = true;
```

#### Pricing Configuration

```typescript
// Free Plan
export const FreeType = 'Free Plan';
export const FreeCost = 0;
export const FreeTime = '';

// Monthly Plan
export const MonthType = 'Monthly Plan';
export const MonthCost = 9;
export const MonthTime = 'month';

// Yearly Plan
export const YearType = 'Yearly Plan';
export const YearCost = 99;
export const YearTime = 'year';
```

#### Social Authentication

```typescript
// Social Login
export const googleClientId = "your-google-oauth-client-id";
export const facebookClientId = "your-facebook-app-id";
```

#### Payment Plan IDs

```typescript
// PayPal Plan IDs
export const paypalPlanIdOne = "P-monthly-plan-id";
export const paypalPlanIdTwo = "P-yearly-plan-id";

// Stripe Price IDs
export const stripePlanIdOne = "price_monthly_id";
export const stripePlanIdTwo = "price_yearly_id";

// Razorpay Plan IDs
export const razorpayPlanIdOne = "plan_monthly_id";
export const razorpayPlanIdTwo = "plan_yearly_id";
```

## Database Configuration

### MongoDB Setup

#### Local MongoDB
```env
MONGODB_URI=mongodb://localhost:27017/aicourse
```

#### MongoDB Atlas
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/aicourse?retryWrites=true&w=majority
```

### Database Collections

The application creates these collections automatically:
- `users` - User accounts
- `courses` - Generated courses
- `subscriptions` - Payment subscriptions
- `contacts` - Contact form submissions
- `admins` - Admin users
- `notes` - Course notes
- `exams` - Course examinations
- `langs` - Language preferences
- `blogs` - Blog posts

## API Service Configuration

### Google Generative AI

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create new API key
3. Add to `API_KEY` in environment

**Model Configuration:**
- Model: `gemini-2.0-flash`
- Safety settings: Medium and above blocking
- Content generation for educational purposes

### Unsplash API (Optional)

1. Create account at [Unsplash Developers](https://unsplash.com/developers)
2. Create new application
3. Get Access Key
4. Add to `UNSPLASH_ACCESS_KEY`

**Usage:**
- Course cover images
- Search query: Course main topic
- Orientation: Landscape
- Per page: 1 image

## Email Configuration

### Gmail SMTP Setup

1. **Enable 2-Factor Authentication**
   - Go to Google Account settings
   - Enable 2FA

2. **Generate App Password**
   - Visit [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and your device
   - Copy generated password

3. **Configure Environment**
   ```env
   EMAIL=your-gmail@gmail.com
   PASSWORD=generated-app-password
   ```

### Email Templates

The application sends these emails:
- **Welcome Email** - New user registration
- **Password Reset** - Forgot password requests
- **Course Certificate** - Course completion
- **Custom Notifications** - Admin messages

## Payment Gateway Configuration

### Stripe

1. **Create Stripe Account**
   - Go to [Stripe Dashboard](https://dashboard.stripe.com)
   - Get API keys from Developers → API keys

2. **Create Products & Prices**
   - Create monthly and yearly subscription products
   - Note the price IDs

3. **Configure**
   ```env
   STRIPE_SECRET_KEY=sk_test_your_key
   ```
   ```typescript
   export const stripePlanIdOne = "price_monthly_id";
   export const stripePlanIdTwo = "price_yearly_id";
   ```

### PayPal

1. **Create PayPal App**
   - Go to [PayPal Developer](https://developer.paypal.com)
   - Create new app

2. **Create Subscription Plans**
   - Use PayPal's subscription API
   - Create monthly and yearly plans

3. **Configure**
   ```env
   PAYPAL_CLIENT_ID=your_client_id
   PAYPAL_APP_SECRET_KEY=your_secret
   ```

### Other Payment Gateways

Similar setup process for:
- **Razorpay** - Indian payment gateway
- **Paystack** - African payment gateway  
- **Flutterwave** - African payment gateway

## CORS Configuration

The server is configured to accept requests from:
- `http://localhost:3000`
- `http://localhost:8080`
- `http://127.0.0.1:3000`
- `http://127.0.0.1:8080`

To add more origins, edit `server/server.js`:

```javascript
const corsOptions = {
    origin: [
        'http://localhost:3000',
        'http://localhost:8080',
        'https://yourdomain.com'  // Add production domain
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};
```

## Security Configuration

### Environment Security
- Never commit `.env` files
- Use different keys for development/production
- Rotate API keys regularly

### Database Security
- Use MongoDB Atlas for production
- Enable authentication
- Whitelist specific IPs
- Use SSL connections

### API Security
- Implement rate limiting
- Validate all inputs
- Use HTTPS in production
- Sanitize user data

## Performance Configuration

### Frontend Optimization
```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu']
        }
      }
    }
  }
}
```

### Backend Optimization
- Enable MongoDB indexing
- Use connection pooling
- Implement caching for AI responses
- Optimize image delivery

## Development vs Production

### Development
```env
NODE_ENV=development
WEBSITE_URL=http://localhost:8080
```

### Production
```env
NODE_ENV=production
WEBSITE_URL=https://yourdomain.com
```

## Troubleshooting Configuration

### Common Issues

1. **CORS Errors**
   - Check frontend URL in CORS config
   - Verify WEBSITE_URL matches frontend

2. **Database Connection**
   - Verify MongoDB URI format
   - Check network access and IP whitelist

3. **API Keys Not Working**
   - Verify keys are correct and active
   - Check API quotas and billing

4. **Email Not Sending**
   - Verify Gmail app password (not regular password)
   - Check 2FA is enabled

## Next Steps

- [Deployment Guide](deployment.md) - Deploy to production
- [API Reference](api-reference.md) - Integrate with API
- [Troubleshooting](troubleshooting.md) - Fix common issues