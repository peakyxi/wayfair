
import express from 'express'
import Process from '../models/process.js'
import Scrapers from '../scraping/scrapersContainer.js'
import Product from '../models/product.js'




const router = express.Router();

const findLastCatesFromCategory = async (cid, cids = []) => {
    const childDocs = await Category.find({ parent: cid }).lean().exec()
    if (childDocs.length === 0) {
        cids.push(cid)
    }
    for (const child of childDocs) {
        await this.findUrlsInCategory(child._id, cids)
    }
    return cids
}

(async () => {

    const scrapers = await new Scrapers()

    router.get('/', (req, res) => {
        const { ids } = req.query
        let filter = {}
        if (ids) {
            filter = { _id: { $in: ids.split(',') } }
        }
        Process.find(filter)
            .populate('belong')
            .lean()
            .then(docs => res.send(docs))
    })

    router.post('/scraping', async (req, res) => {
        const { cid } = req.body
        const scraper = await scrapers.new(cid)
        res.send(scraper.process)
        scraper.run()


    })
    router.post('/stop', async (req, res) => {
        const { cid } = req.body
        console.log(cid)
        await scrapers.stop(cid)



        res.send({ done: true })
    })
    router.post('/delete', async (req, res) => {

        const { cid } = req.body
        await scrapers.delete(cid)
        res.send({ done: true })

    })
    router.post('/download', async () => {

        const { cid } = req.body

        const cids = await findLastCatesFromCategory(cid)
        Product.find({ cateIds: { $in: cids } })
            .select('-url')
            .lean()
            .then(products => res.send(products))

    })




})()


export default router







