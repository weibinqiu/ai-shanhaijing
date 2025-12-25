# User Login Feature

## Overview
This document describes the newly added user login feature for the AI Shanhaijing game (v2).

## Features Added

### 1. User Authentication Store (`src/stores/user.ts`)
- User state management using Pinia
- Login and registration functionality
- Session persistence using localStorage
- Logout functionality

### 2. Login View (`src/views/LoginView.vue`)
- Beautiful login/register form with animations
- Toggle between login and register modes
- Form validation
- Guest login option
- Responsive design

### 3. Game View (`src/views/GameView.vue`)
- Protected game view requiring authentication
- User info header with logout button
- Wraps existing game functionality
- Preserves all original game features

### 4. Router Updates (`src/router/index.ts`)
- Added `/login` route
- Added `/game` route (protected)
- Navigation guards for authentication
- Auto-redirect for logged-in users

### 5. App Updates (`src/App.vue`)
- Simplified to use RouterView
- Maintains global styles

## Usage

### Running the Game

1. Install dependencies:
```bash
cd ai-shanhaijing-v2
npm install
```

2. Run development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

### User Flow

1. **Login Page** (`/login`)
   - First-time users can register with username, email, and password
   - Existing users can login with username and password
   - Guest users can click "游客登录" for quick access

2. **Game Page** (`/game`)
   - Protected route (requires authentication)
   - Shows username in header
   - Logout button available
   - All original game features preserved

### Data Persistence

- User sessions are stored in localStorage
- Key: `ai-shanhaijing-user`
- Auto-login on page refresh if session exists

## Technical Details

### Authentication Flow

```
User visits / 
  → Redirects to /login
  → User logs in/registers
  → Redirects to /game
  → User can play game
  → User can logout → back to /login
```

### Router Guards

- **requiresAuth**: Protects routes that need authentication
- **requiresGuest**: Prevents logged-in users from accessing login page

### State Management

The user store exposes:
- `currentUser`: User object or null
- `isLoggedIn`: Computed boolean
- `login(username, password)`: Login method
- `register(username, email, password)`: Registration method
- `logout()`: Logout method

## Future Enhancements

Potential improvements:
- Backend API integration for real authentication
- Password encryption
- Email verification
- Password reset functionality
- Social login (Google, Facebook, etc.)
- User profile management
- Game progress tied to user account
- Leaderboards and achievements
