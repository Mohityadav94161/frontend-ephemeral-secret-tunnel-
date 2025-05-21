import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Shield, AlertTriangle } from 'lucide-react';

interface AuthInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthInfoModal = ({ isOpen, onClose }: AuthInfoModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] p-4 sm:p-6">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-neon" />
            Create Account
          </DialogTitle>
          <DialogDescription className="space-y-3">
            <div className="flex items-start gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <p className="text-muted-foreground">
                Create account with just username & password. No email/phone number required. Can't recover account if lost.
                Completely Anonymous !!!
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button onClick={onClose} className="w-full bg-neon hover:bg-neon/80 text-black">
            Create Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AuthInfoModal; 