import { API_URL } from '../config';
import chatSocketService, { ChatSocketService } from './socket';

// Get auth token from localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Authentication
export const register = async (username: string, password: string) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Registration failed');
  }
  
  return response.json();
};

export const login = async (username: string, password: string) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Login failed');
  }
  
  return response.json();
};

export const logout = async () => {
  const response = await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Logout failed');
  }
  
  return response.json();
};

// Verify JWT token
export const verifyToken = async (token: string) => {
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to verify token');
  }
  
  return response.json();
};

// Paste
export const createPaste = async (content: string, expiry: string, deleteAfterView: boolean, userId?: string) => {
  const response = await fetch(`${API_URL}/paste`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content,
      expiry,
      delete_after_view: deleteAfterView,
      user_id: userId,
    }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create paste');
  }
  
  return response.json();
};

export const getPaste = async (id: string) => {
  // Check if id is a short code or regular id
  const isShortCode = id.includes('-');
  const endpoint = isShortCode 
    ? `${API_URL}/paste/code/${id}` 
    : `${API_URL}/paste/${id}`;
  
  const response = await fetch(endpoint);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to get paste');
  }
  
  return response.json();
};

export const deletePaste = async (id: string) => {
  // Check if id is a short code or regular id
  const isShortCode = id.includes('-');
  const endpoint = isShortCode 
    ? `${API_URL}/paste/code/${id}` 
    : `${API_URL}/paste/${id}`;
  
  const response = await fetch(endpoint, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to delete paste');
  }
  
  return response.json();
};

// File Share
export const uploadFile = async (
  file: File, 
  expiry: string, 
  deleteAfterDownload: boolean, 
  userId?: string
) => {
  // Read file as data URL
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  
  const response = await fetch(`${API_URL}/file`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: file.name,
      type: file.type,
      size: file.size,
      data: dataUrl,
      expiry,
      delete_after_download: deleteAfterDownload,
      user_id: userId,
    }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to upload file');
  }
  
  return response.json();
};

