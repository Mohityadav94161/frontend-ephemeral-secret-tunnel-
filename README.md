# Ephemeral Secret Tunnel

A secure, ephemeral service for anonymous sharing of text, files, and chats. All content is automatically deleted after a configurable time period or after being viewed/downloaded.

## Features

- Anonymous text sharing (paste service)
- Secure file sharing
- Ephemeral chat rooms
- Self-destruct content after viewing/downloading
- Automatic cleanup of expired content

## Services

### Paste Service
- Quick copy/paste with expiration times ranging from 5 minutes to 24 hours
- Option to delete content after first view
- No account required

### File Sharing
- Share files up to 10MB
- Configure expiration time or delete after download
- No account required

### Ephemeral Chat
- Create temporary chat rooms
- Chats expire after 2 hours of inactivity or 12 hours maximum
- No account required

## Architecture

The application is split into frontend and backend:

- **Frontend**: React with TypeScript, using Shadcn UI components
- **Backend**: Node.js with Express
- **Database**: Supabase (PostgreSQL)

## Setup and Installation

### Environment Variables

The application uses environment variables to store configuration and sensitive information:

1. **Backend Environment**:
   - Create a `.env` file in the `backend` directory using the provided `.env.example` template
   - Set your Supabase URL and anonymous key

2. **Frontend Environment**:
   - Create a `.env.local` file in the root directory using the provided `.env.example` template
   - Set your Supabase URL and anonymous key

### Backend

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with:
   ```
   PORT=3001
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the backend:
   ```
   npm run dev
   ```

### Frontend

1. From the root directory, install dependencies:
   ```
   npm install
   ```

2. Create a `.env.local` file with:
   ```
   VITE_API_URL=http://localhost:3001/api
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. Start the frontend:
   ```
   npm run dev
   ```

4. Access the application at `http://localhost:5173`

## Running Both Services

You can run both the frontend and backend services with a single command using the provided start script:

```
chmod +x start.sh  # Make the script executable (first time only)
./start.sh
```

## Data Retention Policy

- Paste content: Deleted after 2-24 hours (user configurable) or after first view
- Shared files: Deleted after 1-24 hours (user configurable) or after first download
- Chat messages: Deleted after 2 hours of inactivity or 12 hours maximum
- No personally identifiable information is stored

## Security

- All content is stored in Supabase with appropriate Row Level Security
- Minimal tracking, no logs of IP addresses or user sessions
- Optional user accounts (username/password only)
- Sensitive configuration is stored in environment variables, not in code
