import mongoose from 'mongoose'
import config from 'config'
const db = config.get('db')
mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true })