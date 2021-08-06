import mongoose from 'mongoose'

const schema = new mongoose.Schema({

})

const Product = mongoose.model('product', schema, { strick: false })


export default Product