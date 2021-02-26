const mongoose = require('../../db').mongoose
mongoose.set('useCreateIndex', true)

const schema = new mongoose.Schema({
  _id: mongoose.SchemaTypes.String,
  personal_details: mongoose.SchemaTypes.Mixed,
  education: mongoose.SchemaTypes.Mixed,
  certifications: mongoose.SchemaTypes.Mixed,
  work_experience: mongoose.SchemaTypes.Mixed,
  board_experience: mongoose.SchemaTypes.Mixed,
  user_consent: mongoose.SchemaTypes.Mixed,
  media: mongoose.SchemaTypes.Mixed, //  for media urls (documents, certificates etc)
  social_links: mongoose.SchemaTypes.Mixed,
  additional_info: mongoose.SchemaTypes.Mixed
}, { versionKey: false })

// schema.index({ 'work_experience.industry': 'text', 'work_experience.jobTitles': 'text', 'work_experience.designation': 'text', 'work_experience.skills': 'text', 'work_experience.aboutMe': 'text' })

schema.index({ '$**':'text' })

const UserProfiles = mongoose.model('userProfiles', schema)

module.exports = UserProfiles
