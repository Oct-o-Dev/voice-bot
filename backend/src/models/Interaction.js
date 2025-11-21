// backend/src/models/Interaction.js
const mongoose = require('mongoose');

const InteractionSchema = new mongoose.Schema({
  conversationId: { type: String, required: true, index: true },
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  text: { type: String, required: true },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Interaction || mongoose.model('Interaction', InteractionSchema);
