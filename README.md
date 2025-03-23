# Agro-Connected

A modern digital platform connecting farmers, agricultural experts, and enthusiasts to share knowledge, experiences, and best practices in farming. Agro-Connected provides a comprehensive ecosystem for agricultural knowledge sharing and community building.

![Agro-Connected](https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&q=80&w=1200)

## Features

- **Expert Community**: Connect with agricultural experts and fellow farmers
- **Interactive Forum**: Share experiences and get advice from the community
- **Data-Driven Insights**: Access real-time agricultural data and analytics
- **User Authentication**: Secure email-based authentication system
- **Modern UI**: Beautiful, responsive design with Tailwind CSS
- **Real-time Updates**: Instant updates for forum posts and interactions

## Tech Stack

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- Vite
- React Router DOM v6
- Lucide React (Icons)
- Date-fns
- Axios

### Backend
- Node.js
- Express
- MongoDB (with Mongoose)
- JWT Authentication
- Multer (File uploads)
- Express Validator

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MongoDB database

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd agro-connected
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with your environment variables:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. Create a `.env` file in the server directory with your environment variables:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   PORT=5000
   ```

5. Start the backend server:
   ```bash
   cd server
   npm install
   npm run dev
   ```

6. Start the frontend development server:
   ```bash
   # In another terminal, from the project root
   npm run dev
   ```

The frontend application will be available at `http://localhost:5173`
The backend API will be available at `http://localhost:5000/api`

### Building for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
./
├── src/                      # Frontend source code
│   ├── components/           # React components
│   │   ├── Auth/            # Authentication components
│   │   ├── Features.tsx     # Features page component
│   │   ├── Forum.tsx        # Forum page component
│   │   ├── Home.tsx         # Home page component
│   │   └── Profile.tsx      # User profile component
│   ├── contexts/            # React contexts
│   │   └── AuthContext.tsx  # Authentication context
│   ├── lib/                 # Utility functions
│   │   └── api.ts           # API client setup
│   ├── App.tsx              # Main application component
│   ├── index.css            # Global styles
│   └── main.tsx             # Application entry point
├── server/                   # Backend source code
│   ├── src/                 # Server source code
│   │   ├── controllers/     # API controllers
│   │   ├── middleware/      # Express middleware
│   │   ├── models/          # Mongoose models
│   │   ├── routes/          # API routes
│   │   └── index.js         # Server entry point
│   └── uploads/             # File uploads directory
│       └── profile-pictures/# User profile pictures
├── .env                      # Frontend environment variables
├── index.html                # HTML entry point
├── package.json              # Frontend dependencies
├── tailwind.config.js        # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
└── vite.config.ts            # Vite configuration
```

## Deployment

### Building for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist` directory.

### Deployment Options

1. **Frontend Deployment**:
   - Deploy the `dist` directory to platforms like Netlify, Vercel, or GitHub Pages
   - These platforms offer automatic deployments from your Git repository

2. **Backend Deployment**:
   - Deploy the Node.js server to platforms like Heroku, Railway, or Render
   - Alternatively, use container services like AWS ECS or Google Cloud Run

3. **Database Deployment**:
   - Use MongoDB Atlas for cloud-hosted MongoDB database
   - Ensure proper network security settings for database access

4. **Environment Configuration**:
   - Ensure all environment variables are properly set in your deployment platforms
   - Configure CORS settings to allow communication between frontend and backend
   - Set up proper security headers and HTTPS

## Features in Detail

### Home Page
- Modern, responsive landing page
- Quick overview of platform features
- Easy navigation to key sections

### Features Page
- Comprehensive list of platform capabilities
- Detailed descriptions of each feature
- Interactive UI elements

### Forum
- Real-time discussion platform
- Image and video sharing
- Like and comment functionality
- User engagement metrics

### Authentication
- Secure email/password authentication
- User registration
- Password confirmation
- Error handling and validation

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

Project Link: [https://github.com/yourusername/agro-connected](https://github.com/yourusername/agro-connected)

## Acknowledgments

- [Tailwind CSS](https://tailwindcss.com)
- [Vite](https://vitejs.dev)
- [MongoDB](https://www.mongodb.com)
- [Express](https://expressjs.com)
- [React](https://reactjs.org)
- [Node.js](https://nodejs.org)
- [Lucide Icons](https://lucide.dev)