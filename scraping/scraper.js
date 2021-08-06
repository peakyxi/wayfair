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
        if (this.browser) {
            await this.browser.close()
            this.puppeteer = null
        }
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
    goto = async (page, url) => {
        try {
            await page.goto(url, { waitUntil: "networkidle2" })

        } catch (err) {
            console.log(err)
            if (!!err.message.match(/Navigation timeout of|ERR_CONNECTION_RESET/))
                return await this.goto(page, url)
            return await this.browser.close()


        }

    }
    waitForFunction = async (page, url, fun) => {
        try {
            await page.waitForFunction(fun)
        } catch (err) {
            await this.goto(page, url)
            await this.waitForFunction(page, url, fun)
        }
    }




}

export default Scraper
