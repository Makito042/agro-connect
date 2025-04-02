# Agro-Connected

Agro-Connected is a modern web application that facilitates connections and communication in the agricultural sector. The platform features real-time chat, user authentication, profile management, and consultation services.

## Features

- Real-time chat with Socket.IO integration
- User authentication and authorization with JWT
- Profile management with picture uploads
- Consultation services
- Responsive design with Tailwind CSS
- TypeScript support for better development experience

## Tech Stack

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- Socket.IO Client
- Vite
- React Router DOM

### Backend
- Node.js
- Express
- MongoDB (with Mongoose)
- Socket.IO
- JWT Authentication
- Multer (File uploads)
- Express Validator

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v16 or higher)
- npm or yarn
- MongoDB (local installation or MongoDB Atlas account)
- Git

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd agro-connect
```

### 2. Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create a .env file in the server directory with the following variables:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
NODE_ENV=development
```

4. Start the development server:
```bash
npm run dev
```

The backend server will start on http://localhost:5000

### 3. Frontend Setup

1. Open a new terminal and navigate to the project root:
```bash
cd ..
```

2. Install dependencies:
```bash
npm install
```

3. Create a .env file in the root directory with:
```env
VITE_API_URL=http://localhost:5000
```

4. Start the development server:
```bash
npm run dev
```

The frontend application will start on http://localhost:5173

## Available Scripts

### Frontend

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Lint code

### Backend

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server

## Project Structure

```
├── src/                    # Frontend source files
│   ├── components/         # React components
│   ├── contexts/           # React contexts
│   ├── lib/                # Utility functions
│   ├── App.tsx             # Main App component
│   └── main.tsx            # Entry point
├── server/                 # Backend files
│   ├── src/
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # API routes
│   │   └── index.js        # Server entry point
│   └── uploads/            # File uploads directory
├── .env                    # Environment variables
├── package.json           # Project dependencies
└── vite.config.ts        # Vite configuration
```

## API Endpoints

### Authentication
- POST /api/auth/register - Register new user
- POST /api/auth/login - User login

### Users
- GET /api/users/profile - Get user profile
- PUT /api/users/profile - Update user profile
- POST /api/users/profile/picture - Upload profile picture

### Consultations
- POST /api/consultation - Create consultation
- GET /api/consultation - Get consultations

## Environment Variables

### Backend (.env)
```env
MONGODB_URI=mongodb://localhost:27017/agro-connect
JWT_SECRET=your_jwt_secret
PORT=5000
NODE_ENV=development
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
```

## Development

1. Follow the installation steps above
2. Make sure both frontend and backend servers are running
3. Frontend runs on http://localhost:5173
4. Backend runs on http://localhost:5000
5. API endpoints are prefixed with /api

## Production Deployment

### Backend
1. Set NODE_ENV=production in .env
2. Update CORS settings in server/src/index.js
3. Set up proper MongoDB connection string
4. Run `npm start`

### Frontend
1. Update VITE_API_URL in .env
2. Run `npm run build`
3. Deploy the dist directory to your hosting service

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License.