const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const templateRoutes = require('./routes/template'); 

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', templateRoutes); // - templates will be at /api/templates

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Campizo API Server is running',
    timestamp: new Date().toISOString()
  });
});

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://hrishikesh:hrishikesh@cluster0.kiocuci.mongodb.net/?appName=Cluster0')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});