# CivicAI Login Functionality Testing Guide

This guide provides comprehensive testing instructions for the newly implemented login functionality.

## 🚀 Quick Start

1. **Start the development server:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Navigate to the login page:**
   - Go to `http://localhost:5173/login`
   - Or click "Login" in the header navigation

## 🧪 Manual Testing Checklist

### 1. Login Form Validation

#### National ID Validation
- [ ] **Empty Field**: Submit form without National ID → Should show "National ID is required"
- [ ] **Invalid Length**: Enter less than 8 digits (e.g., "123") → Should show "National ID must be exactly 8 digits"
- [ ] **Non-numeric Input**: Try entering letters (e.g., "12ab34cd") → Should filter to digits only ("1234")
- [ ] **Max Length**: Try entering more than 8 digits → Should limit to 8 digits
- [ ] **Valid Input**: Enter exactly 8 digits (e.g., "12345678") → Should accept without error

#### Password Validation
- [ ] **Empty Field**: Submit form without password → Should show "Password is required"
- [ ] **Valid Input**: Enter any password → Should accept without error

#### UI/UX Features
- [ ] **Password Toggle**: Click eye icon → Should toggle password visibility
- [ ] **Real-time Validation**: Start typing in invalid field → Error should clear
- [ ] **Loading State**: During submission → Button should show "Logging in..." and be disabled
- [ ] **Kenyan Theme**: Form should use green colors and Kenyan flag elements

### 2. API Integration Testing

#### Successful Login
- [ ] **Valid Credentials**: Use test credentials from your backend
- [ ] **Token Storage**: Check browser localStorage for `access_token` and `refresh_token`
- [ ] **User Data**: Verify user object is stored in context
- [ ] **App Config**: Verify app configuration is received and stored

#### Failed Login
- [ ] **Invalid Credentials**: Use wrong password → Should show server error message
- [ ] **Network Error**: Disconnect internet → Should show appropriate error message
- [ ] **Server Error**: If backend is down → Should show connection error

### 3. Role-Based Routing

After successful login, verify redirection based on user role:

#### Citizen Users
- [ ] **Redirect**: Should go to `/citizen-dashboard`
- [ ] **Navigation**: Header should show citizen-specific menu items
- [ ] **User Info**: Header should display user name and county

#### Government Officials
- [ ] **Local Officials**: Should go to `/gov-dashboard`
- [ ] **Regional Officials**: Should go to `/gov-dashboard`
- [ ] **National Officials**: Should go to `/gov-dashboard`
- [ ] **Super Admins**: Should go to `/admin-dashboard`

### 4. Authentication Context

#### Header Navigation
- [ ] **Unauthenticated**: Should show "Login" and "Register" buttons
- [ ] **Authenticated**: Should show user name, role, county, and "Logout" button
- [ ] **Logout**: Click logout → Should clear tokens and redirect to home

#### Protected Routes
- [ ] **Dashboard Access**: Try accessing dashboard without login → Should redirect to login
- [ ] **Persistent Login**: Refresh page while logged in → Should maintain authentication

### 5. Responsive Design

Test on different screen sizes:
- [ ] **Desktop**: Form should be centered with proper spacing
- [ ] **Tablet**: Layout should adapt appropriately
- [ ] **Mobile**: Form should be mobile-friendly

### 6. Accessibility

- [ ] **Keyboard Navigation**: Tab through form elements
- [ ] **Screen Reader**: Labels should be properly associated
- [ ] **Focus States**: Elements should have visible focus indicators
- [ ] **Error Announcements**: Errors should be announced to screen readers

## 🔧 Test Data

### Sample Test Users
Create these users in your backend for testing:

```json
{
  "citizen": {
    "national_id": "12345678",
    "password": "testpass123",
    "role": "citizen",
    "county": "Nairobi"
  },
  "local_official": {
    "national_id": "87654321",
    "password": "testpass123",
    "role": "government_official",
    "official_level": "local",
    "county": "Kisumu"
  },
  "super_admin": {
    "national_id": "11111111",
    "password": "testpass123",
    "role": "government_official",
    "official_level": "super_admin",
    "county": "Nairobi"
  }
}
```

## 🐛 Common Issues & Solutions

### Login Not Working
1. **Check Backend**: Ensure Django server is running on `http://127.0.0.1:8000`
2. **CORS Issues**: Verify CORS settings in Django allow frontend origin
3. **API Endpoint**: Confirm `/api/auth/login/` endpoint is accessible

### Routing Issues
1. **React Router**: Ensure all routes are properly defined in `App.tsx`
2. **Authentication Context**: Verify `AuthProvider` wraps the entire app
3. **Token Storage**: Check if tokens are being stored in localStorage

### Styling Issues
1. **Tailwind CSS**: Ensure Tailwind is properly configured
2. **Icons**: Verify `lucide-react` icons are loading
3. **Responsive**: Test on different screen sizes

## 📊 Expected API Responses

### Successful Login Response
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "citizen",
    "role_display": "Citizen",
    "county_name": "Nairobi",
    "tenant_name": "Nairobi",
    "accessible_counties": [
      {"id": 1, "name": "Nairobi", "code": "NRB"}
    ]
  },
  "app_config": {
    "available_endpoints": ["feedback", "profile"],
    "data_scope": "county"
  },
  "tokens": {
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }
}
```

### Failed Login Response
```json
{
  "success": false,
  "message": "Login failed",
  "errors": {
    "non_field_errors": ["Invalid credentials"]
  }
}
```

## 🎯 Success Criteria

The login functionality is working correctly if:

1. ✅ Form validation works for all edge cases
2. ✅ API integration handles success and error cases
3. ✅ Role-based routing redirects users appropriately
4. ✅ Authentication context maintains state across page refreshes
5. ✅ UI follows Kenyan theme and is responsive
6. ✅ Accessibility requirements are met
7. ✅ Error messages are clear and helpful

## 📝 Reporting Issues

When reporting issues, please include:
- Browser and version
- Screen size/device
- Steps to reproduce
- Expected vs actual behavior
- Console errors (if any)
- Network tab information for API calls
