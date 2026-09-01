require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const feeRoutes = require('./routes/fees');
const scheduleRoutes = require('./routes/schedules');
const academicRoutes = require('./routes/academics');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10kb' }));

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/academics', academicRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Student ERP API is running' });
});

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/student_erp')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Student ERP server running on http://localhost:${PORT}`);
});
