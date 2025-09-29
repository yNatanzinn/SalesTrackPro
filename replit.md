# Overview

This is a mobile-first sales management web application built for vendors/sellers to track their sales activities. The system provides a complete solution for product management, sales recording, payment tracking, and analytics. Each user operates as an independent vendor with their own isolated data, making it suitable for multi-tenant scenarios where each seller maintains separate inventory and sales records.

The application features a responsive design optimized for mobile devices, real-time analytics with charts, customer management, partial payment handling, and comprehensive reporting capabilities. It's designed as a Progressive Web App (PWA) with offline-first considerations for mobile sales scenarios.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript for type safety and modern development
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Framework**: Radix UI components with shadcn/ui for consistent, accessible design
- **Styling**: Tailwind CSS with CSS variables for theme customization
- **Charts**: Recharts for data visualization and analytics
- **Build Tool**: Vite for fast development and optimized builds

## Backend Architecture
- **Server**: Express.js with TypeScript for robust API development
- **Authentication**: Passport.js with Local Strategy using session-based auth
- **Session Storage**: Express sessions with configurable store (memory store in development)
- **Password Security**: Node.js crypto module with scrypt for password hashing
- **API Design**: RESTful endpoints with proper HTTP status codes and error handling

## Database Layer
- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL with Neon serverless database provider
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Connection**: Connection pooling with pg library for optimal performance

## Data Model Design
- **Multi-tenancy**: Each user (vendor) has isolated data through vendorId foreign keys
- **Products**: Per-vendor product catalog with inventory tracking
- **Customers**: Vendor-specific customer database with search capabilities
- **Sales**: Complete sales tracking with line items and payment history
- **Payments**: Support for partial payments and multiple payment methods

## Security & Authentication
- **Session Management**: Secure session handling with configurable cookie settings
- **Password Hashing**: Cryptographically secure password storage using scrypt
- **Route Protection**: Middleware-based authentication checks for protected routes
- **CSRF Protection**: Built-in session security with proper cookie configuration

## Mobile-First Design
- **Responsive UI**: Mobile-optimized interface with bottom navigation
- **Touch-Friendly**: Large touch targets and swipe-friendly interactions
- **Progressive Enhancement**: Works across different device sizes and capabilities
- **Theme Support**: Dark/light mode with system preference detection

# External Dependencies

## Database & Infrastructure
- **Neon Database**: Serverless PostgreSQL database with connection pooling
- **Drizzle ORM**: Type-safe database toolkit with PostgreSQL dialect
- **Express Sessions**: Session management with configurable storage backends

## UI & Styling
- **Radix UI**: Headless UI component library for accessibility
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Lucide React**: Icon library for consistent iconography
- **Recharts**: Composable charting library for data visualization

## Development & Build Tools
- **Vite**: Fast build tool with HMR and optimized production builds
- **TypeScript**: Static type checking and enhanced developer experience
- **ESBuild**: Fast JavaScript bundler for server-side code
- **PostCSS**: CSS processing with Tailwind and autoprefixer

## Authentication & Security
- **Passport.js**: Authentication middleware with Local Strategy
- **bcryptjs**: Password hashing library (backup to native crypto)
- **Connect PG Simple**: PostgreSQL session store for production use

## Client-Side Libraries
- **TanStack Query**: Server state management with caching and synchronization
- **Wouter**: Lightweight routing library for single-page application behavior
- **React Hook Form**: Form state management with validation
- **Date-fns**: Date manipulation and formatting utilities