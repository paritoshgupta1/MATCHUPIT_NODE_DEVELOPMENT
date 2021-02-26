
const jwt = require('jsonwebtoken')
function generateJWT (data) {
  const token = jwt.sign({
    data: data
  }, process.env.JWT_SECRET, { expiresIn: parseInt(process.env.JWT_EXPIRY) }) // Expires in secs
  return token
}

function verifyJWT (token) {
  try {
    const data = jwt.verify(token, process.env.JWT_SECRET)
    return data
  } catch (ex) {
    console.log(ex, 'jwt error')
    return false
  }
}

module.exports = {
  generateJWT: generateJWT,
  verifyJWT: verifyJWT
}
