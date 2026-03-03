# Token Management Architecture

This document explains how authentication tokens are managed for different admin types in the application.

## Admin Types

1. **Super Admin** - Uses `token` key in localStorage
2. **School Admin** - Uses `school-admin-token` key in localStorage
3. **Category Admin** - Uses `category-admin-token` key in localStorage (for future implementation)

## Token Storage Keys

```typescript
const TOKEN_KEYS = {
  SUPER_ADMIN: 'token',
  SCHOOL_ADMIN: 'school-admin-token',
  CATEGORY_ADMIN: 'category-admin-token',
}
```

## How It Works

### 1. Request Interceptor (`api.ts`)

The API interceptor automatically attaches the correct token based on the route:

- `/super-admin/*` → Uses `token` (Super Admin)
- `/school-admin/*` → Uses `school-admin-token` (School Admin)
- `/category-admin/*` → Uses `category-admin-token` (Category Admin)
- Other routes → No token attached (public routes)

### 2. Response Interceptor (`api.ts`)

On 401 errors:
- Only removes the token for the specific admin type that failed
- Only redirects if not already on the login page
- Skips redirect for auth-related endpoints (`/login`, `/me`, `/auth/`, etc.)

### 3. Token Isolation

- Each admin type has its own token storage
- Tokens don't interfere with each other
- Logging out from one admin type doesn't affect others
- Multiple admin sessions can coexist (if needed)

## Best Practices

1. **Always use the correct token key** for each admin type
2. **Don't mix tokens** - Super Admin routes should only use Super Admin token
3. **Clean up on logout** - Only remove the token for the admin type being logged out
4. **Handle errors gracefully** - Don't remove tokens on network errors, only on 401

## Future: Category Admin

When implementing Category Admin:
1. Add `category-admin-token` to localStorage
2. Create `CategoryAdminAuthContext` similar to `SchoolAdminAuthContext`
3. Add routes under `/category-admin/*`
4. The API interceptor will automatically handle it
