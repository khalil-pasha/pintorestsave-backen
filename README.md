# Pinterest Save - Pinterest Video & Image Downloader

Pinterest Save is a robust, full-stack application built to effortlessly download high-quality videos, images, and GIFs from Pinterest. Designed for speed, security, and a seamless user experience across all devices.

## Features
- **High-Quality Downloads**: Download Pinterest media in highest available quality (up to 4K for supported videos).
- **Format Support**: MP4 for videos, JPEG/PNG for images, and GIF support.
- **Cross-Platform**: Works fully in any modern web browser across Windows, Mac, Linux, iOS, and Android.
- **Privacy-First**: No account required, no tracking logs, and strictly server-side processing ensuring privacy.

## Project Structure
- `/backend`: Node.js + Express backend handling API requests and serving static assets.
- `/frontend`: Vanilla HTML, CSS, and JS frontend with a responsive, modern dark-themed UI.
- `/blog`: HTML blog pages.
- `/seo`: SEO files including `sitemap.xml` and `robots.txt`.
- `/assets`: Static media assets like logos and favicons.

## Setup Instructions

### Prerequisites
- [Node.js](https://nodejs.org/en/) (v14 or higher recommended)
- A RapidAPI account for Pinterest Downloader API key.

### Local Development
1. **Clone the repository:**
   ```bash
   git clone <YOUR_REPO_URL>
   cd pintorestsave
   ```

2. **Install Backend Dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root of the project with the following:
   ```env
   PORT=5000
   RAPIDAPI_KEY=your_rapidapi_key_here
   ```

4. **Start the Server:**
   ```bash
   # Make sure you are in the backend directory
   node server.js
   ```

5. **Access the App:**
   Open your browser and navigate to `http://localhost:5000`.

## Deployment Steps (Render + Hostinger)

### 1. Hosting Backend on Render
1. Push this repository to GitHub.
2. Log into [Render](https://render.com/) and click **New > Web Service**.
3. Connect your GitHub account and select this repository.
4. Set the **Root Directory** to `backend`.
5. Set the **Build Command** to `npm install`.
6. Set the **Start Command** to `node server.js`.
7. Go to **Environment Variables** and add:
   - `RAPIDAPI_KEY`: your_actual_api_key
8. Click **Create Web Service**. Wait for the deployment to finish and copy your Render URL (e.g., `https://your-backend.onrender.com`).

### 2. Hosting Frontend on Hostinger
If you want to host the frontend separately on Hostinger (or Hostinger can just proxy to Render):
1. Note: By default, the `backend/server.js` serves the frontend automatically. If you plan to host the frontend and backend together, simply point Hostinger to your Render URL (via domain mapping).
2. If separating: Update `frontend/script.js` to point API requests to your Render Backend URL instead of relative paths.
3. Upload the `/frontend`, `/blog`, `/seo`, `/assets`, and `.html` root files to Hostinger's `public_html` via File Manager or FTP.

## License
This project is proprietary.
