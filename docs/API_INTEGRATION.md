# API Integration Documentation

## Overview

The Admin Portal has been updated to integrate with your backend APIs based on the Swagger documentation.

## API Services

### 1. Authentication Service
**Base URL:** `http://authentificationv2-env.eba-zxhbu6ur.eu-north-1.elasticbeanstalk.com`

#### Key Endpoints Integrated:
- **POST** `/api/auth/open/signin` - User login
- **GET** `/api/auth/users/current-user` - Get current user
- **GET** `/api/auth/users/all` - List all users
- **GET** `/api/auth/users/{userId}` - Get user by ID
- **PUT** `/api/auth/users/update/{userId}` - Update user
- **DELETE** `/api/auth/users/{phoneNumber}` - Delete user
- **GET** `/api/auth/roles/all` - List all roles
- **GET** `/api/auth/roles/by-id/{id}` - Get role by ID
- **POST** `/api/auth/roles/add-new` - Create role
- **PUT** `/api/auth/roles/update/{id}` - Update role
- **DELETE** `/api/auth/roles/delete/{id}` - Delete role
- **GET** `/api/auth/permissions/all` - List all permissions

### 2. Transaction Service
**Base URL:** `http://movasafe-transaction-env.eba-ydyugcws.eu-north-1.elasticbeanstalk.com`

*Endpoints to be integrated when Swagger documentation is provided*

### 3. Audit Service
**Base URL:** `http://movasafeaudit-env.eba-np6jzj74.eu-north-1.elasticbeanstalk.com/api/audit-logs`

*Endpoints to be integrated when Swagger documentation is provided*

## Configuration

### Environment Variables

Create a `.env.local` file with:

```env
NEXT_PUBLIC_AUTH_API_URL=http://authentificationv2-env.eba-zxhbu6ur.eu-north-1.elasticbeanstalk.com
NEXT_PUBLIC_TRANSACTION_API_URL=http://movasafe-transaction-env.eba-ydyugcws.eu-north-1.elasticbeanstalk.com
NEXT_PUBLIC_AUDIT_API_URL=http://movasafeaudit-env.eba-np6jzj74.eu-north-1.elasticbeanstalk.com/api/audit-logs
```

## API Response Structure

Your API appears to use an `ApiResponse<T>` wrapper format. The client code handles this by checking for:
- `response.data` - The actual data
- `response.token` - Authentication token
- `response.data?.token` - Alternative token location

## Important Notes

1. **User Identification**: Some endpoints use `phoneNumber` instead of `userId` or `email`
   - Delete user endpoint uses `phoneNumber`
   - Update user endpoint uses `userId`

2. **Login Credentials**: The login endpoint expects `LoginDTO` with:
   - `phoneNumber` (not email)
   - `password`

3. **Response Format**: Your API likely returns responses in this format:
   ```json
   {
     "data": { ... },
     "message": "...",
     "status": "..."
   }
   ```

4. **Authentication**: Token is stored in `localStorage` as `auth_token` and sent as:
   ```
   Authorization: Bearer <token>
   ```

## Files Updated

### Core API Files
- `lib/config/api.ts` - API configuration with all endpoints
- `lib/api/auth.ts` - Authentication API client
- `lib/api/users.ts` - User management API client
- `lib/api/roles.ts` - Role and permission API client
- `lib/types/auth.ts` - Type definitions for authentication

### UI Components
- `app/login/page.tsx` - Updated to use new API structure
- `app/admin/users/page.tsx` - Updated delete function to use phoneNumber

## Next Steps

1. **Test Authentication**: Verify login works with your actual API
2. **Adjust Response Mapping**: Update response parsing based on your actual `ApiResponse` structure
3. **Add Transaction Service**: Integrate transaction endpoints when Swagger is provided
4. **Add Audit Service**: Integrate audit endpoints when Swagger is provided
5. **Error Handling**: Customize error handling based on your API's error response format

## Testing

To test the integration:

1. Start the development server: `npm run dev`
2. Navigate to `/login`
3. Try logging in with valid credentials
4. Check browser console for any API errors
5. Verify token is stored in localStorage
6. Test user management pages in `/admin/users`

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure your backend allows requests from your frontend domain
2. **401 Unauthorized**: Check that token is being sent correctly in headers
3. **Response Format Mismatch**: Adjust response parsing in API client files
4. **Phone Number vs Email**: Some endpoints use phoneNumber - ensure correct field mapping

## Support

If you encounter issues:
1. Check browser console for API errors
2. Verify environment variables are set correctly
3. Confirm API endpoints match your Swagger documentation
4. Check network tab to see actual request/response format

