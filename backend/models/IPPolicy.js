const mongoose = require('mongoose');

const ipPolicySchema = new mongoose.Schema({
  ipAddress: {
    type: String,
    required: true,
    unique: true,
  },
  type: {
    type: String,
    enum: ['whitelist', 'blacklist'],
    required: true,
  },
  description: {
    type: String,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('IPPolicy', ipPolicySchema);
