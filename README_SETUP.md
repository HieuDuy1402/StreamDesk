# StreamDesk Setup Guide

## Quick Start

### 1. Start the Backend Server
```bash
# In terminal 1 (from project root)
npx nodemon server/index.js
```

**Expected Output:**
- `Trying to connect with URI: Found URI` (or shows the actual URI)
- `MongoDB Connected`
- `Server running on port 5000`

### 2. Start the Frontend
```bash
# In terminal 2 (from project root)
npm run dev
```

**Expected Output:**
- Next.js dev server running on `http://localhost:3000`

### 3. Open Browser
Navigate to `http://localhost:3000`

---

## Troubleshooting

### Backend Won't Connect to MongoDB

**Check your `.env` file location:**
- Should be at: `server/.env`
- Format:
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

**Common Issues:**
1. Missing `mongodb+srv://` prefix
2. Wrong password (use the actual password, not `<password>`)
3. File in wrong location (must be in `server/` folder)

### Frontend Shows "data.forEach is not a function"

This means the backend isn't running or isn't reachable.

**Fix:**
1. Ensure backend terminal shows "Server running on port 5000"
2. Check browser console (F12) for the actual error
3. Verify `http://localhost:5000/api/sounds` returns `[]` (empty array) when you visit it directly

---

## Architecture

- **Frontend**: Next.js on port 3000
- **Backend**: Express on port 5000
- **Database**: MongoDB Atlas
- **File Storage**: `server/uploads/` directory

## API Endpoints

- `GET /api/sounds` - Get all sounds
- `POST /api/sounds` - Upload a sound (with file)
- `DELETE /api/sounds/:id` - Delete a sound
