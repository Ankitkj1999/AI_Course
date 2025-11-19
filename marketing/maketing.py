import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import os

# Email configuration
email = 'powerofseller1234@gmail.com'
password = 'xhgy udea ousf kzlm'
emailList = ['ankit.k.j1999@gmail.com', 'ankit.kumar@zalon.in']

# Email settings
subject = 'AI Study Newsletter - Discover AI-Powered Learning'
from_name = 'AI Study Team'

def read_html_template():
    """Read the HTML newsletter template"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    html_file = os.path.join(script_dir, 'index.html')
    
    try:
        with open(html_file, 'r', encoding='utf-8') as file:
            return file.read()
    except FileNotFoundError:
        print(f"Error: Could not find {html_file}")
        return None

def send_newsletter(recipient_email):
    """Send newsletter to a single recipient"""
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['From'] = f"{from_name} <{email}>"
        msg['To'] = recipient_email
        msg['Subject'] = subject
        
        # Read HTML content
        html_content = read_html_template()
        if not html_content:
            return False
        
        # Plain text fallback
        text_content = """
        AI Study Newsletter
        
        Discover AI Study - Transform Learning with AI
        
        We're excited to introduce AI Study, a revolutionary platform that helps educators 
        and professionals create comprehensive learning materials in minutes.
        
        Features:
        - AI-Powered Generation
        - Multiple Course Formats
        - Smart Flash Cards
        - Study Guides
        - Interactive Quizzes
        - AI Teacher Chat
        - 23+ Languages Support
        - PWA & Offline Access
        
        Visit us to learn more!
        
        Contact: hello@aistudy.com
        """
        
        # Attach both plain text and HTML versions
        part1 = MIMEText(text_content, 'plain')
        part2 = MIMEText(html_content, 'html')
        
        msg.attach(part1)
        msg.attach(part2)
        
        # Connect to Gmail SMTP server
        print(f"Connecting to Gmail SMTP server...")
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        
        # Login
        print(f"Logging in as {email}...")
        server.login(email, password)
        
        # Send email
        print(f"Sending newsletter to {recipient_email}...")
        server.send_message(msg)
        
        # Close connection
        server.quit()
        
        print(f"✓ Successfully sent to {recipient_email}")
        return True
        
    except smtplib.SMTPAuthenticationError:
        print(f"✗ Authentication failed. Please check your email and app password.")
        return False
    except smtplib.SMTPException as e:
        print(f"✗ SMTP error occurred: {str(e)}")
        return False
    except Exception as e:
        print(f"✗ Error sending to {recipient_email}: {str(e)}")
        return False

def main():
    """Main function to send newsletter to all recipients"""
    print("="*60)
    print("AI Study Newsletter Sender")
    print("="*60)
    print(f"From: {email}")
    print(f"Recipients: {len(emailList)}")
    print(f"Subject: {subject}")
    print("="*60)
    print()
    
    success_count = 0
    fail_count = 0
    
    for recipient in emailList:
        if send_newsletter(recipient):
            success_count += 1
        else:
            fail_count += 1
        print()
    
    print("="*60)
    print(f"Newsletter Sending Complete")
    print(f"✓ Successful: {success_count}")
    print(f"✗ Failed: {fail_count}")
    print("="*60)

if __name__ == "__main__":
    main()