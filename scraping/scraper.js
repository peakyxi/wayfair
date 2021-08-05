import Puppeteer from './puppeteer.js'


import fs from 'fs'

class Scraper {
    constructor(id) {

        this.id = id
        this.puppeteer = null
        this.browser = null
        this.context = null
        this.pages = []
        // this.tempDir = 'temp'
        // this.userDataDir = `${this.tempDir}/temp_${id}`

    }
    init = async () => {
        const puppeteer = new Puppeteer()
        this.puppeteer = puppeteer

        const browser = await puppeteer.launch()
        const context = await browser.createIncognitoBrowserContext();
        await context.newPage()
        await context.newPage()
        this.browser = browser
        this.context = context
        this.pages = await context.pages()
        this.page = this.pages[0]
        this.page2 = this.pages[1]


    }
    createDirs = () => {
        if (!fs.existsSync(this.tempDir))
            fs.mkdirSync(this.tempDir)
    }




}

export default Scraper
