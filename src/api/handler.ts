// src/api/handler.ts
// This file sets up a lightweight API handler for your Vite application
// It uses the browser's fetch API to make requests to your API endpoints

import { SessionAPI } from './sessions';
import { supabase } from '../lib/supabase';

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

// Define the API routes
const API_ROUTES = {
  // Session routes
  'GET /api/sessions': async (req: Request) => {
    // Parse the URL to get query parameters
    const url = new URL(req.url);
    const professorId = url.searchParams.get('professorId');
    
    if (!professorId) {
      throw new Error('Professor ID is required');
    }
    
    const sessions = await SessionAPI.getProfessorSessions(professorId);
    return new Response(JSON.stringify(sessions), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  },
  
  'GET /api/sessions/:id': async (req: Request) => {
    // Extract session ID from URL path
    const path = new URL(req.url).pathname;
    const sessionId = path.split('/').pop();
    
    if (!sessionId) {
      throw new Error('Session ID is required');
    }
    
    const session = await SessionAPI.getSessionById(sessionId);
    return new Response(JSON.stringify(session), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  },
  
  'POST /api/sessions': async (req: Request) => {
    // Parse request body
    const body = await req.json();
    const { title, description } = body;
    
    if (!title) {
      throw new Error('Session title is required');
    }
    
    const session = await SessionAPI.createSession(title, description);
    return new Response(JSON.stringify(session), {
      status: 201,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  },
  
  'POST /api/sessions/:id/end': async (req: Request) => {
    // Extract session ID from URL path
    const path = new URL(req.url).pathname;
    const parts = path.split('/');
    const sessionId = parts[parts.length - 2]; // Get the ID before "end"
    
    if (!sessionId) {
      throw new Error('Session ID is required');
    }
    
    const session = await SessionAPI.endSession(sessionId);
    return new Response(JSON.stringify(session), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  },
  
  // Special route for professor sessions
  'GET /api/sessions/professor/:id': async (req: Request) => {
  // Extract professor ID from URL path
  const path = new URL(req.url).pathname;
  const professorId = path.split('/').pop();
  
  if (!professorId) {
    throw new Error('Professor ID is required');
  }
    
  const sessions = await SessionAPI.getProfessorSessions(professorId);
  return new Response(JSON.stringify(sessions), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}
};

// Main API handler function
export async function handleAPIRequest(request: Request): Promise<Response> {
  try {
    // Handle OPTIONS requests (CORS preflight)
    if (request.method === 'OPTIONS') {
      return new Response(null, { 
        status: 204,
        headers: corsHeaders
      });
    }
    
    // Get the path from the URL
    const url = new URL(request.url);
    let path = url.pathname;
    
    // Get the route pattern (METHOD /path)
    let matchedRoute = null;
    
    // Special handling for routes with path parameters
    if (path.startsWith('/api/sessions/professor/')) {
      matchedRoute = 'GET /api/sessions/professor/:id';
    } else if (path.match(/^\/api\/sessions\/[^\/]+\/end$/)) {
      matchedRoute = 'POST /api/sessions/:id/end';
    } else if (path.match(/^\/api\/sessions\/[^\/]+$/)) {
      matchedRoute = 'GET /api/sessions/:id';
    } else {
      // For routes without parameters
      matchedRoute = `${request.method} ${path}`;
    }
    
    // Check if the route exists
    const handler = API_ROUTES[matchedRoute as keyof typeof API_ROUTES];
    if (!handler) {
      return new Response(JSON.stringify({ error: 'Route not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Get the Authorization header for authentication
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Set the session with the token
      const { error } = await supabase.auth.setSession({
        access_token: token,
        refresh_token: ''
      });
      
      if (error) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
    // Call the route handler
    const response = await handler(request);
    
    // Add CORS headers to the response if they're not already there
    const newHeaders = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      if (!newHeaders.has(key)) {
        newHeaders.set(key, value);
      }
    });
    
    return new Response(response.body, {
      status: response.status,
      headers: newHeaders
    });
  } catch (error) {
    console.error('API Error:', error);
    
    // Return error response with CORS headers
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }), 
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
}