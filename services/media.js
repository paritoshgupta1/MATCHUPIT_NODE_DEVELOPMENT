
const fs = require('fs')
const MediaserviceUploadBase64 = require('../mediaService/app').uploadBase64
const responseObj = require('../helpers/response_handler').responseObj

function upload (userid, tempFilePath, originalFileName, uploadType) {
  return new Promise((resolve, reject) => {
    const request = require('request')
    var options = {
      url: `${process.env.MEDIA_SERVICE_BASE_URL}/media/upload`,
      headers: {
        secret: `${process.env.MEDIA_SERVICE_SECRET}`,
        userid: userid,
        'Content-Type': 'multipart/form-data;',
        type: uploadType
      },
      formData: {
        file: {
          value: fs.createReadStream(tempFilePath),
          options: {
            filename: originalFileName
          }
        }
      }
    }
    request.post(options, (err, response, body) => {
      if (err || response.statusCode !== 200) {
        reject((err && err.msg) || ((response && response.body) || 'Error in upload'))
      } else {
        let res
        try {
          res = JSON.parse(response.body)
        } catch (ex) {
          res = response.body
        }
        resolve(res)
      }
    })
  })
}

async function uploadBase64 (userid, base64, filename) {
  try {
    const response = await MediaserviceUploadBase64(userid, base64, filename)
    if (response && response.Location) {
      return responseObj(false, 200, 'Upload success', { location: response.Location })
    } else {
      return responseObj(true, 500, 'Upload failed')
    }
  } catch (ex) {
    return responseObj(true, 500, 'Upload failed')
  }
}

module.exports = {
  upload: upload,
  uploadBase64: uploadBase64
}
