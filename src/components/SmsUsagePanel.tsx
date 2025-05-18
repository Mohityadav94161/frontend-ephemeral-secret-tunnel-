import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import * as api from '../lib/api';

interface SmsLimits {
  sms_sent_today: number;
  daily_limit: number;
  remaining_allowance: number;
  reset_at: string;
}

const SmsUsagePanel = () => {
  const [smsLimits, setSmsLimits] = useState<SmsLimits | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSmsLimits();
  }, []);

  const fetchSmsLimits = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const limits = await api.getSmsLimits();
      setSmsLimits(limits);
    } catch (error) {
      console.error('Error fetching SMS limits:', error);
      if (error instanceof Error) {
        if (error.message.includes('API not configured')) {
          setError('SMS service is not yet configured on the backend server.');
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          setError('Could not connect to the server. Please check your network connection.');
        } else {
          setError(error.message);
        }
      } else {
        setError('Failed to fetch SMS limits');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate the percentage of SMS limit used
  const smsLimitPercentage = smsLimits 
    ? Math.round((smsLimits.sms_sent_today / smsLimits.daily_limit) * 100) 
    : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl">SMS Invitations</CardTitle>
            <CardDescription>Track your daily SMS invitation usage</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={fetchSmsLimits}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : smsLimits ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Daily SMS Usage</span>
                <span className="text-sm text-muted-foreground">
                  {smsLimits.sms_sent_today} / {smsLimits.daily_limit}
                </span>
              </div>
              <Progress value={smsLimitPercentage} className="h-2" />
            </div>
            
            <div className="rounded-lg border p-4 bg-muted/50">
              <div className="grid gap-1">
                <div className="flex justify-between text-sm">
                  <span>Remaining SMS invitations</span>
                  <span className="font-medium">{smsLimits.remaining_allowance}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Limit resets at</span>
                  <span className="font-medium">{smsLimits.reset_at}</span>
                </div>
              </div>
            </div>
            
            {smsLimits.remaining_allowance <= 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Daily Limit Reached</AlertTitle>
                <AlertDescription>
                  You've reached your daily SMS limit. Please try again after midnight.
                </AlertDescription>
              </Alert>
            )}
            
            <p className="text-xs text-muted-foreground mt-4">
              SMS invitations allow you to invite others to your chat rooms via text message.
              For security and cost reasons, we limit the number of SMS invitations to {smsLimits.daily_limit} per day.
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
            <span>Loading SMS usage...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SmsUsagePanel; 