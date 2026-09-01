const express = require('express');
const Schedule = require('../models/Schedule');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'student') filter.student = req.user.id;
    if (req.user.role === 'faculty') filter.faculty = req.user.id;

    const schedules = await Schedule.find(filter)
      .populate('student', 'name email studentId')
      .populate('faculty', 'name email department')
      .sort({ date: 1, startTime: 1 });
    res.json(schedules);
  } catch {
    res.status(500).json({ error: 'Failed to fetch schedules.' });
  }
});

router.post('/', auth, authorize('student'), async (req, res) => {
  try {
    const { facultyId, subject, date, startTime, endTime, notes } = req.body;

    if (!facultyId || !subject || !date || !startTime || !endTime) {
      return res.status(400).json({ error: 'Faculty, subject, date and time are required.' });
    }

    const conflict = await Schedule.findOne({
      faculty: facultyId,
      date: new Date(date),
      status: { $in: ['pending', 'confirmed'] },
      $or: [
        { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
      ]
    });

    if (conflict) {
      return res.status(400).json({ error: 'Faculty is not available at this time.' });
    }

    const schedule = await Schedule.create({
      student: req.user.id,
      faculty: facultyId,
      subject,
      date: new Date(date),
      startTime,
      endTime,
      notes
    });

    const populated = await Schedule.findById(schedule._id)
      .populate('student', 'name email studentId')
      .populate('faculty', 'name email department');

    res.status(201).json(populated);
  } catch {
    res.status(500).json({ error: 'Failed to create schedule.' });
  }
});

router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatus = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) return res.status(404).json({ error: 'Schedule not found.' });

    const isFaculty = req.user.role === 'faculty' && schedule.faculty.toString() === req.user.id;
    const isStudent = req.user.role === 'student' && schedule.student.toString() === req.user.id;
    if (!isFaculty && !isStudent && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    schedule.status = status;
    await schedule.save();

    const populated = await Schedule.findById(schedule._id)
      .populate('student', 'name email studentId')
      .populate('faculty', 'name email department');

    res.json(populated);
  } catch {
    res.status(500).json({ error: 'Failed to update schedule.' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) return res.status(404).json({ error: 'Schedule not found.' });

    const isOwner = schedule.student.toString() === req.user.id || schedule.faculty.toString() === req.user.id;
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    await schedule.deleteOne();
    res.json({ message: 'Schedule cancelled.' });
  } catch {
    res.status(500).json({ error: 'Failed to cancel schedule.' });
  }
});

module.exports = router;
