import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  AlertTriangle, Upload, Download, File, Trash2, ClipboardIcon, 
  ArrowRight, Clock, CheckCircle2, Link as LinkIcon, Share2, MessageSquare
} from 'lucide-react';
import { useToast } from '../components/ui/use-toast';
import CopyButton from '../components/CopyButton';
import Timer from '../components/Timer';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Spinner } from '../components/common/Spinner';
import { Skeleton } from '../components/ui/skeleton';
import { cn } from '../lib/utils';

// Define file data type
interface FileData {
  id: string;
  name: string;
  type: string;
  size: number;
  data: string;
  expiresAt: Date;
  downloaded: boolean;
  delete_after_download?: boolean;
  short_code?: string;
}

// Add helper functions for formatting
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatTimeRemaining = (expiryDate: Date): string => {
  const now = new Date();
  const diffMs = expiryDate.getTime() - now.getTime();
  
  if (diffMs <= 0) {
    return 'Expired';
  }
  
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffHours > 24) {
    const days = Math.floor(diffHours / 24);
    return `in ${days} day${days !== 1 ? 's' : ''}`;
  } else if (diffHours > 0) {
    return `in ${diffHours}h ${diffMinutes}m`;
  } else {
    return `in ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
  }
};

// File type icon mapping
const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) {
    return <File className="h-6 w-6 text-primary" />;
  } else if (fileType.startsWith('video/')) {
    return <File className="h-6 w-6 text-cyan-500" />;
  } else if (fileType.startsWith('audio/')) {
    return <File className="h-6 w-6 text-purple-500" />;
  } else if (fileType.includes('pdf')) {
    return <File className="h-6 w-6 text-red-500" />;
  } else if (fileType.includes('word') || fileType.includes('document')) {
    return <File className="h-6 w-6 text-blue-500" />;
  } else if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
    return <File className="h-6 w-6 text-green-500" />;
  } else {
    return <File className="h-6 w-6 text-primary" />;
  }
};

const FileShare = () => {
  const { fileId, shortCode } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [expiry, setExpiry] = useState('2h');
  const [isLoading, setIsLoading] = useState(false);
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [deleteAfterDownload, setDeleteAfterDownload] = useState(false);
  const [inputShortCode, setInputShortCode] = useState('');
  const [accessLoading, setAccessLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileShareUrl, setFileShareUrl] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // For viewing a shared file
  useEffect(() => {
    if (fileId || shortCode) {
      const fetchFile = async () => {
        setAccessLoading(true);
        setErrorMessage(null);
        try {
          // Use the fileId or shortCode, depending on which is available
          const id = shortCode || fileId;
          if (!id) return;
          
          console.log(`Attempting to fetch file with identifier: ${id}`);
          const fileData = await api.getFile(id);
          console.log('File data received:', fileData);
          
          if (!fileData || !fileData.id) {
            throw new Error('Invalid file data received');
          }
          
          setFileData({
            id: fileData.id,
            name: fileData.name,
            type: fileData.type,
            size: fileData.size,
            data: fileData.data,
            expiresAt: new Date(fileData.expires_at),
            downloaded: fileData.downloaded,
            delete_after_download: fileData.delete_after_download,
            short_code: fileData.short_code
          });
          
          // Generate share URL for copying
          const shareUrl = fileData.short_code 
            ? `${window.location.origin}/f/${fileData.short_code}`
            : `${window.location.origin}/share/${fileData.id}`;
          setFileShareUrl(shareUrl);
          
          // Warning if this is a one-time downloadable file
          if (fileData.delete_after_download && !fileData.downloaded) {
            toast({
              title: "Warning",
              description: "This file will be deleted after downloading",
              variant: "destructive",
            });
          }
        } catch (err) {
          console.error('Error fetching file:', err);
          setErrorMessage(err instanceof Error ? err.message : "Failed to load file data");
          toast({
            title: "Error",
            description: err instanceof Error ? err.message : "Failed to load file data",
            variant: "destructive",
          });
        } finally {
          setAccessLoading(false);
          setInitialLoading(false);
        }
      };

      fetchFile();
    } else {
      setInitialLoading(false);
    }
  }, [fileId, shortCode, toast, navigate]);

  // Handle accessing a file by short code
  const handleAccessByShortCode = () => {
    let code = inputShortCode.trim();
    
    if (!code) {
      toast({
        title: "Error",
        description: "Please enter a valid short code",
        variant: "destructive",
      });
      return;
    }
    
    // Add "F-" prefix if needed (for backward compatibility)
    if (code.length >= 7 && !code.includes('-')) {
      code = `F-${code}`;
    }
    
    console.log(`Accessing file with code: ${code}`);
    setAccessLoading(true);
    navigate(`/f/${code}`);
  };

  // Handle file download
  const handleDownload = async () => {
    if (!fileData) return;
    
    try {
      setIsLoading(true);
      
      // Mark the file as downloaded first
      if (fileId || shortCode) {
        const id = shortCode || fileId;
        if (id) {
          console.log(`Marking file as downloaded: ${id}`);
          await api.markFileDownloaded(id);
        }
      }
      
      // Process the data URL
      const dataUrl = fileData.data;
      if (!dataUrl || !dataUrl.startsWith('data:')) {
        toast({
          title: 'Download Error',
          description: 'Invalid file data format',
          variant: 'destructive',
        });
        return;
      }
      
      // Create a blob from the data URL
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileData.name;
      
      // Trigger download
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Success',
        description: 'File downloaded successfully',
      });
      
      if (fileData.delete_after_download) {
        setFileData(prev => prev ? {...prev, downloaded: true} : null);
        toast({
          title: 'File Deleted',
          description: 'This file has been deleted after download',
        });
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: 'Download Error',
        description: error instanceof Error ? error.message : 'Failed to download file',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Handle drag and drop events
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Check file size (12MB limit)
      const droppedFile = e.dataTransfer.files[0];
      const MAX_FILE_SIZE = 12 * 1024 * 1024;
      
      if (droppedFile.size > MAX_FILE_SIZE) {
        toast({
          title: 'Error',
          description: `File too large (12MB maximum)`,
          variant: 'destructive',
        });
        return;
      }
      
      setFile(droppedFile);
    }
  }, [toast]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast({
        title: 'Error',
        description: 'Please select a file',
        variant: 'destructive',
      });
      return;
    }
    
    // Check file size (12MB limit)
    const MAX_FILE_SIZE = 12 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'Error',
        description: `File too large (12MB maximum)`,
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Get the user ID if logged in (for profile syncing)
      const userId = user?.id || null;
      console.log(`Uploading file with user ID: ${userId || 'none (anonymous)'}`);
      
      const result = await api.uploadFile(file, expiry, deleteAfterDownload, userId);
      
      // Generate share URL
      const shareUrl = result.short_code 
        ? `${window.location.origin}/f/${result.short_code}`
        : `${window.location.origin}/share/${result.id}`;
      
      // Reset form
      setFile(null);
      setExpiry('2h');
      setDeleteAfterDownload(false);
      
      // Show success message with copy button and short code
      toast({
        title: 'Success',
        description: (
          <div className="flex flex-col gap-2">
            <p>File uploaded successfully!</p>
            
            {/* File Share URL */}
            <div className="mt-2">
              <label className="text-xs font-medium mb-1 block">Share Link:</label>
              <div className="flex items-center gap-2">
                <Input 
                  readOnly 
                  value={shareUrl}
                  className="text-xs"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    toast({
                      title: 'Copied',
                      description: 'Link copied to clipboard',
                    });
                  }}
                >
                  <ClipboardIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* File Access Code */}
            {result.short_code && (
              <div className="mt-2">
                <label className="text-xs font-medium mb-1 block">Access Code:</label>
                <div className="flex items-center">
                  <code className="bg-black/30 px-3 py-2 rounded font-mono text-sm flex-1">
                    {result.short_code}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-2"
                    onClick={() => {
                      navigator.clipboard.writeText(result.short_code);
                      toast({
                        title: 'Copied',
                        description: 'Access code copied to clipboard',
                      });
                    }}
                  >
                    <ClipboardIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ),
        duration: 15000,
      });
      
      // Navigate to the file page
      if (result.short_code) {
        navigate(`/f/${result.short_code}`);
      } else {
        navigate(`/share/${result.id}`);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Upload Error',
        description: 'Failed to upload file',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add a function to test different formats of the code
  const tryAccessWithVariants = async (originalCode: string) => {
    const variants = [
      originalCode,
      `F-${originalCode}`,
      originalCode.replace('F-', ''),
      originalCode.toUpperCase(),
      originalCode.toLowerCase()
    ];
    
    setAccessLoading(true);
    console.log('Trying the following code variants:', variants);
    
    for (const variant of variants) {
      try {
        console.log(`Attempting variant: ${variant}`);
        const fileData = await api.getFile(variant);
        if (fileData && fileData.id) {
          console.log('Success with variant:', variant);
          toast({
            title: 'Access successful',
            description: 'File found with variant code format',
          });
          
          // Redirect to the correct format
          navigate(`/f/${fileData.short_code || variant}`);
          return true;
        }
      } catch (err) {
        console.log(`Failed with variant: ${variant}`, err);
      }
    }
    
    setAccessLoading(false);
    toast({
      title: 'Access Failed',
      description: 'Could not find a file with any variation of the code',
      variant: 'destructive',
    });
    return false;
  };

  // Share the file using the Web Share API if available
  const handleShareFile = () => {
    if (!fileShareUrl) return;
    
    if (navigator.share) {
      navigator.share({
        title: `Shared File: ${fileData?.name || 'Shared File'}`,
        text: `Access this shared file: ${fileData?.name || 'Click the link to access the shared file'}`,
        url: fileShareUrl
      }).catch(err => {
        console.error('Error sharing:', err);
        // Fallback to clipboard if share fails
        navigator.clipboard.writeText(fileShareUrl);
        toast({
          title: 'Copied to clipboard',
          description: 'Link copied to clipboard instead',
        });
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(fileShareUrl);
      toast({
        title: 'Copied to clipboard',
        description: 'Link copied to clipboard',
      });
    }
  };

  // Rendering loading skeleton
  const renderSkeleton = () => {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-80" />
        </div>

        <Card className="mb-8 overflow-hidden border-border">
          <CardHeader className="pb-3 bg-dark-lighter border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Skeleton className="h-7 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-14 w-28 rounded-md" />
            </div>
          </CardHeader>
          <CardContent className="py-6">
            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-6 w-32" />
              </div>
              
              <div className="flex flex-col gap-3">
                <Skeleton className="h-5 w-24" />
                <div className="flex gap-2 flex-wrap">
                  <Skeleton className="h-10 w-36 rounded-md" />
                  <Skeleton className="h-10 w-28 rounded-md" />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-dark-lighter border-t border-border py-4">
            <div className="w-full flex justify-between items-center">
              <Skeleton className="h-9 w-32 rounded-md" />
              <Skeleton className="h-6 w-20" />
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  };

  // Rendering logic
  const renderFileViewPage = () => {
    if (initialLoading) {
      return renderSkeleton();
    }
    
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 gradient-text">File Sharing</h1>
          <p className="text-muted-foreground">Securely share files with end-to-end encryption</p>
        </div>

        {accessLoading ? (
          <div className="rounded-lg border border-border bg-dark-lighter p-8 flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
            <h2 className="text-2xl font-semibold mb-2">Loading File...</h2>
            <p className="text-muted-foreground">Please wait while we retrieve your file</p>
          </div>
        ) : fileData ? (
          <Card className="mb-8 overflow-hidden border-border animate-fade-in">
            <CardHeader className="pb-3 bg-dark-lighter border-b border-border">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-xl md:text-2xl flex items-center gap-2 break-all">
                    {getFileIcon(fileData.type)}
                    {fileData.name}
                  </CardTitle>
                  <CardDescription>
                    {fileData.type} • {formatBytes(fileData.size)}
                  </CardDescription>
                </div>
                {fileData.short_code && (
                  <div className="bg-primary/10 px-4 py-3 rounded-md border border-primary/20 flex-shrink-0">
                    <p className="text-xs text-muted-foreground mb-1">Access Code:</p>
                    <div className="flex items-center gap-2">
                      <code className="font-mono font-medium text-sm">{fileData.short_code}</code>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => {
                          navigator.clipboard.writeText(fileData.short_code || '');
                          toast({
                            title: 'Copied',
                            description: 'Access code copied to clipboard',
                          });
                        }}
                        aria-label="Copy access code"
                      >
                        <ClipboardIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="py-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-3 p-4 bg-dark-lighter rounded-lg border border-border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        Expires {formatTimeRemaining(fileData.expiresAt)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className={`h-4 w-4 ${fileData.downloaded ? 'text-green-500' : 'text-muted-foreground'}`} />
                      <span className={fileData.downloaded ? 'text-green-500' : 'text-muted-foreground'}>
                        {fileData.downloaded ? 'Downloaded' : 'Not yet downloaded'}
                      </span>
                    </div>
                    
                    {fileData.delete_after_download && (
                      <Badge variant="destructive" className="w-fit">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Deletes after download
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 p-4 bg-dark-lighter rounded-lg border border-border">
                    <h3 className="text-sm font-medium">Share Options</h3>
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="gap-1"
                        onClick={() => {
                          if (fileShareUrl) {
                            navigator.clipboard.writeText(fileShareUrl);
                            toast({
                              title: 'Copied',
                              description: 'File link copied to clipboard',
                            });
                          }
                        }}
                        aria-label="Copy file link"
                      >
                        <LinkIcon className="h-3 w-3" />
                        <span className="hidden sm:inline">Copy Link</span>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="gap-1"
                        onClick={handleShareFile}
                        aria-label="Share file"
                      >
                        <Share2 className="h-3 w-3" />
                        <span className="hidden sm:inline">Share</span>
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-3">
                  <h3 className="text-sm font-medium">File Actions</h3>
                  
                  <div className="flex gap-2 flex-wrap">
                    <Button 
                      className="gap-2 w-full sm:w-auto" 
                      size="lg"
                      onClick={handleDownload}
                      disabled={isLoading || (fileData.downloaded && fileData.delete_after_download)}
                      aria-label="Download file"
                    >
                      {isLoading ? (
                        <>
                          <Spinner className="mr-2" size="sm" />
                          <span>Downloading...</span>
                        </>
                      ) : (
                        <>
                          <Download className="h-5 w-5" />
                          <span>Download File</span>
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="gap-2 w-full sm:w-auto"
                      onClick={handleShareFile}
                      aria-label="Share file"
                    >
                      <Share2 className="h-4 w-4" />
                      <span>Share File</span>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-dark-lighter border-t border-border py-4 flex-col sm:flex-row gap-3">
              <div className="w-full flex justify-between items-center">
                <Button variant="outline" asChild aria-label="Upload another file">
                  <Link to="/fileshare">Share Another File</Link>
                </Button>
                <Timer expiryTime={fileData.expiresAt} onExpire={() => navigate('/fileshare')} />
              </div>
            </CardFooter>
          </Card>
        ) : (
          <div className="rounded-lg border border-red-500 bg-red-950/20 p-8 mb-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start">
              <AlertTriangle className="h-6 w-6 text-red-500 mr-3 mt-0.5 mb-3 sm:mb-0" />
              <div>
                <h3 className="text-xl font-semibold text-red-400 mb-2">File Not Available</h3>
                <p className="text-muted-foreground mb-4">
                  {errorMessage || "This file may have expired, been deleted, or the access code is incorrect."}
                </p>
                <Button variant="outline" onClick={() => navigate('/fileshare')}>
                  Upload a New File
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderUploadPage = () => {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl animate-fade-in">
        <h1 className="text-3xl font-bold mb-4 gradient-text">Secure File Share</h1>
        <p className="text-muted-foreground mb-6">Upload and share files securely with automatic expiration</p>
        
        {/* File Access Section */}
        <div className="mb-6 p-6 bg-dark-lighter rounded-md border border-border">
          <h2 className="text-lg font-medium mb-3">Access by File Code</h2>
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <Input
              placeholder="Enter file code (e.g. 6828339 or F-6828339)"
              value={inputShortCode}
              onChange={(e) => setInputShortCode(e.target.value)}
              className="flex-1"
              aria-label="File access code"
            />
            <Button 
              onClick={handleAccessByShortCode} 
              disabled={accessLoading || !inputShortCode.trim()}
              className="sm:flex-shrink-0"
              aria-label="Access file"
            >
              {accessLoading ? <Spinner size="sm" className="mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
              Access
            </Button>
          </div>
          
          {inputShortCode.trim() && (
            <div className="mt-2">
              <p className="text-sm text-muted-foreground mb-2">Having trouble accessing the file?</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => tryAccessWithVariants(inputShortCode.trim())}
                disabled={accessLoading}
                aria-label="Try alternative code formats"
              >
                Try Alternative Formats
              </Button>
            </div>
          )}
        </div>
        
        <div className="mb-4 p-3 bg-dark-lighter rounded-md border border-border flex items-center text-sm">
          <div className="mr-2 p-1 rounded-full bg-primary/20 text-primary">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <span>
            {user ? 'Your files will be saved to your profile' : 'Sign in to track your files in your profile'}
          </span>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Upload File</label>
            <div 
              ref={dropZoneRef}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200",
                isDragging 
                  ? "border-primary bg-primary/5 scale-[1.01]" 
                  : file 
                    ? "border-primary/50 bg-primary/5 hover:border-primary hover:bg-primary/10" 
                    : "border-border hover:border-primary/50 hover:bg-dark-lighter",
                "cursor-pointer"
              )}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              aria-label="Drop zone for file upload"
            >
              {file ? (
                <div className="flex items-center justify-center flex-col">
                  <File className="h-12 w-12 text-primary mb-4" />
                  <h3 className="text-lg font-medium mb-1">{file.name}</h3>
                  <p className="text-sm text-muted-foreground">{((file.size / 1024).toFixed(2))} KB</p>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="mt-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    aria-label="Remove selected file"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Upload className={cn(
                    "h-12 w-12 mb-4 transition-colors",
                    isDragging ? "text-primary" : "text-muted-foreground"
                  )} />
                  <h3 className="text-lg font-medium mb-1">
                    {isDragging ? "Drop to upload" : "Drag & drop a file or click to browse"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">Max file size: 12MB</p>
                  <Button type="button" variant="outline">
                    Select File
                  </Button>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                aria-hidden="true"
              />
            </div>
          </div>
          
          {/* Expiry and Delete Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" htmlFor="expiry-select">
                Expiration Time
              </label>
              <Select value={expiry} onValueChange={setExpiry} name="expiry">
                <SelectTrigger className="bg-dark-lighter border-border" id="expiry-select">
                  <SelectValue placeholder="Select expiration time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="download">Delete after download</SelectItem>
                  <SelectItem value="1h">1 hour</SelectItem>
                  <SelectItem value="2h">2 hours</SelectItem>
                  <SelectItem value="12h">12 hours</SelectItem>
                  <SelectItem value="24h">24 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2" htmlFor="delete-select">
                Delete After Download
              </label>
              <Select 
                value={deleteAfterDownload ? "yes" : "no"} 
                onValueChange={(value) => setDeleteAfterDownload(value === "yes")}
                disabled={expiry === "download"}
                name="delete-after-download"
              >
                <SelectTrigger className="bg-dark-lighter border-border" id="delete-select">
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button 
            type="submit" 
            disabled={!file || isLoading} 
            className="bg-primary hover:bg-primary/80 text-white w-full"
            aria-label="Upload and share file"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Spinner className="mr-2" size="sm" />
                <span>Uploading...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                <span>Upload & Share File</span>
              </div>
            )}
          </Button>
        </form>
        
        <div className="mt-8 p-4 border border-border rounded-lg bg-dark-lighter">
          <h3 className="text-lg font-semibold mb-2">How it works</h3>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>Upload the file you want to share</li>
            <li>Choose when the file should expire</li>
            <li>Share the generated link with the recipient</li>
            <li>Use the short code link for easier sharing</li>
            <li>Once downloaded or expired, the file is permanently deleted</li>
          </ul>
        </div>
        
        {/* Feedback Section */}
        <div className="mt-8 flex flex-col items-center border-t border-border pt-8">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold mb-1">How can we improve?</h3>
            <p className="text-sm text-muted-foreground">
              We'd love to hear your thoughts on our file sharing service
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/feedback" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Send Feedback
            </Link>
          </Button>
        </div>
      </div>
    );
  };

  // Main return
  if (fileId || shortCode) {
    return renderFileViewPage();
  } else {
    return renderUploadPage();
  }
};

export default FileShare;
