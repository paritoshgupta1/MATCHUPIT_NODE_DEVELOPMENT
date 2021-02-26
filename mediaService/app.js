const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const http = require('http')
const multer = require('multer')
const multerS3 = require('multer-s3')
const path = require('path')
const config = require('./config.js')
const app = express()
app.use(cors())
app.use(bodyParser.json())
const port = config.port || '3000'
app.set('port', port)
// var server = http.createServer(app)

// server.listen(port, '0.0.0.0')
// server.on('error', (err) => {
//   console.log('Error ', err)
// })

// server.on('listening', () => {
//   console.log('Mediaservice is listeining on', port)
// })

app.get('/', (req, res) => {
  res.send({ msg: 'Response from Media Service running on ' + port })
})

const AWS = require('aws-sdk')

const s3 = new AWS.S3({
  accessKeyId: config.S3AccessKeyID,
  secretAccessKey: config.S3SecretAccessKey
})

var upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: config.bucketName,
    acl: config.acl,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname })
    },
    key: function (req, file, cb) {
      // const key = `${req.headers.userid}/${new Date().getTime() + '_' + file.originalname.split(' ').join('_')}`
      // console.log('keyyy', key, 'original Name', file.originalname, "FileObj", file)
      // cb(null, key)
      if (path.extname(file.originalname.split(' ').join('_'))) {
        const key = `${req.headers.userid}/${new Date().getTime() + '_' + file.originalname.split(' ').join('_')}`
        console.log('keyyy in If', key, 'original Name', file.originalname, "FileObj", file)
        cb(null, key)
      }
      else {
        const key = `${req.headers.userid}/${new Date().getTime() + '_' + file.originalname.split(' ').join('_')}.webm`
        console.log('keyyy in else', key, 'original Name', file.originalname, "FileObj", file)
        cb(null, key)
      }
    }
  }),
  limits: {
    fileSize: config.allowedFileSize
  },
  fileFilter: (req, file, callback) => {
    var ext = path.extname(file.originalname)
    console.log('===========', ext, req.headers.type)
    // for image types
    if (req.headers.type === 'image') {
      if (ext === '.png' || ext === '.PNG' || ext === '.JPEG' || ext === '.JPG' || ext === '.jpg' || ext === '.jpeg') {
        return callback(null, true)
      } else {
        return callback(new Error('Allowed image types are jpg, jpeg and png!'))
      }
    } else if (req.headers.type === 'video') {
      return callback(null, true)
    } else if (req.headers.type === 'document') {
      if (ext === '.docx' || ext === '.DOCX' ||ext === '.PDF' || ext === '.pdf') {
        return callback(null, true)
      } else {
        return callback(new Error('Allowed document type is docx and pdf!'))
      }
    } else if (req.headers.type === 'audio') {
      if (ext === '.mp3' || ext === '.aac' || ext === '.wac' || ext === '.wav' || ext === '.MP3' || ext === '.AAC' || ext === '.WAC' || ext === '.WAV') {
        return callback(null, true)
      } else {
        return callback(new Error('Allowed audio types are mp3, aac, wav and wac!'))
      }
    } else if (req.headers.type === 'attachment') {
      if (ext === '.docx' || ext === '.pdf' || ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.mp4' || ext === '.flv' || ext === '.3gp' || ext === '.wmv' || ext === '.ogg' || ext === '.mkv' || ext === '.mp3' || ext === '.aac' || ext === '.wac' || ext === '.wav' || ext === '.DOCX' || ext === '.PDF' || ext === '.PNG' || ext === '.JPG' || ext === '.JPEG' || ext === '.MP4' || ext === '.FLV' || ext === '.3GP' || ext === '.WMV' || ext === '.OGG' || ext === '.MKV' || ext === '.MP3' || ext === '.AAC' || ext === '.WAC' || ext === '.WAV' || ext === ".txt" || ext === ".TXT") {
        return callback(null, true)
      } else {
        return callback(new Error('Allowed extensions are jpg, jpeg, docx, pdf, mp3, aac, wac, mp4, flv, 3gp, txt, wmv, ogg, mkv!'))
      }
    }
    else if (req.headers.type === 'allAttachments') {
      if ((ext === '.docx' || ext === '.pdf' || ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.mp4' || ext === '.flv' || ext === '.3gp' || ext === '.wmv' || ext === '.ogg' || ext === '.mkv' || ext === '.mp3' || ext === '.aac' || ext === '.wac' || ext === '.wav' || ext === '.xls' || ext === '.xlsx' || ext === '.ppt' || ext === '.pptx' || ext === '.doc' || ext === '.DOCX' || ext === '.PDF' || ext === '.PNG' || ext === '.JPG' || ext === '.JPEG' || ext === '.MP4' || ext === '.FLV' || ext === '.3GP' || ext === '.WMV' || ext === '.OGG' || ext === '.MKV' || ext === '.MP3' || ext === '.AAC' || ext === '.WAC' || ext === '.WAV' || ext === '.XLS' || ext === '.XLSX' || ext === '.PPT' || ext === '.PPTX' || ext === '.DOC' || ext === ".txt" || ext === ".TXT") && ext !== ".exe" && ext !== ".EXE") {
        return callback(null, true)
      } else {
        return callback(new Error('Allowed extensions are jpg, jpeg, docx, doc, ppt, pptx, xls, png, txt, xlsx, pdf, mp3, wav, aac, wac, mp4, flv, 3gp, wmv, ogg, mkv!'))
      }
    }
    else if (req.headers.type === 'videopdf') {
      if ((ext === '.mp4' || ext === '.MP4' || ext === '.3gp' || ext === '.3GP' || ext === '.ogg' || ext === '.OGG' || ext === '.wmv' || ext === '.WMV' || ext === '.flv' || ext === '.FLV' || ext === '.PDF' || ext === '.pdf' || ext === '.avi' || ext === '.AVI' || ext === '.hdv' || ext === '.HDV')) {
        return callback(null, true)
      } else {
        return callback(new Error('Allowed extensions are mp4, 3gp, ogg, wmv, flv!'))
      }
    }
    else {
      callback(new Error('Unknown upload type'))
    }
  }
})

