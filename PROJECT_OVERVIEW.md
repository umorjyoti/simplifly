# Simplifly - Project Overview

## What is Simplifly?

**Simplifly** is a free, production-ready time tracking and billing application designed specifically for freelancers who bill by the hour. It provides a comprehensive solution for managing projects, tracking work hours, collaborating with teams, and generating professional invoices.

The application is built with modern web technologies and focuses on simplicity, efficiency, and professional billing workflows. It's completely free to use and optimized for search engines to help freelancers discover the tool.

## Core Purpose

Simplifly solves the common challenges faced by freelancers:
- **Time Tracking**: Easily log hours worked on different tasks and projects
- **Project Management**: Organize work into tickets with clear status tracking
- **Team Collaboration**: Work with team members on shared workspaces
- **Professional Billing**: Generate detailed invoices with accurate time records
- **Client Management**: Separate workspaces for different clients/projects

## Key Features

### 🔐 Authentication & Security

- **Google OAuth 2.0**: Secure sign-in with Google only - no passwords to remember
- **JWT Tokens**: Secure authentication tokens that expire after 7 days
- **Role-Based Access**: Workspace owners have additional permissions for billing and member management

### 📊 Workspace Management

- **Multiple Workspaces**: Create separate workspaces for different clients or projects
- **Workspace Settings**:
  - Period types: Weekly, Monthly, or Quarterly views
  - Currency support: USD or INR
- **Team Collaboration**: Add team members to workspaces for collaborative work
- **Workspace Invites**: Generate secure invite links to add team members
- **Owner Controls**: Workspace owners can manage members and access billing features

### 🎫 Ticket Management

- **Ticket Types**:
  - **Stories**: Main work items/tasks
  - **Subtasks**: Break down stories into smaller components
- **Ticket Properties**:
  - Title and description
  - Go-live date (optional for backlog items)
  - Assignee assignment
  - Status tracking (todo, in-progress, completed)
  - Payment status (pending-pay, billed, not-applicable)
  - Hours worked tracking
- **Ticket Workflow**:
  - Create tickets with title, description, and assignee
  - Track ticket status through different stages
  - Require hours worked before closing tickets
  - Automatic payment status update when tickets are completed
- **Backlog Management**: View and manage tickets without go-live dates
- **Period Navigation**: Navigate tickets by monthly or quarterly periods
- **Ticket History**: Track changes and updates to tickets

### 💬 Collaboration Features

- **Comments**: Add comments to tickets for team communication
- **Subtask Management**: Create and manage subtasks within tickets
- **User Avatars**: Visual representation of team members
- **Activity Tracking**: Monitor ticket status changes and updates

### 💰 Billing & Invoicing

- **Billable Items**:
  - Completed tickets with hours worked
  - Manual bill items (for work not tracked as tickets)
- **Billing Modes**:
  - **User-Level Billing**: Bill individual users with separate hourly rates
  - **Agency-Level Billing**: Bill all users' work with a single hourly rate
- **Bill Generation**:
  - Select multiple tickets and/or manual items
  - Enter hourly rates
  - Generate professional invoices instantly
  - Support for multiple currencies (USD, INR)
- **Invoice Features**:
  - Professional invoice layout
  - Print-ready format
  - Save as PDF capability
  - Detailed work item breakdown
  - Total hours and amount calculations
- **Payment Status Management**:
  - Track payment status (pending-pay, billed)
  - Mark items as billed after invoice generation
  - Filter billable items by payment status

### 📅 Period Management

- **Period Types**:
  - **Monthly**: View tickets organized by month
  - **Quarterly**: View tickets organized by quarter
  - **Weekly**: (Coming soon)
- **Period Navigation**: 
  - Navigate between different time periods
  - View tickets filtered by selected period
  - Access backlog items separately

### 👥 Team Management

- **Member Management**:
  - Add team members to workspaces
  - Remove team members
  - View all workspace members
