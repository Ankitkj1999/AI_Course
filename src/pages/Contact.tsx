import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, MessageSquare, Send, Check } from 'lucide-react';
import SEO from '@/components/SEO';
import { appName, serverURL } from '@/constants';
import axios from 'axios';

const Contact = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API request
    const postURL = serverURL + '/api/contact';
    const response = await axios.post(postURL, { fname: name, lname: subject, email, phone: '', msg: message });
    if (response.data.success) {
      toast({
        title: "Message sent",
        description: response.data.message,
      });
    } else {
      toast({
        title: "Failed",
        description: response.data.message,
      });
    }
    setIsSubmitted(true);
    setIsLoading(false);
  };

  return (
    <>
      <SEO
        title="Contact Us"
        description="Have questions, feedback, or need support? Contact the team for assistance."
        keywords="contact, support, help, feedback, customer service, questions"
      />
      <div className="min-h-screen bg-background">
        <div className="container max-w-6xl mx-auto px-4 py-12">
          <div className="mb-10">
            <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </div>

          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Have questions, feedback, or need support? We're here to help. Reach out to the {appName} team using any of the methods below.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <MessageSquare className="h-6 w-6 mr-2 text-primary" />
                Send Us a Message
              </h2>

              {isSubmitted ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="mb-4 mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <Check className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-medium mb-2">Message Sent!</h3>
                    <p className="text-muted-foreground mb-6">
                      Thank you for reaching out. We've received your message and will respond as soon as possible.
                    </p>
                    <Button onClick={() => setIsSubmitted(false)}>Send Another Message</Button>
                  </CardContent>
                </Card>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Your Name</Label>
                      <Input
                        id="name"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Select onValueChange={setSubject} required>
                      <SelectTrigger id="subject">
                        <SelectValue placeholder="Select a subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Inquiry</SelectItem>
                        <SelectItem value="support">Technical Support</SelectItem>
                        <SelectItem value="billing">Billing Questions</SelectItem>
                        <SelectItem value="feedback">Feedback</SelectItem>
                        <SelectItem value="partnership">Partnership Opportunities</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Your Message</Label>
                    <Textarea
                      id="message"
                      placeholder="How can we help you?"
                      rows={6}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                    />
                  </div>

                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? (
                      "Sending..."
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">How do I reset my password?</h3>
                  <p className="text-muted-foreground">
                    You can reset your password by clicking the "Forgot Password" link on the login page and following the instructions sent to your email.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">What payment methods do you accept?</h3>
                  <p className="text-muted-foreground">
                    We accept all major credit cards, PayPal, and bank transfers for business accounts.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">How do I generate a new course?</h3>
                  <p className="text-muted-foreground">
                    After logging in, navigate to the "Generate Course" section in your dashboard. Enter your course topic and preferences, then click "Generate" to create your customized course.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Can I download my certificates?</h3>
                  <p className="text-muted-foreground">
                    Yes, once you've completed a course, you can download your certificate from the course completion page or from your account's "Certificates" section.
                  </p>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Contact;
