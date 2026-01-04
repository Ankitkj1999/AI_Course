//BRAND
export const appName = import.meta.env.VITE_APP_NAME || 'AI Course';
export const companyName = import.meta.env.VITE_COMPANY_NAME || 'Spacester';

// Dynamic URL detection based on environment
export const websiteURL = typeof window !== 'undefined' 
  ? `${window.location.protocol}//${window.location.host}`
  : import.meta.env.VITE_WEBSITE_URL || 'http://gksage.run.place';

// Dynamic server URL detection
const getServerURL = () => {
  // If environment variable is set, use it
  if (import.meta.env.VITE_SERVER_URL) {
    return import.meta.env.VITE_SERVER_URL;
  }
  
  // In production (Docker), use same origin
  if (import.meta.env.PROD && typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.host}`;
  }
  
  // In development, try common ports in order
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    
    // Try ports in order: 5011 (current), 5010 (default), 5012, 5013
    return `${protocol}//${hostname}:5011`;
  }
  
  return 'http://localhost:5011';
};

export const serverURL = getServerURL();
export const appLogo = import.meta.env.VITE_APP_LOGO || 'https://firebasestorage.googleapis.com/v0/b/aicourse-81b42.appspot.com/o/aicouse.png?alt=media&token=7175cdbe-64b4-4fe4-bb6d-b519347ad8af';
export const razorpayEnabled = true;
export const paypalEnabled = true;
export const stripeEnabled = true;
export const paystackEnabled = true;
export const flutterwaveEnabled = true;

//PRICING :-

//FREE 
export const FreeType = 'Free Plan';
export const FreeCost = 0;
export const FreeTime = '';

//MONTHLY 
export const MonthType = 'Monthly Plan';
export const MonthCost = 9;
export const MonthTime = 'month';

//YEARLY 
export const YearType = 'Yearly Plan';
export const YearCost = 99;
export const YearTime = 'year';

//TESTIMONIAL
export const review = "The AI Course Generator revolutionized my content creation process, providing accurate and relevant topics effortlessly. It's a time-saving powerhouse that enhances the quality and relevance of my courses. A must-have tool for educators seeking efficiency and impactful online learning experiences.";
export const from = "Anam Meena Sharif";
export const profession = 'CFO at Spacester';
export const photoURL = 'https://firebasestorage.googleapis.com/v0/b/aicourse-81b42.appspot.com/o/aicouse.png?alt=media&token=7175cdbe-64b4-4fe4-bb6d-b519347ad8af';

//PAYPAL
export const paypalPlanIdOne = "P-1EM732768S920784HMWKW3OA";
export const paypalPlanIdTwo = "P-8T744865W27080359MWOCE5Q";

//RAZORPAY
export const razorpayKeyId = "rzp_test_uqALjZHyTyuiOm";
export const razorpayPlanIdOne = "plan_NMvvtDfznbRp6V";
export const razorpayPlanIdTwo = "plan_NMRc9HARBQRLWA";

//STRIPE
export const stripePlanIdOne = "price_1OTo7CSDXmLtVnVeaHIHxqCj";
export const stripePlanIdTwo = "price_1OTo7eSDXmLtVnVeBbn82U5B";

//PAYSTACK
export const paystackPlanIdOne = "PLN_ouqmm8eo6i2k9k8";
export const paystackPlanIdTwo = "PLN_1v1xqb8io9t5lis";
export const amountInZarOne = '170';
export const amountInZarTwo = '1871';

//FLUTTERWAVE
export const flutterwavePlanIdOne = "67960";
export const flutterwavePlanIdTwo = "67961";
export const flutterwavePublicKey = "FLWPUBK_TEST-6ee1faf6460ea587f510a024ac4c2b23-X";

//SOCIAL SIGNIN - Dynamic values will be fetched from settings
export const googleClientId = "976697008167-t77ctqg0jbamsik99qv3m0hesnnoenfu.apps.googleusercontent.com"; // Fallback
export const facebookClientId = "818765030524259"; // Fallback

//SOCIAL MEDIA
export const facebookSocialLink = "https://www.youtube.com/@spacester-codecanyon";
export const twitterSocialLink = "https://www.youtube.com/@spacester-codecanyon";
export const instagramSocialLink = "https://www.youtube.com/@spacester-codecanyon";

//  the lanaguage option should be on top when selecting for course creation for generating course so that
// title could also be in that language only

// have constants stored in db 