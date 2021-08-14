import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
puppeteer.use(StealthPlugin())
import config from 'config'
const proxyServer = config.get('proxy')
const chromePath = config.get('chrome_path')
const headless = config.get('headless') === 'true'
const userAgent = config.get('userAgent')

const args = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-infobars",
    "--window-position=0,0",
    "--ignore-certifcate-errors",
    "--ignore-certifcate-errors-spki-list",
    `--user-agent="${userAgent}"`,
    `--proxy-server=${proxyServer}`
]

class Scraper {
    constructor(id) {

        this.id = id
        this.browser = null
        this.pages = []

    }
    init = async () => {
        if (this.browser) {
            await this.browser.close()
        }
        const browser = await puppeteer.launch({ ignoreHTTPSErrors: true, executablePath: chromePath, headless: headless, defaultViewport: null, args })
        this.browser = browser
        await browser.newPage()
        this.pages = await browser.pages()
        this.page = this.pages[0]
        await this.page.authenticate('', '');
        this.page2 = this.pages[1]
        await this.page2.authenticate('', '');
    }

    goto = async (page, url) => {
        try {
            await page.goto(url, { waitUntil: "networkidle2" })

        } catch (err) {
            console.log(err)
            if (!!err.message.match(/Navigation timeout of/))
                return await this.goto(page, url)
            return 'unhandle'
        }

    }
    waitForFunction = (() => {
        let counter = 0
        return async (page, url, fun) => {
            try {
                await page.waitForFunction(fun, { polling: 1000 })
                counter = 0
            } catch (err) {
                counter++
                if (counter >= 5) {
                    counter = 0
                    return
                }
                await this.goto(page, url)
                await this.waitForFunction(page, url, fun)
            }
        }

    })()




}

export default Scraper
