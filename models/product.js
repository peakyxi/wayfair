import mongoose from 'mongoose'

const schema = new mongoose.Schema({

    cateIds: { type: [String], default: [], required: true },
    cateNames: { type: [String], default: [], required: true }
}, { strict: false })

const Product = mongoose.model('product', schema)


export default Product