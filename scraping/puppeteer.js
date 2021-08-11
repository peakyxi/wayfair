import puppet from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import pluginProxy from 'puppeteer-extra-plugin-proxy'
puppet.use(StealthPlugin())
import config from 'config'
const [proxyIp, proxyPort] = config.get('proxy').split(":")

const chromePath = config.get('chrome_path')
const headless = config.get('headless') === 'true'
const userAgent = config.get('userAgent')
class Puppeteer {
    constructor() {

        this.setProxy()
    }

    args = [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-infobars",
        "--window-position=0,0",
        "--ignore-certifcate-errors",
        "--ignore-certifcate-errors-spki-list",
        `--user-agent="${userAgent}"`
    ]
    options = {
        ignoreHTTPSErrors: true,
        executablePath: chromePath,
        headless: headless,
        defaultViewport: null,
        args: this.args
    }
    launch = () => {

        return puppet.launch(this.options)
    }
    setProxy = () => {

        puppet.use(pluginProxy({
            address: proxyIp,
            port: proxyPort

        }))
    }
}

export default Puppeteer