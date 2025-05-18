import { useState, useEffect } from 'react';
import { API_URL } from '@/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/common/Spinner';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  LineChart,
  BarChart,
  PieChart,
  Pie,
  Line,
  XAxis,
  YAxis,
  Legend,
  CartesianGrid,
  Tooltip,
  Bar,
  Cell
} from 'recharts';
import {
  ArrowLeftRight,
  BarChart2,
  Clock,
  Database,
  Download,
  Eye,
  FileText,
  MessageSquare,
  Users,
  LogOut,
  MessageCircle,
  Settings as SettingsIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { getAdminAuthHeader, checkAdminAuth, logoutAdmin, getAdminUsername } from '@/utils/adminAuth';

// Stats interface
interface DashboardStats {
  users: number;
  chats: {
    total: number;
    active: number;
  };
  pastes: {
    total: number;
    viewed: number;
  };
  files: {
    total: number;
    downloaded: number;
  };
  messages: number;
  footprints: number;
  feedback?: number;
}

// Footprint interface
interface Footprint {
  _id: string;
  ipAddress: string;
  path: string;
  method: string;
  referer: string;
  browserInfo: {
    browser: string;
    os: string;
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
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

// Chart data interfaces
interface ChartData {
  name: string;
  value: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [footprints, setFootprints] = useState<Footprint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Check if user is authenticated as admin
  useEffect(() => {
    const checkAuth = () => {
      // Only perform check if we're not already in an error state
      if (!error) {
        const isAuth = checkAdminAuth(navigate);
        if (!isAuth) {
          setError('Authentication required');
        }
      }
    };
    
    checkAuth();
    
    // Check for valid auth token by attempting to fetch stats
    const validateAuth = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/admin/stats`, {
          headers: {
            'Authorization': getAdminAuthHeader()
          }
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            setError('Authentication failed. Please log in again.');
            // Avoid immediately redirecting to prevent loops
            setTimeout(() => {
              logoutAdmin();
              navigate('/admin/login');
            }, 2000);
          }
        }
      } catch (err) {
        console.error('Auth validation error:', err);
      }
    };
    
    validateAuth();
  }, [navigate, error]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    pages: 1,
    total: 0
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [browserStats, setBrowserStats] = useState<ChartData[]>([]);
  const [osStats, setOsStats] = useState<ChartData[]>([]);
  const [deviceStats, setDeviceStats] = useState<ChartData[]>([]);

  // Random colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

  useEffect(() => {
    // Fetch dashboard stats
    fetchDashboardStats();
    
    // Fetch footprint data if on analytics tab
    if (activeTab === 'analytics') {
      fetchFootprints();
    }
  }, [activeTab, pagination.page]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/admin/stats`, {
        headers: {
          'Authorization': getAdminAuthHeader()
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication failed. Please check your credentials.');
        } else {
          setError('Failed to fetch dashboard stats');
        }
        return;
      }
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError('Error connecting to server');
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFootprints = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/admin/analytics/footprints?page=${pagination.page}&limit=${pagination.limit}`, 
        {
          headers: {
            'Authorization': getAdminAuthHeader()
          }
        }
      );
      
      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication failed. Please check your credentials.');
        } else {
          setError('Failed to fetch footprint data');
        }
        return;
      }
      
      const data = await response.json();
      setFootprints(data.footprints);
      setPagination({
        ...pagination,
        pages: data.pagination.pages,
        total: data.total
      });
      
      // Set chart data
      if (data.stats) {
        setBrowserStats(data.stats.browsers.map((item: { _id: string; count: number }) => ({
          name: item._id || 'Unknown',
          value: item.count
        })));
        
        setOsStats(data.stats.os.map((item: { _id: string; count: number }) => ({
          name: item._id || 'Unknown',
          value: item.count
        })));
        
        setDeviceStats(data.stats.devices.map((item: { _id: string; count: number }) => ({
          name: item._id || 'Unknown',
          value: item.count
        })));
      }
    } catch (err) {
      setError('Error connecting to server');
      console.error('Error fetching footprints:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Reset pagination when changing tabs
    setPagination({
      ...pagination,
      page: 1
    });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.pages) return;
    setPagination({
      ...pagination,
      page: newPage
    });
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-3xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center">{error}</p>
            <div className="flex justify-center mt-4">
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle admin logout
  const handleLogout = () => {
    logoutAdmin();
    navigate('/admin/login');
  };

  return (
    <div className="container mx-auto p-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Logged in as: {getAdminUsername()}
          </span>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">User Analytics</TabsTrigger>
          <TabsTrigger value="content">Content Management</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview">
          {loading ? (
            <div className="flex justify-center my-12">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Users
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.users || 0}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Chats
                  </CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.chats.active || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    of {stats?.chats.total || 0} total chats
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Messages
                  </CardTitle>
                  <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.messages || 0}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Pastes
                  </CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.pastes.total || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.pastes.viewed || 0} viewed
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Files
                  </CardTitle>
                  <Download className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.files.total || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.files.downloaded || 0} downloaded
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    User Footprints
                  </CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.footprints || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    tracked activities
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    User Feedback
                  </CardTitle>
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.feedback || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    User suggestions and reports
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
        
        {/* Analytics Tab */}
        <TabsContent value="analytics">
          {loading ? (
            <div className="flex justify-center my-12">
              <Spinner size="lg" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Browser Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Browser Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <PieChart width={250} height={250}>
                      <Pie
                        dataKey="value"
                        data={browserStats}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {browserStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </CardContent>
                </Card>
                
                {/* OS Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>OS Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <PieChart width={250} height={250}>
                      <Pie
                        dataKey="value"
                        data={osStats}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {osStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </CardContent>
                </Card>
                
                {/* Device Type */}
                <Card>
                  <CardHeader>
                    <CardTitle>Device Types</CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <PieChart width={250} height={250}>
                      <Pie
                        dataKey="value"
                        data={deviceStats}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {deviceStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>User Footprints</CardTitle>
                  <CardDescription>
                    Recent user activity across the platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Path</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Device</TableHead>
                        <TableHead>Browser</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {footprints.map((footprint) => (
                        <TableRow key={footprint._id}>
                          <TableCell>
                            {new Date(footprint.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell>{footprint.ipAddress}</TableCell>
                          <TableCell>{footprint.path}</TableCell>
                          <TableCell>{footprint.method}</TableCell>
                          <TableCell>
                            {footprint.browserInfo.isMobile 
                              ? 'Mobile' 
                              : footprint.browserInfo.isTablet 
                                ? 'Tablet' 
                                : 'Desktop'}
                          </TableCell>
                          <TableCell>
                            {footprint.browserInfo.browser} / {footprint.browserInfo.os}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing page {pagination.page} of {pagination.pages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page >= pagination.pages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
        
        {/* Content Management Tab */}
        <TabsContent value="content">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Management</CardTitle>
                <CardDescription>
                  View and manage all content on the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                  <Button 
                    variant="outline" 
                    className="h-24 flex flex-col items-center justify-center gap-2"
                    onClick={() => navigate('/admin/users')}
                  >
                    <Users className="h-8 w-8" />
                    <span>Manage Users</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-24 flex flex-col items-center justify-center gap-2"
                    onClick={() => navigate('/admin/chats')}
                  >
                    <MessageSquare className="h-8 w-8" />
                    <span>Manage Chats</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-24 flex flex-col items-center justify-center gap-2"
                    onClick={() => navigate('/admin/files')}
                  >
                    <FileText className="h-8 w-8" />
                    <span>Manage Files</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-24 flex flex-col items-center justify-center gap-2"
                    onClick={() => navigate('/admin/pastes')}
                  >
                    <Database className="h-8 w-8" />
                    <span>Manage Pastes</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-24 flex flex-col items-center justify-center gap-2"
                    onClick={() => navigate('/admin/feedback')}
                  >
                    <MessageCircle className="h-8 w-8" />
                    <span>Manage Feedback</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-24 flex flex-col items-center justify-center gap-2"
                    onClick={() => navigate('/admin/settings')}
                  >
                    <SettingsIcon className="h-8 w-8" />
                    <span>App Settings</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 