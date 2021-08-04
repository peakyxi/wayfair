import Scraper from './scraper.js'
import Category from '../models/category.js'



class CategoryScraper extends Scraper {
    constructor(id) {
        return (async () => {
            super(id)
            await this.init()
            this.page = this.pages[0]
            return this
        })()

    }
    run = async () => {
        try {
            return await this._run()
        } catch (err) {
            await this.browser.close()
        }
    }

    _run = async () => {
        await this.scrapeMainCategory()
        await this.scrapeGeneralCategory('mainCategory', 'subCategory')
        await this.scrapeGeneralCategory('subCategory', 'itemCategory')
        await this.scrapeGeneralCategory('itemCategory', 'subItemCategory')
        await this.browser.close()
    }
    reset = async () => {
        await this.browser.close()

    }




    scrapeMainCategory = async () => {
        await this.page.goto('https://www.wayfair.com/')
        let categories = await this._scrapeMainCategory()
        categories = await this._addTypesCategory(categories, 'mainCategory', '-1')
        await this._saveCategory(categories)

    }
    scrapeGeneralCategory = async (parentType, type) => {
        const parentCategories = await Category.find({ type: parentType })
        for (const parentCategory of parentCategories) {
            const { _id, url } = parentCategory
            if (!this._isCatUrl) continue
            await this.page.goto(url)
            if (!await this._isCatPage()) continue
            let categories = await this._scrapeGeneralCategory()
            categories = this._addTypesCategory(categories, type, _id)
            await this._saveCategory(categories)
        }


    }

    _scrapeMainCategory = async () => {
        return await this.page.evaluate(() => [...document.querySelectorAll('ul.DepartmentList-list > li.DepartmentItem')]
            .filter(ele => !ele.classList.contains('DepartmentItem--sale'))
            .map(ele => {
                const link = ele.querySelector('.DepartmentItem-link')
                const name = link.innerText
                const url = link.href
                return { name, url }
            })
        )


    }
    _scrapeGeneralCategory = async () => {
        const cates = await this.page.evaluate(() => [...document.querySelector('.CategoryLandingPageNavigation-subnavWrap').querySelectorAll('.CategoryLandingPageNavigation-linkWrap')]
            .map(ele => {
                const link = ele.querySelector('a')
                const name = link.innerText
                const url = link.href
                return { name, url }
            }))
        return cates.filter(({ name, url }) => !name.match(/Sale/i))
    }

    _isCatUrl = (url) => {
        return url.match(/\/cat\/[^\/]+$/)
    }
    _isCatPage = async () => {
        return await this.page.$('div.CategoryLandingPageNavigation')
    }
    _addTypesCategory = (categories, type, parent) => {
        return categories.map(item => {
            item.type = type
            item.parent = parent
            return item
        })
    }
    _saveCategory = async (categories) => {
        for (const cate of categories) {
            Category.findOneAndUpdate({ name: cate.name, type: cate.type }, cate, { upsert: true }, (err, doc) => {
                if (err) throw err
            })
        }
    }
}

export default CategoryScraper