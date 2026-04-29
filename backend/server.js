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
  try {
    console.log("Incoming body:", req.body);

    let url = req.body.url || req.body.link || req.body.pinterestUrl;

    if (!url) {
      return res.status(400).json({ error: "No URL provided" });
    }

    if (url.includes('pin.it')) {
      const axios = require('axios');
      const response = await axios.get(url, { maxRedirects: 5 });
      url = response.request.res.responseUrl;
    }

    if (!url.includes("pinterest.com/pin/")) {
      return res.status(400).json({ error: "Invalid Pinterest URL provided" });
    }

    const encodedUrl = encodeURIComponent(url);

    const axios = require('axios');

    const response = await axios.get(
      `https://pinterest-video-and-image-downloader.p.rapidapi.com/pinterest?url=${encodedUrl}`,
      {
        headers: {
          "x-rapidapi-key": process.env.RAPIDAPI_KEY,
          "x-rapidapi-host": "pinterest-video-and-image-downloader.p.rapidapi.com"
        }
      }
    );

    console.log("API Response:", response.data);

    res.json(response.data);

  } catch (error) {
    console.error("ERROR:", error.response?.data || error.message);
    res.status(500).json({ error: "Server error" });
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
