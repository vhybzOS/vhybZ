# vhybZ - AI-Powered Interactive Digital Artifacts Platform

A monorepo containing both the server (Hono + Better Auth) and studio (React) applications for creating and managing interactive digital artifacts.

## 🚀 Quick Start for New Developers

### Prerequisites
- [Deno](https://deno.land/) (for server)
- [Node.js 18+](https://nodejs.org/) (for studio)
- MongoDB (local install or MongoDB Atlas account)

### 1. Clone and Setup
```bash
git clone <your-repo-url>
cd vhybZ

# Install studio dependencies
cd studio && npm install
cd ..
```

### 2. Server Development (Easy Start - No OAuth Required)
```bash
cd server

# Copy environment template
cp .env.example .env

# Start server (works without Google OAuth!)
deno task dev
```

The server will start in **development mode** with mock authentication - no Google OAuth setup required! 🎉

Visit http://localhost:8000 to see the server running with development instructions.

### 3. Studio Development
```bash
cd studio

# Copy environment template  
cp .env.example .env

# Start studio
npm run dev
```

Visit http://localhost:5173 to see the React application.

## 🔧 Full Setup (Production-Ready)

### MongoDB Setup
**Option 1: Local MongoDB**
```bash
# Install MongoDB locally or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

**Option 2: MongoDB Atlas (Recommended)**
1. Create account at [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a cluster and get connection string
3. Update `MONGODB_ATLAS_URI` in your `.env` files

### Google OAuth Setup (Optional for Development)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project and enable Google+ API
3. Create OAuth 2.0 credentials
4. Add to your `.env` files:
   ```
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

## 📁 Project Structure

```
vhybZ/
├── server/          # Hono backend with Better Auth
│   ├── main.ts      # Main server file
│   ├── deno.json    # Deno configuration
│   └── .env.example # Environment template
├── studio/          # React frontend with React Router 7
│   ├── src/         # React application source
│   ├── package.json # Node.js dependencies
│   └── .env.example # Environment template
└── docs/           # Documentation
```

## 🔐 Authentication Modes

### Development Mode (Default)
- **No Google OAuth required**
- Mock authentication system
- Perfect for new developers to get started immediately
- Automatic when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are not set

### Production Mode
- Full Google OAuth integration
- Real user authentication and sessions
- Requires Google Cloud Console setup

## 🛠️ Available Commands

### Server (Deno)
```bash
cd server
deno task dev      # Development with hot reload
deno task start    # Production start
deno task check    # Lint and type check
deno task fmt      # Format code
```

### Studio (Node.js)
```bash
cd studio  
npm run dev        # Development with hot reload
npm run build      # Production build
npm run start      # Production start
npm run lint       # ESLint check
```

## 🚀 Deployment

### Server (Deno Deploy)
1. Push to GitHub
2. Connect repository to [Deno Deploy](https://deno.com/deploy)
3. Set environment variables in Deno Deploy dashboard
4. Deploy from `server/main.ts`

### Studio (Netlify/Vercel)
1. Build: `npm run build`
2. Deploy `dist/` folder
3. Set environment variables in hosting platform

## 🐛 Troubleshooting

### "Missing required environment variable: GOOGLE_CLIENT_ID"
This is expected in development! The server will automatically switch to mock auth mode.

### MongoDB Connection Issues
- Check MongoDB is running locally on port 27017
- Verify MongoDB Atlas connection string and IP whitelist
- Ensure database user has correct permissions

### CORS Issues
- Verify studio URL is included in server CORS origins
- Check that credentials are included in requests

## 📖 Documentation

- [Development Guide](./CLAUDE.md)
- [Architecture Overview](./AGENTS.md) 
- [Product Requirements](./PRD.md)
- [Development Diary](./DIARY.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally (both server and studio)
5. Submit a pull request

## 📄 License

See [LICENSE](./LICENSE) file for details.