// const http = require('http')
// const path = require('path')
// const { exec } = require('child_process')

// const bodyParser = require('body-parser')
// const express = require('express')
// const ecstatic = require('ecstatic')
// const history = require('connect-history-api-fallback')

// const app = express()
// app.use(bodyParser.json())

// app.post('//update', (req, res) => {
//   console.log('pull start')
//   res.send('ok')
//   exec('git pull https://cafbe4d081c2ffc3015dc82f78b1c750d245d7fd@github.com/apulis/NewObjectLabel.git', (err, result) => {
//     if (!err) {
//       console.log('pull over')
//       exec('yarn build', (err, result) => {
//         if (!err) {
//           console.log('build over')
//         } else {
//           console.log('build err', err)
//         }
//       })
//     } else {
//       console.log('pull error', err)
//     }
//   })
// })
// app.use(history())

// app.use(ecstatic({ root: path.join(__dirname, './dist') }))

// http.createServer(app).listen(process.argv[2] || 3085)
