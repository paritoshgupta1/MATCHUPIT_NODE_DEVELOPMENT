const mongoose = require('../../db').mongoose

const schema = new mongoose.Schema({
  skills: [mongoose.SchemaTypes.String]
}, { versionKey: false })

const Skills = mongoose.model('skills', schema)

module.exports = Skills
