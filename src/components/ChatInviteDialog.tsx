import React from 'react';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';
import { Link, PhoneCall, Copy, ArrowRight } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import InviteByPhone from './InviteByPhone';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

interface ChatInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatId: string;
  chatName: string;
  roomCode: string;
}

const ChatInviteDialog = ({
  open,
  onOpenChange,
  chatId,
  chatName,
  roomCode,
}: ChatInviteDialogProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleCopyLink = async () => {
    const shareText = `Join my chat on Ephemeral Secret Tunnel\nRoom Code: ${roomCode}\nURL: ${window.location.origin}/chat/${chatId}`;
    
    try {
      await navigator.clipboard.writeText(shareText);
      
      toast({
        title: "Link copied",
        description: "Share link copied to clipboard",
      });
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };
  
  const handleJoinChat = () => {
    onOpenChange(false);
    navigate(`/chat/${chatId}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Chat Room Created!</DialogTitle>
          <DialogDescription>
            Your secure chat room "{chatName}" is ready. How would you like to proceed?
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 my-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-2 items-center p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={handleCopyLink}>
              <Copy className="h-8 w-8 text-primary mb-1" />
              <h3 className="font-medium text-center">Copy Invite Link</h3>
              <p className="text-xs text-center text-muted-foreground">Share via your preferred app</p>
            </div>
            
            <div className="flex flex-col gap-2 items-center p-3 border rounded-lg hover:bg-muted/50 transition-colors">
              <PhoneCall className="h-8 w-8 text-primary mb-1" />
              <h3 className="font-medium text-center">SMS Invite</h3>
              <p className="text-xs text-center text-muted-foreground">Send text message invitation</p>
              <InviteByPhone 
                chatName={chatName}
                chatId={chatId}
                roomCode={roomCode}
                buttonVariant="default"
                buttonSize="sm"
                buttonClassName="mt-1 w-full"
                buttonLabel="Send SMS"
                showIcon={false}
              />
            </div>
          </div>
          
          <div className="p-3 border rounded-lg bg-primary/5">
            <h3 className="font-medium flex items-center"><Link className="h-4 w-4 mr-2" /> Room Code</h3>
            <p className="font-mono text-lg font-bold mt-1">{roomCode}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Anyone with this code can join your chat
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={handleJoinChat} className="w-full" size="lg">
            Join Chat Now
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ChatInviteDialog; 