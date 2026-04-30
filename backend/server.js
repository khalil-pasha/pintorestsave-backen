const path = require('path');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

function extractMedia(apiData) {
  let video = null;
  let image = null;

  // Direct fields
  video = apiData?.video || apiData?.videoUrl || apiData?.video_url;
  image = apiData?.image || apiData?.imageUrl || apiData?.image_url;

  // Nested data
  if (!video && apiData?.data) {
    video = apiData.data.video || apiData.data.videoUrl;
    image = apiData.data.image || apiData.data.imageUrl;
  }

  // Arrays
  if (!video && apiData?.videos?.length) {
    video = apiData.videos[0]?.url || apiData.videos[0];
  }

  if (!image && apiData?.images?.length) {
    image = apiData.images[0]?.url || apiData.images[0];
  }

  // Apify specific
  if (!video && apiData?.videoUrl) {
    video = apiData.videoUrl;
  }

  if (!image && apiData?.imageUrl) {
    image = apiData.imageUrl;
  }

  return { video, image };
}

async function fetchFromApify(url) {
  try {
    const token = process.env.APIFY_TOKEN || "token=process.env.APIFY_TOKEN";
    const response = await axios.post(
      `https://api.apify.com/v2/acts/igview-owner~pinterest-downloader/run-sync-get-dataset-items?token=${token}`,
      {
        startUrls: [{ url }]
      }
    );

    const data = response.data?.[0];
    return extractMedia(data);
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
      console.log("===== FULL API RESPONSE START =====");
      console.log(JSON.stringify(apiData, null, 2));
      console.log("===== FULL API RESPONSE END =====");
    } catch (rapidApiError) {
      console.error("RapidAPI request failed:", rapidApiError.message);
    }

    // 5. Extract media using improved parsing
    const media = extractMedia(apiData);

    if (!media.video && !media.image) {
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
        
        console.log("Full API Response:", apiData);
        return res.status(404).json({
          success: false,
          error: "Media not found. API returned unsupported format."
        });
    }

    // 6. Ensure response matches frontend expectations
    return res.json({
      success: true,
      video: media.video,
      image: media.image,
      title: apiData.title || apiData.description || "Pinterest Media",
      filename: media.video ? "video.mp4" : "image.jpg"
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

app.get('/api/test', async (req, res) => {
  try {
    const testUrl = req.query.url;

    if (!testUrl) {
      return res.json({ error: "Add ?url=PINTEREST_URL" });
    }

    console.log("TEST URL:", testUrl);

    const encodedUrl = encodeURIComponent(testUrl);

    const response = await axios.get(
      `https://pinterest-video-and-image-downloader.p.rapidapi.com/pinterest?url=${encodedUrl}`,
      {
        headers: {
          "x-rapidapi-key": process.env.RAPIDAPI_KEY,
          "x-rapidapi-host": "pinterest-video-and-image-downloader.p.rapidapi.com"
        }
      }
    );

    console.log("RAW API DATA:", JSON.stringify(response.data, null, 2));

    res.json(response.data);

  } catch (err) {
    console.error("TEST ERROR:", err.response?.data || err.message);
    res.json({ error: err.response?.data || err.message });
  }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    if (process.env.RAPIDAPI_KEY) {
        console.log("API Key Loaded");
    } else {
        console.log("API Key Missing");
    }
});
