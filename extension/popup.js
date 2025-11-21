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
        console.log("Retrieved from storage.local (login):", result); // Debug log
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

// NEW: Function to mock optimal pay data
async function fetchOptimalPayData(userLogin, currentUrl) {
    console.log("Mocking optimal pay data for:", userLogin, currentUrl); // Debug log
    // Return the mock data provided in the curl example
    return [
        {"category":"restaurant","bank":"abank","predicted":"yes"},
        {"category":"cafe","bank":"abank","predicted":"no"},
        {"category":"grocery","bank":"sbank","predicted":"no"},
        {"category":"clothing","bank":"sbank","predicted":"no"}
    ];
}


// NEW: Function to create and show the Category Dropdown using fetched data
// This replicates the logic from the main app's CategoryDropdown component, adapted for fetched data
async function showCategoryDropdown(currentCategory, onCategorySelect, optimalPayData, onClose) {
    // Extract unique categories from the fetched data
    const allCategories = [...new Set(optimalPayData.map(item => item.category))];

    // Find the best bank for the *current* selected category from the fetched data
    const currentCategoryData = optimalPayData.find(item => item.category === currentCategory);
    const bestBank = currentCategoryData ? currentCategoryData.bank : 'Не найден';

    console.log("Showing dropdown for current category:", currentCategory, "Best bank:", bestBank, "All categories:", allCategories); // Debug log

    // Create the overlay for the dropdown
    const dropdownOverlay = document.createElement('div');
    dropdownOverlay.className = "fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"; // EXACT FROM REACT

    // Create the dropdown content div
    const dropdownContent = document.createElement('div');
    dropdownContent.className = "bg-white rounded-2xl p-6 w-full max-w-md"; // EXACT FROM REACT

    // Create header
    const headerDiv = document.createElement('div');
    headerDiv.className = "flex justify-between items-start mb-4"; // EXACT FROM REACT

    const titleH3 = document.createElement('h3');
    titleH3.className = "text-xl font-bold text-gray-800"; // EXACT FROM REACT
    titleH3.textContent = "Выбрать категорию";

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

    // Add close functionality
    closeButton.addEventListener('click', () => {
        dropdownOverlay.remove(); // Remove the dropdown overlay
        if (onClose) onClose(); // Call the provided close handler if needed
    });

    headerDiv.appendChild(titleH3);
    headerDiv.appendChild(closeButton);
    dropdownContent.appendChild(headerDiv);

    // Create content section
    const contentSection = document.createElement('div');
    contentSection.className = "mb-4"; // EXACT FROM REACT

    // Display current category and best bank (for context)
    const currentCategoryDisplay = document.createElement('div');
    currentCategoryDisplay.className = "text-center text-xl font-bold text-gray-800 mb-2"; // EXACT FROM REACT
    currentCategoryDisplay.textContent = currentCategory;

    const bestBankDisplay = document.createElement('div');
    bestBankDisplay.className = "text-center text-lg text-[#337357] mb-4 flex items-center justify-center gap-2"; // EXACT FROM REACT
    bestBankDisplay.innerHTML = `<span>✭</span><span>Лучший банк: ${bestBank}</span>`; // Using innerHTML for the span

    contentSection.appendChild(currentCategoryDisplay);
    contentSection.appendChild(bestBankDisplay);
    dropdownContent.appendChild(contentSection);

    // Create scrollable category list
    const listContainer = document.createElement('div');
    listContainer.className = "max-h-60 overflow-y-auto space-y-2"; // EXACT FROM REACT

    allCategories.forEach(category => {
        const categoryButton = document.createElement('button');
        categoryButton.textContent = category;
        categoryButton.className = `w-full text-left p-3 rounded-lg transition-colors duration-150 ${
            category === currentCategory
                ? 'bg-[#337357] text-white' // EXACT FROM REACT for selected
                : 'bg-gray-100 hover:bg-gray-200 text-gray-800' // EXACT FROM REACT for others
        }`;

        // Add click listener to select category
        categoryButton.addEventListener('click', () => {
            console.log("Selected category from dropdown:", category); // Debug log
            onCategorySelect(category, optimalPayData); // Pass the selected category AND the full data to update the main popup's state
            dropdownOverlay.remove(); // Close the dropdown
            if (onClose) onClose(); // Call the provided close handler if needed
        });

        listContainer.appendChild(categoryButton);
    });

    dropdownContent.appendChild(listContainer);
    dropdownOverlay.appendChild(dropdownContent);

    // Append the dropdown overlay to the body
    document.body.appendChild(dropdownOverlay);
}


