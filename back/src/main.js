const bodyParser = require('body-parser')
const { config } = require('./config')
const express = require('express')
const routes = require('./contexts/routes')

const expressServer = express()

expressServer.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE')
  next()
})
/**
 * Health Check endpoints
 */
expressServer.get('/status', (req, res) => {
  res.status(200).end()
})

// Middleware that transforms the raw string of req.body into json
expressServer.use(bodyParser.json())

expressServer.use('/api', routes)

expressServer.listen(config.server.port, () => {
  console.log(`
    ################################################
    🛡️  Server listening on port: ${config.server.port} 🛡️ 
    ################################################
  `)
})
