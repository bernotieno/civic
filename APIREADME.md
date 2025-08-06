🇰🇪 CivicAI API Documentation
Version: 1.0.0
Base URL: http://127.0.0.1:8000 (Development) | https://api.civicai.ke (Production)
Interactive Docs: Swagger UI | ReDoc

📋 Table of Contents

Overview
Authentication
Quick Start
API Endpoints
Response Format
Error Handling
Rate Limiting
Frontend Integration
Hackathon Features


🎯 Overview
CivicAI is Kenya's premier civic engagement platform that enables citizens to provide feedback to their county governments through a secure, tenant-based system. The API is built with Django REST Framework and features:
🏗️ Architecture Highlights

🏛️ County-Based Tenancy: Each county operates independently with isolated data
🆔 National ID Authentication: Secure login using 8-digit Kenyan National IDs
👤 Anonymous Submissions: Privacy-first feedback without registration
📍 Administrative Hierarchy: County → Sub-County → Ward → Village structure
🔐 Role-Based Access: Citizens, Government Officials with different permission levels
⚡ JWT Authentication: Modern token-based authentication system

🎯 Key Features

✅ Production-Ready: Scalable architecture with comprehensive error handling
✅ Security-First: JWT tokens, rate limiting, data isolation
✅ Kenya-Focused: National ID validation, county structure
✅ Privacy-Aware: Anonymous feedback sessions
✅ Developer-Friendly: Interactive documentation, code examples


🔐 Authentication
CivicAI uses JWT (JSON Web Tokens) for authentication with support for anonymous sessions.
Authentication Methods
MethodUse CaseDurationJWT TokensRegistered users1 hour (access) / 7 days (refresh)Anonymous SessionsGuest feedback2 hours, 3 submissions max
JWT Token Usage
Include the access token in the Authorization header for protected endpoints:
httpAuthorization: Bearer <your-jwt-access-token>
Token Refresh Flow
When your access token expires (1 hour), use the refresh token to get a new access token:
bashcurl -X POST http://127.0.0.1:8000/api/auth/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh": "your-refresh-token"}'

🚀 Quick Start
1. Health Check
bashcurl http://127.0.0.1:8000/api/health/
Response:
json{
  "success": true,
  "message": "CivicAI API is running",
  "version": "1.0.0",
  "features": {
    "counties": 47,
    "anonymous_sessions": true,
    "invisible_boundaries": true,
    "jwt_auth": true
  }
}
2. Get Counties List
bashcurl http://127.0.0.1:8000/api/locations/counties/
3. Register a User
bashcurl -X POST http://127.0.0.1:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "national_id": "12345678",
    "name": "John Doe Kiprop",
    "email": "john.kiprop@gmail.com",
    "password": "securepass123",
    "county_id": 1
  }'
4. Login
bashcurl -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "national_id": "12345678",
    "password": "securepass123"
  }'

🛠️ API Endpoints
🏥 System Endpoints
GET /api/health/
System health check and information.
Authentication: None
Rate Limit: None
Response:
json{
  "success": true,
  "message": "CivicAI API is running",
  "version": "1.0.0",
  "features": {
    "counties": 47,
    "anonymous_sessions": true,
    "invisible_boundaries": true,
    "jwt_auth": true
  }
}

🔐 Authentication Endpoints
POST /api/auth/register/
Register a new user with Kenyan National ID.
Authentication: None
Rate Limit: 5/minute
Request Body:
json{
  "national_id": "12345678",        // Required: 8-digit Kenyan National ID
  "name": "John Doe Kiprop",        // Required: Full name
  "email": "john@gmail.com",        // Required: Valid email
  "password": "securepass123",      // Required: Min 6 characters
  "county_id": 1,                   // Required: County ID
  "sub_county_id": 5,               // Optional: Sub-county ID
  "ward_id": 15,                    // Optional: Ward ID  
  "village_id": 42                  // Optional: Village ID
}
Success Response (201):
json{
  "success": true,
  "message": "Registration successful",
  "user": {
    "id": 1,
    "name": "John Doe Kiprop",
    "email": "john@gmail.com",
    "role": "citizen",
    "role_display": "Citizen",
    "county_name": "Kisumu",
    "tenant_name": "Kisumu",
    "accessible_counties": [
      {"id": 1, "name": "Kisumu", "code": "KSM"}
    ],
    "date_joined": "2024-01-15T10:30:00Z"
  },
  "tokens": {
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }
}
Error Response (400):
json{
  "success": false,
  "message": "Registration failed",
  "errors": {
    "national_id": ["User with this National ID already exists"],
    "email": ["Enter a valid email address"]
  }
}

