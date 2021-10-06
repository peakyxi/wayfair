
import express from 'express'
import Process from '../models/process.js'
import Product from '../models/product.js'
import Category from '../models/category.js'






const router = express.Router();

const findLastCatesFromCategory = async (cid, cids = []) => {
    const childDocs = await Category.find({ parent: cid }).lean().exec()
    if (childDocs.length === 0) {
        cids.push(cid)
    }
    for (const child of childDocs) {
        await findLastCatesFromCategory(child._id, cids)
    }
    return cids
}

(async () => {



    router.get('/', (req, res) => {
        const { ids } = req.query
        let filter = {}
        if (ids) {
            filter = { _id: { $in: ids.split(',') } }
        }
        Process.find(filter)
            .populate('belong')
            .then(docs => {
                res.send(docs)
            })
    })

    router.post('/', async (req, res) => {
        const { cid } = req.body
        if (!cid) return res.status(404).send({ message: "Can't find category with specific category!" })
        let process = await Process.findOne({ belong: cid })
        if (process) return res.status(400).send({ message: "Scraper with given category has created!" })
        process = {
            belong: cid,
            statusCode: 1,
            status: "Initializing",
            error: null
        }
        Process.create(process)
            .then(process => {
                process.populate('belong', (err, process) => {
                    res.send(process)
                })
            })
            .catch(err => {
                res.status(400).send({ message: err.message })
            })


    })
    router.put('/:pid', async (req, res) => {
        const { pid } = req.params
        const { status } = req.body
        let process = await Process.findById(pid)
        if (!process)
            return res.status(400).send({ message: "Can't find the specific scraper!" })
        process.status = status
        process.updated = Date()
        process.save()
            .then(process => {
                process.populate('belong', (err, process) => {
                    res.send(process)
                })

            })
            .catch(err => res.status(400).send(err.message))

    })
    router.delete('/:pid', async (req, res) => {

        const { pid } = req.params
        const process = await Process.find({ _id: pid })
        if (!process)
            return res.status(400).send({ message: "Can't find the specific scraper!" })
        Process.deleteOne({ _id: pid })
            .then(info => res.send(info))
            .catch(err => {
                res.status(400).send(err.message)
            })


    })
    router.post('/download', async (req, res) => {

        const { cid } = req.body

        const cids = await findLastCatesFromCategory(cid)
        Product.find({ cateIds: { $in: cids } })
            .select('-url -cateIds -cateNames -sku -_id')
            .lean()
            .then(products => res.send(products))

    })




})()


export default router







