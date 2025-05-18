import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '@/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  Eye,
  Globe,
  Lock,
  MousePointer,
  RefreshCw,
  Search,
  Smartphone,
  Trash2,
  User,
  UserPlus,
  UserCog
} from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';

// Auth header
const username = 'admin';
const password = 'admin123';
const authHeader = 'Basic ' + btoa(`${username}:${password}`);

// User interface
interface UserData {
  id: string;
  username: string;
  email: string;
  created_at: string;
  last_login?: string;
  chat_count: number;
  paste_count: number;
  file_count: number;
  is_active: boolean;
  is_verified: boolean;
}

// Footprint interface
interface Footprint {
  _id: string;
  ipAddress: string;
  path: string;
  method: string;
  referer: string;
  user_id?: string;
  browserInfo: {
    browser: string;
    os: string;
    version: string;
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
  };
  geolocation?: {
    country: string;
    city: string;
    region: string;
    timezone: string;
    provider: string;
  };
  timestamp: string;
}

// Pagination interface
interface Pagination {
  page: number;
  limit: number;
  pages: number;
  total: number;
}

interface User {
  _id: string;
  username: string;
  email: string;
  createdAt: string;
  lastLogin: string | null;
  isAdmin: boolean;
  isActive: boolean;
}

const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load users from API
  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/admin/users`, {
        params: { page, limit: 10, search },
        withCredentials: true
      });
      
      setUsers(response.data.users);
      setTotalPages(response.data.pagination.pages);
    } catch (err) {
      setError('Failed to load users');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  // Format date strings
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Never';
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (err) {
      return 'Invalid Date';
    }
  };

  // View user details
  const viewUserDetails = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  // Load users when component mounts or search/page changes
  useEffect(() => {
    loadUsers();
  }, [page, search]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadUsers();
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin User Management</CardTitle>
          <CardDescription>
            View and manage all users in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="mb-4">
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                placeholder="Search by username or email..."
                className="max-w-xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Button type="submit">Search</Button>
            </div>
          </form>

          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center py-4">{error}</div>
          ) : (
            <>
              <Table>
                <TableCaption>A list of all users in the system</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length > 0 ? (
                    users.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                        <TableCell>{formatDate(user.lastLogin)}</TableCell>
                        <TableCell>
                          {user.isAdmin ? (
                            <Badge className="bg-purple-500">Admin</Badge>
                          ) : user.isActive ? (
                            <Badge variant="default" className="bg-green-500">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewUserDetails(user)}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        No users found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <div className="flex justify-between items-center mt-4">
                <Button
                  variant="outline"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* User Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle>User Details</DialogTitle>
                <DialogDescription>
                  Account created: {formatDate(selectedUser.createdAt)}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4">
                <h3 className="font-medium mb-2">User Information:</h3>
                <ul className="space-y-2">
                  <li><span className="font-medium">User ID:</span> {selectedUser._id}</li>
                  <li><span className="font-medium">Username:</span> {selectedUser.username}</li>
                  <li><span className="font-medium">Email:</span> {selectedUser.email}</li>
                  <li><span className="font-medium">Last Login:</span> {formatDate(selectedUser.lastLogin)}</li>
                  <li><span className="font-medium">Admin:</span> {selectedUser.isAdmin ? 'Yes' : 'No'}</li>
                  <li><span className="font-medium">Status:</span> {selectedUser.isActive ? 'Active' : 'Inactive'}</li>
                </ul>
              </div>

              <div className="mt-4">
                <h3 className="font-medium mb-2">Account Actions:</h3>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline">Reset Password</Button>
                  {selectedUser.isActive ? (
                    <Button variant="destructive">Deactivate Account</Button>
                  ) : (
                    <Button variant="default">Activate Account</Button>
                  )}
                  {selectedUser.isAdmin ? (
                    <Button variant="destructive">Remove Admin</Button>
                  ) : (
                    <Button variant="default">Make Admin</Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers; 