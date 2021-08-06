import Scraper from './scraper.js'
import Category from '../models/category.js'
import Product from '../models/product.js'
import Process from '../models/process.js'
import config from 'config'
const [proxyIp, proxyPort] = config.get('proxy').split(":")
class ProductScraper extends Scraper {
    constructor(id) {
        return (async () => {
            super(id)
            this.urls = []
            this.process = null
            this.pageIndex
            this.listIndex
            this.itemIndex


            return this
        })()
    }
    setup = async () => {
        // const { url } = await Category.findById(this.id)
        // this.url = url

        await this._updateProcess({ statusCode: 1, status: 'Runing', error: null }, true)

        const doc = await Category.findById(this.id).lean().exec()
        this.urls = await this.findUrlsInCategory(doc)

    }

    stop = async () => {
        if (this.browser)
            await this.browser.close()
        this._updateProcess({ statusCode: 0, status: 'Stopped', error: null })

    }
    delete = async () => {
        if (this.browser)
            await this.browser.close()

        return await Process.findOneAndRemove({ belong: this.id }).exec()
    }


    run = async () => {
        await this.init()
        try {

            return await this._run()
        } catch (err) {
            console.log(err)
            this._updateProcess({ statusCode: 0, status: 'Stopped', error: err.message })
            await this.browser.close()
        }
    }

    _run = async () => {
        for (const url of this.urls) {
            const pageUrls = await this.parsePage(url)
            for (const pageUrl of pageUrls) {
                const detailUrls = await this.parseList(pageUrl)
                for (const detailUrl of detailUrls) {
                    const detail = await this.parseDetail(detailUrl)
                    await this._saveProduct(detail)
                }
            }
        }
    }

    _updateProcess = async (process, upsert = false) => {
        const position = { pageIndex: this.pageIndex, listIndex: this.listIndex, itemIndex: this.itemIndex }
        process['position'] = position
        return Process.findOneAndUpdate({ belong: this.id }, process, { upsert, new: true, useFindAndModify: false })
            .populate('belong')
            .lean()
            .then(doc => {
                this.process = doc
            })

    }

    _saveProduct = async (detail) => {
        const product = new Product(detail)
        await product.save()
    }

    findUrlsInCategory = async (doc, urls = []) => {
        const childDocs = await Category.find({ parent: doc._id }).lean().exec()
        if (childDocs.length === 0) {
            urls.push(doc.url)
        }
        for (const child of childDocs) {
            await this.findUrlsInCategory(child, urls)
        }
        return urls
    }

    parseList = async (pageUrl) => {
        console.log('pageUrl', pageUrl)
        await this.gotoList(pageUrl)
        return await this._parseList()

    }

    gotoList = async (pageUrl) => {
        await this.page2.goto(pageUrl)
        while (this._isRecaptchaPage(this.page2)) {
            this.init()
            await this.page2.goto(pageUrl)
        }
    }

    _parseList = async () => {
        let urls = await this.page2.evaluate(() => [...document.querySelectorAll('#sbprodgrid > div > div')].slice(0, 48)
            .map(ele => ele.querySelector('a').href))
        return urls
    }
    parsePage = async (url) => {
        console.log('start url', url)
        await this.page2.goto(url)
        while (this._isRecaptchaPage(this.page2)) {
            this.init()
            await this.page2.goto(url)
        }
        const count = await this.page2.evaluate(() => [...document.querySelectorAll('.pl-Pagination > *')].map(ele => parseInt(ele.innerText)).filter(num => !!num).pop())
        let urls = [...Array(count)].map((_, i) => `${url}?curpage=${i + 1}`)

        return urls


    }
    parseDetail = async (detailUrl) => {
        await this.gotoDetail(detailUrl)
        return await this._parseDetail()
    }
    gotoDetail = async (url) => {
        console.log('detail url ', url)
        if (this.page.url() === url) return
        await this.page.goto(url)
        while (this._isRecaptchaPage(this.page)) {
            this.init()
            await this.page.goto(url)
        }
        await this.page.waitForFunction(() => !![...document.querySelectorAll('.Specifications h4')].find(ele => ele.innerText === 'Features'))
    }

    _parseDetail = async () => {
        const item = await this.page.evaluate(() => document.querySelector('.ProductDetailInfoBlock-header >h1').innerText)
        const description = await this.page.evaluate(() => document.querySelector('.OverviewPreviewExpansion').innerText.replace('See More', ''))
        const image_url = await this.page.evaluate(() => 'image url')
        const WeightsDimensions = await this.page.evaluate(() => {
            const prefix = 'Weights & Dimensions'
            return [...document.querySelectorAll('.ProductWeightsDimensions dl.pl-DescriptionList > dt')].reduce((ret, dt) => {
                const key = `${prefix} dt.innerText`
                const value = dt.nextElementSibling.innerText
                ret[key] = value
                return ret
            }, {})
        })
        const specifications = await this.page.evaluate(() => [...document.querySelectorAll('.Specifications-documentList > li >a')]
            .map(item => item.href).join(','))

        const features = await this.page.evaluate(() => {
            const titleEle = [...document.querySelectorAll('.Specifications h4')].find(ele => ele.innerText === 'Features')
            if (!titleEle) return null
            return [...titleEle.nextElementSibling.querySelectorAll('dl> dt')]
                .reduce((ret, item) => {
                    const key = item.innerText
                    const value = item.nextElementSibling.innerText
                    ret[key] = value
                    return ret
                }, {})
        })
        const assembly = await this.page.evaluate(() => {
            const titleEle = [...document.querySelectorAll('.Specifications h4')].find(ele => ele.innerText === 'Assembly')
            if (!titleEle) return null
            return [...titleEle.nextElementSibling.querySelectorAll('dl> dt')]
                .reduce((ret, item) => {
                    const key = item.innerText
                    const value = item.nextElementSibling.innerText
                    ret[key] = value
                    return ret
                }, {})
        })

        const warranty = await this.page.evaluate(() => {
            const titleEle = [...document.querySelectorAll('.Specifications h4')].find(ele => ele.innerText === 'Warranty')
            if (!titleEle) return null
            return [...titleEle.nextElementSibling.querySelectorAll('dl> dt')]
                .reduce((ret, item) => {
                    const key = item.innerText
                    const value = item.nextElementSibling.innerText
                    ret[key] = value
                    return ret
                }, {})
        })

        return { item, description, image_url, ...WeightsDimensions, specifications, ...features, ...assembly, ...warranty }


    }
    _isRecaptchaPage = (page) => {
        return !!page.url().match(/captcha/)
    }
}

export default ProductScraper