export const getFile = async (id: string) => {
  if (!id) {
    throw new Error('No file ID or code provided');
  }
  
  // Clean up the ID/code - trim any whitespace
  id = id.trim();
  
  // Check if id is a short code or regular MongoDB ObjectId
  // - MongoDB IDs are 24 hex characters
  // - Short codes can have an "F-" prefix followed by alphanumeric
  let isShortCode = false;
  
  if (id.startsWith('F-')) {
    isShortCode = true;
  } else if (!/^[0-9a-f]{24}$/i.test(id)) {
    // If it's not a valid MongoDB ObjectId format, treat as short code
    isShortCode = true;
    
    // For backward compatibility, add the F- prefix if missing
    if (id.length >= 6 && !id.includes('-')) {
      id = `F-${id}`;
    }
  }
  
  // Use the appropriate endpoint based on the ID format
  const endpoint = isShortCode 
    ? `${API_URL}/file/code/${id}` 
    : `${API_URL}/file/${id}`;
  
  console.log(`Getting file with ${isShortCode ? 'short code' : 'ID'}: ${id}`);
  console.log(`Using endpoint: ${endpoint}`);
  
  try {
    const response = await fetch(endpoint, {
      headers: {
        ...getAuthHeaders()
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Failed to get file (Status: ${response.status})`);
    }
    
    const data = await response.json();
    
    // Validate response data
    if (!data || !data.id) {
      console.error('Invalid file data received:', data);
      throw new Error('Invalid file data received from server');
    }
    
    return data;
  } catch (err) {
    console.error('Error in getFile:', err);
    throw err;
  }
};

export const markFileDownloaded = async (id: string) => {
  if (!id) {
    throw new Error('No file ID or code provided');
  }
  
  // Get user ID from local storage if available
  let userId = null;
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userData = JSON.parse(userStr);
      userId = userData.id;
    } else {
      // Try to get from auth token
      const token = localStorage.getItem('auth_token');
      if (token) {
        const user = await verifyToken(token).catch(() => null);
        if (user && user.id) {
          userId = user.id;
        }
      }
    }
  } catch (e) {
    console.error('Error getting user ID for download tracking:', e);
  }
  
  // Clean up the ID/code - trim any whitespace
  id = id.trim();
  
  // Check if id is a short code or regular MongoDB ObjectId
  let isShortCode = false;
  
  if (id.startsWith('F-')) {
    isShortCode = true;
  } else if (!/^[0-9a-f]{24}$/i.test(id)) {
    // If it's not a valid MongoDB ObjectId format, treat as short code
    isShortCode = true;
    
    // For backward compatibility, add the F- prefix if missing
    if (id.length >= 6 && !id.includes('-')) {
      id = `F-${id}`;
    }
  }
  
  // Use the appropriate endpoint based on the ID format
  const endpoint = isShortCode 
    ? `${API_URL}/file/code/${id}/download` 
    : `${API_URL}/file/${id}/download`;
  
  console.log(`Marking file as downloaded with ${isShortCode ? 'short code' : 'ID'}: ${id}`);
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({
        downloader_id: userId
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.warn('Warning: Failed to mark file as downloaded:', errorData.error);
      // Don't throw error here - we want the download to continue even if tracking fails
      return { success: false, error: errorData.error };
    }
    
    return response.json();
  } catch (err) {
    // Log but don't block the download
    console.warn('Warning: Error marking file as downloaded:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
};

// Chat
export const createChat = async (
  name: string, 
  userId?: string, 
  username?: string,
  description?: string,
  isPublic: boolean = true,
  maxParticipants: number = 50,
  expirationHours: number = 24,
  messageExpirationHours: number = 2
) => {
  const response = await fetch(`${API_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({
      name,
      username,
      description,
      is_public: isPublic,
      max_participants: maxParticipants,
      expirationHours,
      messageExpirationHours
    }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create chat');
  }
  
  return response.json();
};

export const getChat = async (id: string) => {
  const response = await fetch(`${API_URL}/chat/${id}`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to get chat');
  }
  
  return response.json();
};

export const getChatByRoomCode = async (roomCode: string) => {
  const response = await fetch(`${API_URL}/chat/code/${roomCode}`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to find chat');
  }
  
  return response.json();
};

export const listChats = async (publicOnly: boolean = true, limit: number = 20, offset: number = 0) => {
  const response = await fetch(`${API_URL}/chat?public_only=${publicOnly}&limit=${limit}&offset=${offset}`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to list chats');
  }
  
  return response.json();
};

export const joinChat = async (id: string, username: string, userId?: string) => {
  const response = await fetch(`${API_URL}/chat/${id}/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({
      username,
      user_id: userId
    }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to join chat');
  }
  
  return response.json();
};

export const updateChatSettings = async (
  id: string,
  ownerId: string,
  name?: string,
  description?: string,
  isPublic?: boolean,
  maxParticipants?: number
) => {
  const response = await fetch(`${API_URL}/chat/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      owner_id: ownerId,
      name,
      description,
      is_public: isPublic,
      max_participants: maxParticipants
    }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update chat settings');
  }
  
  return response.json();
};

export const kickParticipant = async (
  chatId: string,
  usernameToKick: string,
  ownerId: string
) => {
  const response = await fetch(`${API_URL}/chat/${chatId}/kick`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username_to_kick: usernameToKick,
      owner_id: ownerId
    }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to kick participant');
  }
  
  return response.json();
};

export const deleteChat = async (id: string, ownerId?: string) => {
  const url = ownerId 
    ? `${API_URL}/chat/${id}?owner_id=${ownerId}` 
    : `${API_URL}/chat/${id}`;
  
  const response = await fetch(url, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to delete chat');
  }
  
  return response.json();
};

export const sendMessage = async (chatId: string, content: string, senderName: string, userId?: string) => {
  // Get device info for transmission tracking
  const deviceInfo = getDeviceInfo();
  const deviceInfoString = JSON.stringify(deviceInfo);
  
  // Use socket for real-time message delivery
  chatSocketService.sendMessage(chatId, content, senderName, userId, deviceInfoString);
  
  try {
    // Send via HTTP API as backup/fallback to socket
    const response = await fetch(`${API_URL}/chat/${chatId}/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({
        content,
        sender_name: senderName,
        sender_id: userId || null,
        device_info: deviceInfoString
      })
    });
    
    if (!response.ok) {
      console.error('HTTP fallback for message sending failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error sending message via HTTP:', error);
    
    // Return a mock response structure for UI responsiveness
    return {
      id: 'temp-' + Date.now(),
      chat_id: chatId,
      sender_id: userId || null,
      content,
      sender_name: senderName,
      created_at: new Date(),
      transmission: {
        sent: { status: true, timestamp: new Date() },
        delivered: { status: false, timestamp: null },
        received: { status: false, timestamp: null, deviceInfo: null },
        seen: { status: false, timestamp: null, viewDuration: 0 }
      }
    };
  }
};

// Get device info for message tracking
const getDeviceInfo = () => {
  try {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      vendor: navigator.vendor,
      language: navigator.language,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestamp: new Date().toISOString(),
      screenSize: `${window.screen.width}x${window.screen.height}`
    };
  } catch (e) {
    return 'unknown-device';
  }
};

// Mark message as delivered
export const markMessageDelivered = async (messageId: string) => {
  try {
    const response = await fetch(`${API_URL}/chat/messages/${messageId}/delivered`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to mark message as delivered');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error marking message as delivered:', error);
    throw error;
  }
};

// Mark message as received
export const markMessageReceived = async (messageId: string, deviceInfo?: string) => {
  try {
    // If deviceInfo is not provided, get it
    const deviceData = deviceInfo || JSON.stringify(getDeviceInfo());
    
    const response = await fetch(`${API_URL}/chat/messages/${messageId}/received`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({
        device_info: deviceData
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to mark message as received');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error marking message as received:', error);
    throw error;
  }
};

// Mark message as seen
export const markMessageSeen = async (messageId: string, viewDuration?: number) => {
  try {
    const response = await fetch(`${API_URL}/chat/messages/${messageId}/seen`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({
        view_duration: viewDuration
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to mark message as seen');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error marking message as seen:', error);
    throw error;
  }
};

// Send SMS invitation to join chat
export const sendSmsInvite = async (phoneNumber: string, message: string, chatId: string, senderId?: string) => {
  try {
    const response = await fetch(`${API_URL}/sms/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({
        phone_number: phoneNumber,
        message,
        chat_id: chatId,
        sender_id: senderId
      }),
    });
    
    // First check if the response is not ok
    if (!response.ok) {
      // Clone the response before reading it to allow multiple reads if needed
      const responseClone = response.clone();
      
      // Try to get the error as JSON
      try {
        const errorData = await response.json();
        // Check if this is a rate limiting error (429 Too Many Requests)
        if (response.status === 429) {
          throw new Error(`Rate limit exceeded: ${errorData.error || 'Too many SMS requests'}. 
            Daily limit: ${errorData.limit || 20}, 
            Resets at: ${errorData.reset || 'midnight'}`);
        }
        throw new Error(errorData.error || `Failed to send SMS invitation: ${response.status}`);
      } catch (jsonError) {
        // If we can't parse JSON, check if it's HTML (which would indicate a server error page)
        const text = await responseClone.text();
        if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
          console.error('Received HTML instead of JSON. Backend endpoint may not be implemented.');
          throw new Error('SMS API not configured. Please set up the backend according to README_SMS_SETUP.md');
        } else {
          throw new Error(`Server error: ${response.status} - ${text.substring(0, 100)}`);
        }
      }
    }
    
    return await response.json();
  } catch (error) {
    console.error('SMS API error:', error);
    // Re-throw the error to be handled by the component
    throw error;
  }
};

// Get SMS limits and usage for the user
export const getSmsLimits = async () => {
  try {
    const response = await fetch(`${API_URL}/sms/limits`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      // Clone the response before reading it to allow multiple reads if needed
      const responseClone = response.clone();
      
      // Try to parse as JSON first
      try {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to get SMS limits: ${response.status}`);
      } catch (jsonError) {
        // If JSON parsing fails, try to read as text from the cloned response
        const text = await responseClone.text();
        if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
          throw new Error('SMS API not configured. Please set up the backend according to README_SMS_SETUP.md');
        } else {
          throw new Error(`Server error: ${response.status} - ${text.substring(0, 100)}`);
        }
      }
    }
    
    return await response.json();
  } catch (error) {
    console.error('SMS limits API error:', error);
    throw error;
  }
};

export const getUserChatHistory = async (userId: string) => {
  console.log(`Fetching chat history for user ${userId}`);
  
  try {
    const token = localStorage.getItem('auth_token');
    console.log(`Auth token present: ${!!token}`);
    
    const response = await fetch(`${API_URL}/users/${userId}/chats`, {
      headers: {
        ...getAuthHeaders()
      }
    });
    
    console.log(`Chat history API response status: ${response.status}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Chat history error:', errorData);
      throw new Error(errorData.error || 'Failed to get user chat history');
    }
    
    const data = await response.json();
    console.log(`Received ${data.chats?.length || 0} chat entries`);
    return data;
  } catch (err) {
    console.error('Error in getUserChatHistory:', err);
    throw err;
  }
};

export const getUserFiles = async (userId: string) => {
  console.log(`Fetching files for user ${userId}`);
  
  try {
    // Make sure we have auth headers for authorized requests
    const headers = getAuthHeaders();
    console.log('Auth headers present:', Object.keys(headers).length > 0);
    
    const response = await fetch(`${API_URL}/users/${userId}/files`, {
      headers: {
        ...headers
      }
    });
    
    console.log(`User files API response status: ${response.status}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('User files error:', errorData);
      throw new Error(errorData.error || 'Failed to get user files');
    }
    
    const data = await response.json();
    console.log(`Received ${data.files?.length || 0} file entries`);
    
    // Make sure we have data.files as an array
    if (!data.files) {
      data.files = [];
    }
    
    // Add short codes to files if they don't already have them
    if (data.files && Array.isArray(data.files)) {
      data.files = data.files.map(file => {
        if (!file.short_code && file.id) {
          // Generate a proper short code format
          file.short_code = `F-${file.id.substring(0, 7).toUpperCase()}`;
        }
        return file;
      });
    }
    
    return data;
  } catch (err) {
    console.error('Error in getUserFiles:', err);
    throw err;
  }
};

export const deleteFile = async (id: string) => {
  const response = await fetch(`${API_URL}/file/${id}`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeaders()
    }
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to delete file');
  }
  
  return response.json();
};

export const getUserPastes = async (userId: string) => {
  console.log(`Fetching pastes for user ${userId}`);
  
  try {
    const response = await fetch(`${API_URL}/users/${userId}/pastes`, {
      headers: {
        ...getAuthHeaders()
      }
    });
    
    console.log(`User pastes API response status: ${response.status}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('User pastes error:', errorData);
      throw new Error(errorData.error || 'Failed to get user pastes');
    }
    
    const data = await response.json();
    console.log(`Received ${data.pastes?.length || 0} paste entries`);
    return data;
  } catch (err) {
    console.error('Error in getUserPastes:', err);
    throw err;
  }
}; 