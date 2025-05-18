import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { 
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogClose
} from './ui/dialog';
import { Settings, Trash2 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import * as api from '../lib/api';

interface ChatSettingsProps {
  chatId: string;
  ownerId: string;
  initialName: string;
  initialDescription: string;
  initialIsPublic: boolean;
  initialMaxParticipants: number;
  roomCode: string;
  onSettingsUpdated: () => void;
  onChatDeleted: () => void;
}

export default function ChatSettings({
  chatId,
  ownerId,
  initialName,
  initialDescription,
  initialIsPublic,
  initialMaxParticipants,
  roomCode,
  onSettingsUpdated,
  onChatDeleted
}: ChatSettingsProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription || '');
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [maxParticipants, setMaxParticipants] = useState(initialMaxParticipants);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Chat name is required",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      await api.updateChatSettings(
        chatId,
        ownerId,
        name,
        description,
        isPublic,
        maxParticipants
      );
      
      toast({
        title: "Settings updated",
        description: "Chat room settings have been updated",
      });
      
      onSettingsUpdated();
      setOpen(false);
    } catch (err) {
      console.error('Error updating chat settings:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async () => {
    setLoading(true);
    
    try {
      await api.deleteChat(chatId, ownerId);
      
      toast({
        title: "Chat deleted",
        description: "The chat room has been deleted",
      });
      
      onChatDeleted();
      setOpen(false);
    } catch (err) {
      console.error('Error deleting chat:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete chat",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };
  
  return (
    <>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Settings className="h-4 w-4 mr-2" />
        Settings
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chat Room Settings</DialogTitle>
            <DialogDescription>
              Manage your chat room settings and permissions
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4 py-2">
              <div>
                <Label htmlFor="room-code">Room Code</Label>
                <Input
                  id="room-code"
                  value={roomCode}
                  readOnly
                  className="font-mono uppercase"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Share this code with others to join your chat
                </p>
              </div>
              
              <div>
                <Label htmlFor="name">Room Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={50}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description of your chat room"
                  maxLength={200}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="public">Public Room</Label>
                  <p className="text-xs text-muted-foreground">
                    Allow anyone to discover this chat
                  </p>
                </div>
                <Switch
                  id="public"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
              </div>
              
              <div>
                <Label htmlFor="max-participants">Maximum Participants</Label>
                <Input
                  id="max-participants"
                  type="number"
                  min={2}
                  max={100}
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(parseInt(e.target.value, 10))}
                />
              </div>
              
              {showDeleteConfirm ? (
                <div className="border border-destructive rounded-md p-4">
                  <h4 className="font-medium text-destructive mb-2">Delete Chat Room</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    This will permanently delete the chat room and all messages. This action cannot be undone.
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={loading}
                    >
                      Confirm Delete
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full text-destructive border-destructive hover:bg-destructive/10"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Chat Room
                </Button>
              )}
            </div>
            
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
} 