- **Invite System**:
  - Generate secure invite tokens
  - Share invite links with team members
  - Join workspaces via invite links
- **My Team Page**: View all workspaces you're a member of

### 🔧 Administrative Features

- **Super Admin Dashboard**: 
  - Administrative access for system management
  - User and workspace oversight
- **Workspace Settings**:
  - Configure period types
  - Set currency preferences
  - Manage workspace details

### 🎨 User Interface

- **Modern Design**: Clean, intuitive interface built with Tailwind CSS
- **Responsive Layout**: Works seamlessly on desktop and mobile devices
- **Beautiful Landing Page**: Conversion-focused design to get users started quickly
- **SEO Optimized**: Built for search engines to help freelancers discover the tool
- **Loading States**: Smooth loading indicators for better UX
- **Error Handling**: Clear error messages and user feedback

## Technical Architecture

### Frontend
- **React 18**: Modern React with hooks and context
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **Context API**: State management for authentication

### Backend
- **Node.js**: JavaScript runtime
- **Express**: Web application framework
- **MongoDB Atlas**: Cloud database service
- **Mongoose**: MongoDB object modeling
- **JWT**: JSON Web Tokens for authentication

### Deployment
- **Frontend**: Netlify (with edge functions support)
- **Backend**: AWS EC2
- **Database**: MongoDB Atlas

## Data Models

### User
- Google OAuth profile information
- Username and email
- Authentication tokens

### Workspace
- Name and description
- Owner reference
- Member list
- Settings (period type, currency)

### Ticket
- Ticket number (unique)
- Title and description
- Go-live date
- Assignee
- Workspace reference
- Type (story/subtask)
- Parent ticket (for subtasks)
- Status (todo/in-progress/completed)
- Payment status
- Hours worked
- Completion timestamp

### Comment
- Ticket reference
- User reference
- Content
- Timestamps

### Subtask
- Ticket reference
- Title and description
- Completion status
- Order
- Completion timestamp

### BillItem
- Workspace reference
- User reference (optional for agency-level)
- Title and description
- Hours
- Type (ticket/manual)
- Ticket reference (if applicable)

### WorkspaceInvite
- Workspace reference
- Invite token (unique)
- Requested by
- Status (pending/approved/rejected)
- Expiration date

### Visit
- Tracking for analytics and usage monitoring

## Workflow Examples

### Creating and Billing a Project

1. **Sign In**: Use Google OAuth to sign in
2. **Create Workspace**: Set up a workspace for your client/project
3. **Add Team Members**: Invite team members via invite links
4. **Create Tickets**: Add work items with descriptions and assignees
5. **Track Time**: Log hours worked on tickets as you complete them
6. **Close Tickets**: Mark tickets as completed (requires hours worked)
7. **Generate Bill**: 
   - Go to Billing page
   - Select user (or enable agency-level billing)
   - Select completed tickets and/or add manual items
   - Enter hourly rate
   - Generate professional invoice
8. **Mark as Billed**: Update payment status after sending invoice

### Team Collaboration

1. **Workspace Owner**: Creates workspace and generates invite link
2. **Team Member**: Joins workspace via invite link
3. **Collaboration**: Team members create tickets, add comments, and track time
4. **Owner Billing**: Workspace owner generates bills for all team members' work

## Key Differentiators

- **Free Forever**: No subscription fees or hidden costs
- **Google OAuth Only**: Simplified authentication, no password management
- **Freelancer-Focused**: Built specifically for hourly billing workflows
- **Professional Invoices**: Print-ready, detailed invoices
- **Flexible Billing**: Support for both individual and agency-level billing
- **Period-Based Organization**: Organize work by time periods for better tracking
- **SEO Optimized**: Designed to be discoverable by freelancers searching for time tracking tools

## Future Enhancements

- Weekly period navigation
- Additional currency support
- Export capabilities (CSV, Excel)
- Email notifications
- Time tracking timer
- Mobile applications
- Advanced reporting and analytics
