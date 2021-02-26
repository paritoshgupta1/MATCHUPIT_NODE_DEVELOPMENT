const multer = require('multer')

var fileUpload = multer({ dest: './tmp/' }).single('file')


module.exports = {
  fileUpload: fileUpload
}