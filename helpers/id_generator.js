const uuidv1 = require('uuid/v1')

function generateId(prefix) {
  return prefix+'-'+uuidv1()
}

module.exports = {
  generateId: generateId
}