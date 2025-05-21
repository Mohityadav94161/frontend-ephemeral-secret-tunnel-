import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { PhoneCall, Send, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../lib/api';
import logger from '@/utils/logger';

import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Progress } from './ui/progress';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface InviteByPhoneProps {
  chatName: string;
  chatId: string;
  roomCode: string;
  buttonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  buttonSize?: "default" | "sm" | "lg" | "icon";
  buttonClassName?: string;
  buttonLabel?: string;
  showIcon?: boolean;
}

interface SmsLimits {
  sms_sent_today: number;
  daily_limit: number;
  remaining_allowance: number;
  reset_at: string;
}

// Country codes for common countries
const countryCodes = [
  { code: '+1', name: 'US/Canada' },
  { code: '+44', name: 'UK' },
  { code: '+61', name: 'Australia' },
  { code: '+91', name: 'India' },
  { code: '+49', name: 'Germany' },
  { code: '+33', name: 'France' },
  { code: '+81', name: 'Japan' },
  { code: '+86', name: 'China' },
  { code: '+52', name: 'Mexico' },
  { code: '+55', name: 'Brazil' },
  { code: '+34', name: 'Spain' },
  { code: '+39', name: 'Italy' },
  { code: '+7', name: 'Russia' },
  { code: '+82', name: 'South Korea' },
];

// Message templates for different scenarios
const messageTemplates = [
  // Professional Templates (20%)
  {
    id: 'professional',
    name: 'Professional Network',
    template: 'Hello! I\'d like to discuss some professional opportunities. I\'ve set up a secure chat room "{chatName}" for our conversation. Join with code: {roomCode} or this link: {origin}/chat/{chatId}'
  },
  {
    id: 'business',
    name: 'Business Connection',
    template: 'Hi! I noticed your business profile and would love to explore potential collaboration. Join my secure chat room "{chatName}" using code: {roomCode} or this link: {origin}/chat/{chatId}'
  },
  {
    id: 'career',
    name: 'Career Opportunity',
    template: 'Hello! I came across your profile and have an exciting career opportunity to discuss. Join my secure chat room "{chatName}" with code: {roomCode} or this link: {origin}/chat/{chatId}'
  },

  // Personal/Flirty Templates (60%)
  {
    id: 'flirty1',
    name: 'Casual Flirty',
    template: 'Hey! I couldn\'t help but notice your profile. Would love to chat more in my secure room "{chatName}". Join with code: {roomCode} or this link: {origin}/chat/{chatId} 😊'
  },
  {
    id: 'flirty2',
    name: 'Playful',
    template: 'Hi there! Your profile caught my eye. Let\'s chat in my private room "{chatName}"? Join using code: {roomCode} or this link: {origin}/chat/{chatId} 💫'
  },
  {
    id: 'flirty3',
    name: 'Sweet',
    template: 'Hey! I\'ve been thinking about your profile. Join my secure chat room "{chatName}" so we can talk more? Code: {roomCode} or this link: {origin}/chat/{chatId} ✨'
  },
  {
    id: 'flirty4',
    name: 'Direct',
    template: 'Hi! I\'d love to get to know you better. Join my private chat room "{chatName}" using code: {roomCode} or this link: {origin}/chat/{chatId} 💝'
  },
  {
    id: 'flirty5',
    name: 'Mysterious',
    template: 'Hey! I have something interesting to share. Join my secure room "{chatName}" with code: {roomCode} or this link: {origin}/chat/{chatId} 🌟'
  },
  {
    id: 'flirty6',
    name: 'Friendly',
    template: 'Hi! I think we might have a lot in common. Let\'s chat in my secure room "{chatName}". Join with code: {roomCode} or this link: {origin}/chat/{chatId} 💫'
  },

  // Other Templates (20%)
  {
    id: 'social',
    name: 'Social Connection',
    template: 'Hey there! I saw your post about {topic} and would love to chat more about it. Join my secure chat room "{chatName}" using code: {roomCode} or this link: {origin}/chat/{chatId}'
  },
  {
    id: 'hobby',
    name: 'Shared Interest',
    template: 'Hi! I noticed we share the same interest in {topic}. Join my secure chat room "{chatName}" to discuss more. Code: {roomCode} or this link: {origin}/chat/{chatId}'
  },
  {
    id: 'default',
    name: 'Default Invitation',
    template: 'Hey! I\'ve created a secure chat room "{chatName}". You can join using code: {roomCode} or this link: {origin}/chat/{chatId}'
  }
];

