import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '@/config';
import { getAdminAuthHeader, isAdminAuthenticated } from '@/utils/adminAuth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/common/Spinner';
import { toast } from '@/components/ui/use-toast';
import { Clock, Save, RefreshCcw, File } from 'lucide-react';

interface AppSettings {
  chat: {
    defaultExpirationHours: number;
    minExpirationHours: number;
    maxExpirationHours: number;
  };
  message: {
    defaultExpirationHours: number;
  };
  file: {
    maxFileSize: number;
  };
}

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

const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    defaultChatExpirationHours: 48,
    defaultMessageExpirationHours: 48,
    minExpirationHours: 1,
    maxExpirationHours: 8760,
    maxFileSize: 12582912
  });

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (settings) {
      setFormData({
        defaultChatExpirationHours: settings.chat.defaultExpirationHours,
        defaultMessageExpirationHours: settings.message.defaultExpirationHours,
        minExpirationHours: settings.chat.minExpirationHours,
        maxExpirationHours: settings.chat.maxExpirationHours,
        maxFileSize: settings.file.maxFileSize
      });
    }
  }, [settings]);

  const loadSettings = async () => {
    if (!isAdminAuthenticated()) {
      setError('Authentication required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_URL}/admin/settings`, {
        headers: {
          Authorization: getAdminAuthHeader()
        }
      });
      
      setSettings(response.data);
    } catch (error: any) {
      console.error('Error loading settings:', error);
      
      if (error.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else {
        setError(`Failed to load settings: ${error.response?.data?.error || error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      
      const response = await axios.put(
        `${API_URL}/admin/settings`,
        formData,
        {
          headers: {
            Authorization: getAdminAuthHeader()
          }
        }
      );
      
      setSettings(response.data);
      
      toast({
        title: 'Settings Saved',
        description: 'Application settings have been updated successfully.',
      });
    } catch (error: any) {
      console.error('Error saving settings:', error);
      
      toast({
        title: 'Error',
        description: `Failed to save settings: ${error.response?.data?.error || error.message}`,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'maxFileSize' ? Number(value) : parseInt(value, 10)
    }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (error) {
    return (
      <div className="p-6 max-w-screen-xl mx-auto">
        <ErrorDisplay 
          message={error} 
          onRetry={loadSettings} 
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Application Settings</h1>
          <p className="text-muted-foreground">Configure application-wide settings</p>
        </div>
        <Button 
          onClick={loadSettings} 
          variant="outline"
          disabled={loading}
        >
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Spinner />
        </div>
      ) : (
        <Tabs defaultValue="chat">
          <TabsList className="mb-6">
            <TabsTrigger value="chat">Chat Settings</TabsTrigger>
            <TabsTrigger value="message">Message Settings</TabsTrigger>
            <TabsTrigger value="file">File Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="chat">
            <Card>
              <CardHeader>
                <CardTitle>Chat Room Settings</CardTitle>
                <CardDescription>
                  Configure settings for chat rooms
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultChatExpirationHours">
                    Default Chat Expiration Time (hours)
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="defaultChatExpirationHours"
                      name="defaultChatExpirationHours"
                      type="number"
                      min="1"
                      max="8760"
                      value={formData.defaultChatExpirationHours}
                      onChange={handleChange}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Chats will automatically expire after this many hours of inactivity
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minExpirationHours">
                      Minimum Expiration Time (hours)
                    </Label>
                    <Input
                      id="minExpirationHours"
                      name="minExpirationHours"
                      type="number"
                      min="1"
                      max="8760"
                      value={formData.minExpirationHours}
                      onChange={handleChange}
                    />
                    <p className="text-sm text-muted-foreground">
                      Minimum allowed expiration time for chats
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="maxExpirationHours">
                      Maximum Expiration Time (hours)
                    </Label>
                    <Input
                      id="maxExpirationHours"
                      name="maxExpirationHours"
                      type="number"
                      min="1"
                      max="8760"
                      value={formData.maxExpirationHours}
                      onChange={handleChange}
                    />
                    <p className="text-sm text-muted-foreground">
                      Maximum allowed expiration time for chats (8760 hours = 1 year)
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="ml-auto" 
                  onClick={saveSettings}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Spinner className="h-4 w-4 mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Settings
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="message">
            <Card>
              <CardHeader>
                <CardTitle>Message Settings</CardTitle>
                <CardDescription>
                  Configure settings for messages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="defaultMessageExpirationHours">
                    Default Message Expiration Time (hours)
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="defaultMessageExpirationHours"
                      name="defaultMessageExpirationHours"
                      type="number"
                      min="1"
                      max="8760"
                      value={formData.defaultMessageExpirationHours}
                      onChange={handleChange}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Messages in chats will automatically expire after this many hours
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="ml-auto" 
                  onClick={saveSettings}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Spinner className="h-4 w-4 mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Settings
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="file">
            <Card>
              <CardHeader>
                <CardTitle>File Settings</CardTitle>
                <CardDescription>
                  Configure settings for file uploads
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="maxFileSize">
                    Maximum File Size
                  </Label>
                  <div className="flex items-center space-x-2">
                    <File className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="maxFileSize"
                      name="maxFileSize"
                      type="number"
                      min="1048576"
                      max="104857600"
                      value={formData.maxFileSize}
                      onChange={handleChange}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Current value: {formatFileSize(formData.maxFileSize)} (default: 12MB)
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Maximum file size for uploads. Values between 1MB and 100MB recommended.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="ml-auto" 
                  onClick={saveSettings}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Spinner className="h-4 w-4 mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Settings
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default AdminSettings; 