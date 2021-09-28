
import express from 'express'
import category from '../models/category.js'
import CategoryScraper from '../scraping/categoryScraper.js'
import Process from '../models/process.js'

const router = express.Router()


let scraper;

router.get('/', (req, res) => {

    category.find()
        .then(data => res.send(data))
})
router.get('/parent/:pid', (req, res) => {
    const pid = req.params.pid
    category.find({ parent: pid })
        .then(data => res.send(data))

})
router.get('/:cid', (req, res) => {
    const cid = req.params.cid
    category.findById(cid)
        .then(data => res.send(data))
})



router.post('/scraping/reset', async (req, res) => {
    if (scraper) await scraper.reset()
    Status.findOneAndUpdate({ action: 'categoryScraper' }, {
        statusCode: -2,
        status: "Reseted",
        error: null
    }, { upsert: true, new: true })
        .then(doc => res.send(doc))

})


router.post('/scraping', async (req, res) => {
    if (scraper) return res.send({ status: "running" })
    scraper = await new CategoryScraper("1")
    res.send({ status: "running" })
    scraper.run()
        .then(() => process.exit())

})


export default router