POST /api/auth/login/
Login with National ID and password.
Authentication: None
Rate Limit: 5/minute
Request Body:
json{
  "national_id": "12345678",
  "password": "securepass123"
}
Success Response (200):
json{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "name": "John Doe Kiprop",
    "email": "john@gmail.com",
    "role": "citizen",
    "role_display": "Citizen",
    "county_name": "Kisumu",
    "tenant_name": "Kisumu"
  },
  "app_config": {
    "available_endpoints": ["feedback", "profile"],
    "data_scope": "county",
    "theme": "citizen"
  },
  "tokens": {
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }
}

GET /api/auth/profile/
Get current user profile and app configuration.
Authentication: Bearer Token Required
Rate Limit: 1000/hour
Headers:
httpAuthorization: Bearer <access-token>
Success Response (200):
json{
  "success": true,
  "user": {
    "id": 1,
    "name": "John Doe Kiprop",
    "email": "john@gmail.com",
    "role": "citizen",
    "role_display": "Citizen",
    "official_level": null,
    "level_display": null,
    "county_name": "Kisumu",
    "tenant_name": "Kisumu",
    "accessible_counties": [
      {"id": 1, "name": "Kisumu", "code": "KSM"}
    ],
    "date_joined": "2024-01-15T10:30:00Z"
  },
  "app_config": {
    "available_endpoints": ["feedback", "profile"],
    "data_scope": "county"
  },
  "permissions": {
    "can_access_endpoints": ["feedback", "profile"],
    "data_scope": "county"
  }
}

