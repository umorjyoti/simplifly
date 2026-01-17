# Simplifly - Free Time Tracking & Billing for Freelancers

A production-ready time tracking and billing application built specifically for freelancers who bill by the hour. Track tasks, log hours, and generate professional invoices instantly.

## Features

- **Google OAuth**: Secure sign-in with Google only - no passwords to remember
- **Time Tracking**: Log hours as you work on tasks and projects
- **Workspace Management**: Create multiple workspaces for different clients/projects
- **Team Collaboration**: Add team members and collaborate on workspaces
- **Ticket Management**: 
  - Create tickets with title, description, go-live date, and assignee
  - Track ticket status (open, in-progress, closed)
  - Require hours worked before closing tickets
  - Manage payment status (pending-pay, billed)
- **Billing**: 
  - Select completed tasks
  - Enter hourly rates and generate professional bills
  - Mark tickets as billed
- **SEO Optimized**: Built for search engines to help freelancers discover the tool
- **Beautiful Landing Page**: Conversion-focused design to get users started quickly

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router
- **Backend**: Node.js, Express, MongoDB Atlas, Mongoose
- **Authentication**: Google OAuth 2.0 + JWT (JSON Web Tokens)
- **Deployment**: Netlify (Frontend), EC2 (Backend), MongoDB Atlas (Database)

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (running locally or connection string)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
NODE_ENV=development
PORT=3002
MONGODB_URI=mongodb://localhost:27017/simplifly
JWT_SECRET=your-secret-key-change-this-in-production
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
FRONTEND_URL=http://localhost:3000
```

**Note**: You need to set up Google OAuth credentials. See [DEPLOYMENT.md](./DEPLOYMENT.md) for instructions.

4. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:3002`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the frontend directory:
```env
VITE_API_URL=http://localhost:3002/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Usage

1. **Sign In**: Click "Sign in with Google" on the landing page
2. **Create Workspace**: Create a workspace for your project/client
3. **Add Members**: As workspace owner, add team members to collaborate
4. **Create Tickets**: Create tickets with title, description, go-live date, and assignee
5. **Track Time**: Log hours as you work on tasks
6. **Close Tickets**: Before closing, enter hours worked. Closed tickets automatically move to "pending-pay" status
7. **Generate Bills**: As workspace owner, go to Billing, select user, select tickets, enter hourly rate, and generate bill
8. **Update Payment Status**: Manually update payment status from "pending-pay" to "billed"

## Project Structure

```
simplifly/
├── backend/
│   ├── models/          # MongoDB models (User, Workspace, Ticket)
│   ├── routes/          # API routes (auth, workspaces, tickets, billing)
│   ├── middleware/      # Authentication middleware
│   └── server.js        # Express server setup
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React context (Auth)
│   │   └── utils/       # Utility functions (API client)
│   └── ...
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/google` - Sign in with Google OAuth
- `GET /api/auth/me` - Get current user (requires auth)

### Workspaces
- `GET /api/workspaces` - Get all user workspaces
- `GET /api/workspaces/:id` - Get single workspace
- `POST /api/workspaces` - Create workspace
- `PUT /api/workspaces/:id` - Update workspace
- `DELETE /api/workspaces/:id` - Delete workspace
- `POST /api/workspaces/:id/members` - Add member
- `DELETE /api/workspaces/:id/members/:userId` - Remove member

### Tickets
- `GET /api/tickets/workspace/:workspaceId` - Get all tickets in workspace
- `GET /api/tickets/:id` - Get single ticket
- `POST /api/tickets` - Create ticket
- `PUT /api/tickets/:id` - Update ticket
- `PATCH /api/tickets/:id/hours` - Update hours worked
- `PATCH /api/tickets/:id/close` - Close ticket (requires hours)
- `DELETE /api/tickets/:id` - Delete ticket

### Billing
- `GET /api/billing/workspace/:workspaceId/billable` - Get billable tickets grouped by user
- `GET /api/billing/workspace/:workspaceId/user/:userId` - Get billable tickets for user
- `POST /api/billing/generate` - Generate bill
- `PATCH /api/billing/tickets/status` - Update payment status

## Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions on deploying to:
- **Frontend**: Netlify
- **Backend**: AWS EC2
- **Database**: MongoDB Atlas

## Notes

- **Authentication**: Google OAuth only - no password-based authentication
- **Free Forever**: The application is completely free to use
- **MongoDB**: Use MongoDB Atlas connection string in production
- **JWT Tokens**: Expire after 7 days
- **Permissions**: Only workspace owners can access billing and manage members
- **SEO**: Optimized for search engines targeting freelancers who bill by the hour
