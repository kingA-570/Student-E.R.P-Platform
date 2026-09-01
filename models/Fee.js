const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  semester: { type: String, required: true },
  amount: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'paid', 'overdue'], default: 'pending' },
  paidAt: { type: Date },
  transactionId: { type: String },
  paymentMethod: { type: String, enum: ['card', 'upi', 'netbanking', 'cash'], default: 'upi' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Fee', feeSchema);
