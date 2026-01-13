# Simplifly - Task Management Application

A lightweight task management application similar to JIRA, built with React and Node.js.

## Features

- **User Management**: Sign up and login with local username/password
- **Workspace Management**: Create multiple workspaces for different projects
- **Collaboration**: Add members to workspaces and work together
- **Ticket Management**: 
  - Create tickets with title, description, go-live date, and assignee
  - Track ticket status (open, in-progress, closed)
  - Require hours worked before closing tickets
  - Manage payment status (pending-pay, billed)
- **Billing**: 
  - Workspace owners can select completed tasks
  - Enter hourly rates and generate bills
  - Mark tickets as billed

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router
- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Authentication**: JWT (JSON Web Tokens)

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
PORT=3002
MONGODB_URI=mongodb://localhost:27017/simplifly
JWT_SECRET=your-secret-key-change-this-in-production
NODE_ENV=development
```

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

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Usage

1. **Sign Up**: Create a new account with username and password
2. **Create Workspace**: Create a workspace for your project
3. **Add Members**: As workspace owner, add members to collaborate
4. **Create Tickets**: Create tickets with title, description, go-live date, and assignee
5. **Close Tickets**: Before closing, enter hours worked. Closed tickets automatically move to "pending-pay" status
6. **Generate Bills**: As workspace owner, go to Billing, select user, select tickets, enter hourly rate, and generate bill
7. **Update Payment Status**: Manually update payment status from "pending-pay" to "billed"

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
- `POST /api/auth/signup` - Sign up new user
- `POST /api/auth/login` - Login user

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

## Notes

- Authentication is simplified for now (local username/password)
- MongoDB connection string can be configured in `.env`
- JWT tokens expire after 7 days
- Only workspace owners can access billing and manage members