function uploadBase64(userid, base64, filename) {
  try {
    const type = base64.split(';')[0].split('/')[1]
    let base64Data;
    if (type == 'webm') {
      base64Data = new Buffer.from(base64.replace(/^data:video\/\w+;base64,/, ''), 'base64')
    } else {
      base64Data = new Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ''), 'base64')
    }

    const params = {
      Bucket: config.bucketName,
      Key: `${userid}/${new Date().getTime()}_${filename}.${type}`,
      Body: base64Data,
      ACL: config.acl,
      ContentEncoding: 'base64', // required
      ContentType: (type == 'webm') ? `video/${type}` : `image/${type}` // required. Notice the back ticks
    }

    return new Promise((resolve, reject) => {
      s3.upload(params, (err, data) => {
        if (err) {
          reject(err)
        } else {
          resolve(data)
        }
      })
    })
  } catch (ex) {
    return ''
  }
}

app.post('/media/upload', validateUpoadRequest, authMiddleware, upload.single('file'), // body param is file
  function (req, res, next) {
    res.send({ err: false, msg: 'File uploaded', fileUrl: req.file.location })
  })

function validateUpoadRequest(req, res, next) {
  console.log('req.headers.userid', req.headers.userid, req.headers.type)
  if (!req.headers.userid) {
    return res.status(400).send({ err: true, msg: 'userid header is missing' })
  } if (!['image', 'document', 'video', "attachment", "audio", "allAttachments", "videopdf"].includes(req.headers.type)) {
    return res.status(400).send({ err: true, msg: 'Unknown upload type' })
  } else {
    next()
  }
}

function authMiddleware(req, res, next) {
  const reqSecret = req.headers.secret
  if (reqSecret !== config.secret) {
    return res.status(400).send({ err: true, msg: 'invalid secret' })
  } else {
    next()
  }
}

module.exports = {
  upload: upload,
  uploadBase64: uploadBase64,
  validateUpoadRequest: validateUpoadRequest
}
