
import express from 'express'
import Process from '../models/process.js'
import Scrapers from '../scraping/scrapersContainer.js'


const router = express.Router();

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




})()


export default router







