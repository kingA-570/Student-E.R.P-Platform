const express = require('express');
const AcademicRecord = require('../models/AcademicRecord');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

const VALID_GRADES = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'];

function calculateGPA(subjects) {
  const gradePoints = { 'A+': 10, 'A': 9, 'B+': 8, 'B': 7, 'C+': 6, 'C': 5, 'D': 4, 'F': 0 };
  let totalPoints = 0, totalCredits = 0;
  subjects.forEach(s => {
    if (s.grade && gradePoints[s.grade] !== undefined && typeof s.credits === 'number' && s.credits > 0) {
      totalPoints += gradePoints[s.grade] * s.credits;
      totalCredits += s.credits;
    }
  });
  return totalCredits > 0 ? Math.round((totalPoints / totalCredits) * 100) / 100 : 0;
}

router.get('/', auth, async (req, res) => {
  try {
    const filter = req.user.role === 'student' ? { student: req.user.id } : {};
    const records = await AcademicRecord.find(filter)
      .populate('student', 'name email studentId department')
      .sort({ semester: -1 });
    res.json(records);
  } catch {
    res.status(500).json({ error: 'Failed to fetch academic records.' });
  }
});

router.get('/student/:studentId', auth, async (req, res) => {
  try {
    const records = await AcademicRecord.find({ student: req.params.studentId })
      .populate('student', 'name email studentId department')
      .sort({ semester: -1 });
    res.json(records);
  } catch {
    res.status(500).json({ error: 'Failed to fetch records.' });
  }
});

router.post('/', auth, authorize('admin', 'faculty'), async (req, res) => {
  try {
    const { studentId, semester, subjects } = req.body;

    if (!studentId || !semester || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ error: 'Student, semester and at least one subject are required.' });
    }

    for (const sub of subjects) {
      if (!sub.name || !sub.code || typeof sub.credits !== 'number' || sub.credits <= 0) {
        return res.status(400).json({ error: 'Each subject needs name, code, and valid credits.' });
      }
      if (sub.grade && !VALID_GRADES.includes(sub.grade)) {
        return res.status(400).json({ error: `Invalid grade: ${sub.grade}. Use: ${VALID_GRADES.join(', ')}` });
      }
    }

    const gpa = calculateGPA(subjects);
    const totalCredits = subjects.reduce((s, sub) => s + sub.credits, 0);

    const record = await AcademicRecord.create({
      student: studentId,
      semester,
      subjects,
      gpa,
      totalCredits,
      status: 'completed'
    });

    const populated = await AcademicRecord.findById(record._id)
      .populate('student', 'name email studentId department');
    res.status(201).json(populated);
  } catch {
    res.status(500).json({ error: 'Failed to create academic record.' });
  }
});

router.patch('/:id/grade', auth, authorize('admin', 'faculty'), async (req, res) => {
  try {
    const { subjectCode, grade, marks } = req.body;

    if (!subjectCode) {
      return res.status(400).json({ error: 'Subject code is required.' });
    }
    if (grade && !VALID_GRADES.includes(grade)) {
      return res.status(400).json({ error: `Invalid grade: ${grade}. Use: ${VALID_GRADES.join(', ')}` });
    }
    if (marks !== undefined && (typeof marks !== 'number' || marks < 0)) {
      return res.status(400).json({ error: 'Marks must be a non-negative number.' });
    }

    const record = await AcademicRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ error: 'Record not found.' });

    const subject = record.subjects.find(s => s.code === subjectCode);
    if (!subject) return res.status(404).json({ error: 'Subject not found.' });

    if (grade) subject.grade = grade;
    if (marks !== undefined) subject.marks = marks;

    record.gpa = calculateGPA(record.subjects);
    await record.save();

    const populated = await AcademicRecord.findById(record._id)
      .populate('student', 'name email studentId department');
    res.json(populated);
  } catch {
    res.status(500).json({ error: 'Failed to update grade.' });
  }
});

module.exports = router;
