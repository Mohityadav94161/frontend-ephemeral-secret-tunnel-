import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Button } from './ui/button';
import FeedbackForm from './FeedbackForm';

interface FeedbackDialogProps {
  trigger?: React.ReactNode;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const FeedbackDialog: React.FC<FeedbackDialogProps> = ({
  trigger,
  defaultOpen,
  onOpenChange,
}) => {
  return (
    <Dialog defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button variant="outline">Send Feedback</Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
          <DialogDescription>
            Help us improve by sharing your thoughts and suggestions.
          </DialogDescription>
        </DialogHeader>
        <FeedbackForm 
          isDialog={true} 
          onComplete={() => onOpenChange?.(false)} 
        />
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackDialog; 