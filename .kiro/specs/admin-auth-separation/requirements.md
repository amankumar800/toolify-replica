# Requirements Document

## Introduction

This feature implements a separate authentication system for admin users, completely independent from the regular user authentication (Supabase Auth). The admin panel will have its own login page, dedicated database table for admin credentials, and session management using JWT tokens stored in httpOnly cookies. The existing admin panel functionality will be updated to use this new authentication system.

## Glossary

- **Admin_System**: The dedicated authentication system for administrative users
- **Admin_Login_Page**: The login interface located at `/admin/login`
- **Admin_Dashboard**: The main admin interface at `/admin/dashboard`
- **Admin_Session**: JWT token stored in httpOnly cookie for admin authentication
- **Admins_Table**: Database table storing admin credentials and audit information
- **Password_Hash**: bcrypt-hashed password stored in database
- **Account_Lockout**: Temporary blocking of login attempts after multiple failures
- **JWT_Secret**: Environment variable containing the secret key for JWT signing
- **Admin_Layout**: The shared layout component for all admin pages

## Requirements

### Requirement 1: Admin Database Table

**User Story:** As a system administrator, I want admin credentials stored in a dedicated database table with proper audit fields, so that admin authentication is secure and auditable.

#### Acceptance Criteria

1.1. THE Admin_System SHALL store admin credentials in a dedicated `admins` table
1.2. THE Admins_Table SHALL contain columns: id (UUID, primary key), email (VARCHAR, unique, not null), password_hash (VARCHAR, not null), is_active (BOOLEAN, default true), last_login_at (TIMESTAMP, nullable), failed_login_attempts (INTEGER, default 0), locked_until (TIMESTAMP, nullable), created_at (TIMESTAMP, default now), updated_at (TIMESTAMP, default now)
1.3. THE Admins_Table SHALL have a unique index on the email column
1.4. WHEN hashing passwords, THE Admin_System SHALL use bcrypt algorithm with minimum 12 salt rounds
1.5. THE Admins_Table SHALL have RLS enabled with policies allowing only service role access

### Requirement 2: Admin Login Page

**User Story:** As an admin, I want a dedicated login page at `/admin/login`, so that I can access the admin panel without using the regular user login.

#### Acceptance Criteria

2.1. WHEN a user navigates to `/admin/login`, THE Admin_System SHALL display a login form with email and password fields
2.2. WHEN an admin submits valid credentials, THE Admin_System SHALL create an Admin_Session and redirect to `/admin/dashboard`
2.3. WHEN an admin submits invalid credentials, THE Admin_System SHALL display a generic error message "Invalid email or password"
2.4. WHEN an authenticated admin visits `/admin/login`, THE Admin_System SHALL redirect to `/admin/dashboard`
2.5. THE Admin_Login_Page SHALL be visually distinct from the regular user login page with admin branding
2.6. WHEN submitting the login form, THE Admin_Login_Page SHALL validate email format before submission
2.7. WHEN login is successful, THE Admin_System SHALL update last_login_at and reset failed_login_attempts to 0

### Requirement 3: Admin Session Management

**User Story:** As an admin, I want my session to be secure and persistent, so that I can work in the admin panel without frequent re-authentication.

#### Acceptance Criteria

3.1. WHEN an admin successfully logs in, THE Admin_System SHALL create a JWT token containing admin id and email
3.2. WHEN signing JWT tokens, THE Admin_System SHALL use JWT_Secret from environment variable `ADMIN_JWT_SECRET`
3.3. WHEN storing the JWT token, THE Admin_System SHALL use an httpOnly, secure, sameSite=strict cookie named `admin_session`
3.4. THE Admin_Session SHALL expire after 8 hours from creation
3.5. WHEN an admin logs out, THE Admin_System SHALL clear the admin_session cookie and redirect to `/admin/login`
3.6. WHEN processing a protected request, THE Admin_System SHALL validate JWT signature and expiry

### Requirement 4: Admin Route Protection

**User Story:** As a system owner, I want admin routes protected by admin authentication, so that only authenticated admins can access the admin panel.

#### Acceptance Criteria

4.1. WHEN an unauthenticated user accesses any `/admin/*` route (except `/admin/login`), THE Admin_System SHALL redirect to `/admin/login`
4.2. WHEN a valid Admin_Session exists, THE Admin_System SHALL allow access to admin routes
4.3. WHEN an Admin_Session is expired or invalid, THE Admin_System SHALL redirect to `/admin/login`
4.4. WHEN processing an admin route request, THE Admin_System SHALL validate Admin_Session via middleware
4.5. WHEN the admin account is_active is false, THE Admin_System SHALL deny access and redirect to `/admin/login`

