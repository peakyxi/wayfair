import mongoose from 'mongoose'


const schema = new mongoose.Schema({
    name: { type: String, required: true },
    url: { type: String, required: true },
    parent: { type: String, required: true, enum: ['mainCategory', 'subCategory', 'itemCategory'] },
    type: { type: String, required: true, enum: ['mainCategory', 'subCategory', 'itemCategory'] }
})

const Category = mongoose.model('category', schema)

export default Category