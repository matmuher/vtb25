// Function to get the current active tab's URL
async function getCurrentTabUrl() {
    try {
        // Query for the active tab in the current window
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        return tab.url;
    } catch (error) {
        console.error("Error getting current tab URL:", error);
        return "Error retrieving URL";
    }
}

// Function to get the saved login from storage
async function getSavedLogin() {
    try {
        const result = await chrome.storage.sync.get('userLogin');
        // Check if the key exists in the result object
        if (result.hasOwnProperty('userLogin')) {
            return result.userLogin || 'Not set'; // Return the value or 'Not set' if it's an empty string
        } else {
            // Key doesn't exist in storage
            return 'Not set';
        }
    } catch (error) {
        console.error("Error getting saved login:", error);
        return "Error retrieving login"; // Return an error message
    }
}

// Main function to populate the popup when it opens
async function populatePopup() {
    try {
        // Get the current URL
        const currentUrl = await getCurrentTabUrl();
        document.getElementById('currentUrl').textContent = currentUrl;
        document.getElementById('currentUrl').classList.remove('loading');

        // Get the saved login
        const userLogin = await getSavedLogin();
        document.getElementById('userLogin').textContent = userLogin;
        document.getElementById('userLogin').classList.remove('loading');

    } catch (error) {
        console.error("Error populating popup:", error);
        // Optionally, update the UI to show errors
        document.getElementById('currentUrl').textContent = "Error loading URL";
        document.getElementById('currentUrl').classList.remove('loading');
        document.getElementById('userLogin').textContent = "Error loading login";
        document.getElementById('userLogin').classList.remove('loading');
    }
}

// Run the populate function when the popup's DOM is loaded
document.addEventListener('DOMContentLoaded', populatePopup);
