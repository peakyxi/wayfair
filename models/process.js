import mongoose from 'mongoose'


const schema = new mongoose.Schema({
    "belong": { type: mongoose.Schema.Types.ObjectId, ref: 'category' },
    "statusCode": { type: Number, required: true, default: 1 },
    "status": { type: String, required: false, default: 'reset' },
    "error": { type: String, required: false, default: null },
    "position": { type: Object, required: false, default: { pageIndex: 0, listIndex: 0, itemIndex: 0 } },
    "updated": { type: Date, required: true, default: Date.now() }
})

const Process = mongoose.model('process', schema)

export default Process