import express from 'express'
import config from 'config'
import cors from 'cors'
import sockjs from 'sockjs'
import './db.js'
import category from './routes/category.js'
import Process from './models/process.js'
import process from './routes/process.js'

const port = config.get('port')

const app = express()

const echo = sockjs.createServer({ sockjs_url: 'http://cdn.jsdelivr.net/sockjs/1.0.1/sockjs.min.js' })

app.use(express.json())
app.use(cors())

app.use('/api/categories', category)

app.use('/api/processes', process)

const clients = {}

echo.on('connection', function (client) {
    clients[client.id] = client
    client.on('data', async function (message) {
        if (message === 'updateProcesses') {
            const result = await Process.find()
            Object.values(clients).filter(c => c.id !== client.id).forEach(c => c.write(JSON.stringify(result)))
        }

    });
    client.on('close', function () {
        delete clients[client.id]
    });

});




const server = app.listen(port, () => console.log(`listen on port ${port}`))
echo.installHandlers(server, { prefix: '/api/update' });







