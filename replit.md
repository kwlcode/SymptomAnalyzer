# Overview

This is a cross-platform diagnostic assessment tool built with React Native and Expo. The application allows healthcare professionals to conduct medical diagnostic assessments using customizable scoring criteria. It features both a mobile React Native application and a web client interface, with a comprehensive backend API for data management.

The system enables users to evaluate patients across multiple assessment categories (like severity, impact, duration, frequency, and contributing factors) using configurable scoring scales. It calculates risk assessments using weighted algorithms and provides detailed explanations and recommendations based on the results.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Mobile Application (React Native/Expo)**
- Framework: React Native with Expo SDK 53
- Navigation: Expo Router with file-based routing and typed routes
- UI Components: React Native Paper for Material Design components
- State Management: Local component state with AsyncStorage for persistence
- Charts: React Native Chart Kit for data visualization
- Form Handling: React Hook Form with Zod validation
- Platform Support: iOS, Android, and web deployment capabilities

**Web Client (React/Vite)**
- Framework: React 18 with TypeScript
- Build Tool: Vite for development and production builds
- UI Library: Shadcn/ui components built on Radix UI
- Styling: Tailwind CSS with CSS variables for theming
- State Management: TanStack Query (React Query) for server state
- Routing: Wouter for lightweight client-side routing
- Form Handling: React Hook Form with Zod validation

### Backend Architecture

**Server Framework**
- Runtime: Node.js with Express.js
- Language: TypeScript with ESM modules
- Database ORM: Drizzle ORM for type-safe database operations
- Session Management: Express sessions with PostgreSQL store
- API Design: RESTful endpoints with JSON responses

**Database Design**
- Database: PostgreSQL (configured for Neon serverless)
- Schema Management: Code-first approach with Drizzle migrations
- Key Tables: Users, Categories, Assessments, Reports, Payments, Subscriptions

### Authentication & Authorization

**Authentication System**
- Provider: Replit Auth with OpenID Connect
- Session Storage: PostgreSQL-backed sessions
- User Management: Automatic user creation and profile management
- Authorization: Route-level protection with middleware

### Data Storage Strategy

**Mobile Storage**
- Primary: AsyncStorage for local data persistence
- Structure: JSON serialization for categories and assessments
- Fallback: Memory storage with automatic initialization
- Synchronization: Manual data export capabilities

**Web Storage**
- Primary: PostgreSQL database via API calls
- Caching: TanStack Query for client-side caching
- Session: Server-side session management

### Business Logic

**Assessment Algorithm**
- Scoring: Configurable scale types (1-10, 1-5, 0-100, 0-1)
- Risk Calculation: Weighted scoring with normalization to common scale
- Thresholds: Low Risk (≤15), Moderate Risk (≤30), High Risk (>30)
- Output: Risk level, percentage, explanations, and recommendations

**Freemium Model**
- Free Tier: 2 assessments, basic features only
- Premium Tier: Unlimited assessments, AI insights, export features
- Usage Tracking: Per-user assessment counting with monthly resets

### AI Integration

**Diagnostic Analysis**
- Provider: OpenAI GPT-4o for advanced analysis
- Input: Assessment scores with category descriptions
- Output: Enhanced risk analysis, clinical insights, confidence scores
- Fallback: Local algorithm when AI is unavailable

## External Dependencies

### Core Frameworks
- **Expo SDK**: Cross-platform mobile development framework
- **React Native**: Mobile application framework
- **Express.js**: Web server framework
- **Drizzle ORM**: Type-safe database operations

### UI Libraries
- **React Native Paper**: Material Design components for mobile
- **Shadcn/ui**: Component library for web interface
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework

### Database & Storage
- **PostgreSQL**: Primary database (via Neon serverless)
- **AsyncStorage**: Local storage for React Native
- **Connect-PG-Simple**: PostgreSQL session store

### Authentication
- **Replit Auth**: OpenID Connect authentication provider
- **Passport.js**: Authentication middleware
- **OpenID Client**: OIDC protocol implementation

### AI & Analytics
- **OpenAI API**: GPT-4o for diagnostic analysis
- **React Native Chart Kit**: Data visualization
- **Recharts**: Web chart library

### Payment Processing
- **Paystack**: Payment gateway for subscriptions
- **SendGrid**: Email service for notifications

### Development Tools
- **TypeScript**: Type safety across the stack
- **Zod**: Runtime type validation
- **TanStack Query**: Server state management
- **Vite**: Build tool for web client