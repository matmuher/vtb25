// Saves options to chrome.storage
function saveOptions() {
    const login = document.getElementById('loginInput').value;
    chrome.storage.sync.set({
        userLogin: login
    }, function() {
        // Update status to let user know options were saved.
        console.log('Login saved to storage:', login);
        if (chrome.runtime.lastError) {
            console.error("Error saving login:", chrome.runtime.lastError);
        } else {
            // Optional: Show a temporary message
            const saveButton = document.getElementById('saveButton');
            const originalText = saveButton.textContent;
            saveButton.textContent = 'Saved!';
            setTimeout(() => {
                 saveButton.textContent = originalText;
            }, 2000);
        }
    });
}

// Restores options from chrome.storage
function restoreOptions() {
    chrome.storage.sync.get('userLogin', function(result) {
        if (chrome.runtime.lastError) {
            console.error("Error restoring login:", chrome.runtime.lastError);
            // Optionally, clear the input or show an error
            document.getElementById('loginInput').value = '';
        } else {
            document.getElementById('loginInput').value = result.userLogin || '';
        }
    });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('saveButton').addEventListener('click', saveOptions);
