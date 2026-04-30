const path = require('path');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

async function fetchFromApify(url) {
  try {
    const token = process.env.APIFY_TOKEN || "apify_api_etXSDQV6Rtbmvmt0DGYcoXzqWWH2SB1FWvYq";
    const response = await axios.post(
      `https://api.apify.com/v2/acts/igview-owner~pinterest-downloader/run-sync-get-dataset-items?token=${token}`,
      {
        startUrls: [{ url }]
      }
    );

    const data = response.data?.[0];

    return {
      video: data?.videoUrl || null,
      image: data?.imageUrl || null
    };
  } catch (err) {
    console.error("Apify failed:", err.message);
    return null;
  }
}

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
    const originalUrl = req.body.url || req.body.link || req.body.pinterestUrl;
    console.log("--- Pinterest Download Request ---");
    console.log("Original URL:", originalUrl);

    if (!originalUrl) {
      return res.status(400).json({ success: false, error: "No URL provided" });
    }

    let url = originalUrl;

    // 1. Automatically expand short URLs (pin.it) to full Pinterest URLs
    if (url.includes('pin.it')) {
      try {
        const redirectResponse = await axios.get(url, { maxRedirects: 5 });
        url = redirectResponse.request.res.responseUrl;
        console.log("Expanded URL:", url);
      } catch (err) {
        console.error("Failed to expand pin.it URL:", err.message);
        return res.status(400).json({ success: false, error: "Could not resolve short link. Is the link valid?" });
      }
    }

    // 2. Improve Validation Logic (Accept mobile, different domains)
    if (!url.includes("pinterest.")) {
      return res.status(400).json({ success: false, error: "Invalid Pinterest URL provided" });
    }

    // 3. Environment Setup Check
    if (!process.env.RAPIDAPI_KEY) {
       console.error("Missing RAPIDAPI_KEY in environment variables.");
       return res.status(500).json({ success: false, error: "Server configuration error: Missing API Key" });
    }

    const encodedUrl = encodeURIComponent(url);

    // 4. Fetch Media from API
    let apiData = {};
    try {
      const response = await axios.get(
        `https://pinterest-video-and-image-downloader.p.rapidapi.com/pinterest?url=${encodedUrl}`,
        {
          headers: {
            "x-rapidapi-key": process.env.RAPIDAPI_KEY,
            "x-rapidapi-host": "pinterest-video-and-image-downloader.p.rapidapi.com"
          }
        }
      );
      apiData = response.data || {};
      console.log("API Response Data:", JSON.stringify(apiData).substring(0, 300) + "...");
    } catch (rapidApiError) {
      console.error("RapidAPI request failed:", rapidApiError.message);
    }

    // 5. Fix "Media not found" by deeply checking response JSON
    let videoUrl = null;
    let imageUrl = null;

    if (apiData.data) {
        videoUrl = apiData.data.video || apiData.data.videoUrl || apiData.data.video_url || apiData.data.video_link;
        imageUrl = apiData.data.image || apiData.data.imageUrl || apiData.data.image_url || apiData.data.image_link;
    } else {
        videoUrl = apiData.video || apiData.videoUrl || apiData.video_url || apiData.video_link;
        imageUrl = apiData.image || apiData.imageUrl || apiData.image_url || apiData.image_link || apiData.thumbnail;
    }

    // Check nested arrays if standard fields are empty
    if (!videoUrl && apiData.videos && apiData.videos.length > 0) {
        videoUrl = apiData.videos[0].url || apiData.videos[0];
    }
    if (!imageUrl && apiData.images && apiData.images.length > 0) {
        imageUrl = apiData.images[0].url || apiData.images[0];
    }

    if (!videoUrl && !imageUrl) {
        console.error("Media extraction failed or RapidAPI returned no data. Trying Apify fallback...");
        let fallback = await fetchFromApify(url);

        if (fallback && (fallback.video || fallback.image)) {
          return res.json({
            success: true,
            video: fallback.video,
            image: fallback.image,
            title: "Pinterest Media (Fallback)",
            filename: fallback.video ? "video.mp4" : "image.jpg"
          });
        }
        
        return res.status(404).json({ success: false, error: "Media not found. Both primary and fallback APIs failed." });
    }

    // 6. Ensure response matches frontend expectations
    return res.json({
      success: true,
      video: videoUrl || null,
      image: imageUrl || null,
      title: apiData.title || apiData.description || "Pinterest Media",
      filename: videoUrl ? "video.mp4" : "image.jpg"
    });

  } catch (error) {
    console.error("ERROR Details:", error.response?.data || error.message);
    res.status(500).json({ success: false, error: "Server error occurred while fetching media." });
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
