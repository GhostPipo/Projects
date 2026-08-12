const puppeteer = require('puppeteer');

class ScraperService {
    constructor() {
        this.browser = null;
        this.sessionCookies = null;
        this.username = process.env.PORTAL_USER;
        this.password = process.env.PORTAL_PASS;
        this.portalLoginUrl = 'https://www.birner360.at/de/login'; 
        // Use the proper dynamic search endpoint
        this.portalSearchUrl = 'https://www.birner360.at/de/search?q='; 
    }

    async init() {
        console.log('Launching browser...');
        this.browser = await puppeteer.launch({
            headless: true,
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        try {
            await this.login();
        } catch (error) {
            console.error('Initial login failed.');
        }
    }

    async login() {
        if (!this.username || !this.password) {
            throw new Error('Credentials (PORTAL_USER or PORTAL_PASS) not provided in environment variables.');
        }

        console.log('Logging into portal at', this.portalLoginUrl);
        const page = await this.browser.newPage();
        
        try {
            await page.goto(this.portalLoginUrl, { waitUntil: 'networkidle2' });
            
            // Wait for inputs to be present in the DOM (even if hidden)
            await page.waitForFunction(() => document.querySelector('input[name="username"]'));
            await page.waitForFunction(() => document.querySelector('input[name="password"]'));

            // Force visibility to ensure page.type() works on hidden React inputs
            await page.evaluate(() => {
                const userInp = document.querySelector('input[name="username"]');
                const passInp = document.querySelector('input[name="password"]');
                if (userInp) {
                    userInp.classList.remove('hidden');
                    userInp.style.display = 'block';
                    userInp.style.visibility = 'visible';
                }
                if (passInp) {
                    passInp.classList.remove('hidden');
                    passInp.style.display = 'block';
                    passInp.style.visibility = 'visible';
                }
            });

            // Type the credentials
            await page.type('input[name="username"]', this.username);
            await page.type('input[name="password"]', this.password);
            
            // Click the submit button and wait for navigation concurrently
            await page.waitForSelector('button[type="submit"]');
            await Promise.all([
                page.waitForNavigation({ waitUntil: 'networkidle2' }),
                page.click('button[type="submit"]')
            ]);

            this.sessionCookies = await page.cookies();
            console.log('Login successful. Session cookies saved to memory.');
        } catch (error) {
            console.error('Login failed during Puppeteer execution:', error.message);
            // Robust error handling: Cleanly close the browser if login fails
            if (this.browser) {
                await this.browser.close();
                this.browser = null;
            }
            throw error;
        } finally {
            if (this.browser && !page.isClosed()) {
                await page.close();
            }
        }
    }

    async scrapePrice(productId) {
        if (!this.browser) {
            console.log('Browser not available. Re-initializing...');
            await this.init();
            if (!this.browser) {
                throw new Error('Failed to initialize browser and login.');
            }
        }

        const page = await this.browser.newPage();
        
        try {
            if (this.sessionCookies && this.sessionCookies.length > 0) {
                await page.setCookie(...this.sessionCookies);
            }

            const targetUrl = `https://www.birner360.at/de/portlet/webkat-next?redirectUrl=${productId}`;
            console.log(`Navigating directly to article: ${targetUrl}`);
            
            await page.goto(targetUrl, { waitUntil: 'networkidle2' });

            await page.waitForSelector('iframe#dvseNextFrame', { timeout: 10000 });
            const elementHandle = await page.$('iframe#dvseNextFrame');
            const frame = await elementHandle.contentFrame();

            if (!frame) {
                throw new Error("Iframe 'dvseNextFrame' konnte nicht geladen werden.");
            }

            const extractPrices = async () => {
                const rawPrices = await frame.evaluate(() => {
                    const pTags = Array.from(document.querySelectorAll('p'));
                    let ek = null;
                    let evp = null;
                    
                    for (let i = 0; i < pTags.length; i++) {
                        const text = pTags[i].textContent.trim();
                        // Nimm strikt das nächste p-Tag im Array
                        if (text === 'EK' && i + 1 < pTags.length) {
                            ek = pTags[i + 1].textContent;
                        }
                        if (text === 'EVP' && i + 1 < pTags.length) {
                            evp = pTags[i + 1].textContent;
                        }
                    }
                    return { ek, evp };
                });

                if (rawPrices && rawPrices.ek && rawPrices.evp) {
                    // Entfernt alle Leerzeichen (auch Non-Breaking) für einen sauberen Float
                    const ekStr = rawPrices.ek.replace(/€/g, '').replace(/,/g, '.').replace(/\s/g, '');
                    const evpStr = rawPrices.evp.replace(/€/g, '').replace(/,/g, '.').replace(/\s/g, '');
                    
                    const ek = parseFloat(ekStr);
                    const evp = parseFloat(evpStr);
                    
                    if (!isNaN(ek) && !isNaN(evp)) {
                        return { ek, evp };
                    }
                }
                return null;
            };

            let prices = null;
            try {
                console.log('Waiting for prices to appear in DOM...');
                await frame.waitForFunction(() => {
                    return Array.from(document.querySelectorAll('p')).some(p => p.textContent.trim() === 'EK');
                }, { timeout: 15000 });
                
                prices = await extractPrices();
            } catch (e) {
                console.log('Timeout waiting for prices. Trying fallback: Alternativartikel');
            }

            if (!prices) {
                console.log('Versuche Alternativartikel zu finden...');
                const clicked = await frame.evaluate(() => {
                    // 1. Suche nach dem neuen Icon-Button
                    const altBtn = document.querySelector('[aria-label*="Alternativen"], [aria-label*="Alternative Artikel"]');
                    if (altBtn) {
                        altBtn.click();
                        return true;
                    }
                    // 2. Fallback für alte Text-Tabs
                    const els = Array.from(document.querySelectorAll('button, a, div[role="tab"], span'));
                    const textEl = els.find(el => el.textContent.trim().toLowerCase().includes('alternativartikel'));
                    if (textEl) {
                        textEl.click();
                        return true;
                    }
                    return false;
                });

                if (clicked) {
                    console.log('Alternativartikel angeklickt. Warte auf UI-Update...');
                    try {
                        // Dem React-UI kurz Zeit geben, das alte Grid zu leeren
                        await new Promise(resolve => setTimeout(resolve, 1500));
                        
                        // Auf den neuen EK-Text im Frame warten
                        await frame.waitForFunction(() => {
                            return Array.from(document.querySelectorAll('p')).some(p => p.textContent.trim() === 'EK');
                        }, { timeout: 15000 });
                        
                        prices = await extractPrices();
                    } catch (e) {
                        console.log('Timeout beim Warten auf Alternativartikel-Preise.');
                    }
                }
            }

            if (prices) {
                console.log(`Successfully extracted prices - EK: ${prices.ek}, EVP: ${prices.evp}`);
                return {
                    success: true,
                    ek: prices.ek,
                    evp: prices.evp
                };
            } else {
                console.warn(`Article ${productId} not found or no prices could be extracted. Erstelle Beweisfoto...`);
                
                // --- HARDCORE DEBUGGING START ---
                try {
                    await page.screenshot({ path: '/usr/src/app/src/debug-webkat-error.png', fullPage: true });
                    const html = await page.content();
                    require('fs').writeFileSync('/usr/src/app/src/debug-webkat-error.html', html);
                    console.log("Failed at URL:", page.url());
                    console.log("Beweisfoto und HTML wurden im Container gespeichert!");
                } catch (debugErr) {
                    console.error("Fehler beim Erstellen des Beweisfotos:", debugErr.message);
                }
                // --- HARDCORE DEBUGGING END ---

                return { success: false, error: "Keine Preise gefunden (auch nicht bei Alternativen)." };
            }

        } catch (error) {
            console.error('Error during scraping process:', error.message);
            if (this.browser) {
                await this.browser.close();
                this.browser = null;
            }
            throw error;
        } finally {
            if (this.browser && !page.isClosed()) {
                await page.close();
            }
        }
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
}

module.exports = ScraperService;
