const fs = require('fs')
const puppeteer = require('puppeteer')

const BASE_URL = 'https://www.wofford.edu/about/news/news-archives/'

const years = ['2019']

years.map((year) => scrape(year))

async function scrape(year) {
    const browser = await puppeteer.launch({ headless: true })
    const [page] = await browser.pages()

    const SCRAPE_URL = `${BASE_URL}${year}/`

    await page.goto(SCRAPE_URL, { waitUntil: 'networkidle0' })

    const pageUrls = await page.evaluate((SCRAPE_URL) => {
        const urlArray = Array.from(document.links).map((link) => link.href)
        const newsUrl = urlArray.filter((link) => link.startsWith(SCRAPE_URL))
        const uniqueUrlArray = [...new Set(newsUrl)]
        return uniqueUrlArray
    }, SCRAPE_URL)

    fs.mkdir(year, { recursive: true }, (err) => {
        if (err) throw err
    })

    await Promise.allSettled(
        pageUrls.map(async (url, i) => {
            const page = await browser.newPage()
            await page.goto(url, {
                waitUntil: 'networkidle0',
            })

            const postDateEl = await page.waitForSelector('.post-date')
            const postDate = await postDateEl.evaluate((el) => el.textContent)

            const fileName = postDate + '-' + url.substring(url.lastIndexOf('/') + 1)

            await page.pdf({
                format: 'A4',
                margin: {
                    top: 48,
                    bottom: 48,
                    left: 48,
                    right: 48,
                },
                path: `${year}/${fileName}.pdf`,
            })

            await page.close()
        })
    )

    await browser.close()
}

// async function singleScrape() {
//     const browser = await puppeteer.launch({ headless: true })
//     const page = await browser.newPage()

//     const year = '2019'
//     const fileName = 'gonzaleslecture'

//     await page.goto(`https://www.wofford.edu/about/news/news-archives/${year}/${fileName}`, { waitUntil: 'networkidle0' })

//     const postDateEl = await page.waitForSelector('.post-date')
//     const postDate = await postDateEl.evaluate((el) => el.textContent)

//     await page.pdf({
//         format: 'A4',
//         margin: {
//             top: 48,
//             bottom: 48,
//             left: 48,
//             right: 48,
//         },
//         path: `${year}/${postDate}-${fileName}.pdf`,
//     })

//     await page.close()

//     await browser.close()
// }
// singleScrape()
