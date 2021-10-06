import mongoose from 'mongoose'


const schema = new mongoose.Schema({
    "belong": { type: mongoose.Schema.Types.ObjectId, ref: 'category' },
    "statusCode": { type: Number, required: true, default: 1 },
    "status": { type: String, required: true, enum: ["Initializing", "Running", "Stopping", "Stopped"] },
    "error": { type: String, required: false, default: null },
    "position": { type: Object, required: true, default: { urlIndex: 0, pageIndex: 0, itemIndex: 0 } },
    "created": { type: String, required: true, default: Date() },
    "updated": { type: String, required: true, default: Date() }
}, { toJSON: { virtuals: true } })

schema.virtual("created_short").get(function () {
    return new Date(this.created).toLocaleString("en-US")
})
schema.virtual("updated_short").get(function () {
    return new Date(this.updated).toLocaleString("en-US")
})
schema.virtual("disabled").get(function () {
    return ["Stopping", "Initializing"].includes(this.status)
})
const Process = mongoose.model('process', schema)

export default Process