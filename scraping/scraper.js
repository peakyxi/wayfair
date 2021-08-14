import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
puppeteer.use(StealthPlugin())
import pluginProxy from 'puppeteer-extra-plugin-proxy'
import config from 'config'
const [proxyIp, proxyPort] = config.get('proxy').split(":")
puppeteer.use(pluginProxy({ address: proxyIp, port: proxyPort, credentials: { username: '', password: '' } }))
const chromePath = config.get('chrome_path')
const headless = config.get('headless') === 'true'
const userAgent = config.get('userAgent')

args = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-infobars",
    "--window-position=0,0",
    "--ignore-certifcate-errors",
    "--ignore-certifcate-errors-spki-list",
    `--user-agent="${userAgent}"`
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
        this.pages = await browser.pages()
        this.page = this.pages[0]
        this.page2 = this.pages[1]
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
