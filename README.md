# GuardShare - Secure File Sharing Platform

A modern, secure file sharing platform built with React, Node.js, Express, and MongoDB. Features advanced link sharing with access controls, user management, and a beautiful glassmorphism UI.

## Features

### 🔐 Authentication & Security
- JWT-based authentication with refresh tokens
- Role-based access control (User/Superuser)
- Rate limiting and security headers
- Activity logging and audit trails

### 📁 File Management
- GridFS storage for large files (50MB limit)
- Custom filename support
- File favorites and search
- Bulk operations and download tracking

### 🔗 Advanced Link Sharing
- Custom link names with unique validation
- Multiple expiration options (time/date/never)
- Access limits and usage tracking
- Verification systems (password/username)
- Scope control (public/users/selected)
- Download permission control

### 🎨 Modern UI/UX
- Glassmorphism design with live lightning effects
- Dark/light theme support
- Fully responsive design
- Advanced search and filtering
- Real-time updates and notifications

### 👥 User Management (Superuser)
- User account management
- Role assignment and permissions
- Activity monitoring and logs
- System-wide overview

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd guardshare
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd server && npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/guardshare
   
   # JWT
   JWT_SECRET=your-super-secure-jwt-secret-key-here
   JWT_EXPIRES_IN=7d
   
   # Server
   PORT=5000
   NODE_ENV=development
   
   # Client URL (for CORS)
   CLIENT_URL=http://localhost:5173
   ```

4. **Create Superuser Account**
   ```bash
   cd server
   npm run create-superuser
   ```
   
   This creates:
   - **Superuser**: `admin` / `admin123`
   - **Demo User**: `demo` / `demo123`

5. **Start Development Servers**
   ```bash
   npm run dev
   ```
   
   This starts both:
   - Client: http://localhost:5173
   - Server: http://localhost:5000

## Project Structure

```
guardshare/
├── src/                    # React frontend
│   ├── components/         # Reusable components
│   │   ├── auth/          # Authentication components
│   │   ├── dashboard/     # Dashboard components
│   │   └── ui/            # UI components
│   ├── contexts/          # React contexts
│   ├── pages/             # Page components
│   ├── services/          # API services
│   └── styles/            # Global styles
├── server/                # Node.js backend
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── middleware/        # Express middleware
│   ├── scripts/           # Utility scripts
│   └── utils/             # Helper functions
└── docs/                  # Documentation
```

## API Documentation

The API documentation is available in `api-routes.txt` with complete endpoint details, request/response formats, and authentication requirements.

### Key Endpoints

- **Authentication**: `/api/auth/*`
- **File Management**: `/api/files/*`
- **Link Sharing**: `/api/links/*`
- **User Management**: `/api/users/*` (Superuser only)

## User Roles

### Regular User
- Upload and manage files
- Create and manage shareable links
- Access shared links (based on permissions)
- Update profile settings

### Superuser
- All user permissions
- Manage all users and their data
- View system-wide statistics
- Access admin panels and logs

## Security Features

- **Rate Limiting**: Prevents API abuse
- **CORS Protection**: Configured for production
- **Input Validation**: Comprehensive data validation
- **File Security**: Safe file upload and storage
- **Access Control**: Granular permission system
- **Activity Logging**: Complete audit trail

## Deployment

### Production Build
```bash
npm run build
```

### Environment Variables
Ensure all production environment variables are set:
- `MONGODB_URI`: Production MongoDB connection
- `JWT_SECRET`: Strong, unique secret key
- `NODE_ENV=production`
- `CLIENT_URL`: Production client URL

### Recommended Deployment
- **Frontend**: Netlify, Vercel, or CDN
- **Backend**: Railway, Heroku, or VPS
- **Database**: MongoDB Atlas
- **File Storage**: GridFS (included) or cloud storage

## Development

### Available Scripts
- `npm run dev`: Start development servers
- `npm run build`: Build for production
- `npm run server`: Start backend only
- `npm run client`: Start frontend only
- `npm run create-superuser`: Create admin account

### Code Style
- ESLint configuration included
- TypeScript for type safety
- Consistent naming conventions
- Component-based architecture

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please check the documentation or create an issue in the repository.

---

**GuardShare** - Secure file sharing reimagined ⚡🛡️