const mongoose = require('../../db').mongoose

const schema = new mongoose.Schema({
  email: mongoose.SchemaTypes.String,
  otp: mongoose.SchemaTypes.String,
  expiry: mongoose.SchemaTypes.String,
  user_id: mongoose.SchemaTypes.String,
  type: mongoose.SchemaTypes.String,
  email_verified: mongoose.SchemaTypes.Boolean
}, { versionKey: false })

const Questionnaire = mongoose.model('otps', schema)

module.exports = Questionnaire
