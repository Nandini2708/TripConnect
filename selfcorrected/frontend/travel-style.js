// Interest selection logic
const interestOptions = document.querySelectorAll('.interest-option');
const selectedCountElement = document.getElementById('selected-count');
const progressBar = document.getElementById('progressBar');
const companionOptions = document.querySelectorAll('.companion-option');
const instructionMessage = document.getElementById('instruction-message');
const successMessage = document.getElementById('success-message');

let selectedInterests = [];
let selectedCompanion = null;
let companionEnabled = false;

// Initialize
updateProgress();

// Handle interest selection
interestOptions.forEach(option => {
    option.addEventListener('click', () => {
        const interest = option.getAttribute('data-interest');
        const isSelected = selectedInterests.includes(interest);

        if (isSelected) {
            // Deselect interest
            selectedInterests = selectedInterests.filter(item => item !== interest);
            option.classList.remove('selected');
            
            // Disable companion options if less than 5 interests
            if (selectedInterests.length < 5) {
                disableCompanionOptions();
            }
        } else {
            // Select interest
            if (selectedInterests.length < 5) {
                selectedInterests.push(interest);
                option.classList.add('selected');

                // Visual feedback
                option.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    option.style.transform = 'scale(1)';
                }, 200);
                
                // Enable companion options if exactly 5 interests are selected
                if (selectedInterests.length === 5) {
                    enableCompanionOptions();
                }
            } else {
                // Already have 5 interests, show message
                showMaxInterestsMessage();
                return;
            }
        }

        updateProgress();
        logCurrentSelection();
    });
});

// Handle companion selection
companionOptions.forEach(option => {
    option.addEventListener('click', async () => {
        const companionType = option.getAttribute('data-companion');
        
        // Check if exactly 5 interests are selected
        if (selectedInterests.length !== 5) {
            showSelectMoreInterestsMessage();
            return;
        }
        
        // Check if companion options are enabled
        if (!companionEnabled) {
            return;
        }

        try {
            // Save to backend before redirecting
            const result = await savePreferencesToBackend(selectedInterests, companionType);
            console.log('Save result:', result);
            
            // Update UI
            updateSelectionAndRedirect(option, companionType);
        } catch (error) {
            console.error('Error saving preferences:', error);
            showSaveError();
        }
    });
});

// Function to save preferences to backend
async function savePreferencesToBackend(interests, companion_type) {
    // Get user ID (you need to implement this based on your auth system)
    const user_id = getUserId();
    
    if (!user_id) {
        // If no user ID, save to localStorage temporarily
        console.log('No user ID found, saving to localStorage temporarily');
        saveToLocalStorage(interests, companion_type);
        
        // Return success for demo purposes
        return {
            success: true,
            message: 'Saved to localStorage (not logged in)'
        };
    }
    
    const response = await fetch('http://localhost:5000/api/preferences/save-interests', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            user_id: user_id,
            interests: interests,
            companion_type: companion_type  // Note: using 'companion_type' to match your table column
        })
    });
    
    const result = await response.json();
    
    if (!result.success) {
        throw new Error(result.message || 'Failed to save preferences');
    }
    
    return result;
}

// Helper function to get user ID
function getUserId() {
    // Try to get from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            return user.id || user.user_id || user.userId;
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }
    
    // Try to get from sessionStorage
    const sessionUser = sessionStorage.getItem('currentUser');
    if (sessionUser) {
        try {
            const user = JSON.parse(sessionUser);
            return user.id || user.user_id;
        } catch (e) {
            console.error('Error parsing session user:', e);
        }
    }
    
    // Check for auth token
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (token) {
        // If you have JWT token, you might decode it to get user ID
        // For now, return null and handle in your auth system
        console.log('Auth token found but user ID extraction not implemented');
    }
    
    return null;
}

// Save to localStorage as fallback
function saveToLocalStorage(interests, companion_type) {
    const tempPreferences = {
        interests: interests,
        companion_type: companion_type,
        saved_at: new Date().toISOString(),
        from_localStorage: true
    };
    localStorage.setItem('tripconnect_preferences', JSON.stringify(tempPreferences));
    localStorage.setItem('tripconnect_interests', JSON.stringify(interests));
    localStorage.setItem('tripconnect_companion', companion_type);
}

// Load saved preferences from localStorage
function loadFromLocalStorage() {
    const savedPrefs = localStorage.getItem('tripconnect_preferences');
    if (savedPrefs) {
        try {
            const prefs = JSON.parse(savedPrefs);
            if (prefs.interests && prefs.interests.length > 0) {
                // Select the saved interests
                prefs.interests.forEach(interest => {
                    const option = document.querySelector(`.interest-option[data-interest="${interest}"]`);
                    if (option && selectedInterests.length < 5) {
                        selectedInterests.push(interest);
                        option.classList.add('selected');
                    }
                });
                
                updateProgress();
                
                if (selectedInterests.length === 5) {
                    enableCompanionOptions();
                    
                    // Auto-select the saved companion if available
                    if (prefs.companion_type) {
                        const companionOption = document.querySelector(`.companion-option[data-companion="${prefs.companion_type}"]`);
                        if (companionOption && companionEnabled) {
                            companionOption.click();
                        }
                    }
                }
            }
        } catch (e) {
            console.error('Error loading from localStorage:', e);
        }
    }
}

