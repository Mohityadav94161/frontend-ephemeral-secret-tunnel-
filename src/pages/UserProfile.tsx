import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../lib/api';
import { Clock, File, FileIcon, Download, Trash2, Zap, Clipboard, Code } from 'lucide-react';
import Timer from '../components/Timer';
import SmsUsagePanel from '../components/SmsUsagePanel';

interface UserFile {
  id: string;
  name: string;
  type: string;
  size: number;
  expires_at: string;
  delete_after_download: boolean;
  created_at: string;
  downloaded: boolean;
  short_code?: string;
}

interface UserPaste {
  id: string;
  content: string;
  expires_at: string;
  delete_after_view: boolean;
  created_at: string;
  viewed: boolean;
  short_code?: string;
}

interface UserChat {
  chatId: string;
  chatName: string;
  roomCode: string;
  lastActivity: string;
}

const UserProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [files, setFiles] = useState<UserFile[]>([]);
  const [pastes, setPastes] = useState<UserPaste[]>([]);
  const [chats, setChats] = useState<UserChat[]>([]);
  const [loading, setLoading] = useState({ files: true, pastes: true, chats: true });
  
  // Fetch user files
  useEffect(() => {
    const fetchUserFiles = async () => {
      if (!user?.id) return;
      
      try {
        const data = await api.getUserFiles(user.id);
        setFiles(data.files || []);
      } catch (error) {
        console.error('Error fetching user files:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your shared files',
          variant: 'destructive',
        });
      } finally {
        setLoading(prev => ({ ...prev, files: false }));
      }
    };
    
    fetchUserFiles();
  }, [user?.id, toast]);
  
  // Fetch user pastes
  useEffect(() => {
    const fetchUserPastes = async () => {
      if (!user?.id) return;
      
      try {
        const data = await api.getUserPastes(user.id);
        setPastes(data.pastes || []);
      } catch (error) {
        console.error('Error fetching user pastes:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your shared pastes',
          variant: 'destructive',
        });
      } finally {
        setLoading(prev => ({ ...prev, pastes: false }));
      }
    };
    
    fetchUserPastes();
  }, [user?.id, toast]);
  
  // Fetch user chats
  useEffect(() => {
    const fetchUserChats = async () => {
      if (!user?.id) return;
      
      try {
        const data = await api.getUserChatHistory(user.id);
        setChats(data.chats || []);
      } catch (error) {
        console.error('Error fetching user chats:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your chat history',
          variant: 'destructive',
        });
      } finally {
        setLoading(prev => ({ ...prev, chats: false }));
      }
    };
    
    fetchUserChats();
  }, [user?.id, toast]);
  
  // Handle file expiration
  const handleExpireFile = async (fileId: string) => {
    try {
      await api.deleteFile(fileId);
      
      // Remove file from state
      setFiles(files.filter(file => file.id !== fileId));
      
      toast({
        title: 'Success',
        description: 'File has been deleted',
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete file',
        variant: 'destructive',
      });
    }
  };
  
  // Handle paste expiration
  const handleExpirePaste = async (pasteId: string) => {
    try {
      await api.deletePaste(pasteId);
      
      // Remove paste from state
      setPastes(pastes.filter(paste => paste.id !== pasteId));
      
      toast({
        title: 'Success',
        description: 'Paste has been deleted',
      });
    } catch (error) {
      console.error('Error deleting paste:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete paste',
        variant: 'destructive',
      });
    }
  };
  
  // Format bytes to human-readable format
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl animate-fade-in">
      <h1 className="text-2xl font-bold mb-6 gradient-text">Your Profile</h1>
      
      <div className="grid gap-6 mb-6 md:grid-cols-2">
        <div className="col-span-2 md:col-span-1">
          <div className="bg-dark-lighter rounded-lg p-6 border border-border h-full">
            <h2 className="text-xl font-semibold mb-4">Account Information</h2>
            <div className="grid gap-4">
              <div>
                <p className="text-muted-foreground">Username</p>
                <p className="font-medium">{user?.username || 'N/A'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Account Type</p>
                <p className="font-medium">Standard</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-span-2 md:col-span-1">
          <SmsUsagePanel />
        </div>
      </div>
      
      <Tabs defaultValue="files">
        <TabsList className="mb-6">
          <TabsTrigger value="files">Shared Files</TabsTrigger>
          <TabsTrigger value="pastes">Code Pastes</TabsTrigger>
          <TabsTrigger value="chats">Chat Rooms</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="files">
          <div className="bg-dark-lighter rounded-lg p-6 border border-border">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Your Shared Files</h2>
              <Button variant="outline" onClick={() => navigate('/fileshare')}>
                Share New File
              </Button>
            </div>
            
            {loading.files ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p>Loading your files...</p>
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border rounded-md">
                <FileIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No shared files</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't shared any files yet.
                </p>
                <Button onClick={() => navigate('/fileshare')}>
                  Share a File
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {files.map(file => (
                  <Card key={file.id} className="bg-dark border-border">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          <FileIcon className="w-5 h-5 mr-2 text-primary" />
                          <CardTitle className="text-lg">{file.name}</CardTitle>
                        </div>
                        <div className="flex items-center space-x-2">
                          {file.downloaded ? (
                            <span className="text-xs bg-green-900/30 text-green-400 px-2 py-1 rounded">
                              Downloaded
                            </span>
                          ) : (
                            <span className="text-xs bg-blue-900/30 text-blue-400 px-2 py-1 rounded">
                              Waiting
                            </span>
                          )}
                          {file.delete_after_download && (
                            <span className="text-xs bg-yellow-900/30 text-yellow-400 px-2 py-1 rounded">
                              One-time
                            </span>
                          )}
                        </div>
                      </div>
                      <CardDescription className="flex items-center">
                        <span className="mr-3">{formatBytes(file.size)}</span>
                        <span>{file.type}</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground">
                        <div className="flex justify-between mb-1">
                          <span>Created:</span>
                          <span>{formatDate(file.created_at)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Expires:</span>
                          <span>
                            <Timer 
                              expiryTime={new Date(file.expires_at)} 
                              onExpire={() => setFiles(files.filter(f => f.id !== file.id))}
                              compact
                            />
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleExpireFile(file.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Expire Now
                      </Button>
                      
                      <Button
                        size="sm"
                        onClick={() => {
                          const shareUrl = file.short_code 
                            ? `${window.location.origin}/f/${file.short_code}`
                            : `${window.location.origin}/share/${file.id}`;
                          
                          navigator.clipboard.writeText(shareUrl);
                          toast({
                            title: 'Link Copied',
                            description: 'Share link copied to clipboard',
                          });
                        }}
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Copy Share Link
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="pastes">
          <div className="bg-dark-lighter rounded-lg p-6 border border-border">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Your Code Pastes</h2>
              <Button variant="outline" onClick={() => navigate('/paste')}>
                Create New Paste
              </Button>
            </div>
            
            {loading.pastes ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p>Loading your pastes...</p>
              </div>
            ) : pastes.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border rounded-md">
                <Code className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No code pastes</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't created any code pastes yet.
                </p>
                <Button onClick={() => navigate('/paste')}>
                  Create a Paste
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {pastes.map(paste => (
                  <Card key={paste.id} className="bg-dark border-border">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          <Clipboard className="w-5 h-5 mr-2 text-primary" />
                          <CardTitle className="text-lg">Code Paste</CardTitle>
                        </div>
                        <div className="flex items-center space-x-2">
                          {paste.viewed ? (
                            <span className="text-xs bg-green-900/30 text-green-400 px-2 py-1 rounded">
                              Viewed
                            </span>
                          ) : (
                            <span className="text-xs bg-blue-900/30 text-blue-400 px-2 py-1 rounded">
                              Unviewed
                            </span>
                          )}
                          {paste.delete_after_view && (
                            <span className="text-xs bg-yellow-900/30 text-yellow-400 px-2 py-1 rounded">
                              One-time
                            </span>
                          )}
                        </div>
                      </div>
                      <CardDescription>
                        {paste.content.length > 60 ? paste.content.substring(0, 60) + '...' : paste.content}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground">
                        <div className="flex justify-between mb-1">
                          <span>Created:</span>
                          <span>{formatDate(paste.created_at)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Expires:</span>
                          <span>
                            <Timer 
                              expiryTime={new Date(paste.expires_at)} 
                              onExpire={() => setPastes(pastes.filter(p => p.id !== paste.id))}
                              compact
                            />
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleExpirePaste(paste.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Expire Now
                      </Button>
                      
                      <Button
                        size="sm"
                        onClick={() => {
                          const shareUrl = paste.short_code 
                            ? `${window.location.origin}/p/${paste.short_code}`
                            : `${window.location.origin}/paste/${paste.id}`;
                          
                          navigator.clipboard.writeText(shareUrl);
                          toast({
                            title: 'Link Copied',
                            description: 'Share link copied to clipboard',
                          });
                        }}
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Copy Share Link
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="chats">
          <div className="bg-dark-lighter rounded-lg p-6 border border-border">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Your Chat Rooms</h2>
              <Button variant="outline" onClick={() => navigate('/chat')}>
                Create New Chat
              </Button>
            </div>
            
            {loading.chats ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p>Loading your chats...</p>
              </div>
            ) : chats.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border rounded-md">
                <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No chat history</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't created or joined any chats yet.
                </p>
                <Button onClick={() => navigate('/chat')}>
                  Create a Chat Room
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {chats.map(chat => (
                  <Card key={chat.chatId} className="bg-dark border-border">
                    <CardHeader>
                      <CardTitle>{chat.chatName}</CardTitle>
                      <CardDescription>Room Code: {chat.roomCode}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Last activity: {formatDate(chat.lastActivity)}
                      </p>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const chatUrl = `${window.location.origin}/chat/${chat.chatId}`;
                          navigator.clipboard.writeText(chatUrl);
                          toast({
                            title: 'Link Copied',
                            description: 'Chat link copied to clipboard',
                          });
                        }}
                      >
                        Copy Link
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => navigate(`/chat/${chat.chatId}`)}
                      >
                        Join Chat
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="settings">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-dark-lighter border-border">
              <CardHeader>
                <CardTitle>SMS Invitations</CardTitle>
                <CardDescription>
                  Manage your SMS invitation settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  You can invite people to your chats by sending them an SMS message. This
                  feature is limited to prevent abuse.
                </p>
                <SmsUsagePanel />
              </CardContent>
            </Card>
            
            <Card className="bg-dark-lighter border-border">
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Manage your account preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Control your account settings and preferences.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Default File Expiry</h3>
                    <select className="w-full bg-dark border border-border rounded px-3 py-2">
                      <option>2 hours (default)</option>
                      <option>12 hours</option>
                      <option>24 hours</option>
                    </select>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Default Chat Expiry</h3>
                    <select className="w-full bg-dark border border-border rounded px-3 py-2">
                      <option>24 hours (default)</option>
                      <option>48 hours</option>
                      <option>7 days</option>
                    </select>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Save Settings</Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserProfile; 