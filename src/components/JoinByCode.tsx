import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { useToast } from '../hooks/use-toast';
import * as api from '../lib/api';

interface JoinByCodeProps {
  onSuccess?: (chatId: string) => void;
}

export default function JoinByCode({ onSuccess }: JoinByCodeProps) {
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roomCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a room code",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const cleanCode = roomCode.trim().toUpperCase();
      const data = await api.getChatByRoomCode(cleanCode);
      
      if (onSuccess) {
        onSuccess(data.id);
      } else {
        // Navigate to the chat page
        navigate(`/chat/${data.id}`);
      }
      
      toast({
        title: "Success",
        description: `Found chat room: ${data.name}`,
      });
    } catch (err) {
      console.error('Error finding chat room:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to find chat room",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Join by Room Code</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Enter Room Code
              </label>
              <Input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                placeholder="e.g. ABC123"
                className="uppercase"
                maxLength={6}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter the 6-character code provided by the room creator
              </p>
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Join Chat Room'}
            </Button>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t pt-4">
        <p className="text-xs text-muted-foreground">
          You'll need to enter a username after joining
        </p>
      </CardFooter>
    </Card>
  );
} 