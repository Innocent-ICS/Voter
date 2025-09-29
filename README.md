# Voting Application

A secure and comprehensive voting application for class representative elections, built with modern web technologies.

## Project Structure

```
voting-app/
├── backend/           # Deno-based API server with Hono
│   ├── server/        # API endpoints and business logic
│   ├── package.json   # Backend dependencies
│   └── deno.json      # Deno configuration
├── frontend/          # React-based frontend with Vite
│   ├── src/          # React components and pages
│   ├── package.json  # Frontend dependencies
│   └── vite.config.ts # Vite configuration
└── package.json      # Root package.json for monorepo management
```

## Features

### 🔐 Security
- Email-based voter authentication
- Secure voting links with tokens
- Hashed email storage for privacy
- CORS protection and input validation

### 🎯 Voting System
- Class-specific candidate visibility
- Multi-question voting with weighted scoring
- Real-time results calculation
- Vote verification and completion tracking

### 🎨 User Experience
- Responsive design with Tailwind CSS
- Dark mode support
- Smooth animations and transitions
- Accessible UI components with Radix UI

### 🛠 Technology Stack

**Backend:**
- Deno runtime for server-side JavaScript
- Hono framework for API routing
- Supabase for database and authentication
- Key-value storage for session management

**Frontend:**
- React 18 with TypeScript
- Vite for fast development and building
- Tailwind CSS for styling
- Radix UI for accessible components

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Deno runtime
- Supabase account and project

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Innocent-ICS/Voter.git
   cd Voter
   ```

2. **Install dependencies:**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables:**
   Create a `.env` file in the backend directory with:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. **Start the development servers:**
   ```bash
   npm run dev
   ```

   This will start both backend (port 8000) and frontend (port 3000) servers.

### Development Scripts

- `npm run dev` - Start both backend and frontend in development mode
- `npm run dev:backend` - Start only the backend server
- `npm run dev:frontend` - Start only the frontend server
- `npm run build` - Build both backend and frontend for production
- `npm run start` - Start the backend server in production mode

## API Endpoints

### Authentication
- `POST /make-server-02adf113/register` - Register new voter/candidate
- `POST /make-server-02adf113/generate-voting-link` - Generate secure voting link
- `POST /make-server-02adf113/verify-voter` - Verify voter credentials

### Voting
- `POST /make-server-02adf113/submit-vote` - Submit a vote
- `GET /make-server-02adf113/get-candidates` - Get candidates for a class
- `GET /make-server-02adf113/get-results` - Get voting results

### Results
- `GET /make-server-02adf113/election-results` - Get complete election results

## Database Schema

The application uses Supabase with the following main tables:
- `voters` - Voter information and registration status
- `candidates` - Candidate profiles and class information
- `votes` - Individual votes with scoring data
- `kv_store_02adf113` - Key-value storage for session data

## Security Features

- **Email Verification**: All voters must verify their email before voting
- **Token-based Authentication**: Secure, time-limited voting tokens
- **Input Validation**: Comprehensive validation on all API endpoints
- **CORS Protection**: Configured CORS policies for cross-origin requests
- **Rate Limiting**: Built-in rate limiting to prevent abuse

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For support or questions, please contact the development team or create an issue in the repository.
