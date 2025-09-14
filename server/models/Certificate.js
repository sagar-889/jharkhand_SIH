const mongoose = require('mongoose');

const CertificateSchema = new mongoose.Schema({
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  certificateType: { type: String },
  issuedAt: { type: Date, default: Date.now },
  validUntil: { type: Date },
  metadata: { type: Object }
});

module.exports = mongoose.model('Certificate', CertificateSchema);
