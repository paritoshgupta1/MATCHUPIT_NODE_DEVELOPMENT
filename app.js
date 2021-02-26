var createError = require('http-errors')
var express = require('express')
var path = require('path')
var cookieParser = require('cookie-parser')
var logger = require('morgan')
var cors = require('cors')
const compression = require('compression');
var indexRouter = require('./routes/index')
var usersRouter = require('./routes/user')
var questionnaireRouter = require('./routes/questionnaire')
var socialAccountRouter = require('./routes/social-account')
var countriesRouter = require('./routes/countries')
var mediaRouter = require('./routes/media')
var industryRoutes = require('./routes/industry')
var paymentRoutes = require('./routes/payments')
const communityRoutes = require('./routes/community');
const conversationRoutes = require('./routes/conversation');
const corporateRoutes = require('./routes/corporate');
const adminRouter = require('./routes/admin')

var app = express()
app.use(cors())

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public'),{ dotfiles: 'allow' }))

if (process.env.NODE_ENV !== 'development') {
  var helmet = require('helmet')
  app.use(helmet())
}

require('./db/index')
require('./models/index');
function shouldCompress(req, res) {
  if (req.headers["x-no-compression"]) {
    // don't compress responses with this request header
    return false;
  }
  // fallback to standard filter function
  return compression.filter(req, res);
}
app.use(compression({ filter: shouldCompress, level: 7, threshold: 0 }));

// Routes
app.use('/', indexRouter)
app.use('/social-account', socialAccountRouter)
app.use('/user', usersRouter)
app.use('/questionnaire', questionnaireRouter)
app.use('/countries', countriesRouter)
app.use('/media', mediaRouter)
app.use('/industry', industryRoutes)
app.use('/payments', paymentRoutes)
app.use('/community', communityRoutes)
app.use('/conversation', conversationRoutes)
app.use('/corporate', corporateRoutes)
app.use('/admin', adminRouter)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404))
})

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('error')
})

module.exports = app
