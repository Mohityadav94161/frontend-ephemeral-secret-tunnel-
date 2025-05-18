/**
 * Configuration settings for the application.
 * Values are loaded from environment variables.
 */

// API URL - defaults to localhost if environment variable is not set
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Supabase URL and anon key from environment variables
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ofjgyheowqpqmubkeuzi.supabase.co';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mamd5aGVvd3FwcW11YmtldXppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2OTE4MDksImV4cCI6MjA2MTI2NzgwOX0.gogWExRMO3mRL-vLA33VJgpF45yxdUKm06mMGBg56aY'; 