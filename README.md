# Attendance Management System

A robust Node.js application for managing user authentication, profiles, and daily attendance tracking.

## Features

- **Authentication**: Secure Signup, Login, and Logout using JWT and Cookies.
- **Password Management**: Forgot and Reset Password functionality via email.
- **Attendance Tracking**: Daily Check-in and Check-out system.
- **Dashboard**: Overview of monthly attendance statistics.
- **User Profile**: View and update user details.
- **Activity Logging**: Tracks user actions for security and auditing.
- **Domain Restriction**: Signup restricted to specific email domains (`@growixglobal.com`, `@growixglobal.in`).

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Validation**: express-validator
- **Security**: bcryptjs, crypto

## Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

Create a `.env` file in the root directory with the following variables:

```env
PORT=4000
MONGO_URI=mongodb://localhost:27017/your_database_name
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d
JWT_COOKIE_NAME=auth_token
COOKIE_SECURE=false # Set to true in production
COOKIE_SAME_SITE=lax
FRONTEND_URL=http://localhost:4000
```

## Usage

Start the development server:

```bash
npm start
# or if using nodemon
npx nodemon index.js
```

## API Endpoints

### Authentication (`/auth`)
- `POST /auth/signup`: Create a new account.
- `POST /auth/login`: Log in.
- `POST /auth/logout`: Log out.
- `POST /auth/forgot-password`: Request password reset.
- `POST /auth/reset-password`: Reset password with token.

### User (`/user`)
- `GET /user/me`: Get current user profile.
- `PUT /user/me`: Update user profile.

### Attendance (`/attendance`)
- `POST /attendance/mark`: Check-in or Check-out for the day.
- `GET /attendance/me`: Get attendance history.

### Dashboard (`/dashboard`)
- `GET /dashboard/overview`: Get monthly attendance summary.