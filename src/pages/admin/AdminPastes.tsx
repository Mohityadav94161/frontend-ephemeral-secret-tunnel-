import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
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
  FileText,
  RefreshCw,
  Search,
  Trash2,
  ExternalLink
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getAdminAuthHeader } from '@/utils/adminAuth';

// Paste interface
interface Paste {
  id: string;
  title: string;
  content: string;
  language: string;
  short_code: string;
  expires_at: string;
  created_at: string;
  views: number;
  created_by?: string;
  is_public: boolean;
  user_id: string | null;
  delete_after_view: boolean;
  viewed: boolean;
}

// Pagination interface
interface Pagination {
  page: number;
  limit: number;
  pages: number;
  total: number;
}

const AdminPastes = () => {
  const navigate = useNavigate();
  const [pastes, setPastes] = useState<Paste[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewFilter, setViewFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPaste, setSelectedPaste] = useState<Paste | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load pastes from API
  const loadPastes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/admin/pastes`, {
        params: { page, limit: 10, viewed: viewFilter },
        headers: {
          Authorization: getAdminAuthHeader()
        },
        withCredentials: true
      });
      
      setPastes(response.data.pastes);
      setTotalPages(response.data.pagination.pages);
    } catch (err) {
      setError('Failed to load pastes');
      console.error('Error loading pastes:', err);
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

  // View paste details
  const viewPasteDetails = (paste: Paste) => {
    setSelectedPaste(paste);
    setIsModalOpen(true);
  };

  // Check if paste is expired
  const isExpired = (expiresAt: string | null): boolean => {
    if (!expiresAt) return false;
    try {
      return new Date(expiresAt) < new Date();
    } catch (err) {
      return false;
    }
  };

  // Load pastes when component mounts or filters change
  useEffect(() => {
    loadPastes();
  }, [page, viewFilter]);

  if (error) {
    return (
      <Card className="mx-auto max-w-5xl mt-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Error</CardTitle>
            <Button variant="outline" size="sm" onClick={() => navigate('/admin')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
          <Button onClick={loadPastes} className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin Paste Management</CardTitle>
          <CardDescription>
            View and manage all pastes in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col md:flex-row gap-4">
            <Select
              value={viewFilter}
              onValueChange={(value) => setViewFilter(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by view status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Pastes</SelectItem>
                <SelectItem value="viewed">Viewed Pastes</SelectItem>
                <SelectItem value="unviewed">Unviewed Pastes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent"></div>
            </div>
          ) : (
            <>
              <Table>
                <TableCaption>A list of all pastes in the system</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pastes.length > 0 ? (
                    pastes.map((paste) => (
                      <TableRow key={paste.id}>
                        <TableCell className="font-medium">{paste.id.substring(0, 8)}...</TableCell>
                        <TableCell>{formatDate(paste.created_at)}</TableCell>
                        <TableCell>{paste.expires_at ? formatDate(paste.expires_at) : 'Never'}</TableCell>
                        <TableCell>
                          {paste.viewed ? (
                            <Badge variant="default" className="bg-green-500">Viewed</Badge>
                          ) : isExpired(paste.expires_at) ? (
                            <Badge variant="destructive">Expired</Badge>
                          ) : (
                            <Badge variant="secondary">Unviewed</Badge>
                          )}
                        </TableCell>
                        <TableCell>{paste.user_id || 'Anonymous'}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewPasteDetails(paste)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        No pastes found
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

      {/* Paste Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl">
          {selectedPaste && (
            <>
              <DialogHeader>
                <DialogTitle>Paste Details</DialogTitle>
                <DialogDescription>
                  Created: {formatDate(selectedPaste.created_at)} | 
                  Expires: {selectedPaste.expires_at ? formatDate(selectedPaste.expires_at) : 'Never'} | 
                  Status: {selectedPaste.viewed ? 'Viewed' : 'Unviewed'}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4">
                <h3 className="font-medium mb-2">Content:</h3>
                <div className="bg-slate-700 dark:bg-slate-800 p-4 rounded-md overflow-auto max-h-96">
                  <pre className="whitespace-pre-wrap">{selectedPaste.content}</pre>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="font-medium mb-2">Additional Information:</h3>
                <ul className="space-y-2">
                  <li><span className="font-medium">Paste ID:</span> {selectedPaste.id}</li>
                  <li><span className="font-medium">User:</span> {selectedPaste.user_id || 'Anonymous'}</li>
                  <li><span className="font-medium">Delete after view:</span> {selectedPaste.delete_after_view ? 'Yes' : 'No'}</li>
                </ul>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPastes; 