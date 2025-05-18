import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import CopyButton from '../components/CopyButton';
import Timer from '../components/Timer';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../lib/api';
import { Input } from '../components/ui/input';

const Paste = () => {
  const { pasteId, shortCode } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [content, setContent] = useState('');
  const [expiry, setExpiry] = useState('2h');
  const [isLoading, setIsLoading] = useState(false);
  const [pasteData, setPasteData] = useState<{
    content: string;
    expiresAt: Date;
    viewed: boolean;
    id: string;
    short_code?: string;
  } | null>(null);
  const [inputShortCode, setInputShortCode] = useState('');

  // For viewing a paste
  useEffect(() => {
    if (pasteId || shortCode) {
      const fetchPaste = async () => {
        try {
          // Use either the short code or the paste ID
          const id = shortCode || pasteId;
          if (!id) return;
          
          const paste = await api.getPaste(id);
          
          // Set paste data
          setPasteData({
            id: paste.id,
            content: paste.content,
            expiresAt: new Date(paste.expires_at),
            viewed: paste.viewed,
            short_code: paste.short_code
          });
          
          // Warning if this is a one-time viewable paste
          if (paste.delete_after_view && !paste.viewed) {
            toast({
              title: "Warning",
              description: "This paste will be deleted after you leave this page",
              variant: "destructive",
            });
          }
        } catch (err) {
          console.error('Error fetching paste:', err);
          toast({
            title: "Error",
            description: err instanceof Error ? err.message : "Failed to load paste data",
            variant: "destructive",
          });
          navigate('/paste');
        }
      };

      fetchPaste();
    }
  }, [pasteId, shortCode, toast, navigate]);

  // Handle paste expiration
  const handleExpire = async () => {
    if (pasteData?.id) {
      try {
        await api.deletePaste(pasteData.id);
        
        toast({
          title: "Paste expired",
          description: "This paste has been deleted",
          variant: "destructive",
        });
        
        navigate('/paste');
      } catch (err) {
        console.error('Error expiring paste:', err);
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to delete paste",
          variant: "destructive",
        });
      }
    }
  };

  // Handle accessing a paste by short code
  const handleAccessByShortCode = () => {
    if (!inputShortCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid short code",
        variant: "destructive",
      });
      return;
    }
    
    navigate(`/p/${inputShortCode.trim()}`);
  };

  // Create a new paste
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please enter some content to share",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Determine if this is a one-time viewable paste
      const deleteAfterView = expiry === 'view';
      
      // Create paste via API
      const data = await api.createPaste(
        content, 
        expiry, 
        deleteAfterView, 
        user?.id
      );
      
      // Generate the share URL - use short code if available
      const shareUrl = data.short_code 
        ? `${window.location.origin}/p/${data.short_code}`
        : `${window.location.origin}/paste/${data.id}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      
      // Show toast with short code if available
      toast({
        title: "Paste created",
        description: (
          <div className="flex flex-col gap-1">
            <p>Share URL has been copied to clipboard</p>
            {data.short_code && (
              <p className="text-xs font-mono bg-black/30 p-1 rounded mt-1">
                Short code: <span className="text-primary">{data.short_code}</span>
              </p>
            )}
          </div>
        ),
        duration: 5000,
      });
      
      // Reset form
      setContent('');
      
      // Navigate to the paste
      if (data.short_code) {
        navigate(`/p/${data.short_code}`);
      } else {
        navigate(`/paste/${data.id}`);
      }
    } catch (err) {
      console.error('Error creating paste:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create paste",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-8">
      {(pasteId || shortCode) && pasteData ? (
        // Viewing an existing paste
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Shared Paste</h1>
            <div className="flex items-center space-x-2">
              <CopyButton text={pasteData.content} />
              <Button variant="destructive" size="sm" onClick={handleExpire}>
                Expire Now
              </Button>
            </div>
          </div>
          
          {pasteData.short_code && (
            <div className="flex items-center justify-between bg-dark-lighter p-2 px-3 rounded-md text-sm">
              <div className="flex items-center">
                <span className="text-muted-foreground mr-2">Short code:</span>
                <code className="font-mono text-primary">{pasteData.short_code}</code>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  const shareUrl = `${window.location.origin}/p/${pasteData.short_code}`;
                  navigator.clipboard.writeText(shareUrl);
                  toast({
                    title: "Link copied",
                    description: "Short link copied to clipboard",
                  });
                }}
              >
                Copy Link
              </Button>
            </div>
          )}
          
          <div className="bg-muted p-4 rounded-md relative">
            {pasteData.viewed && (
              <div className="absolute top-2 right-2 flex items-center text-yellow-500">
                <AlertTriangle className="w-4 h-4 mr-1" />
                <span className="text-xs">This paste will be deleted after viewing</span>
              </div>
            )}
            
            <pre className="whitespace-pre-wrap break-words">
              {pasteData.content}
            </pre>
          </div>
          
          <div className="flex justify-between items-center">
            <Button variant="outline" asChild>
              <Link to="/paste">Create New Paste</Link>
            </Button>
            
            <Timer expiryTime={pasteData.expiresAt} onExpire={handleExpire} />
          </div>
        </div>
      ) : (
        // Create a new paste
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Code Paste</h1>
          
          {/* Short code access form */}
          <div className="p-4 bg-dark-lighter rounded-md border border-border">
            <h2 className="text-lg font-medium mb-3">Access by Short Code</h2>
            <div className="flex gap-2">
              <Input
                placeholder="Enter paste short code (e.g. P-1A2B3C4)"
                value={inputShortCode}
                onChange={(e) => setInputShortCode(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleAccessByShortCode}>
                <ArrowRight className="h-4 w-4 mr-2" />
                Access
              </Button>
            </div>
          </div>
          
          <div className="border-t border-border pt-6">
            <h2 className="text-lg font-medium mb-4">Create a New Paste</h2>
            
            <div className="mb-4 p-3 bg-dark-lighter rounded-md border border-border flex items-center text-sm">
              <div className="mr-2 p-1 rounded-full bg-primary/20 text-primary">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <span>
                A short code will be automatically generated for easier sharing
              </span>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <Textarea
                placeholder="Enter your text here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[200px]"
              />
              
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex items-center space-x-2">
                  <span>Expires after:</span>
                  <Select value={expiry} onValueChange={setExpiry}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5m">5 minutes</SelectItem>
                      <SelectItem value="1h">1 hour</SelectItem>
                      <SelectItem value="2h">2 hours</SelectItem>
                      <SelectItem value="12h">12 hours</SelectItem>
                      <SelectItem value="24h">24 hours</SelectItem>
                      <SelectItem value="view">After viewing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create and Share'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Paste;
