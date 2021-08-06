import mongoose from 'mongoose'

const schema = new mongoose.Schema({

}, { strict: false })

const Product = mongoose.model('product', schema)


export default Product