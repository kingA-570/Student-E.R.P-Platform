const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, studentId, department, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required.' });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Invalid email format.' });
    }
    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    if (role && !['student', 'faculty'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role.' });
    }
    if ((role || 'student') === 'student' && !studentId) {
      return res.status(400).json({ error: 'Student ID is required for students.' });
    }

    const sanitizedEmail = String(email).toLowerCase().trim();
    const existing = await User.findOne({ email: sanitizedEmail });
    if (existing) return res.status(400).json({ error: 'Invalid email or password.' });

    const sanitizedRole = ['student', 'faculty'].includes(role) ? role : 'student';
    const hashed = await bcrypt.hash(String(password), 10);
    const user = await User.create({
      name: String(name).trim(),
      email: sanitizedEmail,
      password: hashed,
      role: sanitizedRole,
      studentId: sanitizedRole === 'student' ? String(studentId).trim() : undefined,
      department: department ? String(department).trim() : undefined,
      phone: phone ? String(phone).trim() : undefined
    });

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, studentId: user.studentId, department: user.department }
    });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const sanitizedEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: sanitizedEmail });
    if (!user) return res.status(400).json({ error: 'Invalid email or password.' });

    const valid = await bcrypt.compare(String(password), user.password);
    if (!valid) return res.status(400).json({ error: 'Invalid email or password.' });

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, studentId: user.studentId, department: user.department }
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed.' });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch {
    res.status(500).json({ error: 'Failed to fetch user.' });
  }
});

router.get('/faculty', auth, async (req, res) => {
  try {
    const faculty = await User.find({ role: 'faculty' }).select('-password');
    res.json(faculty);
  } catch {
    res.status(500).json({ error: 'Failed to fetch faculty.' });
  }
});

router.get('/students', auth, async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password');
    res.json(students);
  } catch {
    res.status(500).json({ error: 'Failed to fetch students.' });
  }
});

module.exports = router;
