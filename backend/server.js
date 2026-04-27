const path = require('path');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Serve static frontend files
app.use('/frontend', express.static(path.join(__dirname, '../frontend')));
app.use('/blog', express.static(path.join(__dirname, '../blog')));
app.use('/seo', express.static(path.join(__dirname, '../seo')));
app.use('/assets', express.static(path.join(__dirname, '../assets')));

// Serve extra pages
app.get('/about.html', (req, res) => res.sendFile(path.join(__dirname, '../about.html')));
app.get('/contact.html', (req, res) => res.sendFile(path.join(__dirname, '../contact.html')));
app.get('/privacy-policy.html', (req, res) => res.sendFile(path.join(__dirname, '../privacy-policy.html')));

// API Route for Pinterest Video & Image Download
app.post('/api/download', async (req, res) => {
    const { url } = req.body;

    if (!url || !url.includes('pinterest.com')) {
        return res.status(400).json({ success: false, error: 'Invalid Pinterest URL provided.' });
    }

    try {
        const response = await axios.get('https://pinterest-video-and-image-downloader.p.rapidapi.com/pinterest', {
            params: { url: url },
            headers: {
                'Content-Type': 'application/json',
                'x-rapidapi-host': 'pinterest-video-and-image-downloader.p.rapidapi.com',
                'x-rapidapi-key': process.env.RAPIDAPI_KEY
            },
            timeout: 5000
        });

        const data = response.data;

        // Check response structure based on the specific API
        if (data && data.video) {
            return res.json({ success: true, type: 'video', media: data.video });
        } else if (data && data.image) {
            return res.json({ success: true, type: 'image', media: data.image });
        } else {
            return res.status(404).json({ success: false, error: 'no media found' });
        }

    } catch (error) {
        console.error('Download Error:', error.message);
        return res.status(500).json({ 
            success: false, 
            error: 'API failure or invalid response' 
        });
    }
});

// Serve index.html for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    if (process.env.RAPIDAPI_KEY) {
        console.log("API Key Loaded");
    } else {
        console.log("API Key Missing");
    }
});
