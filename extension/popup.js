// popup.js

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

// Function to get the saved login from storage (CHANGED TO LOCAL)
async function getSavedLogin() {
    try {
        const result = await chrome.storage.local.get('userLogin'); // Use local storage
        console.log("Retrieved from storage.local:", result); // Debug log
        // Check if the key exists in the result object
        if (result.hasOwnProperty('userLogin')) {
            return result.userLogin || 'Not set'; // Return the value or 'Not set' if it's an empty string
        } else {
            // Key doesn't exist in storage
            console.log("userLogin key not found in storage.local"); // Debug log
            return 'Not set';
        }
    } catch (error) {
        console.error("Error getting saved login from local storage:", error); // Updated log
        return "Error retrieving login"; // Return an error message
    }
}

// Function to create and populate the "Optimal Card" popup content
// This replicates the logic from the main app's OptimalCardPopup component
// REMOVED: isOpen, onClose props as they are not needed here
async function createOptimalCardPopupContent(userLogin) {
    // Get bank cashbacks data (this was saved by the main app)
    let bankCashbacks = {};
    try {
        const result = await chrome.storage.local.get('BANK_CASHBACKS');
        bankCashbacks = result.BANK_CASHBACKS || {};
        console.log("Retrieved bank cashbacks from storage.local:", bankCashbacks);
    } catch (error) {
        console.error("Error getting bank cashbacks:", error);
    }

    // Get the selected category (this was saved by the main app)
    let selectedCategory = "Продукты"; // Default fallback
    try {
        const result = await chrome.storage.local.get('selectedCategory');
        if (result.selectedCategory) {
            selectedCategory = result.selectedCategory;
        }
        console.log("Retrieved selected category from storage.local:", selectedCategory);
    } catch (error) {
        console.error("Error getting selected category:", error);
    }

    // Find the best bank for the selected category (replicating main app logic)
    let bestBank = null;
    let bestCashbackRate = 0;
    Object.values(bankCashbacks || {}).forEach(bankData => {
        const cashbackForCategory = bankData.cashbacks?.find(c => c.category === selectedCategory);
        if (cashbackForCategory) {
            const cashbackRate = typeof cashbackForCategory.cashback === 'string'
                ? parseFloat(cashbackForCategory.cashback)
                : cashbackForCategory.percent || 0;
            if (cashbackRate > bestCashbackRate) {
                bestCashbackRate = cashbackRate;
                bestBank = cashbackForCategory.bank_name || bankData.bankInfo?.split(' ')[0] || 'Неизвестный';
            }
        }
    });

    // Get all unique categories (replicating main app logic)
    const allCategories = [...new Set(Object.values(bankCashbacks || {}).flatMap(bank =>
        bank.cashbacks?.map(c => c.category) || []
    ))];

    // Create the main container div (replacing the overlay)
    // REMOVED: fixed positioning, bg-black/50, flex centering, p-4, z-50
    const mainContainer = document.createElement('div');
    // CHANGED: Apply the background and centering directly to the main container
    mainContainer.className = "bg-black/50 flex items-center justify-center min-h-screen"; // Use min-h-screen for full height context if needed, or remove if not


    // Create the popup content div (replacing the inner content div)
    const contentDiv = document.createElement('div');

    // Apply main app's popup styling classes - MAIN CONTAINER
    // REMOVED: fixed, inset-0, bg-black/50, flex, items-center, justify-center, p-4, z-50
    // CHANGED: Kept bg-white, rounded-2xl, p-6, added a specific width (e.g., w-96, w-4xl, or specific px)
    contentDiv.className = "bg-white rounded-2xl p-6 w-full max-w-4xl"; // Increased width significantly, adjust max-w-4xl as needed
    // CHANGED: Apply a specific width style to the content div as well, potentially overriding Tailwind if necessary
    contentDiv.style.width = '800px'; // Set a fixed width, adjust as needed
    contentDiv.style.maxWidth = '90vw'; // Ensure it doesn't exceed 90% of the viewport width
    contentDiv.style.boxSizing = 'border-box'; // Include padding in width calculation
    contentDiv.style.minHeight = '400px'; // Set a minimum height, adjust as needed
    contentDiv.style.maxHeight = '80vh'; // Limit height to 80% of viewport height
    contentDiv.style.overflowY = 'auto'; // Allow scrolling if content overflows


    // Create header
    const headerDiv = document.createElement('div');
    headerDiv.className = "flex justify-between items-start mb-4"; // EXACT FROM REACT

    const titleDiv = document.createElement('div');
    titleDiv.className = ""; // No specific class for the title container div itself in the React JSX, just the h3

    const titleH3 = document.createElement('h3');
    titleH3.className = "text-xl font-bold text-gray-800"; // EXACT FROM REACT
    titleH3.textContent = `Оплата оптимальной картой для ${userLogin}`; // Include login

    titleDiv.appendChild(titleH3);
    headerDiv.appendChild(titleDiv);

    // Close button
    const closeButton = document.createElement('button');
    closeButton.className = "text-gray-500 hover:text-gray-700"; // EXACT FROM REACT
    const closeIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    closeIcon.setAttribute("width", "24");
    closeIcon.setAttribute("height", "24");
    closeIcon.setAttribute("viewBox", "0 0 24 24");
    closeIcon.setAttribute("fill", "none");
    closeIcon.setAttribute("stroke", "currentColor");
    closeIcon.setAttribute("stroke-width", "2");
    closeIcon.setAttribute("stroke-linecap", "round");
    closeIcon.setAttribute("stroke-linejoin", "round");
    closeIcon.classList.add("w-6", "h-6"); // Apply Tailwind classes if Tailwind is available in popup
    const closeIconPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    closeIconPath.setAttribute("d", "M18 6 6 18M6 6l12 12");
    closeIcon.appendChild(closeIconPath);
    closeButton.appendChild(closeIcon);

    // Add close functionality - Closes the entire popup window
    closeButton.addEventListener('click', () => {
        window.close(); // Close the popup window
    });

    headerDiv.appendChild(closeButton);
    contentDiv.appendChild(headerDiv);

    // Create main content section
    const contentSection = document.createElement('div');
    contentSection.className = "mb-6"; // EXACT FROM REACT (main content padding)

    // Category selection part (simplified, just shows current)
    const categorySection = document.createElement('div');
    categorySection.className = "text-left mb-2"; // EXACT FROM REACT

    const categoryLabel = document.createElement('div');
    categoryLabel.className = "text-gray-700 font-medium"; // EXACT FROM REACT
    categoryLabel.textContent = "Категория (поменяйте, если мы угадали неправильно 😉)";
    categorySection.appendChild(categoryLabel);
    contentSection.appendChild(categorySection);

    const categoryDisplay = document.createElement('div');
    categoryDisplay.className = "flex items-center justify-center"; // EXACT FROM REACT
    const categoryButton = document.createElement('button');
    categoryButton.className = "bg-gray-100 border border-gray-300 rounded-lg px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#337357] focus:border-transparent text-center flex items-center justify-center gap-2 min-w-[200px]"; // EXACT FROM REACT
    categoryButton.textContent = selectedCategory;
    // Add dropdown logic here if needed (requires more complex implementation)
    categoryDisplay.appendChild(categoryButton);
    contentSection.appendChild(categoryDisplay);

    // Best bank display
    const bestBankSection = document.createElement('div');
    bestBankSection.className = "text-left mb-2 mt-4"; // EXACT FROM REACT
    const bestBankLabel = document.createElement('div');
    bestBankLabel.className = "text-gray-700 font-medium"; // EXACT FROM REACT
    bestBankLabel.textContent = "Лучший банк";
    bestBankSection.appendChild(bestBankLabel);
    contentSection.appendChild(bestBankSection);

    const bestBankDisplay = document.createElement('div');
    bestBankDisplay.className = "text-center text-xl text-[#337357] mb-6 flex items-center justify-center gap-2"; // EXACT FROM REACT
    const starSpan = document.createElement('span');
    starSpan.textContent = '✭';
    const bankNameSpan = document.createElement('span');
    bankNameSpan.textContent = bestBank || 'Не найден';
    bestBankDisplay.appendChild(starSpan);
    bestBankDisplay.appendChild(bankNameSpan);
    contentSection.appendChild(bestBankDisplay);

    // Payment button
    const paymentButton = document.createElement('button');
    paymentButton.className = "w-full bg-gradient-to-r from-[#337357] to-[#4CAF7D] hover:from-[#2B6246] hover:to-[#3D8B63] text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ease-in-out text-lg"; // EXACT FROM REACT
    paymentButton.textContent = `Оплатить с ${bestBank || 'Лучший банк'}`;
    // Add payment logic here if needed (e.g., open bank app link)
    contentSection.appendChild(paymentButton);

    contentDiv.appendChild(contentSection);
    mainContainer.appendChild(contentDiv); // Append content to main container

    return mainContainer; // Return the main container instead of just the content div
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
        console.log("Populated login:", userLogin); // Debug log

        // --- CHANGED: Create the popup content directly ---
        // Create the main content using the function above
        const optimalPopupContent = await createOptimalCardPopupContent(userLogin);

        // Clear the existing content and append the new content to the popup's body
        document.body.innerHTML = ''; // Clear any default content like URL/Login divs if needed
        document.body.appendChild(optimalPopupContent);

    } catch (error) {
        console.error("Error populating popup:", error);
        // Optionally, update the UI to show errors directly in the popup
        document.body.innerHTML = '<div style="padding: 20px; color: red;">Error loading popup content.</div>';
    }
}

// Run the populate function when the popup's DOM is loaded
document.addEventListener('DOMContentLoaded', populatePopup);
