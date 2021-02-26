const mongoose = require('../../db').mongoose

const schema = new mongoose.Schema({
  _id: mongoose.SchemaTypes.String,
  media: mongoose.SchemaTypes.Mixed,
  additional_info: mongoose.SchemaTypes.Mixed,
  social_links: mongoose.SchemaTypes.Mixed,
  address_details: mongoose.SchemaTypes.Mixed
}, { versionKey: false })

schema.index({ "address_details": "text" });

const CorporateProfile = mongoose.model('corporateProfiles', schema)

module.exports = CorporateProfile
