// API base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Helper function to get tomorrow's date
function getTomorrowDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

// Helper function to get date 3 days later
function getThreeDaysLater() {
  const threeDaysLater = new Date();
  threeDaysLater.setDate(threeDaysLater.getDate() + 3);
  return threeDaysLater.toISOString().split('T')[0];
}

// Save search parameters to session storage
function saveSearchParams(formData) {
  sessionStorage.setItem('lastSearchParams', JSON.stringify(formData));
}

// Save search results to session storage
function saveSearchResults(packages) {
  sessionStorage.setItem('lastSearchResults', JSON.stringify(packages));
}

// Get search parameters from session storage or default
function getSearchParams() {
  // Try to get from session storage first
  const savedParams = sessionStorage.getItem('lastSearchParams');
  if (savedParams) {
    try {
      return JSON.parse(savedParams);
    } catch (e) {
      console.error('Error parsing saved search params:', e);
    }
  }
  
  // Default parameters
  return {
    destination: '',
    startDate: getTomorrowDate(),
    endDate: getThreeDaysLater(),
    budgetMin: '5000',
    budgetMax: '50000',
    travellers: '2'
  };
}

// Populate destinations dropdown from database
async function loadDestinations() {
  try {
    const response = await fetch(`${API_BASE_URL}/packages/destinations`);
    const data = await response.json();
    
    if (data.success) {
      const destinationSelect = document.getElementById('destination');
      destinationSelect.innerHTML = '<option value="">Select destination</option>';
      
      data.destinations.forEach(destination => {
        const option = document.createElement('option');
        option.value = destination;
        option.textContent = destination;
        destinationSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error loading destinations:', error);
    const fallbackDestinations = ['Goa', 'Jaipur', 'Rishikesh', 'Manali', 'Ayodhya'];
    const destinationSelect = document.getElementById('destination');
    
    fallbackDestinations.forEach(destination => {
      const option = document.createElement('option');
      option.value = destination;
      option.textContent = destination;
      destinationSelect.appendChild(option);
    });
  }
}

// Fetch packages from API
async function fetchPackages(formData) {
  const loadingSpinner = document.getElementById('loadingSpinner');
  const packagesList = document.getElementById('packagesList');
  const resultsDiv = document.getElementById('results');
  const noResults = document.getElementById('noResults');
  const resultsCount = document.getElementById('resultsCount');
  
  loadingSpinner.style.display = 'block';
  packagesList.innerHTML = '';
  noResults.style.display = 'none';
  resultsDiv.style.display = 'block';
  
  try {
    const response = await fetch(`${API_BASE_URL}/packages/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    const data = await response.json();
    loadingSpinner.style.display = 'none';
    
    if (data.success && data.packages.length > 0) {
      resultsCount.textContent = `${data.packages.length} package${data.packages.length !== 1 ? 's' : ''} found`;
      displayPackages(data.packages);
      noResults.style.display = 'none';
      
      // Save the search results for potential back navigation
      saveSearchResults(data.packages);
      
    } else {
      resultsCount.textContent = '0 packages found';
      packagesList.innerHTML = '';
      noResults.style.display = 'block';
    }
    
  } catch (error) {
    console.error('Error fetching packages:', error);
    loadingSpinner.style.display = 'none';
    resultsCount.textContent = 'Error loading packages';
    packagesList.innerHTML = '<div style="color: #d32f2f; text-align: center; padding: 20px;">Failed to load packages. Please try again.</div>';
  }
}

// Display packages in the UI - FIXED WITH TYPE="BUTTON"
function displayPackages(packages) {
  const packagesList = document.getElementById('packagesList');
  packagesList.innerHTML = '';
  
  console.log('Displaying packages:', packages.length);
  
  packages.forEach(pkg => {
    const packageCard = document.createElement('div');
    packageCard.className = 'package-card';
    
    console.log('Creating card for package ID:', pkg.package_id, 'Title:', pkg.title);
    
    // Format features
    const features = pkg.included_features ? 
      pkg.included_features.split(',').slice(0, 3).join(', ') : 'No features listed';
    
    const travellers = parseInt(document.getElementById('travellers').value) || 1;
    const totalPrice = pkg.price_per_person * travellers;
    
    packageCard.innerHTML = `
      <div class="package-header">
        <div class="package-title">${escapeHtml(pkg.title)}</div>
        <div class="package-price">₹${totalPrice.toLocaleString()} total</div>
      </div>
      <div class="package-details">
        <span class="package-detail">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          ${pkg.duration_days} days
        </span>
        <span class="package-detail">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75"/>
          </svg>
          ${pkg.min_travellers}-${pkg.max_travellers} people
        </span>
        <span class="package-detail">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
          </svg>
          ₹${pkg.price_per_person.toLocaleString()}/person
        </span>
      </div>
      <div class="package-features" title="${escapeHtml(pkg.included_features || '')}">
        ${escapeHtml(features)}
      </div>
      <div class="package-actions">
        <button type="button" class="btn btn-small btn-details" data-package-id="${pkg.package_id}">
          Details
        </button>
        <button type="button" class="btn btn-small btn-book" data-package-id="${pkg.package_id}">
          Book Now
        </button>
      </div>
    `;
    
    packagesList.appendChild(packageCard);
  });
  
  // Add event listeners
  addPackageButtonListeners();
}

// Add event listeners to package buttons
function addPackageButtonListeners() {
  const packagesList = document.getElementById('packagesList');
  
  // Remove any existing listeners to avoid duplicates
  const newPackagesList = packagesList.cloneNode(true);
  packagesList.parentNode.replaceChild(newPackagesList, packagesList);
  
  // Add new listener
  newPackagesList.addEventListener('click', function(event) {
    // Check if clicked element is a details button or inside it
    let detailsBtn = event.target;
    if (!detailsBtn.classList.contains('btn-details')) {
      detailsBtn = detailsBtn.closest('.btn-details');
    }
    
    // Check if clicked element is a book button or inside it
    let bookBtn = event.target;
    if (!bookBtn.classList.contains('btn-book')) {
      bookBtn = bookBtn.closest('.btn-book');
    }
    
    if (detailsBtn) {
      event.preventDefault();
      event.stopPropagation();
      
      const packageId = detailsBtn.getAttribute('data-package-id');
      console.log('Details button clicked for package ID:', packageId);
      console.log('Redirecting to: package-details.html?id=' + packageId);
      
      if (packageId) {
        // Save current search parameters before redirecting
        const currentFormData = {
          destination: document.getElementById('destination').value.trim(),
          startDate: document.getElementById('startDate').value,
          endDate: document.getElementById('endDate').value,
          budgetMin: document.getElementById('budgetMin').value,
          budgetMax: document.getElementById('budgetMax').value,
          travellers: document.getElementById('travellers').value
        };
        saveSearchParams(currentFormData);
        
        // Also save current search results if available
        const packagesList = document.getElementById('packagesList');
        const packages = Array.from(packagesList.querySelectorAll('.package-card')).map(card => {
          const packageId = card.querySelector('.btn-details').getAttribute('data-package-id');
          return { package_id: packageId };
        });
        if (packages.length > 0) {
          saveSearchResults(packages);
        }
        
        // Then redirect
        window.location.href = `package-details.html?id=${packageId}`;
      }
    }
    
    if (bookBtn) {
      event.preventDefault();
      event.stopPropagation();
      
      const packageId = bookBtn.getAttribute('data-package-id');
      console.log('Book button clicked for package ID:', packageId);
      if (packageId) {
        const destination = document.getElementById('destination')?.value || 'selected destination';
        const travellers = document.getElementById('travellers')?.value || 1;
        alert(`Booking package ${packageId} for ${travellers} people to ${destination}`);
      }
    }
  });
}

// Helper function to escape HTML
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Helper function to parse date
function parseDate(dateString) {
  if (!dateString) return null;
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Calculate duration in days
function calculateDurationDays(startDateStr, endDateStr) {
  try {
    const startDate = parseDate(startDateStr);
    const endDate = parseDate(endDateStr);
    
    if (!startDate || !endDate) return 0;
    
    const timeDiff = endDate.getTime() - startDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  } catch (error) {
    console.error('Error calculating duration:', error);
    return 0;
  }
}

// Save travel preferences
async function saveTravelPreferences() {
  try {
    const destination = document.getElementById('destination').value.trim();
    const startDateInput = document.getElementById('startDate').value;
    const endDateInput = document.getElementById('endDate').value;
    const budgetMin = parseInt(document.getElementById('budgetMin').value) || 0;
    const budgetMax = parseInt(document.getElementById('budgetMax').value) || 0;
    const travelers = parseInt(document.getElementById('travellers').value) || 1;

    if (!destination || !startDateInput || !endDateInput) {
      return false;
    }

    const userData = localStorage.getItem('user');
    let userId = null;
    
    if (userData) {
      try {
        const user = JSON.parse(userData);
        userId = user.user_id || user.id;
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }

    if (!userId) {
      const tempPrefs = {
        destination,
        start_date: startDateInput,
        end_date: endDateInput,
        budget_min: budgetMin,
        budget_max: budgetMax,
        travelers_count: travelers,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('pending_travel_prefs', JSON.stringify(tempPrefs));
      return false;
    }

    const durationDays = calculateDurationDays(startDateInput, endDateInput);
    const preferenceData = {
      user_id: userId,
      destination: destination,
      start_date: startDateInput,
      end_date: endDateInput,
      duration_days: durationDays,
      budget_min: budgetMin,
      budget_max: budgetMax,
      travelers_count: travelers
    };

    const response = await fetch(`${API_BASE_URL}/preferences/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preferenceData)
    });

    const data = await response.json();
    
    if (data.success) {
      localStorage.removeItem('pending_travel_prefs');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error saving travel preferences:', error);
    return false;
  }
}

// Basic client-side validation
function validateForm() {
  const destination = document.getElementById('destination').value.trim();
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  const budgetMin = parseInt(document.getElementById('budgetMin').value, 10);
  const budgetMax = parseInt(document.getElementById('budgetMax').value, 10);
  const travellers = parseInt(document.getElementById('travellers').value, 10);

  if (!destination) {
    alert('Please select a destination in India.');
    return false;
  }

  if (!startDate || !endDate) {
    alert('Please select both start and end dates.');
    return false;
  }

  const startDateObj = parseDate(startDate);
  const endDateObj = parseDate(endDate);
  
  if (startDateObj > endDateObj) {
    alert('End date should be on or after the start date.');
    return false;
  }

  if (isNaN(budgetMin) || isNaN(budgetMax) || budgetMin < 0 || budgetMax < 0) {
    alert('Please enter a valid budget range in rupees.');
    return false;
  }

  if (budgetMin > budgetMax) {
    alert('Minimum budget cannot be greater than maximum budget.');
    return false;
  }

  if (isNaN(travellers) || travellers < 1 || travellers > 10) {
    alert('Number of travellers must be between 1 and 10.');
    return false;
  }

  return true;
}

// Handle "View packages" click - PREVENT DEFAULT
document.getElementById('viewPackagesBtn').addEventListener('click', async function (event) {
  event.preventDefault();
  event.stopPropagation();
  
  await saveTravelPreferences();
  
  if (!validateForm()) return;

  const formData = {
    destination: document.getElementById('destination').value.trim(),
    startDate: document.getElementById('startDate').value,
    endDate: document.getElementById('endDate').value,
    budgetMin: parseInt(document.getElementById('budgetMin').value) || 0,
    budgetMax: parseInt(document.getElementById('budgetMax').value) || 0,
    travellers: parseInt(document.getElementById('travellers').value) || 0
  };

  // Save search parameters before fetching
  saveSearchParams(formData);
  
  console.log('Fetching packages with data:', formData);
  fetchPackages(formData);
});
// Handle "Customize your own trip" click - COMPLETE FIXED VERSION
document.getElementById('customTripBtn').addEventListener('click', async function (event) {
  event.preventDefault();
  event.stopPropagation();
  
  await saveTravelPreferences();
  
  if (!validateForm()) return;
  
  // Get current form data
  const formData = {
    destination: document.getElementById('destination').value.trim(),
    startDate: document.getElementById('startDate').value,
    endDate: document.getElementById('endDate').value,
    budgetMin: document.getElementById('budgetMin').value,
    budgetMax: document.getElementById('budgetMax').value,
    travellers: document.getElementById('travellers').value
  };
  
  console.log('=== CUSTOMIZE TRIP ===');
  console.log('Saving form data:', formData);
  
  // SAVE TO SESSION STORAGE - THIS IS CRITICAL FOR THE SELF PAGE
  sessionStorage.setItem('lastSearchParams', JSON.stringify(formData));
  
  // ALSO save to localStorage as backup
  localStorage.setItem('pending_travel_prefs', JSON.stringify({
    destination: formData.destination,
    start_date: formData.startDate,
    end_date: formData.endDate,
    budget_min: formData.budgetMin,
    budget_max: formData.budgetMax,
    travelers_count: formData.travellers
  }));
  
  // Save trip type
  sessionStorage.setItem('tripType', 'custom');
  
  // REDIRECT DIRECTLY TO GROUP DETAILS PAGE
  // Skip travel-style.html for now to simplify the flow
  console.log('Redirecting directly to group-details.html');
  window.location.href = 'group-details.html';
});
// Handle "Customize your own trip" click - PREVENT DEFAULT
document.getElementById('customTripBtn').addEventListener('click', async function (event) {
  event.preventDefault();
  event.stopPropagation();
  
  await saveTravelPreferences();
  
  if (!validateForm()) return;
  
  const params = new URLSearchParams({
    destination: document.getElementById('destination').value.trim(),
    startDate: document.getElementById('startDate').value,
    endDate: document.getElementById('endDate').value,
    budgetMin: document.getElementById('budgetMin').value,
    budgetMax: document.getElementById('budgetMax').value,
    travellers: document.getElementById('travellers').value
  });
  
  window.location.href = `travel-style.html?${params.toString()}`;
});

// Initialize on page load
window.addEventListener('DOMContentLoaded', function() {
  const today = new Date();
  const todayFormatted = today.toISOString().split('T')[0];
  
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  
  startDateInput.min = todayFormatted;
  endDateInput.min = todayFormatted;
  
  // Check if we have preserved search parameters from package details page
  const urlParams = new URLSearchParams(window.location.search);
  const preserveSearch = urlParams.get('preserveSearch');
  
  if (preserveSearch === 'true') {
    // Load from URL parameters (coming back from package details)
    const destination = urlParams.get('destination') || '';
    const startDate = urlParams.get('startDate') || getTomorrowDate();
    const endDate = urlParams.get('endDate') || getThreeDaysLater();
    const budgetMin = urlParams.get('budgetMin') || '';
    const budgetMax = urlParams.get('budgetMax') || '';
    const travellers = urlParams.get('travellers') || '0';
    
    // Set form values
    document.getElementById('destination').value = destination;
    document.getElementById('startDate').value = startDate;
    document.getElementById('endDate').value = endDate;
    document.getElementById('budgetMin').value = budgetMin;
    document.getElementById('budgetMax').value = budgetMax;
    document.getElementById('travellers').value = travellers;
    
    // Save to session storage
    const formData = {
      destination: destination,
      startDate: startDate,
      endDate: endDate,
      budgetMin: budgetMin || '0',
      budgetMax: budgetMax || '0',
      travellers: travellers || '0'
    };
    saveSearchParams(formData);
    
    // Auto-search if we have a destination
    if (destination) {
      // Check if we have saved search results
      const savedResults = sessionStorage.getItem('lastSearchResults');
      
      if (savedResults) {
        try {
          const packages = JSON.parse(savedResults);
          console.log('Restoring saved search results:', packages.length);
          displayPackages(packages);
          
          // Show results section
          document.getElementById('results').style.display = 'block';
          document.getElementById('resultsCount').textContent = `${packages.length} package${packages.length !== 1 ? 's' : ''} found`;
          document.getElementById('noResults').style.display = 'none';
        } catch (e) {
          console.error('Error parsing saved results:', e);
          // Fallback to API search
          autoSearchWithDelay(formData);
        }
      } else {
        // No saved results, search via API
        autoSearchWithDelay(formData);
      }
    }
  } else {
    // Normal initialization
    // Set placeholder to show date format
    startDateInput.placeholder = 'YYYY-MM-DD';
    endDateInput.placeholder = 'YYYY-MM-DD';
    
    // Clear default values (keep them empty as per your requirement)
    document.getElementById('budgetMin').value = '';
    document.getElementById('budgetMin').placeholder = 'Min';
    document.getElementById('budgetMax').value = '';
    document.getElementById('budgetMax').placeholder = 'Max';
    document.getElementById('travellers').value = '0';
  }
  
  // Load destinations from database
  loadDestinations();
  
  // Check for pending travel preferences from localStorage
  const pendingPrefs = localStorage.getItem('pending_travel_prefs');
  if (pendingPrefs) {
    try {
      const prefs = JSON.parse(pendingPrefs);
      document.getElementById('destination').value = prefs.destination || '';
      if (prefs.start_date) document.getElementById('startDate').value = prefs.start_date;
      if (prefs.end_date) document.getElementById('endDate').value = prefs.end_date;
      if (prefs.budget_min) document.getElementById('budgetMin').value = prefs.budget_min;
      if (prefs.budget_max) document.getElementById('budgetMax').value = prefs.budget_max;
      if (prefs.travelers_count) document.getElementById('travellers').value = prefs.travelers_count;
    } catch (e) {
      console.error('Error parsing pending preferences:', e);
    }
  }
  
  // Also prevent form submission on the form itself
  document.getElementById('tripForm').addEventListener('submit', function(event) {
    event.preventDefault();
    event.stopPropagation();
    return false;
  });
});

// Helper function for auto-search with delay
function autoSearchWithDelay(formData) {
  setTimeout(() => {
    const searchData = {
      destination: formData.destination,
      startDate: formData.startDate,
      endDate: formData.endDate,
      budgetMin: parseInt(formData.budgetMin) || 0,
      budgetMax: parseInt(formData.budgetMax) || 0,
      travellers: parseInt(formData.travellers) || 0
    };
    fetchPackages(searchData);
  }, 300);
}