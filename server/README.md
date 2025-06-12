# deno-vhybZ

Backend for vhybZ - A Fresh 2.0 web application with MongoDB and Google OAuth.

## Quick Start

1. **Install Deno**: https://docs.deno.com/runtime/getting_started/installation
2. **Setup MongoDB** (see [Database Setup](#database-setup) below)
3. **Configure OAuth** (see [Authentication Setup](#authentication-setup) below)
4. **Start development**:
   ```bash
   deno task dev
   ```

## Database Setup

### MongoDB Configuration

The application automatically detects your environment and configures MongoDB connection:

- **All environments**: Uses `mongodb://localhost:27017` by default
- **Production**: Set `MONGODB_URI` environment variable

**WSL2/Ubuntu:**
```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

**Windows:**
Download and install from [MongoDB Downloads](https://www.mongodb.com/try/download/community)

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

## Authentication Setup

Set up Google OAuth for authentication:

1. **Create Google Cloud Project**: https://console.cloud.google.com/
2. **Enable Google+ API**
3. **Create OAuth 2.0 Credentials**:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:8000/auth/google/callback`
4. **Set Environment Variables**:
   ```bash
   export GOOGLE_CLIENT_ID="your-client-id"
   export GOOGLE_CLIENT_SECRET="your-client-secret"
   ```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGODB_URI` | Auto-detected | MongoDB connection string |
| `MONGODB_DB_NAME` | `vhybZ` | Database name |
| `GOOGLE_CLIENT_ID` | Required | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Required | Google OAuth client secret |

## Development

### Available Commands

```bash
# Start development server (auto-detects environment)
deno task dev

# Build for production
deno task build

# Start production server
deno task start

# Run all checks (formatting, linting, type checking)
deno task check

# Update Fresh framework
deno task update

# React app development (in web-vhybZ/ directory)
cd web-vhybZ && npm run dev
```

### Supported Environments

This application works seamlessly across:

1. **Deno Deploy** - Production hosting
2. **Windows** - Direct development
3. **WSL2** - Windows Subsystem for Linux
4. **Linux** - Native development
5. **macOS** - Native development

The `dev.ts` script automatically detects your environment and configures MongoDB connections appropriately.

## Architecture

- **Framework**: Fresh 2.0 with file-based routing
- **Runtime**: Deno with JSR package management
- **UI**: Preact + Tailwind CSS
- **Database**: MongoDB with Zod validation
- **Auth**: Google OAuth 2.0 with session cookies
- **Frontend**: React app served from `/` route

## Project Structure

```
├── main.ts           # Core application with OAuth routes
├── dev.ts            # Development server with environment detection
├── database.ts       # MongoDB operations with Zod schemas
├── routes/           # Fresh file-based routing
├── islands/          # Interactive Preact components
├── components/       # Server-side Preact components
├── web-vhybZ/        # React frontend application
└── static/           # Static assets
```
