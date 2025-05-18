import { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import { format } from 'date-fns';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { API_URL } from '@/config';
import { toast } from 'sonner';

// Define types
interface Chat {
  _id: string;
  name: string;
  description: string;
  roomCode: string;
  createdAt: string;
  lastActivity: string;
  participants: number | unknown;
  messageCount: number;
}

interface Message {
  id: string;
  chatId: string;
  content: string;
  senderId: string;
  senderName: string;
  createdAt: string;
}

interface Participant {
  id: string;
  chatId: string;
  username: string;
  joinedAt: string;
  lastActivity: string;
  isOwner: boolean;
}

// Define a type for raw chat data from API
interface RawChat {
  _id: string;
  name: string;
  description?: string;
  roomCode?: string;
  room_code?: string;
  createdAt?: string;
  created_at?: string;
  lastActivity?: string;
  last_activity?: string;
  participants?: number | unknown;
  messageCount?: number;
}

const AdminChats = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState('messages');
  const [messageLoading, setMessageLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);

  // Load chats from API
  const loadChats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/admin/chats`, {
        params: { page, limit: 10, status, search },
        withCredentials: true
      });
      
      // Transform chat data to ensure proper types
      const formattedChats = response.data.chats.map((chat: RawChat) => {
        // Get participant count safely
        let participantCount = 0;
        if (typeof chat.participants === 'number') {
          participantCount = chat.participants;
        } else if (Array.isArray(chat.participants)) {
          participantCount = chat.participants.length;
        }
        
        return {
          ...chat,
          participants: participantCount,
          messageCount: typeof chat.messageCount === 'number' ? chat.messageCount : 0
        };
      });
      
      console.log('Formatted chats:', formattedChats);
      setChats(formattedChats);
      setTotalPages(response.data.pagination.pages);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{error: string}>;
      const errorMessage = axiosError.response?.data?.error || 'Failed to load chats';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error loading chats:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load messages for a specific chat
  const loadMessages = async (chatId: string) => {
    try {
      setMessageLoading(true);
      const response = await axios.get(`${API_URL}/admin/chats/${chatId}/messages`, {
        params: { page: 1, limit: 100 },
        withCredentials: true
      });
      
      // Log the response to see the exact structure
      console.log('Messages response:', response.data.messages);
      
      // Handle messages data more carefully
      const formattedMessages = response.data.messages.map((m: Record<string, unknown>) => {
        // Create a safe message object with default values
        return {
          id: typeof m._id === 'string' ? m._id : (typeof m.id === 'string' ? m.id : String(Math.random())),
          chatId: typeof m.chat_id === 'string' ? m.chat_id : (typeof m.chatId === 'string' ? m.chatId : ''),
          content: typeof m.content === 'string' ? m.content : '',
          senderId: typeof m.sender_id === 'string' ? m.sender_id : (typeof m.senderId === 'string' ? m.senderId : ''),
          senderName: typeof m.sender_name === 'string' ? m.sender_name : (
            typeof m.senderName === 'string' ? m.senderName : 'Unknown User'
          ),
          createdAt: typeof m.created_at === 'string' ? m.created_at : (typeof m.createdAt === 'string' ? m.createdAt : new Date().toISOString())
        };
      });
      
      console.log('Formatted messages:', formattedMessages);
      setMessages(formattedMessages);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{error: string}>;
      toast.error(axiosError.response?.data?.error || 'Failed to load messages');
      console.error('Error loading messages:', err);
    } finally {
      setMessageLoading(false);
    }
  };

  // Load participants for a specific chat
  const loadParticipants = async (chatId: string) => {
    try {
      setMessageLoading(true);
      const response = await axios.get(`${API_URL}/admin/chats/${chatId}/participants`, {
        withCredentials: true
      });
      
      // Log the response to see the exact structure
      console.log('Participants response:', JSON.stringify(response.data.participants, null, 2));
      
      // Handle participants data more carefully
      const formattedParticipants = response.data.participants.map((p: Record<string, unknown>) => {
        console.log('Processing participant:', p);
        
        // Check if sender_id or other fields might be objects instead of strings
        let username = 'Unknown User';
        
        // Handle potential object in username field
        if (typeof p.username === 'string') {
          username = p.username;
        } else if (p.username && typeof p.username === 'object') {
          // Try to extract username from object
          const usernameObj = p.username as Record<string, unknown>;
          if (typeof usernameObj.username === 'string') {
            username = usernameObj.username;
          }
        }
        
        // Create a safe participant object with default values
        return {
          id: typeof p._id === 'string' ? p._id : (typeof p.id === 'string' ? p.id : String(Math.random())),
          chatId: typeof p.chat_id === 'string' ? p.chat_id : (typeof p.chatId === 'string' ? p.chatId : ''),
          username,
          joinedAt: typeof p.joined_at === 'string' ? p.joined_at : (typeof p.joinedAt === 'string' ? p.joinedAt : new Date().toISOString()),
          lastActivity: typeof p.last_activity === 'string' ? p.last_activity : (typeof p.lastActivity === 'string' ? p.lastActivity : new Date().toISOString()),
          isOwner: Boolean(p.is_owner || p.isOwner)
        };
      });
      
      console.log('Formatted participants:', formattedParticipants);
      setParticipants(formattedParticipants);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{error: string}>;
      toast.error(axiosError.response?.data?.error || 'Failed to load participants');
      console.error('Error loading participants:', err);
    } finally {
      setMessageLoading(false);
    }
  };

  // Format date strings
  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (err) {
      return 'Invalid Date';
    }
  };

  // Check if a chat is active (activity in the last 24 hours)
  const isActive = (dateString: string): boolean => {
    try {
      const activityDate = new Date(dateString);
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      return activityDate > oneDayAgo;
    } catch (err) {
      return false;
    }
  };

  // View chat details
  const viewChatDetails = (chat: Chat) => {
    setSelectedChat(chat);
    setIsModalOpen(true);
    setModalTab('messages');
    loadMessages(chat._id);
    loadParticipants(chat._id);
  };

  // Delete a chat
  const deleteChat = async (chatId: string) => {
    try {
      await axios.delete(`${API_URL}/admin/chats/${chatId}`, {
        withCredentials: true
      });
      
      toast.success('Chat deleted successfully');
      // Refresh the list
      loadChats();
      // Close modals
      setDeleteConfirmOpen(false);
      setChatToDelete(null);
      if (isModalOpen) {
        setIsModalOpen(false);
      }
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{error: string}>;
      toast.error(axiosError.response?.data?.error || 'Failed to delete chat');
      console.error('Error deleting chat:', err);
    }
  };

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadChats();
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  // Load chats when component mounts or filters change
  useEffect(() => {
    loadChats();
  }, [page, status]);

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin Chat Management</CardTitle>
          <CardDescription>
            View and manage all chats in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Search chats..."
              className="max-w-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select
              value={status}
              onValueChange={(value) => setStatus(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Chats</SelectItem>
                <SelectItem value="active">Active Chats</SelectItem>
                <SelectItem value="inactive">Inactive Chats</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center py-4">{error}</div>
          ) : (
            <>
              <Table>
                <TableCaption>A list of all chats in the system</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Room Code</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead>Participants</TableHead>
                    <TableHead>Messages</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chats.length > 0 ? (
                    chats.map((chat) => (
                      <TableRow key={chat._id}>
                        <TableCell className="font-medium">{chat.name}</TableCell>
                        <TableCell>{chat.roomCode}</TableCell>
                        <TableCell>{formatDate(chat.createdAt)}</TableCell>
                        <TableCell>{formatDate(chat.lastActivity)}</TableCell>
                        <TableCell>{typeof chat.participants === 'number' ? chat.participants : 0}</TableCell>
                        <TableCell>{chat.messageCount}</TableCell>
                        <TableCell>
                          <Badge variant={isActive(chat.lastActivity) ? "default" : "secondary"}>
                            {isActive(chat.lastActivity) ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewChatDetails(chat)}
                            >
                              View
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setChatToDelete(chat._id);
                                setDeleteConfirmOpen(true);
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4">
                        No chats found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Chat Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chat Details: {selectedChat?.name}</DialogTitle>
            <DialogDescription>
              Room Code: {selectedChat?.roomCode}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={modalTab} onValueChange={setModalTab}>
            <TabsList>
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="participants">Participants</TabsTrigger>
            </TabsList>

            <TabsContent value="messages">
              {messageLoading ? (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.length > 0 ? (
                    messages.map((message, index) => {
                      // Ensure all values are primitive before rendering
                      const senderName = typeof message.senderName === 'string' 
                        ? message.senderName 
                        : 'Unknown User';
                      
                      const content = typeof message.content === 'string'
                        ? message.content
                        : '';
                      
                      const createdAt = typeof message.createdAt === 'string'
                        ? message.createdAt
                        : new Date().toISOString();
                      
                      // Use index as key if id is not a string
                      const key = typeof message.id === 'string' 
                        ? message.id 
                        : `message-${index}`;
                      
                      return (
                        <div key={key} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="font-semibold">{senderName}</span>
                              <span className="text-sm text-gray-500 ml-2">
                                {formatDate(createdAt)}
                              </span>
                            </div>
                          </div>
                          <p className="whitespace-pre-wrap">{content}</p>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-center text-gray-500">No messages found</p>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="participants">
              {messageLoading ? (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Last Activity</TableHead>
                      <TableHead>Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {participants.length > 0 ? (
                      participants.map((participant, index) => {
                        // Ensure all values are primitive before rendering
                        const username = typeof participant.username === 'string' 
                          ? participant.username 
                          : 'Unknown User';
                        
                        const joinedAt = typeof participant.joinedAt === 'string'
                          ? participant.joinedAt
                          : new Date().toISOString();
                        
                        const lastActivity = typeof participant.lastActivity === 'string'
                          ? participant.lastActivity
                          : new Date().toISOString();
                        
                        const isOwner = Boolean(participant.isOwner);
                        
                        // Use index as key if id is not a string
                        const key = typeof participant.id === 'string' 
                          ? participant.id 
                          : `participant-${index}`;
                        
                        return (
                          <TableRow key={key}>
                            <TableCell>{username}</TableCell>
                            <TableCell>{formatDate(joinedAt)}</TableCell>
                            <TableCell>{formatDate(lastActivity)}</TableCell>
                            <TableCell>
                              <Badge variant={isOwner ? "default" : "secondary"}>
                                {isOwner ? "Owner" : "Participant"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4">
                          No participants found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Chat</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this chat? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setChatToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => chatToDelete && deleteChat(chatToDelete)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminChats; 