// Show save error message
function showSaveError() {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'save-error-message';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        <span>Failed to save preferences. Check your connection.</span>
    `;
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(231, 76, 60, 0.9);
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(errorDiv);
        }, 300);
    }, 3000);
}

// Helper function to update selection and redirect
function updateSelectionAndRedirect(option, companion_type) {
    // Update selection
    companionOptions.forEach(opt => {
        opt.classList.remove('selected');
        const statusIndicator = opt.querySelector('.status-indicator');
        if (statusIndicator) {
            statusIndicator.classList.remove('active');
        }
    });
    
    option.classList.add('selected');
    const statusIndicator = option.querySelector('.status-indicator');
    if (statusIndicator) {
        statusIndicator.classList.add('active');
    }

    // Visual feedback
    option.style.transform = 'scale(1.02)';
    setTimeout(() => {
        option.style.transform = '';
    }, 200);

    selectedCompanion = companion_type;
    logCurrentSelection();

    // Redirect to selected page after a short delay
    setTimeout(() => {
        redirectToSelectedPage();
    }, 500); // Increased delay to ensure save completes
}

// Update progress bar and count
function updateProgress() {
    const count = selectedInterests.length;
    const percentage = (count / 5) * 100;
    
    selectedCountElement.textContent = count;
    progressBar.style.width = `${percentage}%`;
    
    // Change progress bar color based on count
    if (count === 5) {
        progressBar.style.background = 'linear-gradient(90deg, #2ecc71, #27ae60)';
        selectedCountElement.style.color = '#27ae60';
        selectedCountElement.style.fontWeight = 'bold';
    } else if (count >= 3) {
        progressBar.style.background = 'linear-gradient(90deg, #f39c12, #e67e22)';
        selectedCountElement.style.color = '#e67e22';
    } else {
        progressBar.style.background = 'linear-gradient(90deg, #3498db, #2980b9)';
        selectedCountElement.style.color = '#3498db';
    }
}

// Enable companion options when exactly 5 interests are selected
function enableCompanionOptions() {
    companionEnabled = true;
    companionOptions.forEach(option => {
        const companionType = option.getAttribute('data-companion');
        
        // Enable Self Group option
        if (companionType === 'self-group') {
            option.classList.remove('disabled');
            option.classList.add('enabled');
            const lockIcon = option.querySelector('.lock-icon');
            if (lockIcon) {
                lockIcon.style.display = 'none';
            }
            
            // Update status indicator
            const statusIndicator = option.querySelector('.status-indicator');
            if (statusIndicator) {
                statusIndicator.className = 'status-indicator available';
            }
            
            // Remove requirements message
            const requirementsMessage = option.querySelector('.requirements-message');
            if (requirementsMessage) {
                requirementsMessage.style.display = 'none';
            }
        } 
        // Enable Find a Travel Buddy option
        else if (companionType === 'buddy') {
            option.classList.remove('disabled');
            option.classList.add('enabled');
            const lockIcon = option.querySelector('.lock-icon');
            if (lockIcon) {
                lockIcon.style.display = 'none';
            }
        }
        
        // Add unlock animation
        option.classList.add('unlock-animation');
        setTimeout(() => {
            option.classList.remove('unlock-animation');
        }, 500);
    });
    
    // Show success message
    instructionMessage.classList.add('hidden');
    successMessage.classList.remove('hidden');
    
    // Celebrate completion
    celebrateCompletion();
}

// Disable companion options when less than 5 interests are selected
function disableCompanionOptions() {
    companionEnabled = false;
    selectedCompanion = null;
    companionOptions.forEach(option => {
        option.classList.add('disabled');
        option.classList.remove('enabled');
        option.classList.remove('selected');
        
        const lockIcon = option.querySelector('.lock-icon');
        if (lockIcon) {
            lockIcon.style.display = 'block';
        }
        
        const statusIndicator = option.querySelector('.status-indicator');
        if (statusIndicator) {
            statusIndicator.classList.remove('active');
            statusIndicator.className = 'status-indicator';
        }
    });
    
    // Show instruction message
    successMessage.classList.add('hidden');
    instructionMessage.classList.remove('hidden');
}

// Show message when trying to select more than 5 interests
function showMaxInterestsMessage() {
    // Visual feedback
    interestOptions.forEach(option => {
        if (option.classList.contains('selected')) {
            option.classList.add('shake');
            setTimeout(() => {
                option.classList.remove('shake');
            }, 400);
        }
    });
    
    // Show temporary message
    const originalText = instructionMessage.querySelector('span').textContent;
    instructionMessage.style.backgroundColor = 'rgba(231, 76, 60, 0.1)';
    instructionMessage.style.borderColor = 'rgba(231, 76, 60, 0.3)';
    instructionMessage.style.color = '#e74c3c';
    instructionMessage.querySelector('span').textContent = 'Maximum 5 interests allowed. Please deselect one to choose another.';
    
    setTimeout(() => {
        instructionMessage.style.backgroundColor = '';
        instructionMessage.style.borderColor = '';
        instructionMessage.style.color = '';
        instructionMessage.querySelector('span').textContent = originalText;
    }, 2000);
}

// Show message when trying to select companion without 5 interests
function showSelectMoreInterestsMessage() {
    // Shake companion options
    companionOptions.forEach(option => {
        option.classList.add('shake');
        setTimeout(() => {
            option.classList.remove('shake');
        }, 400);
    });
    
    // Highlight unselected interests
    interestOptions.forEach(option => {
        if (!option.classList.contains('selected')) {
            option.style.borderColor = '#e74c3c';
            option.style.boxShadow = '0 0 10px rgba(231, 76, 60, 0.3)';
        }
    });
    
    // Show temporary message
    const originalText = instructionMessage.querySelector('span').textContent;
    instructionMessage.style.backgroundColor = 'rgba(231, 76, 60, 0.1)';
    instructionMessage.style.borderColor = 'rgba(231, 76, 60, 0.3)';
    instructionMessage.style.color = '#e74c3c';
    instructionMessage.querySelector('span').textContent = `Please select ${5 - selectedInterests.length} more interest(s) to unlock travel options`;
    
    setTimeout(() => {
        instructionMessage.style.backgroundColor = '';
        instructionMessage.style.borderColor = '';
        instructionMessage.style.color = '';
        instructionMessage.querySelector('span').textContent = originalText;
        
        // Reset styles
        interestOptions.forEach(option => {
            if (!option.classList.contains('selected')) {
                option.style.borderColor = '';
                option.style.boxShadow = '';
            }
        });
    }, 2000);
}

// Celebration animation
function celebrateCompletion() {
    interestOptions.forEach(option => {
        if (option.classList.contains('selected')) {
            option.style.animation = 'pulse 0.5s ease 2';
            option.style.borderColor = '#2ecc71';
            option.style.boxShadow = '0 0 15px rgba(46, 204, 113, 0.5)';
        }
    });
    
    setTimeout(() => {
        interestOptions.forEach(option => {
            if (option.classList.contains('selected')) {
                option.style.animation = '';
                option.style.boxShadow = '0 5px 15px rgba(52, 152, 219, 0.3)';
            }
        });
    }, 1000);
}

// Redirect to selected page
function redirectToSelectedPage() {
    // Pass selected interests as URL parameters
    const params = new URLSearchParams();
    selectedInterests.forEach(interest => {
        params.append('interests', interest);
    });
    
    if (selectedCompanion === 'self-group') {
        window.location.href = `self.html?${params.toString()}&companion=self-group`;
    } else if (selectedCompanion === 'buddy') {
        window.location.href = `travelBuddyhtml.html?${params.toString()}&companion=buddy`;
    }
}

// Helper to show state in console
function logCurrentSelection() {
    console.log('Selected interests:', selectedInterests);
    console.log('Selected companion:', selectedCompanion);
    console.log('Companion enabled:', companionEnabled);
}

// India badge glow effect
window.addEventListener('load', function () {
    const badge = document.querySelector('.india-badge');
    setInterval(() => {
        badge.style.boxShadow = '0 0 20px rgba(52, 152, 219, 0.4)';
        setTimeout(() => {
            badge.style.boxShadow = '0 5px 15px rgba(52, 152, 219, 0.2)';
        }, 1000);
    }, 3000);
    
    // Load saved preferences on page load
    loadFromLocalStorage();
    
    // Initialize user data
    if (!localStorage.getItem('tripConnectUser')) {
        localStorage.setItem('tripConnectUser', JSON.stringify({
            profileComplete: false,
            verified: false,
            paymentMethodAdded: false,
            tripsCompleted: 0
        }));
    }
});

// Click effects
document.querySelectorAll('.interest-option, .companion-option.enabled').forEach(element => {
    element.addEventListener('mousedown', () => {
        element.style.transform = 'scale(0.98)';
    });

    element.addEventListener('mouseup', () => {
        element.style.transform = '';
    });

    element.addEventListener('mouseleave', () => {
        element.style.transform = '';
    });
});

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .save-error-message {
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(231, 76, 60, 0.9);
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideIn 0.3s ease;
    }
`;
document.head.appendChild(style);