const InviteByPhone = ({ 
  chatName, 
  chatId, 
  roomCode,
  buttonVariant = "outline",
  buttonSize = "sm",
  buttonClassName = "gap-2",
  buttonLabel = "Invite by SMS",
  showIcon = true
}: InviteByPhoneProps) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLimits, setIsLoadingLimits] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [smsLimits, setSmsLimits] = useState<SmsLimits | null>(null);
  const [limitsError, setLimitsError] = useState('');
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  // Generate default message when dialog opens or props change
  useEffect(() => {
    if (isOpen) {
      const defaultTemplate = messageTemplates.find(t => t.id === 'flirty1')?.template || messageTemplates[0].template;
      const formattedMessage = defaultTemplate
        .replace('{chatName}', chatName)
        .replace('{roomCode}', roomCode)
        .replace('{chatId}', chatId)
        .replace('{origin}', window.location.origin);
      
      setMessage(formattedMessage);
      
      // If user is authenticated, fetch SMS limits
      if (isAuthenticated) {
        fetchSmsLimits();
      }
    }
  }, [isOpen, chatName, chatId, roomCode, isAuthenticated]);

  // Fetch SMS usage limits
  const fetchSmsLimits = async () => {
    if (!isAuthenticated) return;
    
    setIsLoadingLimits(true);
    setLimitsError('');
    
    try {
      const limits = await api.getSmsLimits();
      setSmsLimits(limits);
    } catch (error) {
      console.error('Error fetching SMS limits:', error);
      // Provide more user-friendly error messages
      if (error instanceof Error) {
        if (error.message.includes('API not configured')) {
          setLimitsError('SMS service is not yet configured on the backend server.');
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          setLimitsError('Could not connect to the server. Please check your network connection.');
        } else {
          setLimitsError(error.message);
        }
      } else {
        setLimitsError('Failed to fetch SMS limits');
      }
    } finally {
      setIsLoadingLimits(false);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber) {
      toast({
        title: "Error",
        description: "Please enter a phone number",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Format the full phone number with country code for Twilio
    const formattedPhoneNumber = `${countryCode}${phoneNumber}`;

    try {
      // Check if we're in development mode for fallback behavior
      logger.info('process ', import.meta.env.VITE_MODE);
      const isDevelopment = import.meta.env.VITE_MODE === 'development';

      if (isDevelopment) {
        // Simulate API call in development to avoid errors
        logger.info('Development mode: Simulating SMS send to:', formattedPhoneNumber);
        logger.info('Message:', message);
        
        // Fake delay to simulate network request
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        toast({
          title: "Development Mode",
          description: `SMS would be sent to ${formattedPhoneNumber} in production. The backend API needs to be implemented using the instructions in README_SMS_SETUP.md.`,
        });
      } else {
        // Real API call in production
        const result = await api.sendSmsInvite(formattedPhoneNumber, message, chatId, user?.id);
        
        toast({
          title: "Invitation sent",
          description: `SMS invitation sent to ${formattedPhoneNumber}. ${result.remaining_allowance} SMS remaining today.`,
        });
        
        // Update SMS limits with the new data
        if (result.remaining_allowance !== undefined) {
          setSmsLimits(prev => prev ? {
            ...prev,
            sms_sent_today: prev.daily_limit - result.remaining_allowance,
            remaining_allowance: result.remaining_allowance
          } : null);
        }
      }
      
      setIsOpen(false);
      setPhoneNumber('');
      
    } catch (error) {
      logger.error('Error sending SMS invitation:', error);
      
      // Handle the specific HTML response error
      if (error instanceof SyntaxError && error.message.includes("Unexpected token '<'")) {
        toast({
          title: "Backend Not Configured",
          description: "The SMS service is not set up yet. See README_SMS_SETUP.md for instructions on how to configure the backend.",
          variant: "destructive",
        });
      } else if (error instanceof Error && error.message.includes("Rate limit exceeded")) {
        toast({
          title: "Rate Limit Exceeded",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to send SMS invitation",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Keep only digits
    const digits = value.replace(/\D/g, '');
    setPhoneNumber(digits);
  };

  const handleTemplateChange = (templateId: string) => {
    const selectedTemplate = messageTemplates.find(t => t.id === templateId);
    if (selectedTemplate) {
      const formattedMessage = selectedTemplate.template
        .replace('{chatName}', chatName)
        .replace('{roomCode}', roomCode)
        .replace('{chatId}', chatId)
        .replace('{origin}', window.location.origin);
      setMessage(formattedMessage);
    }
  };

  // Calculate the percentage of SMS limit used
  const smsLimitPercentage = smsLimits 
    ? Math.round((smsLimits.sms_sent_today / smsLimits.daily_limit) * 100) 
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={buttonVariant} 
          size={buttonSize} 
          className={buttonClassName}
        >
          {showIcon && <PhoneCall className="h-4 w-4" />}
          <span className={showIcon ? "hidden sm:inline" : ""}>{buttonLabel}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite to Chat</DialogTitle>
          <DialogDescription>
            Send an SMS invitation to join this chat room.
          </DialogDescription>
        </DialogHeader>
        
        {/* SMS Limits Section */}
        {isAuthenticated && (
          <div className="my-2">
            {isLoadingLimits ? (
              <div className="flex items-center justify-center p-2">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <span className="text-xs">Loading SMS limits...</span>
              </div>
            ) : limitsError ? (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{limitsError}</AlertDescription>
              </Alert>
            ) : smsLimits ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-xs">
                  <span>Daily SMS Usage</span>
                  <span>
                    {smsLimits.sms_sent_today} / {smsLimits.daily_limit} sent
                  </span>
                </div>
                <Progress value={smsLimitPercentage} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {smsLimits.remaining_allowance} SMS invitations remaining today. Limit resets at {smsLimits.reset_at}.
                </p>
                {smsLimits.remaining_allowance <= 0 && (
                  <Alert variant="destructive" className="my-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Daily Limit Reached</AlertTitle>
                    <AlertDescription>
                      You've reached your daily SMS limit. Please try again after midnight.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : null}
          </div>
        )}
        
        <form onSubmit={handleSendInvite} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="phone-number" className="text-sm">Phone Number</Label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <Select
                value={countryCode}
                onValueChange={setCountryCode}
              >
                <SelectTrigger className="w-full sm:w-[120px]">
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  {countryCodes.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.code} {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                id="phone-number"
                type="tel"
                placeholder="Enter phone number"
                value={phoneNumber}
                onChange={(e) => formatPhoneNumber(e.target.value)}
                className="text-sm flex-1"
                maxLength={15}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Select country code and enter phone number without leading zeros
            </p>
          </div>
          
          <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="message" className="text-sm font-medium">Message</Label>
                <Select
                  onValueChange={handleTemplateChange}
                  defaultValue="flirty1"
                >
                  <SelectTrigger className="w-[180px] h-8 text-xs">
                    <SelectValue placeholder="Choose a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {messageTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your invitation message"
                className="text-sm min-h-[120px] resize-y"
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Customize the message to make it more personal and engaging
              </p>
            </div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || (smsLimits?.remaining_allowance === 0)}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InviteByPhone; 