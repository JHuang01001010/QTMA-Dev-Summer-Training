import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';

// Load env variables from .env
dotenv.config();

// New express instance
const app = express();

// Enables CORS middleware
app.use(cors());

// Adds middleware for JSON request parsing 
app.use(express.json());

// Send requests with /api to routes
app.use('/api', routes);

// Server listens on/sends network data to PORT 3000
const PORT = process.env.PORT || 3000;

// Starts HTTP server and listens to PORT 3000
app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});