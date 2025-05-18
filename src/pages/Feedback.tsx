import React from 'react';
import FeedbackForm from '../components/FeedbackForm';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { MessageSquare, ThumbsUp } from 'lucide-react';

const Feedback = () => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-3 gradient-text">Send Us Feedback</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          We value your input! Help us improve by sharing your thoughts, reporting issues, or suggesting new features.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
        <Card className="bg-dark-lighter border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <span>Your Voice Matters</span>
            </CardTitle>
            <CardDescription>
              Every piece of feedback helps us build a better product
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="bg-dark-lighter border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <ThumbsUp className="h-5 w-5 text-primary" />
              <span>Quick Response</span>
            </CardTitle>
            <CardDescription>
              Our team reviews all feedback and responds promptly
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="bg-dark-lighter border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" />
              </svg>
              <span>Feature Requests</span>
            </CardTitle>
            <CardDescription>
              Suggest new features to enhance your experience
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-border">
        <CardHeader className="bg-dark-lighter border-b border-border">
          <CardTitle>Submit Feedback</CardTitle>
          <CardDescription>
            Please complete the form below with your feedback
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <FeedbackForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default Feedback; 