POST /api/auth/logout/
Logout and blacklist refresh token.
Authentication: Bearer Token Required
Request Body:
json{
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
Success Response (200):
json{
  "success": true,
  "message": "Logout successful"
}

POST /api/auth/refresh/
Refresh JWT access token.
Authentication: None (uses refresh token)
Request Body:
json{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
Success Response (200):
json{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}

POST /api/auth/anonymous/
Create anonymous session for feedback.
Authentication: None
Rate Limit: 100/hour
Request Body:
json{
  "county_id": 1
}
Success Response (201):
json{
  "success": true,
  "message": "Anonymous session created",
  "session_id": "ANON_8f3a2c1e4d6b9a7f2c5e8d1a4b7f9c2e",
  "expires_in": 7200,
  "max_submissions": 3
}

GET /api/auth/anonymous/{session_id}/status/
Check anonymous session status.
Authentication: None
Parameters: session_id (path parameter)
Success Response (200):
json{
  "success": true,
  "session_id": "ANON_8f3a2c1e4d6b9a7f2c5e8d1a4b7f9c2e",
  "can_submit": true,
  "message": "Session active - 2 submissions remaining",
  "submissions_used": 1,
  "submissions_limit": 3,
  "expires_at": "2024-01-15T16:30:00Z"
}

📍 Location Endpoints
GET /api/locations/counties/
Get all Kenyan counties.
Authentication: None
Rate Limit: None
Query Parameters:

is_active (boolean): Filter by active status
search (string): Search by name or code

Success Response (200):
json[
  {
    "id": 1,
    "name": "Kisumu",
    "code": "KSM",
    "is_active": true,
    "location_data": {
      "id": 1,
      "name": "Kisumu",
      "type": "county",
      "level": 0,
      "code": "001",
      "full_path": "Kisumu",
      "children": []
    }
  },
  {
    "id": 2,
    "name": "Nairobi",
    "code": "NBI",
    "is_active": true,
    "location_data": {
      "id": 2,
      "name": "Nairobi",
      "type": "county",
      "level": 0,
      "code": "047",
      "full_path": "Nairobi",
      "children": []
    }
  }
]

GET /api/locations/hierarchy/
Get administrative hierarchy for cascading dropdowns.
Authentication: None
Rate Limit: None
Query Parameters:

county_id (integer): County ID to get children from
parent_id (integer): Parent location ID
type (string): Location type to retrieve (sub_county, ward, village)

Examples:
Get Sub-Counties in Kisumu:
bashGET /api/locations/hierarchy/?county_id=1&type=sub_county
Get Wards in a Sub-County:
bashGET /api/locations/hierarchy/?parent_id=5&type=ward
Success Response (200):
json{
  "success": true,
  "locations": [
    {
      "id": 3,
      "name": "Kisumu East",
      "type": "sub_county",
      "level": 1,
      "code": "001-001",
      "full_path": "Kisumu > Kisumu East",
      "children": []
    },
    {
      "id": 4,
      "name": "Kisumu West",
      "type": "sub_county", 
      "level": 1,
      "code": "001-002",
      "full_path": "Kisumu > Kisumu West",
      "children": []
    }
  ]
}

📊 Response Format
All API responses follow a consistent format:
Success Response
json{
  "success": true,
  "message": "Operation successful",
  "data": { /* Response data */ },
  "pagination": { /* For paginated results */ }
}
Error Response
json{
  "success": false,
  "message": "Operation failed", 
  "errors": {
    "field_name": ["Error description"],
    "non_field_errors": ["General error"]
  }
}
HTTP Status Codes
CodeDescriptionUsage200OKSuccessful GET, PUT, PATCH201CreatedSuccessful POST (resource created)400Bad RequestValidation errors, malformed request401UnauthorizedInvalid or missing authentication403ForbiddenInsufficient permissions404Not FoundResource not found429Too Many RequestsRate limit exceeded500Internal Server ErrorServer error

⚠️ Error Handling
Common Error Scenarios
Validation Errors (400)
json{
  "success": false,
  "message": "Registration failed",
  "errors": {
    "national_id": ["Invalid National ID format"],
    "email": ["This field is required"],
    "password": ["Ensure this field has at least 6 characters"]
  }
}
Authentication Errors (401)
json{
  "success": false,
  "message": "Authentication failed",
  "errors": {
    "detail": "Given token not valid for any token type"
  }
}
Permission Errors (403)
json{
  "success": false,
  "message": "Permission denied",
  "errors": {
    "detail": "You do not have permission to perform this action"
  }
}
Rate Limit Errors (429)
json{
  "success": false,
  "message": "Rate limit exceeded",
  "errors": {
    "detail": "Request was throttled. Expected available in 46 seconds."
  }
}

🚦 Rate Limiting
Endpoint GroupLimitScopeAuthentication5/minutePer IPAnonymous Sessions100/hourPer IPGeneral API1000/hourPer UserPublic EndpointsNo limit-
Rate Limit Headers
httpX-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999  
X-RateLimit-Reset: 1640995200

⚛️ Frontend Integration
React/JavaScript Example
javascript// API Service Class
class CivicAIApi {
  constructor(baseURL = 'http://127.0.0.1:8000') {
    this.baseURL = baseURL;
    this.accessToken = localStorage.getItem('access_token');
  }

  // Set authorization header
  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (includeAuth && this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }
    
    return headers;
  }

  // Register new user
  async register(userData) {
    const response = await fetch(`${this.baseURL}/api/auth/register/`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify(userData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      this.accessToken = data.tokens.access;
      localStorage.setItem('access_token', data.tokens.access);
      localStorage.setItem('refresh_token', data.tokens.refresh);
    }
    
    return data;
  }

  // Login user
  async login(nationalId, password) {
    const response = await fetch(`${this.baseURL}/api/auth/login/`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify({
        national_id: nationalId,
        password: password
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      this.accessToken = data.tokens.access;
      localStorage.setItem('access_token', data.tokens.access);
      localStorage.setItem('refresh_token', data.tokens.refresh);
    }
    
    return data;
  }

  // Get user profile
  async getProfile() {
    const response = await fetch(`${this.baseURL}/api/auth/profile/`, {
      headers: this.getHeaders()
    });
    
    return response.json();
  }

  // Get counties for dropdown
  async getCounties() {
    const response = await fetch(`${this.baseURL}/api/locations/counties/`, {
      headers: this.getHeaders(false)
    });
    
    return response.json();
  }

  // Get location hierarchy
  async getLocationHierarchy(countyId, type = 'sub_county', parentId = null) {
    const params = new URLSearchParams({
      type: type
    });
    
    if (countyId) params.append('county_id', countyId);
    if (parentId) params.append('parent_id', parentId);
    
    const response = await fetch(
      `${this.baseURL}/api/locations/hierarchy/?${params}`,
      { headers: this.getHeaders(false) }
    );
    
    return response.json();
  }

  // Create anonymous session
  async createAnonymousSession(countyId) {
    const response = await fetch(`${this.baseURL}/api/auth/anonymous/`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify({ county_id: countyId })
    });
    
    return response.json();
  }
}

// Usage Example
const api = new CivicAIApi();

// Registration form handler
async function handleRegistration(formData) {
  try {
    const result = await api.register({
      national_id: formData.nationalId,
      name: formData.name,
      email: formData.email,
      password: formData.password,
      county_id: formData.countyId
    });
    
    if (result.success) {
      console.log('Registration successful!', result.user);
      // Redirect to dashboard
    } else {
      console.error('Registration failed:', result.errors);
      // Show error messages
    }
  } catch (error) {
    console.error('Network error:', error);
  }
}

// Cascading dropdowns
async function loadSubCounties(countyId) {
  const result = await api.getLocationHierarchy(countyId, 'sub_county');
  if (result.success) {
    return result.locations;
  }
  return [];
}
TypeScript Interface Examples
typescriptinterface User {
  id: number;
  name: string;
  email: string;
  role: 'citizen' | 'government_official' | 'anonymous';
  role_display: string;
  county_name: string;
  tenant_name: string;
  accessible_counties: County[];
  date_joined: string;
}

interface County {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
  location_data: Location;
}

interface Location {
  id: number;
  name: string;
  type: 'county' | 'sub_county' | 'ward' | 'village';
  level: number;
  code: string;
  full_path: string;
  children: Location[];
}

interface LoginResponse {
  success: boolean;
  message: string;
  user: User;
  app_config: {
    available_endpoints: string[];
    data_scope: string;
  };
  tokens: {
    access: string;
    refresh: string;
  };
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

🏆 Hackathon Features
🎯 What Makes This API Special
1. Kenya-First Design

National ID Authentication: 8-digit Kenyan National ID validation
County Structure: Complete administrative hierarchy
Swahili Support: Ready for localization
Mobile-First: Optimized for Kenya's mobile-heavy internet usage

2. Privacy & Security

Anonymous Feedback: No registration required for basic feedback
Data Isolation: Each county's data is completely isolated
JWT Security: Modern token-based authentication
Rate Limiting: Prevents abuse and ensures fair usage

3. Government-Ready

Multi-Tenant: Each county operates independently
Role-Based Access: Different permissions for citizens vs officials
Audit Trail: Complete logging of all actions
Scalable: Can handle all 47 Kenyan counties

4. Developer Experience

Interactive Documentation: Swagger UI for live testing
Comprehensive Examples: Copy-paste ready code
TypeScript Support: Full type definitions available
Error Handling: Clear, actionable error messages

🚀 Demo Script for Judges
bash# 1. Show System Health
curl http://127.0.0.1:8000/api/health/

# 2. Show County Structure (Kenya's 47 counties)
curl http://127.0.0.1:8000/api/locations/counties/

# 3. Register a Citizen with National ID
curl -X POST http://127.0.0.1:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "national_id": "12345678",
    "name": "Mary Wanjiku Kamau",
    "email": "mary.wanjiku@gmail.com", 
    "password": "securepass123",
    "county_id": 1
  }'

# 4. Show Anonymous Session (Privacy-First)
curl -X POST http://127.0.0.1:8000/api/auth/anonymous/ \
  -H "Content-Type: application/json" \
  -d '{"county_id": 1}'

# 5. Show Location Hierarchy (Cascading Dropdowns)
curl "http://127.0.0.1:8000/api/locations/hierarchy/?county_id=1&type=sub_county"
🎨 Presentation Highlights

Open with Swagger UI → Show interactive documentation
Live Registration → Register a user with Kenyan National ID
JWT Token Flow → Login and show secure API access
Anonymous Sessions → Privacy-first feedback collection
Location Hierarchy → Kenya's administrative structure
Multi-Tenant Demo → Different counties, isolated data
Error Handling → Professional error responses
Code Examples → Show frontend integration ease


🔧 Development Setup
Prerequisites

Python 3.9+
PostgreSQL
Redis (for caching and sessions)

Environment Variables
bash# .env file
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://user:password@localhost/civicai_db
REDIS_URL=redis://127.0.0.1:6379/1
DEBUG=true
TIME_ZONE=Africa/Nairobi
Installation
bash# Clone and setup
git clone <your-repo>
cd civicAI
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Database setup
python manage.py migrate
python manage.py createsuperuser

# Run development server
python manage.py runserver
API Testing

Interactive Docs: http://127.0.0.1:8000/api/docs/
Admin Panel: http://127.0.0.1:8000/admin/
Health Check: http://127.0.0.1:8000/api/health/


📞 Support & Contact
Hackathon Team: CivicAI Developers
Documentation: Interactive Swagger UI
Repository: GitHub
