import express from 'express'
import config from 'config'
import cors from 'cors'
import './db.js'
import category from './routes/category.js'

import process from './routes/process.js'

const port = config.get('port')

const app = express()

app.use(express.json())
app.use(cors())

app.use('/api/categories', category)

app.use('/api/processes', process)



app.listen(port, () => console.log(`listen on port ${port}`))







