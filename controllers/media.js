const mediaService = require('../services/media')
const sendResponse = require('../helpers/response_handler').sendResponse

const upload = async (req, res) => {
  try {
    const userid = req.tokenUser.data.id
    const tempFilePath = req.file.path
    const originalFileName = req.file.originalname
    const uploadType = req.headers.type
    if (!userid) {
      res.status(400).send({ err: true, msg: 'user id is missing in request' })
    }
    if (!tempFilePath) {
      res.status(500).send({ err: true, msg: 'Error in file upload (temp file creation failed)' })
    }
    if (!uploadType) {
      res.status(400).send({ err: true, msg: 'type body param is missing' })
    }
    const result = await mediaService.upload(userid, tempFilePath, originalFileName, uploadType)
    res.send(result)
  } catch (ex1) {
    console.log(ex1)
    let parsedRes = {}
    try {
      parsedRes = JSON.parse(ex1)
      return sendResponse({err: true, responseCode: 500, msg: parsedRes, err_stack: ex1.stack},res)
    } catch (ex2) {
      parsedRes = ex1
      return sendResponse({err: true, responseCode: 500, msg: parsedRes, err_stack: ex2.stack},res)
    }
  }
}

const uploadBase64 = async (req, res) => {
  try {
    const userid = req.tokenUser.data.id
    const filename = req.body.filename
    const base64 = req.body.file
    if (!userid) {
      res.status(400).send({ err: true, msg: 'userid is missing in req' })
    }
    if (!filename || !base64) {
      res.status(400).send({ err: true, msg: 'filename,base64  is mandatory body params' })
    }
    const serviceResponse = await mediaService.uploadBase64(userid, base64, filename)
    sendResponse(serviceResponse, res)
  } catch (ex) {
    console.log(ex)
    return sendResponse({ err: true,responseCode: 500, msg: 'internal server error' ,err_stack: ex.stack },res)
  }
}

module.exports = {
  upload: upload,
  uploadBase64: uploadBase64
}
