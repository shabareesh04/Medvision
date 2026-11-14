import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';
import { Input } from './components/ui/input';
import { Textarea } from './components/ui/textarea';
import { Label } from './components/ui/label';
import { Mail, Phone, MapPin, Send, CheckCircle, Home } from 'lucide-react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate form submission
    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 4000);
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 py-12 transition-colors">
      <div className="container mx-auto px-4 md:px-6">
        
        {/* Navigation Breadcrumb / Home Button */}
        <div className="max-w-6xl mx-auto mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <Home className="h-3.5 w-3.5 text-blue-500" />
            <span>Home</span>
            <span className="text-slate-400">/</span>
            <span className="text-blue-500">Contact</span>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-zinc-900 dark:text-white">
            Contact Us
          </h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-lg">
            Have questions about MediVision AI? We'd love to hear from you.
            Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Contact Info Cards */}
          <div className="space-y-6">
          </div>

          {/* Contact Form */}
          <div className="md:col-span-2">
            <Card className="border-2 shadow-md dark:border-slate-800">
              <CardContent className="pt-6">
                {isSubmitted && (
                  <div className="mb-6 flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-4 text-green-700 dark:text-green-400">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">Thank you! Your message has been sent successfully.</span>
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      name="subject"
                      placeholder="How can we help?"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Tell us more about your inquiry..."
                      rows={5}
                      value={formData.message}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 shadow-lg rounded-full transition-transform transform hover:scale-105"
                  >
                    Send Message <Send className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
