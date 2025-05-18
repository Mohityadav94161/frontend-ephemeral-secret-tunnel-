import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '@/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/common/Spinner';
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
  Download,
  Eye,
  File,
  RefreshCw,
  Search,
  Trash2,
  ExternalLink,
  Clipboard
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from "@/components/ui/use-toast";

import { getAdminAuthHeader, checkAdminAuth } from '@/utils/adminAuth';

// File interface
interface FileData {
  id: string;
  filename: string;
  original_filename: string;
  short_code: string;
  size: number;
  mime_type: string;
  downloads: number;
  expires_at: string;
  created_at: string;
  created_by?: string;
  is_public: boolean;
  data?: string;
}

// Backend file interface
interface BackendFileData {
  id?: string;
  _id?: string;
  name?: string;
  short_code?: string;
  size?: number;
  type?: string;
  downloaded?: boolean;
  expires_at?: string;
  expiresAt?: string;
  created_at?: string;
  createdAt?: string;
  user_id?: string;
  userId?: string;
  data?: string;
}

// Pagination interface
interface Pagination {
  page: number;
  limit: number;
  pages: number;
  total: number;
}

const AdminFiles = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<FileData[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    pages: 1,
    total: 0
  });
  const [filter, setFilter] = useState<'all' | 'public' | 'private'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Check admin authentication on component mount
  useEffect(() => {
    checkAdminAuth(navigate);
  }, [navigate]);

  useEffect(() => {
    fetchFiles();
  }, [pagination.page, filter]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/admin/files?page=${pagination.page}&limit=${pagination.limit}&visibility=${filter}${searchQuery ? `&search=${searchQuery}` : ''}`,
        {
          headers: {
            'Authorization': getAdminAuthHeader()
          }
        }
      );
      
      if (response.data) {
        // Transform backend data to match our frontend model
        const transformedFiles: FileData[] = response.data.files.map((file: BackendFileData) => ({
          id: file.id || file._id || '',
          filename: file.name || '',
          original_filename: file.name || '',
          short_code: file.short_code || generateShortCode(file.id || file._id || ''),
          size: file.size || 0,
          mime_type: file.type || '',
          downloads: file.downloaded ? 1 : 0,
          expires_at: file.expires_at || file.expiresAt || '',
          created_at: file.created_at || file.createdAt || '',
          created_by: file.user_id || file.userId,
          is_public: true, // Default to public since we don't have this info
          data: file.data
        }));
        
        setFiles(transformedFiles);
        setPagination({
          ...pagination,
          pages: response.data.pagination.pages,
          total: response.data.total
        });
      }
    } catch (err) {
      console.error('Error fetching files:', err);
      setError('Failed to load files. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination({
      ...pagination,
      page: 1
    });
    fetchFiles();
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.pages) return;
    setPagination({
      ...pagination,
      page: newPage
    });
  };

  const handleFilterChange = (value: string) => {
    setFilter(value as 'all' | 'public' | 'private');
    setPagination({
      ...pagination,
      page: 1
    });
  };

  const handleViewFile = (fileId: string) => {
    setSelectedFile(files.find(f => f.id === fileId) || null);
    setIsModalOpen(true);
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) {
      return;
    }
    
    try {
      setLoading(true);
      await axios.delete(`${API_URL}/admin/files/${fileId}`, {
        headers: {
          'Authorization': getAdminAuthHeader()
        }
      });
      
      // Remove the file from the list
      setFiles(files.filter(f => f.id !== fileId));
      
      // Close modal if the deleted file was being viewed
      if (selectedFile?.id === fileId) {
        setIsModalOpen(false);
      }
      
      toast({
        title: "File deleted",
        description: "The file has been permanently deleted.",
      });
    } catch (err) {
      console.error('Error deleting file:', err);
      setError('Failed to delete file. Please try again.');
      
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadFile = async (file: FileData) => {
    try {
      setLoading(true);
      
      // Use the short code if available, otherwise use the file ID
      const fileIdentifier = file.short_code || file.id;
      const isObjectId = isValidObjectId(fileIdentifier);
      
      console.log(`Downloading file with ${isObjectId ? 'ID' : 'short code'}: ${fileIdentifier}`);
      
      // First mark the file as downloaded
      await axios.post(
        isObjectId 
          ? `${API_URL}/file/${fileIdentifier}/download`
          : `${API_URL}/file/code/${fileIdentifier}/download`,
        { downloader_id: 'admin' },
        { headers: { 'Authorization': getAdminAuthHeader() } }
      );
      
      // Fetch the file data if not already present
      let fileData = file.data;
      
      if (!fileData) {
        const response = await axios.get(
          isObjectId
            ? `${API_URL}/admin/files/${file.id}`
            : `${API_URL}/file/code/${file.short_code}`,
          { headers: { 'Authorization': getAdminAuthHeader() } }
        );
        
        if (response.data && response.data.data) {
          fileData = response.data.data;
        } else {
          throw new Error('File data not available');
        }
      }
      
      // Process the data URL
      if (!fileData || typeof fileData !== 'string' || !fileData.startsWith('data:')) {
        throw new Error('Invalid file data format');
      }
      
      // Create a blob from the data URL
      const response = await fetch(fileData);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = file.original_filename || 'download';
      
      // Trigger download
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // Update UI to show file as downloaded
      setFiles(
        files.map(f => 
          f.id === file.id 
            ? { ...f, downloads: f.downloads + 1 } 
            : f
        )
      );
      
      toast({
        title: "Download successful",
        description: `File "${file.original_filename}" has been downloaded.`,
      });
    } catch (err) {
      console.error('Error downloading file:', err);
      setError('Failed to download file. Please try again.');
      
      toast({
        title: "Download failed",
        description: err instanceof Error ? err.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (err) {
      return 'Invalid date';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Add proper validation for ObjectId and short codes
  const isValidObjectId = (id: string): boolean => {
    return /^[0-9a-f]{24}$/i.test(id);
  };

  // Generate a short code for display when one isn't available
  const generateShortCode = (id: string): string => {
    if (!id) return 'N/A';
    return id.substring(0, 8).toUpperCase();
  };

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
          <Button onClick={fetchFiles} className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto p-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Manage Files</CardTitle>
              <CardDescription>View and manage all files on the platform</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/admin')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="flex gap-2">
                <Input
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="max-w-sm"
                />
                <Button variant="outline" onClick={handleSearch}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filter} onValueChange={handleFilterChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Files</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={fetchFiles}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : (
            <>
              {/* Files Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Filename</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Visibility</TableHead>
                      <TableHead>Downloads</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {files.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
                          No files found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      files.map((file) => (
                        <TableRow key={file.id}>
                          <TableCell className="font-medium">
                            {file.original_filename}
                          </TableCell>
                          <TableCell>{file.short_code}</TableCell>
                          <TableCell>{file.mime_type}</TableCell>
                          <TableCell>{formatFileSize(file.size)}</TableCell>
                          <TableCell>
                            {file.is_public ? (
                              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Public</Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">Private</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Download className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span>{file.downloads}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span title={formatDate(file.expires_at)}>
                                {new Date(file.expires_at).toLocaleDateString()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewFile(file.id)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(`/fileshare/${file.short_code}`, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadFile(file)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => handleDeleteFile(file.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {files.length} of {pagination.total} files
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.pages}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* File Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl">
          {selectedFile && (
            <>
              <DialogHeader>
                <DialogTitle>File Details</DialogTitle>
                <DialogDescription>
                  Created: {formatDate(selectedFile.created_at)} | 
                  Expires: {selectedFile.expires_at ? formatDate(selectedFile.expires_at) : 'Never'}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4">
                <div className="mb-4 p-3 bg-muted/20 rounded-md border border-muted">
                  <h3 className="font-semibold mb-2">Share Information:</h3>
                  
                  {/* Share Code */}
                  <div className="mb-3">
                    <label className="text-sm text-muted-foreground mb-1 block">Access Code:</label>
                    <div className="flex items-center justify-between">
                      <code className="bg-black/30 px-3 py-2 rounded font-mono text-lg">
                        {selectedFile.short_code || 'N/A'}
                      </code>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedFile.short_code);
                          toast({
                            title: 'Copied',
                            description: 'Access code copied to clipboard',
                          });
                        }}
                      >
                        <Clipboard className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                    </div>
                  </div>
                  
                  {/* Share URL */}
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Share URL:</label>
                    <div className="flex items-center justify-between">
                      <Input 
                        value={`${window.location.origin}/f/${selectedFile.short_code}`}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="ml-2"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/f/${selectedFile.short_code}`);
                          toast({
                            title: 'Copied',
                            description: 'Share URL copied to clipboard',
                          });
                        }}
                      >
                        <Clipboard className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                    </div>
                  </div>
                </div>
                
                <h3 className="font-medium mb-2">File Information:</h3>
                <ul className="space-y-2">
                  <li><span className="font-medium">File ID:</span> {selectedFile.id}</li>
                  <li><span className="font-medium">Name:</span> {selectedFile.original_filename}</li>
                  <li><span className="font-medium">Type:</span> {selectedFile.mime_type}</li>
                  <li><span className="font-medium">Size:</span> {formatFileSize(selectedFile.size)}</li>
                  <li><span className="font-medium">Visibility:</span> {selectedFile.is_public ? 'Public' : 'Private'}</li>
                  <li><span className="font-medium">Downloads:</span> {selectedFile.downloads}</li>
                  <li><span className="font-medium">Expires at:</span> {selectedFile.expires_at ? formatDate(selectedFile.expires_at) : 'Never'}</li>
                </ul>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => window.open(`/fileshare/${selectedFile.short_code}`, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View File
                </Button>
                <Button 
                  variant="default" 
                  onClick={() => handleDownloadFile(selectedFile)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download File
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    handleDeleteFile(selectedFile.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete File
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFiles; 