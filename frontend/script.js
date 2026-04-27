document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('download-form');
    const urlInput = document.getElementById('pinterest-url');
    const loadingDiv = document.getElementById('loading');
    const resultSection = document.getElementById('result-section');
    const errorMessage = document.getElementById('error-message');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const url = urlInput.value.trim();
        
        if (!url) return;

        // Simple validation
        if (!url.includes('pinterest.com') && !url.includes('pin.it')) {
            showError('Please enter a valid Pinterest URL.');
            return;
        }

        // Reset UI
        hideError();
        resultSection.innerHTML = '';
        resultSection.classList.add('hidden');
        loadingDiv.classList.remove('hidden');

        try {
            // NOTE: In local development, the frontend and backend are usually on the same server,
            // so we can use a relative path like '/api/download'. 
            // If the backend is hosted separately on Render and the frontend on Hostinger,
            // change this to your Render URL: e.g. 'https://your-backend.onrender.com/api/download'
            const apiUrl = '/api/download'; 

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url })
            });

            const data = await response.json();

            loadingDiv.classList.add('hidden');

            if (data.success) {
                showResult(data);
            } else {
                showError(data.error || 'Failed to extract media.');
            }

        } catch (error) {
            loadingDiv.classList.add('hidden');
            showError('Network error. Please make sure the server is running and try again.');
            console.error('Fetch Error:', error);
        }
    });

    function showResult(data) {
        resultSection.classList.remove('hidden');
        
        let mediaHtml = '';
        if (data.type === 'video') {
            mediaHtml = `
                <video src="${data.media}" controls class="media-preview" autoplay></video>
                <br>
                <a href="${data.media}" target="_blank" download class="download-action-btn">Download Video HD</a>
            `;
        } else if (data.type === 'image') {
            mediaHtml = `
                <img src="${data.media}" alt="Pinterest Image" class="media-preview">
                <br>
                <a href="${data.media}" target="_blank" download class="download-action-btn">Download Image HD</a>
            `;
        }
        
        resultSection.innerHTML = mediaHtml;
    }

    function showError(msg) {
        errorMessage.textContent = msg;
        errorMessage.classList.remove('hidden');
    }

    function hideError() {
        errorMessage.classList.add('hidden');
        errorMessage.textContent = '';
    }

    // Accordion Logic
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const activeHeader = document.querySelector('.accordion-header.active');
            if (activeHeader && activeHeader !== header) {
                activeHeader.classList.remove('active');
                activeHeader.nextElementSibling.style.maxHeight = null;
            }

            header.classList.toggle('active');
            const content = header.nextElementSibling;
            if (header.classList.contains('active')) {
                content.style.maxHeight = content.scrollHeight + "px";
            } else {
                content.style.maxHeight = null;
            }
        });
    });
});
