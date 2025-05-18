import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../../components/ui/pagination';
import { Badge } from '../../components/ui/badge';
import { toast } from '../../components/ui/use-toast';
import {
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Mail,
  AlertTriangle,
  Lightbulb,
  BarChart,
  MoreHorizontal,
  Trash2,
  MessageSquare,
  Eye,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { API_URL } from '../../config';
import { getAdminAuthHeader, isAdminAuthenticated } from '../../utils/adminAuth';

interface Feedback {
  _id: string;
  userId?: string;
  username?: string;
  email?: string;
  category: string;
  title: string;
  message: string;
  rating?: number;
  status: string;
  isResolved: boolean;
  adminResponse?: string;
  createdAt: string;
  updatedAt: string;
}

interface FeedbackStats {
  total: number;
  status: {
    new: number;
    'in-review': number;
    planned: number;
    completed: number;
    rejected: number;
  };
  categories: {
    bug: number;
    feature: number;
    improvement: number;
    other: number;
  };
  averageRating: number;
}

interface FeedbackFilters {
  status: string;
  sortBy: string;
  sortOrder: string;
  page: number;
  limit: number;
}

const categoryIcons = {
  bug: <AlertTriangle className="h-4 w-4" />,
  feature: <Lightbulb className="h-4 w-4" />,
  improvement: <BarChart className="h-4 w-4" />,
  other: <MoreHorizontal className="h-4 w-4" />,
};

const statusColors = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  'in-review': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  planned: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const ErrorDisplay = ({ message, onRetry }: { message: string, onRetry: () => void }) => {
  const isAuthError = message.includes('Authentication') || message.includes('credentials');
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl text-red-500">Error</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{message}</p>
        <div className="mt-4 flex gap-2">
          <Button onClick={onRetry}>
            Try Again
          </Button>
          {isAuthError && (
            <Button 
              variant="default" 
              onClick={() => window.location.href = '/admin/login'}
            >
              Login Again
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/admin'}
          >
            Return to Dashboard
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const AdminFeedback: React.FC = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [filters, setFilters] = useState<FeedbackFilters>({
    status: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    limit: 10,
  });
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 1,
  });
  const [error, setError] = useState<string | null>(null);

  const loadFeedbacks = async () => {
    // Check authentication
    const adminAuthHeader = getAdminAuthHeader();
    console.log('Admin auth header:', adminAuthHeader ? `${adminAuthHeader.substring(0, 10)}...` : 'None');
    
    if (!isAdminAuthenticated()) {
      setError('Authentication required');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const { status, sortBy, sortOrder, page, limit } = filters;
      
      console.log('Making API request to:', `${API_URL}/feedback`);
      const response = await axios.get(
        `${API_URL}/feedback`,
        {
          params: {
            status,
            sortBy,
            sortOrder,
            page,
            limit,
          },
          headers: {
            Authorization: getAdminAuthHeader(),
          },
        }
      );
      
      console.log('Feedback API response:', response.data);
      
      setFeedbacks(response.data.feedbacks || []);
      setPagination({
        total: response.data.pagination?.total || 0,
        pages: response.data.pagination?.pages || 1,
      });
      setError(null);
    } catch (error: any) {
      console.error('Error loading feedbacks:', error);
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else {
        setError(`Failed to load feedback data: ${error.response?.data?.error || error.message}`);
        toast({
          title: 'Error',
          description: 'Failed to load feedback data',
          variant: 'destructive',
        });
      }
      
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!isAdminAuthenticated()) return;
    
    try {
      const response = await axios.get(
        `${API_URL}/feedback/stats`,
        {
          headers: {
            Authorization: getAdminAuthHeader(),
          },
        }
      );
      
      setStats(response.data);
    } catch (error) {
      console.error('Error loading feedback stats:', error);
      setStats(null);
      // Don't show a toast for this error as it's less critical
    }
  };

  useEffect(() => {
    loadFeedbacks();
    loadStats();
  }, [filters]);

  const handleFilterChange = (key: keyof FeedbackFilters, value: string | number) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      // Reset page to 1 when changing filters except page itself
      ...(key !== 'page' ? { page: 1 } : {}),
    }));
  };

  const handleSort = (field: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleStatusChange = async (feedback: Feedback, newStatus: string) => {
    try {
      await axios.patch(
        `${API_URL}/feedback/${feedback._id}`,
        {
          status: newStatus,
          isResolved: ['completed', 'rejected'].includes(newStatus),
        },
        {
          headers: {
            Authorization: getAdminAuthHeader(),
          },
        }
      );
      
      // Refresh data
      loadFeedbacks();
      loadStats();
      
      toast({
        title: 'Success',
        description: `Feedback status updated to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating feedback status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update feedback status',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feedback?')) {
      return;
    }
    
    try {
      await axios.delete(`${API_URL}/feedback/${id}`, {
        headers: {
          Authorization: getAdminAuthHeader(),
        },
      });
      
      // Refresh data
      loadFeedbacks();
      loadStats();
      
      toast({
        title: 'Success',
        description: 'Feedback deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting feedback:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete feedback',
        variant: 'destructive',
      });
    }
  };

  const openResponseDialog = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setResponseText(feedback.adminResponse || '');
    setResponseDialogOpen(true);
  };

  const handleResponseSubmit = async () => {
    if (!selectedFeedback) return;
    
    try {
      await axios.patch(
        `${API_URL}/feedback/${selectedFeedback._id}`,
        {
          adminResponse: responseText,
        },
        {
          headers: {
            Authorization: getAdminAuthHeader(),
          },
        }
      );
      
      // Refresh data
      loadFeedbacks();
      
      toast({
        title: 'Success',
        description: 'Response saved successfully',
      });
      
      setResponseDialogOpen(false);
    } catch (error) {
      console.error('Error saving response:', error);
      toast({
        title: 'Error',
        description: 'Failed to save response',
        variant: 'destructive',
      });
    }
  };

  const openViewDialog = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setViewDialogOpen(true);
  };

  const getSortIcon = (field: string) => {
    if (filters.sortBy !== field) return null;
    return filters.sortOrder === 'asc' ? (
      <ChevronUp className="h-4 w-4 ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 ml-1" />
    );
  };

  return (
    <div className="p-6 max-w-screen-2xl mx-auto">
      {error ? (
        <ErrorDisplay 
          message={error} 
          onRetry={() => {
            setLoading(true);
            setError(null);
            loadFeedbacks();
            loadStats();
          }} 
        />
      ) : null}
      
      <div className="flex flex-col md:flex-row justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Feedback Management</h1>
          <p className="text-muted-foreground">Review and respond to user feedback</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">New</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{stats.status.new}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">In Review</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-600">{stats.status['in-review']}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{stats.status.completed}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Average Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.averageRating.toFixed(1)}</p>
              <div className="flex items-center mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 ${
                      star <= Math.round(stats.averageRating)
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="w-full md:w-48">
          <Select
            value={filters.status}
            onValueChange={(value) => handleFilterChange('status', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="in-review">In Review</SelectItem>
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-full md:w-48">
          <Select
            value={filters.sortBy}
            onValueChange={(value) => handleFilterChange('sortBy', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Date</SelectItem>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="category">Category</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-full md:w-48">
          <Select
            value={filters.sortOrder}
            onValueChange={(value) => handleFilterChange('sortOrder', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Ascending</SelectItem>
              <SelectItem value="desc">Descending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Feedback Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="w-48 cursor-pointer"
                  onClick={() => handleSort('title')}
                >
                  <div className="flex items-center">
                    Title {getSortIcon('title')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('category')}
                >
                  <div className="flex items-center">
                    Category {getSortIcon('category')}
                  </div>
                </TableHead>
                <TableHead>From</TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    Status {getSortIcon('status')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center">
                    Date {getSortIcon('createdAt')}
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : !feedbacks || feedbacks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    No feedback found
                  </TableCell>
                </TableRow>
              ) : (
                feedbacks.map((feedback) => (
                  <TableRow key={feedback._id}>
                    <TableCell className="font-medium">{feedback.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <span className="mr-1">{categoryIcons[feedback.category as keyof typeof categoryIcons]}</span>
                        <span className="capitalize">{feedback.category}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {feedback.username || 'Anonymous'}
                      {feedback.email && (
                        <div className="text-xs text-muted-foreground flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {feedback.email}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={
                          statusColors[feedback.status as keyof typeof statusColors]
                        }
                      >
                        {feedback.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(feedback.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openViewDialog(feedback)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        
                        {feedback.adminResponse ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openResponseDialog(feedback)}
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Edit Response
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openResponseDialog(feedback)}
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Respond
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleStatusChange(feedback, 'new')}>
                              Mark as New
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(feedback, 'in-review')}>
                              Mark In Review
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(feedback, 'planned')}>
                              Mark as Planned
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(feedback, 'completed')}>
                              Mark as Completed
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(feedback, 'rejected')}>
                              Mark as Rejected
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteFeedback(feedback._id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="mt-4 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (filters.page > 1) {
                      handleFilterChange('page', filters.page - 1);
                    }
                  }}
                  className={filters.page <= 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                // Logic to show pagination numbers around current page
                let pageNum = i + 1;
                if (pagination.pages > 5) {
                  if (filters.page > 3 && filters.page < pagination.pages - 1) {
                    pageNum = filters.page - 2 + i;
                  } else if (filters.page >= pagination.pages - 1) {
                    pageNum = pagination.pages - 4 + i;
                  }
                }
                
                return pageNum <= pagination.pages ? (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleFilterChange('page', pageNum);
                      }}
                      isActive={filters.page === pageNum}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                ) : null;
              })}
              
              {pagination.pages > 5 && filters.page < pagination.pages - 2 && (
                <>
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleFilterChange('page', pagination.pages);
                      }}
                    >
                      {pagination.pages}
                    </PaginationLink>
                  </PaginationItem>
                </>
              )}
              
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (filters.page < pagination.pages) {
                      handleFilterChange('page', filters.page + 1);
                    }
                  }}
                  className={
                    filters.page >= pagination.pages ? 'pointer-events-none opacity-50' : ''
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Response Dialog */}
      <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Respond to Feedback</DialogTitle>
            <DialogDescription>
              {selectedFeedback?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-4">
            <div className="bg-muted p-4 rounded-md">
              <div className="font-medium mb-1">User Feedback:</div>
              <p className="whitespace-pre-wrap">{selectedFeedback?.message}</p>
              <div className="flex justify-between items-center mt-2 text-sm text-muted-foreground">
                <span>From: {selectedFeedback?.username || 'Anonymous'}</span>
                <span>{selectedFeedback?.createdAt && formatDate(selectedFeedback.createdAt)}</span>
              </div>
            </div>
            
            <div>
              <label htmlFor="response" className="block font-medium mb-1">
                Your Response
              </label>
              <Textarea
                id="response"
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Type your response here..."
                rows={5}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResponseDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleResponseSubmit}>
              Save Response
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Feedback Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Feedback Details</DialogTitle>
            <DialogDescription>
              Complete information about this feedback
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-4">
            {selectedFeedback && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-1">Title</h3>
                    <p className="text-base">{selectedFeedback.title}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-semibold mb-1">Category</h3>
                    <div className="flex items-center">
                      <span className="mr-1">{categoryIcons[selectedFeedback.category as keyof typeof categoryIcons]}</span>
                      <span className="capitalize">{selectedFeedback.category}</span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-semibold mb-1">Status</h3>
                    <Badge 
                      className={
                        statusColors[selectedFeedback.status as keyof typeof statusColors]
                      }
                    >
                      {selectedFeedback.status}
                    </Badge>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-semibold mb-1">Submitted</h3>
                    <p>{formatDate(selectedFeedback.createdAt)}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-semibold mb-1">From</h3>
                    <p>{selectedFeedback.username || 'Anonymous'}</p>
                  </div>
                  
                  {selectedFeedback.email && (
                    <div>
                      <h3 className="text-sm font-semibold mb-1">Email</h3>
                      <div className="flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        <p>{selectedFeedback.email}</p>
                      </div>
                    </div>
                  )}
                  
                  {selectedFeedback.rating !== undefined && selectedFeedback.rating > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-1">Rating</h3>
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-4 w-4 ${
                              star <= selectedFeedback.rating!
                                ? 'text-yellow-400'
                                : 'text-gray-300'
                            }`}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold mb-1">Message</h3>
                  <div className="bg-muted p-4 rounded-md">
                    <p className="whitespace-pre-wrap">{selectedFeedback.message}</p>
                  </div>
                </div>
                
                {selectedFeedback.adminResponse && (
                  <div>
                    <h3 className="text-sm font-semibold mb-1">Admin Response</h3>
                    <div className="bg-muted/50 p-4 rounded-md border">
                      <p className="whitespace-pre-wrap">{selectedFeedback.adminResponse}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Last updated: {formatDate(selectedFeedback.updatedAt)}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          
          <DialogFooter>
            <div className="flex w-full justify-between">
              <Button 
                variant="outline" 
                onClick={() => setViewDialogOpen(false)}
              >
                Close
              </Button>
              
              <div className="space-x-2">
                {selectedFeedback && !selectedFeedback.adminResponse && (
                  <Button 
                    onClick={() => {
                      setViewDialogOpen(false);
                      openResponseDialog(selectedFeedback);
                    }}
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Respond
                  </Button>
                )}
                
                {selectedFeedback && selectedFeedback.adminResponse && (
                  <Button 
                    onClick={() => {
                      setViewDialogOpen(false);
                      openResponseDialog(selectedFeedback);
                    }}
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Edit Response
                  </Button>
                )}
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFeedback; 