### Requirement 5: Account Lockout Protection

**User Story:** As a system owner, I want protection against brute force attacks, so that admin accounts remain secure.

#### Acceptance Criteria

5.1. WHEN an admin submits invalid credentials, THE Admin_System SHALL increment failed_login_attempts by 1
5.2. WHEN failed_login_attempts reaches 5, THE Admin_System SHALL set locked_until to current time plus 15 minutes
5.3. WHILE an account is locked (locked_until > current time), THE Admin_System SHALL reject login attempts with message "Account temporarily locked. Try again later."
5.4. WHEN locked_until expires and login succeeds, THE Admin_System SHALL reset failed_login_attempts to 0 and clear locked_until

### Requirement 6: Admin Setup Script

**User Story:** As a developer, I want a setup script to create the initial admin user, so that I can bootstrap the admin system.

#### Acceptance Criteria

6.1. THE Admin_System SHALL provide a setup script at `scripts/setup-admin-user.ts`
6.2. WHEN the script runs, THE Admin_System SHALL create an admin user with email and password from environment variables ADMIN_EMAIL and ADMIN_PASSWORD
6.3. IF an admin with the same email exists, THEN THE Admin_System SHALL update the password hash
6.4. WHEN validating the password, THE Admin_System SHALL require minimum 8 characters, 1 uppercase letter, and 1 number

### Requirement 7: Admin Logout

**User Story:** As an admin, I want to securely log out of the admin panel, so that my session is terminated.

#### Acceptance Criteria

7.1. WHEN an admin clicks the logout button, THE Admin_System SHALL clear the admin_session cookie
7.2. WHEN logout is complete, THE Admin_System SHALL redirect to `/admin/login`
7.3. THE Admin_System SHALL provide a logout endpoint at `/api/admin/logout`

### Requirement 8: Input Validation and Security

**User Story:** As a system owner, I want all inputs validated and sanitized, so that the admin system is protected from injection attacks.

#### Acceptance Criteria

8.1. WHEN processing email input, THE Admin_System SHALL validate email format using standard email regex before database queries
8.2. WHEN processing user inputs, THE Admin_System SHALL sanitize inputs to prevent SQL injection
8.3. WHEN executing database operations, THE Admin_System SHALL use parameterized queries
8.4. WHEN returning error responses, THE Admin_System SHALL use generic error messages to prevent information leakage

### Requirement 9: Admin Layout Integration

**User Story:** As a developer, I want the existing admin layout updated to use the new authentication system, so that the admin panel works seamlessly with the new auth.

#### Acceptance Criteria

9.1. THE Admin_Layout SHALL use Admin_Session instead of Supabase Auth user_metadata for authentication
9.2. THE Admin_Layout SHALL display the admin email from the Admin_Session
9.3. THE Admin_Layout SHALL have no dependencies on Supabase Auth for admin verification
9.4. THE Admin_Layout SHALL include a logout button that calls the `/api/admin/logout` endpoint
9.5. WHEN Admin_Session is invalid, THE Admin_Layout SHALL redirect to `/admin/login`

### Requirement 10: Admin Dashboard

**User Story:** As an admin, I want a dashboard that displays key statistics, so that I can monitor the platform at a glance.

#### Acceptance Criteria

10.1. THE Admin_Dashboard SHALL display total count of tools from the database
10.2. THE Admin_Dashboard SHALL display total count of categories from the database
10.3. THE Admin_Dashboard SHALL display total count of AI news articles from the database
10.4. THE Admin_Dashboard SHALL display a list of the 5 most recently added tools
10.5. WHEN an unauthenticated user accesses the Admin_Dashboard, THE Admin_System SHALL redirect to `/admin/login`

### Requirement 11: Admin API Protection

**User Story:** As a system owner, I want all admin API routes and server actions protected, so that only authenticated admins can perform administrative operations.

#### Acceptance Criteria

11.1. THE Admin_System SHALL provide a helper function to verify Admin_Session in server actions
11.2. WHEN a server action is called without valid Admin_Session, THE Admin_System SHALL throw an unauthorized error
11.3. WHEN processing `/api/admin/*` routes, THE Admin_System SHALL validate Admin_Session
11.4. WHEN an unauthorized access attempt occurs, THE Admin_System SHALL log the attempt for security monitoring

## Future Extensibility Notes

The following features can be added in future iterations:
- Full CRUD operations for categories, subcategories, and category groups
- AI News management (create, edit, publish/unpublish)
- Midjourney prompts management
- Featured tools management with scheduling
- FAQs management
- User management and analytics
- Admin password reset functionality
- Multiple admin roles (super admin, editor, viewer)
- Audit log viewer for admin actions
