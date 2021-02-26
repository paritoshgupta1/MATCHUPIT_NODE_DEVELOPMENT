const Sequelize = require('sequelize')
const mongoose = require('mongoose')
const dbConfig = require('../config/db.json')[process.env.ENV]
console.log('..................-------------....................')
console.log('.................| DB CONFIG |.....................')
console.log('..................-------------....................')
console.log(dbConfig)
const sequelize = new Sequelize(dbConfig.mysql.db_name, dbConfig.mysql.user_name, dbConfig.mysql.password, {
  host: dbConfig.mysql.host,
  dialect: 'mysql',
  port: dbConfig.mysql.port,
  pool: dbConfig.mysql.pool
})

sequelize
  .authenticate()
  .then(() => {
    console.log('MySQL Connected')
  })
  .catch(err => {
    console.error('MySql connection error', err)
  })


mongoose.connect(dbConfig.mongo.connection_str, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false })
var mongo = mongoose.connection
mongo.on('error', console.error.bind(console, 'Mongo connection error'))
mongo.once('open', function () {
  console.log('MongoDB connected')
})

module.exports = {
  sequelize: sequelize,
  Sequelize: Sequelize,
  mongoose: mongoose
}
