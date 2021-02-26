const mongoose = require('../../db').mongoose

const schema = new mongoose.Schema({
  user_id: mongoose.SchemaTypes.String,
  time_stamp: mongoose.SchemaTypes.Date,
  details: mongoose.SchemaTypes.Mixed
}, { versionKey: false })

const Payments = mongoose.model('payments', schema)

module.exports = Payments
