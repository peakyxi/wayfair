import mongoose from 'mongoose'

const schema = new mongoose.Schema({

}, { strick: false })

const Product = mongoose.model('product', schema)


export default Product