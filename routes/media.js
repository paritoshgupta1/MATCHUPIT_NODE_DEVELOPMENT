const express = require('express')
const router = express.Router()
const mediaCtrl = require('../controllers/media')
const authMiddleware = require('../middlewares/auth')
if (process.env.ENABLE_MEDIA_SERVICE === '1') {
  const fileUpload = require('../middlewares/multer').fileUpload // library
  router.post('/upload', authMiddleware.handleToken, fileUpload, mediaCtrl.upload)
} else {
  const upload = require('../mediaService/app').upload // from media service module
  const validateUpoadRequest = require('../mediaService/app').validateUpoadRequest
  router.post('/upload', authMiddleware.handleToken, validateUpoadRequest, upload.single('file'), // body param is file
    function (req, res, next) {
      let type = "";
      if (req.file.mimetype.startsWith("video")) {
        type = "video";
      } else if (req.file.mimetype.startsWith("image")) {
        type = "image";
      } else if (req.file.mimetype.startsWith("application")) {
        type = "document";
      } else if (req.file.mimetype.startsWith("audio")) {
        type = "audio";
      }
      res.send({ err: false, msg: 'File uploaded', fileUrl: req.file.location, type: type})
    })

  router.post('/upload/head-shot', authMiddleware.handleToken, mediaCtrl.uploadBase64)
}

module.exports = router
