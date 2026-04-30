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
        if (!url.includes('pinterest.com') && !url.includes('pin.it') && !url.includes('pinterest.co')) {
            showError('Invalid URL. Please enter a valid Pinterest link.');
            return;
        }

        // Reset UI
        hideError();
        resultSection.innerHTML = '';
        resultSection.classList.add('hidden');
        loadingDiv.classList.remove('hidden');

        try {
            const apiUrl = 'https://pintorestsave-backen.onrender.com/api/download'; 

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url })
            });

            const data = await response.json();
            console.log("FULL API DATA:", data);

            loadingDiv.classList.add('hidden');

            // Add proper error handling for backend API failures
            if (!response.ok || data.error || data.success === false) {
                showError(data.error || 'Server error. Failed to extract media.');
                return;
            }

            // Extract video and image based on the explicit response schema
            const videoUrl = data.video || null;
            const imageUrl = data.image || null;

            // Display result dynamically handling video vs image correctly
            console.log("API Response:", data);
            
            if (data.video && data.video.includes(".mp4")) {
                resultSection.innerHTML = `
                    <video controls src="${data.video}" style="max-width:100%"></video>
                    <a href="${data.video}" download="${data.filename || 'video.mp4'}">
                        <button>Download Video</button>
                    </a>
                `;
                resultSection.classList.remove('hidden');
            } else if (data.image) {
                resultSection.innerHTML = `
                    <img src="${data.image}" style="max-width:100%" />
                    <a href="${data.image}" download="image.jpg">
                        <button>Download Image</button>
                    </a>
                `;
                resultSection.classList.remove('hidden');
            } else {
                showError("Media not found!");
            }

        } catch (error) {
            loadingDiv.classList.add('hidden');
            showError('Server error. Please make sure the server is running and try again.');
            console.error('Fetch Error:', error);
        }
    });

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
