const express = require('express');
const Fee = require('../models/Fee');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

function generateTxnId() {
  return 'TXN' + Date.now() + Math.random().toString(36).substring(2, 8).toUpperCase();
}

router.get('/', auth, async (req, res) => {
  try {
    const filter = req.user.role === 'student' ? { student: req.user.id } : {};
    const fees = await Fee.find(filter).populate('student', 'name email studentId').sort({ dueDate: -1 });
    res.json(fees);
  } catch {
    res.status(500).json({ error: 'Failed to fetch fees.' });
  }
});

router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { studentId, semester, amount, dueDate } = req.body;
    if (!studentId || !semester || !amount) {
      return res.status(400).json({ error: 'Student, semester and amount are required.' });
    }
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount.' });
    }
    const fee = await Fee.create({ student: studentId, semester, amount, dueDate });
    res.status(201).json(fee);
  } catch {
    res.status(500).json({ error: 'Failed to create fee.' });
  }
});

router.post('/:id/pay', auth, authorize('student'), async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id);
    if (!fee) return res.status(404).json({ error: 'Fee not found.' });
    if (fee.student.toString() !== req.user.id) return res.status(403).json({ error: 'Access denied.' });
    if (fee.status === 'paid') return res.status(400).json({ error: 'Already paid.' });

    const { paymentMethod } = req.body;
    fee.status = 'paid';
    fee.paidAt = new Date();
    fee.transactionId = generateTxnId();
    fee.paymentMethod = paymentMethod || 'upi';
    await fee.save();

    res.json({ message: 'Payment successful!', fee });
  } catch {
    res.status(500).json({ error: 'Payment processing failed.' });
  }
});

router.get('/summary', auth, async (req, res) => {
  try {
    const filter = req.user.role === 'student' ? { student: req.user.id } : {};
    const fees = await Fee.find(filter);
    const summary = {
      total: fees.length,
      paid: fees.filter(f => f.status === 'paid').length,
      pending: fees.filter(f => f.status === 'pending').length,
      overdue: fees.filter(f => f.status === 'overdue').length,
      totalAmount: fees.reduce((s, f) => s + f.amount, 0),
      paidAmount: fees.filter(f => f.status === 'paid').reduce((s, f) => s + f.amount, 0),
      pendingAmount: fees.filter(f => f.status !== 'paid').reduce((s, f) => s + f.amount, 0)
    };
    res.json(summary);
  } catch {
    res.status(500).json({ error: 'Failed to fetch fee summary.' });
  }
});

module.exports = router;
