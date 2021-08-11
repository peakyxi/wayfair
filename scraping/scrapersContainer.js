
import ProductScraper from './productScraper.js'
import Process from '../models/process.js'

class ScraperContainer {

    constructor() {
        return (async () => {

            this.scrapers = []
            await this.init()
            return this
        })()
    }
    init = async () => {
        const docs = await Process.find({}).exec()

        for (const doc of docs) {
            this.scrapers.push(await new ProductScraper(doc.belong))
        }


    }

    add = (scraper) => {
        this.scrapers.push(scraper)
    }
    get = async (id) => {
        const scraper = this.scrapers.find(scraper => scraper.id == id)
        return scraper
    }
    stop = async (id) => {
        const scraper = await this.get(id)
        if (scraper)
            await scraper.stop()
    }
    delete = async (id) => {
        const scraper = await this.get(id)
        if (scraper) {
            await scraper.delete()
            const index = this.scrapers.indexOf(scraper)
            this.scrapers.splice(index, 1)
        }

    }
    new = async (id) => {
        let scraper = await this.get(id)
        if (!scraper) {
            scraper = await new ProductScraper(id)
            this.add(scraper)
        }
        await scraper.setup()
        return scraper
    }

}



export default ScraperContainer