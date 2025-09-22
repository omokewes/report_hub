# Admin Dashboard - Multi-tenant Report Management System

## Overview

This is a multi-tenant admin dashboard application built for secure report management and analytics. The system supports role-based access control with three user levels: Superadmin, Admin, and User. It enables organizations to manage documents, create analytics dashboards, and maintain user permissions within a secure, isolated environment.

The application features a modern React frontend with a Node.js/Express backend, using PostgreSQL for data persistence and Drizzle ORM for database operations. It implements a comprehensive authentication system with invite-based user onboarding and supports multiple file types including PDF, DOCX, XLSX, CSV, and PPTX.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**September 22, 2025 - Authentication System Completed**
- Implemented comprehensive JWT-based authentication with bcrypt password hashing
- Created invitation-based user registration system with secure token validation
- Added role-based access control with three-tier hierarchy (Superadmin > Admin > User)
- Enforced multi-tenant data isolation across all API routes
- Replaced insecure file serving with permission-based download system
- Added production JWT secret validation and security hardening
- Fixed all cross-organization data access vulnerabilities
- Authentication system now meets production security standards

## System Architecture

### Frontend Architecture
The frontend is built using React with TypeScript, implementing a component-based architecture with:
- **UI Framework**: Radix UI components with shadcn/ui for consistent design system
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **State Management**: React Query (TanStack Query) for server state management
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **Authentication**: Context-based auth with localStorage persistence

### Backend Architecture
The backend follows an Express.js architecture with:
- **API Design**: RESTful endpoints with proper HTTP status codes
- **Database Layer**: Drizzle ORM with PostgreSQL for type-safe database operations
- **Storage Pattern**: Repository pattern implemented through IStorage interface
- **Session Management**: PostgreSQL-based session storage
- **Request/Response Flow**: Express middleware for logging, error handling, and JSON parsing

### Database Design
PostgreSQL schema with multi-tenant isolation:
- **Organizations**: Central tenant isolation with organization-scoped data
- **Users**: Role-based access (superadmin, admin, user) with organization linking
- **Reports**: File metadata with folder organization and permission system
- **Activity Logging**: Comprehensive audit trail for all user actions
- **Invitation System**: Token-based user invitation workflow

### Authentication & Authorization
Secure multi-tenant authentication system:
- **Invite-Only Registration**: Admins invite users, preventing unauthorized access
- **Role-Based Permissions**: Three-tier role system with granular access control
- **Organization Isolation**: Complete data separation between organizations
- **Password Recovery**: Secure token-based password reset functionality
- **Session Management**: Server-side session handling with automatic cleanup

### Security Model
- **Multi-tenant Isolation**: Organization-based data segregation
- **Invitation-Based Access**: No public registration to prevent unauthorized access
- **Role Hierarchy**: Superadmin > Admin > User with appropriate permissions
- **Audit Logging**: Complete activity tracking for compliance and security

## External Dependencies

### Database & ORM
- **PostgreSQL**: Primary database with Neon serverless hosting
- **Drizzle ORM**: Type-safe database operations with migration support
- **@neondatabase/serverless**: Serverless PostgreSQL connection handling

### Frontend Libraries
- **React Ecosystem**: React 18+ with TypeScript support
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with PostCSS processing
- **Form Management**: React Hook Form with Zod schema validation
- **Data Fetching**: TanStack React Query for server state management
- **Routing**: Wouter for lightweight client-side routing

### Backend Services
- **Express.js**: Web framework with middleware support
- **Session Storage**: connect-pg-simple for PostgreSQL session management
- **Development Tools**: Vite for frontend bundling and development server
- **TypeScript**: Full-stack TypeScript implementation

### Development & Build Tools
- **Vite**: Frontend build tool with HMR and plugin ecosystem
- **ESBuild**: Backend bundling for production deployment
- **Drizzle Kit**: Database migration and schema management
- **Replit Integration**: Development environment plugins for Replit platform