
import Process from '../models/process'
import ProductScraper from './productScraper'
import sleep from 'sleep-promise'





(async () => {
    const ps = []
    const processes = await Process.find({ statusCode: 0 })
    console.log(processes)

    for (const process of processes) {
        const scraper = await new ProductScraper(process._id)
        const p = scraper.run()
        ps.push(p)
        await sleep(6000)
    }
    return Promise.all(ps)
})().then(() => {

    process.exit()
})


