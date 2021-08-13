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
            this.cates = []
            this.process = null
            this.position = {}
            return this
        })()
    }
    setup = async () => {


        await this._updateProcess({ statusCode: 1, status: 'Runing', error: null }, true)
        this.position = this.process.position
        const doc = await Category.findById(this.id).lean().exec()
        this.cates = await this.findLastCatesFromCategory(doc)

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
            return await this.run()
        }
    }

    _run = async () => {
        for (const { url, name: cateName, _id: cateId } of this.cates) {

            const { pageUrls, resultsCount } = await this.parsePage(url)
            for (const pageUrl of pageUrls) {
                const detailUrls = await this.parseList(pageUrl)
                console.log('detail count', detailUrls.length)
                for (const detailUrl of detailUrls) {
                    const detail = await this.parseDetail(detailUrl)
                    await this._saveProduct(detail, cateName, cateId)
                    this.itemIndex++
                }
                this.itemIndex = 0
                this.pageIndex++
            }
            this.pageIndex = 0
            this.urlIndex++

        }
    }

    set urlIndex(value) {
        this.position['urlIndex'] = value
        this._updateProcess({ position: this.position })
    }
    get urlIndex() {
        return this.position['urlIndex']
    }
    set pageIndex(value) {
        this.position['pageIndex'] = value
        this._updateProcess({ position: this.position })
    }
    get pageIndex() {
        return this.position['pageIndex']
    }
    set itemIndex(value) {
        this.position['itemIndex'] = value
        this._updateProcess({ position: this.position })
    }
    get itemIndex() {
        return this.position['itemIndex']
    }

    _updateProcess = async (process, upsert = false) => {
        return Process.findOneAndUpdate({ belong: this.id }, process, { upsert, new: true, useFindAndModify: false })
            .populate('belong')
            .lean()
            .then(doc => {
                this.process = doc

            })

    }

    _saveProduct = async (detail, cateName, cateId) => {

        cateId = cateId.toString()

        Product.findOneAndUpdate({ sku: detail.sku }, { ...detail, $addToSet: { cateIds: cateId, cateNames: cateName } }, { upsert: true, new: true, useFindAndModify: false })
            .then(doc => console.log(doc))
            .catch(err => console.log('SaveError:', err.message))
    }

    findLastCatesFromCategory = async (doc, cates = []) => {
        const childDocs = await Category.find({ parent: doc._id }).lean().exec()
        if (childDocs.length === 0) {
            cates.push(doc)
        }
        for (const child of childDocs) {
            await this.findLastCatesFromCategory(child, cates)
        }
        return cates.slice(this.urlIndex)
    }

    parseList = async (pageUrl) => {
        console.log('pageUrl', pageUrl)
        await this.gotoList(pageUrl)
        return await this._parseList()

    }

    gotoList = async (pageUrl) => {
        let handled = await this.goto(this.page2, pageUrl)
        while (handled === "unhandle" || this._isRecaptchaPage(this.page2)) {
            await this.init()
            handled = await this.goto(this.page2, pageUrl)
        }
        await this.page2.bringToFront()
        await this.page2.click('span.pl-Pagination-ellipsis')
        await this.waitForFunction(this.page2, pageUrl, () => {
            const notLast = [...document.querySelector('nav.pl-Pagination').children].pop().tagName === 'A'
            if (notLast) {
                const type1Grid = document.querySelector('#sbprodgrid').innerText
                if (type1Grid) {
                    return [...document.querySelector('#sbprodgrid > div').children]
                        .slice(0, -3).length === 48

                } else {
                    return [...document.querySelector('h1.pl-Heading--pageTitle').closest('#bd').querySelector('.pl-Grid').children]
                        .slice(0, -3).length === 48
                }
            }
            return true
        })

    }

    _parseList = async () => {

        let urls = await this.page2.evaluate(() => {
            const type1Grid = document.querySelector('#sbprodgrid').innerText
            if (type1Grid) {
                return [...document.querySelector('#sbprodgrid > div').children].slice(0, -3)
                    .map(ele => ele.querySelector('a').href)
            } else {
                return [...document.querySelector('h1.pl-Heading--pageTitle').closest('#bd').querySelector('.pl-Grid').children].slice(0, -3)
                    .map(ele => ele.querySelector('a').href)
            }

        })
        const list = urls.map(urlItem => {
            const objUrl = new URL(urlItem)
            const url = objUrl.origin + objUrl.pathname
            return url
        })
        return list.slice(this.itemIndex)
    }
    parsePage = async (url) => {
        console.log('start url', url)
        let handled = await this.goto(this.page2, url)
        while (handled === "unhandle" || this._isRecaptchaPage(this.page2)) {
            await this.init()
            handled = await this.goto(this.page2, url)
        }
        const count = await this.page2.evaluate(() => [...document.querySelectorAll('.pl-Pagination > *')].map(ele => parseInt(ele.innerText)).filter(num => !!num).pop())
        let pageUrls = [...Array(count)].map((_, i) => `${url}?curpage=${i + 1}`)
        const resultsCount = await this.page2.$eval('.ResultsCount', (ele) => ele.innerText.replace(',', '').replace(/.*?(\d+) Results/, '$1'))
        pageUrls = pageUrls.slice(this.pageIndex)
        return { pageUrls, resultsCount }


    }
    parseDetail = async (detailUrl) => {
        await this.gotoDetail(detailUrl)
        return await this._parseDetail(detailUrl)
    }
    gotoDetail = async (url) => {
        console.log('detail url ', url)
        let handled = await this.goto(this.page, url)
        while (handled === "unhandle" || this._isRecaptchaPage(this.page)) {
            await this.init()
            handled = await this.goto(this.page, url)
        }
        await this.page.bringToFront()
        // await this.waitForFunction(this.page, url, () => !![...document.querySelectorAll('button')].find(ele => ele.innerText === 'See More'))
        // await this.page.evaluate(() => [...document.querySelectorAll('button')].find(ele => ele.innerText === 'See More').click())
        // await this.waitForFunction(this.page, url, () => !![...document.querySelectorAll('.Specifications h4')].find(ele => ele.innerText === 'Features'))
    }

    _parseDetail = async (detailUrl) => {

        await this.waitForFunction(this.page, detailUrl, () => !!document.querySelector('.ProductDetailInfoBlock-header >h1'))
        await this.waitForFunction(this.page, detailUrl, () => !!document.querySelector('.ProductDetailImageCarouselVariantB-carousel > li img'))
        const item = await this.page.evaluate(() => document.querySelector('.ProductDetailInfoBlock-header >h1').innerText)
        const sku = await this.page.evaluate(() => document.querySelector('nav.Breadcrumbs').innerText.replace(/.+\/SKU:([^\/]+).*/, '$1').trim())
        const description = await this.page.evaluate(() => document.querySelector('.OverviewPreviewExpansion').innerText.replace('See More', ''))
        const image_url = await this.page.$eval('.ProductDetailImageCarouselVariantB-carousel > li img', ele => ele && ele.src)
        const WeightsDimensions = await this.page.evaluate(() => {
            const prefix = 'Weights & Dimensions'
            return [...document.querySelectorAll('.ProductWeightsDimensions dl.pl-DescriptionList > dt')].reduce((ret, dt) => {
                const key = `${prefix} ${dt.innerText}`
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



        return { item, description, image_url, ...WeightsDimensions, specifications, ...features, ...assembly, ...warranty, url: detailUrl, sku }


    }


    _isRecaptchaPage = (page) => {
        return !!page.url().match(/captcha/)
    }
}

export default ProductScraper