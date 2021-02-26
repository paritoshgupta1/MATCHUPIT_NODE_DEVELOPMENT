const winston = require('winston')
const {timestamp, combine, prettyPrint, label, printf} = winston.format 
require('winston-daily-rotate-file')

module.exports = logger = winston.createLogger({
    format: combine(
        timestamp(),
        label({label: 'error_log'}),
        prettyPrint()
    ),
    transports: [
        new winston.transports.DailyRotateFile({
            filename: `logs/%DATE%_error.log`,
            datePattern: "DD.MM.YYYY",
            zippedArchive: true
        })
    ]
})