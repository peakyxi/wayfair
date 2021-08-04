import puppet from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
puppet.use(StealthPlugin())
import config from 'config'
const chromePath = config.get('chrome_path')
const headless = config.get('headless')
class Puppeteer {

    args = [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-infobars",
        "--window-position=0,0",
        "--ignore-certifcate-errors",
        "--ignore-certifcate-errors-spki-list",
        '--user-agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36"'
    ]
    options = {
        ignoreHTTPSErrors: true,
        userDataDir: '',
        executablePath: chromePath,
        headless: headless,
        defaultViewport: null,
        args: this.args
    }
    launch = (userDataDir) => {
        const options = { ...this.options, userDataDir }
        return puppet.launch(options)
    }
}

export default Puppeteer