// NEW: Function to create and populate the "Optimal Card" popup content
// This replicates the logic from the main app's OptimalCardPopup component, adapted for fetched data
// REMOVED: isOpen, onClose props as they are not needed here
async function createOptimalCardPopupContent(userLogin) {
    // Get the current URL
    const currentUrl = await getCurrentTabUrl();
    console.log("Current URL for API call:", currentUrl); // Debug log

    // Fetch optimal pay data from the API (now mocked)
    let optimalPayData = [];
    try {
        optimalPayData = await fetchOptimalPayData(userLogin, currentUrl);
        console.log("Fetched optimal pay data for popup (processed):", optimalPayData); // Debug log
    } catch (error) {
        console.error("Error fetching optimal pay data for popup:", error);
        // Handle error gracefully, maybe show a message
        document.body.innerHTML = '<div style="padding: 20px; color: red;">Error loading optimal pay data.</div>';
        return document.body; // Return early if data fetch fails
    }

    // Extract unique categories from the fetched data
    const allCategories = [...new Set(optimalPayData.map(item => item.category))];
    console.log("Available categories from API:", allCategories); // Debug log

    // Get the selected category from storage, default to the first one from the fetched data if available
    let selectedCategory = allCategories[0] || "Продукты"; // Fallback to "Продукты" if no categories fetched
    try {
        const result = await chrome.storage.local.get('selectedCategory');
        if (result.selectedCategory && allCategories.includes(result.selectedCategory)) {
            // Only use stored category if it's still in the fetched list
            selectedCategory = result.selectedCategory;
        }
        console.log("Initial selected category (from storage or default):", selectedCategory);
    } catch (error) {
        console.error("Error getting selected category from storage:", error);
        // Keep the default selectedCategory if storage fails
    }

    // Find the best bank for the *initial* selected category from the fetched data
    const initialCategoryData = optimalPayData.find(item => item.category === selectedCategory);
    let bestBank = initialCategoryData ? initialCategoryData.bank : 'Не найден';

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
    // CHANGED: Title text
    titleH3.textContent = `Оптимальная карта для покупки: ${selectedCategory}`; // Include login

    titleDiv.appendChild(titleH3);
    headerDiv.appendChild(titleDiv);

    // CHANGED: REMOVED Close button from the main popup header
    // const closeButton = document.createElement('button');
    // closeButton.className = "text-gray-500 hover:text-gray-700"; // EXACT FROM REACT
    // const closeIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    // closeIcon.setAttribute("width", "24");
    // closeIcon.setAttribute("height", "24");
    // closeIcon.setAttribute("viewBox", "0 0 24 24");
    // closeIcon.setAttribute("fill", "none");
    // closeIcon.setAttribute("stroke", "currentColor");
    // closeIcon.setAttribute("stroke-width", "2");
    // closeIcon.setAttribute("stroke-linecap", "round");
    // closeIcon.setAttribute("stroke-linejoin", "round");
    // closeIcon.classList.add("w-6", "h-6"); // Apply Tailwind classes if Tailwind is available in popup
    // const closeIconPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    // closeIconPath.setAttribute("d", "M18 6 6 18M6 6l12 12");
    // closeIcon.appendChild(closeIconPath);
    // closeButton.appendChild(closeIcon);

    // Add close functionality - Closes the entire popup window
    // closeButton.addEventListener('click', () => {
    //     window.close(); // Close the popup window
    // });

    // headerDiv.appendChild(closeButton); // REMOVED
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
    // CHANGED: Make the category button clickable to show the dropdown
    const categoryButton = document.createElement('button');
    categoryButton.className = "bg-gray-100 border border-gray-300 rounded-lg px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#337357] focus:border-transparent text-center flex items-center justify-center gap-2 min-w-[200px]"; // EXACT FROM REACT
    categoryButton.textContent = selectedCategory;
    // CHANGED: Add click listener to open the category dropdown
    categoryButton.addEventListener('click', async () => {
        console.log("Category button clicked, showing dropdown for:", selectedCategory); // Debug log
        // The function to call when a category is selected within the dropdown
        const handleCategorySelectFromDropdown = async (newCategory, fetchedData) => {
            console.log("Selected new category from dropdown:", newCategory);
            // Update the displayed category in the main popup content
            categoryButton.textContent = newCategory;
            // Update the selectedCategory in storage
            try {
                await chrome.storage.local.set({ 'selectedCategory': newCategory });
                console.log("Updated selectedCategory in storage.local:", newCategory);
                // Find the best bank for the *new* selected category from the fetched data
                const newCategoryData = fetchedData.find(item => item.category === newCategory);
                const newBestBank = newCategoryData ? newCategoryData.bank : 'Не найден';
                // Update the best bank display text
                if (bestBankDisplaySpan) {
                    bestBankDisplaySpan.textContent = newBestBank;
                }
                // Update the best bank variable in this scope for the payment button
                bestBank = newBestBank;
                // Update the payment button text
                paymentButton.textContent = `Оплатить с ${bestBank}`;
                // CHANGED: Update the main title text to reflect the new category
                titleH3.textContent = `Оптимальная карта для покупки: ${newCategory}`;
            } catch (storageError) {
                console.error("Error saving selected category:", storageError);
            }
        };

        // Show the dropdown, passing the current category, the selection handler, and the fetched data
        showCategoryDropdown(selectedCategory, handleCategorySelectFromDropdown, optimalPayData, null); // Pass null for onClose as main popup doesn't close
    });
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
    const bestBankDisplaySpan = document.createElement('span'); // Store reference to update later
    bestBankDisplaySpan.textContent = bestBank;
    bestBankDisplay.appendChild(starSpan);
    bestBankDisplay.appendChild(bestBankDisplaySpan);
    contentSection.appendChild(bestBankDisplay);

    // Payment button
    const paymentButton = document.createElement('button');
    paymentButton.className = "w-full bg-gradient-to-r from-[#337357] to-[#4CAF7D] hover:from-[#2B6246] hover:to-[#3D8B63] text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ease-in-out text-lg"; // EXACT FROM REACT
    paymentButton.textContent = `Оплатить с ${bestBank}`;
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
        console.log("Populating popup with URL:", currentUrl); // Debug log
        document.getElementById('currentUrl').textContent = currentUrl;
        document.getElementById('currentUrl').classList.remove('loading');

        // Get the saved login
        const userLogin = await getSavedLogin();
        console.log("Populating popup with login:", userLogin); // Debug log
        document.getElementById('userLogin').textContent = userLogin;
        document.getElementById('userLogin').classList.remove('loading');

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
