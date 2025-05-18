import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { toast } from './ui/use-toast';
import { API_URL } from '../config';

const categories = [
  { value: 'bug', label: 'Bug Report' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'improvement', label: 'Improvement Suggestion' },
  { value: 'other', label: 'Other' }
];

const RatingStars = ({ value, onChange }: { value: number; onChange: (value: number) => void }) => {
  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="focus:outline-none"
          aria-label={`Rate ${star} stars`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-6 w-6 ${star <= value ? 'text-yellow-400' : 'text-gray-300'}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
            />
          </svg>
        </button>
      ))}
    </div>
  );
};

interface FeedbackFormProps {
  onComplete?: () => void;
  isDialog?: boolean;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ onComplete, isDialog = false }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    category: 'other',
    rating: 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value }));
  };

  const handleRatingChange = (value: number) => {
    setFormData((prev) => ({ ...prev, rating: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.message.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both a title and message for your feedback.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      const payload = {
        ...formData,
        userId: user?.id,
        username: user?.username,
      };

      console.log("Submitting feedback to:", `${API_URL}/feedback`);
      const response = await axios.post(`${API_URL}/feedback`, payload);
      
      toast({
        title: "Feedback submitted",
        description: "Thank you for your feedback!",
        variant: "default"
      });
      
      // Reset form
      setFormData({
        title: '',
        message: '',
        category: 'other',
        rating: 0,
      });
      
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Submission failed",
        description: "There was an error submitting your feedback. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${isDialog ? '' : 'max-w-2xl mx-auto p-6 bg-background border rounded-lg shadow-sm'}`}>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Title
            </label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Summary of your feedback"
              required
              maxLength={100}
            />
          </div>
          
          <div>
            <label htmlFor="category" className="block text-sm font-medium mb-1">
              Category
            </label>
            <Select 
              value={formData.category}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label htmlFor="message" className="block text-sm font-medium mb-1">
              Message
            </label>
            <Textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Describe your feedback in detail"
              required
              rows={5}
              maxLength={2000}
              className="resize-y"
            />
            <div className="text-xs text-muted-foreground mt-1">
              Max 2000 characters
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Rate your experience (optional)
            </label>
            <RatingStars value={formData.rating} onChange={handleRatingChange} />
          </div>
          
          {!user && (
            <div className="text-sm text-amber-600 dark:text-amber-400 p-2 bg-amber-50 dark:bg-amber-950/30 rounded border border-amber-200 dark:border-amber-800">
              You are submitting feedback anonymously. If you'd like us to follow up, please include your contact information in the message or <a href="/login" className="underline">log in</a>.
            </div>
          )}
          
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Submitting..." : "Submit Feedback"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default FeedbackForm;