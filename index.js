const fs = require('fs')
const puppeteer = require('puppeteer')

const BASE_URL = 'https://www.wofford.edu/about/news/news-archives/2023/'

async function scrape() {
    const browser = await puppeteer.launch({ headless: true })
    const [page] = await browser.pages()

    await page.goto(BASE_URL, { waitUntil: 'networkidle0' })

    const pageUrls = await page.evaluate((BASE_URL) => {
        const urlArray = Array.from(document.links).map((link) => link.href)
        const newsUrl = urlArray.filter((link) => link.startsWith(BASE_URL))
        const uniqueUrlArray = [...new Set(newsUrl)]
        return uniqueUrlArray
    }, BASE_URL)

    const pdfs = await Promise.allSettled(
        pageUrls.map(async (url, i) => {
            const page = await browser.newPage()
            await page.goto(url, {
                waitUntil: 'domcontentloaded',
            })

            const fileName = url.substring(url.lastIndexOf('/') + 1)

            const pdf = await page.pdf({
                format: 'A4',
                margin: {
                    top: 48,
                    bottom: 48,
                    left: 48,
                    right: 48,
                },
            })

            await page.close()

            fs.writeFile(`assets/${fileName}.pdf`, pdf, (err) => {
                if (err) throw err
                console.log(`${fileName}.pdf saved`)
            })
        })
    )

    console.log(pdfs)

    await browser.close()
}

scrape()
