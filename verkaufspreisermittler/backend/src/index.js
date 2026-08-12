const express = require('express');
const cors = require('cors');
const ScraperService = require('./scraper');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize scraper service
const scraper = new ScraperService();

// Initialize browser and log in to portal on startup
scraper.init().then(() => {
    console.log('Scraper initialized and ready.');
}).catch(err => {
    console.error('Failed to initialize scraper:', err);
});

// Calculate price endpoint
app.post('/api/calculate-price', async (req, res) => {
    const { productId } = req.body;

    if (!productId) {
        return res.status(400).json({ success: false, error: 'Product ID is required' });
    }

    // Pre-Validation: Ein valider Suchbegriff (Art-Nr, EAN, Birner ID) muss mindestens eine Ziffer enthalten.
    // Das blockiert sinnfreie Suchen wie "Döner" sofort, ohne den Scraper zu starten.
    if (!/[0-9]/.test(productId)) {
        return res.status(400).json({ 
            success: false, 
            error: "Ungültige Artikelnummer. Bitte nur valide Nummern eingeben." 
        });
    }

    try {
        const result = await scraper.scrapePrice(productId);
        res.json(result);
    } catch (error) {
        console.error('Scraping error:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to scrape price' });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server listening on port ${PORT}`);
});
