import express from 'express';
import connectDB from './config/db.js'; 
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes.js';
import featureRoutes from './routes/featureRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import advertisementRoutes from './routes/advertisementRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import blogRoutes from './routes/blogRoutes.js';
import supportTicketRoutes from './routes/supportTicketRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config();

const app = express();

// Connect Database
connectDB();

const corsOptions = {
    origin: [process.env.CLIENT_URL, "http://localhost:3000"],
    credentials: true,
  };
  

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// Middleware to handle raw body for Stripe webhook
app.use((req, res, next) => {
  if (req.originalUrl === "/api/webhook") {
    next();
  } else {
    express.json()(req, res, next);
  }
});
// Routes
app.use('/api', userRoutes); 
app.use('/api', featureRoutes);
app.use('/api', reviewRoutes);
app.use('/api', advertisementRoutes);
app.use('/api', projectRoutes);
app.use('/api', blogRoutes);
app.use('/api', supportTicketRoutes);
app.use('/api', adminRoutes);

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
