const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  // service: 'gmail',
  // host: "smtp.office365.com",
  host: "smtp.gmail.com",
  port: 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
})

// async function sendMail (payload) {
//   // send mail with defined transport object
//   let info = await transporter.sendMail({
//     from: '“Help Desk” help@codeinks.com', // sender address
//     to: 'ksudhircse@gmail.com', // list of receivers
//     subject: 'Codeinks Help', // Subject line
//     // text: 'Hello world?', // plain text body
//     html: '<b>Hello world?</b>' // html body
//   })

//   console.log('Message sent: %s', info.messageId)
// }

async function sendMail (payload) {
  // send mail with defined transport object
  const info = await transporter.sendMail({
    from: payload.from, // sender address
    to: payload.to, // list of receivers
    subject: payload.subject, // Subject line
    bcc: ['matchupit@gmail.com'],
    // text: 'Hello world?', // plain text body
    html: payload.html // html body
  })

  console.log('Message sent: %s', info.messageId)
}

module.exports = { sendMail: sendMail }
