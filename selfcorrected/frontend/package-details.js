// API base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Get package ID from URL parameters
function getPackageIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// Fetch package details from API
async function fetchPackageDetails(packageId) {
    try {
        const response = await fetch(`${API_BASE_URL}/packages/${packageId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.package) {
            return data.package;
        } else {
            throw new Error(data.message || 'Package not found');
        }
    } catch (error) {
        console.error('Error fetching package details:', error);
        throw error;
    }
}

// Parse features into categorized format
function parseFeatures(featuresString) {
    if (!featuresString) return { categories: [] };

    const features = featuresString.split(',').map(feature => feature.trim());

    // Categorize features based on keywords
    const categories = {
        'Accommodation': [],
        'Transportation': [],
        'Meals': [],
        'Activities': [],
        'Guides & Services': [],
        'Other Inclusions': []
    };

    features.forEach(feature => {
        const lowerFeature = feature.toLowerCase();

        if (lowerFeature.includes('hotel') || lowerFeature.includes('resort') ||
            lowerFeature.includes('stay') || lowerFeature.includes('accommodation')) {
            categories['Accommodation'].push(feature);
        } else if (lowerFeature.includes('flight') || lowerFeature.includes('train') ||
            lowerFeature.includes('bus') || lowerFeature.includes('transport') ||
            lowerFeature.includes('vehicle') || lowerFeature.includes('transfer')) {
            categories['Transportation'].push(feature);
        } else if (lowerFeature.includes('meal') || lowerFeature.includes('breakfast') ||
            lowerFeature.includes('lunch') || lowerFeature.includes('dinner') ||
            lowerFeature.includes('food')) {
            categories['Meals'].push(feature);
        } else if (lowerFeature.includes('tour') || lowerFeature.includes('sightseeing') ||
            lowerFeature.includes('activity') || lowerFeature.includes('entrance') ||
            lowerFeature.includes('visit')) {
            categories['Activities'].push(feature);
        } else if (lowerFeature.includes('guide') || lowerFeature.includes('assistance') ||
            lowerFeature.includes('service') || lowerFeature.includes('support')) {
            categories['Guides & Services'].push(feature);
        } else {
            categories['Other Inclusions'].push(feature);
        }
    });

    // Filter out empty categories
    const result = [];
    for (const [category, items] of Object.entries(categories)) {
        if (items.length > 0) {
            result.push({ category, items });
        }
    }

    return { categories: result };
}

// Parse detailed itinerary from the details field
function parseDetailedItinerary(packageData) {
    const itinerary = [];
    const duration = packageData.duration_days || 1;

    // First, check if we have structured itinerary in details
    if (packageData.details) {
        const details = packageData.details;

        // Method 1: Check for numbered days (Day 1, Day 2, etc.)
        const dayPatterns = [
            /Day\s+(\d+)[:\-]\s*(.*?)(?=(Day\s+\d+[:\-]|\s*$))/gis,
            /Day\s+(\d+)[)\-]\s*(.*?)(?=(Day\s+\d+[)\-]|\s*$))/gis,
            /DAY\s+(\d+)[:\-]\s*(.*?)(?=(DAY\s+\d+[:\-]|\s*$))/gis
        ];

        for (const pattern of dayPatterns) {
            const matches = [...details.matchAll(pattern)];
            if (matches.length > 0) {
                matches.forEach(match => {
                    const dayNumber = parseInt(match[1]);
                    let dayContent = match[2].trim();

                    // Extract title if available (content before first period or colon)
                    let dayTitle = '';
                    let content = dayContent;

                    // Try to extract title
                    const firstSentenceEnd = dayContent.search(/[.:]/);
                    if (firstSentenceEnd > 0) {
                        dayTitle = dayContent.substring(0, firstSentenceEnd).trim();
                        content = dayContent.substring(firstSentenceEnd + 1).trim();
                    } else {
                        dayTitle = `Day ${dayNumber} Activities`;
                    }

                    // Extract highlights
                    const highlights = extractHighlights(dayContent);

                    // Determine theme
                    const theme = determineTheme(dayTitle + ' ' + content);

                    itinerary.push({
                        day: dayNumber,
                        title: `Day ${dayNumber}: ${dayTitle}`,
                        theme: theme,
                        content: content || 'Full day of activities and exploration.',
                        highlights: highlights.length > 0 ? highlights : getDefaultHighlights(dayNumber, packageData)
                    });
                });

                break; // Found structured format, stop checking other patterns
            }
        }

        // Method 2: If no structured days found, split by paragraphs/lines
        if (itinerary.length === 0) {
            const lines = details.split('\n').filter(line => line.trim().length > 10);

            lines.forEach((line, index) => {
                if (index < duration) { // Only create up to the package duration
                    const dayNumber = index + 1;
                    const theme = determineTheme(line);
                    const highlights = extractHighlights(line);

                    itinerary.push({
                        day: dayNumber,
                        title: `Day ${dayNumber}: ${getDayTitle(dayNumber, packageData)}`,
                        theme: theme,
                        content: line.trim(),
                        highlights: highlights.length > 0 ? highlights : getDefaultHighlights(dayNumber, packageData)
                    });
                }
            });
        }
    }

    // Method 3: If still no itinerary or incomplete, generate based on duration
    if (itinerary.length === 0 || itinerary.length < duration) {
        return generateCompleteItinerary(packageData);
    }

    // Sort by day number
    itinerary.sort((a, b) => a.day - b.day);

    return itinerary;
}

// Extract highlights from text
function extractHighlights(text) {
    const highlights = [];

    // Look for bullet points (•, -, *, ✓)
    const bulletRegex = /[•\-*✓]\s*([^.•\-*✓\n]+)/g;
    let bulletMatch;
    while ((bulletMatch = bulletRegex.exec(text)) !== null) {
        const highlight = bulletMatch[1].trim();
        if (highlight && highlight.length > 3) {
            highlights.push(highlight);
        }
    }

    // Look for numbered lists
    const numberRegex = /\d+[.)]\s*([^\d.\n]+)/g;
    while ((bulletMatch = numberRegex.exec(text)) !== null) {
        const highlight = bulletMatch[1].trim();
        if (highlight && highlight.length > 3) {
            highlights.push(highlight);
        }
    }

    // If no bullets found, extract key phrases
    if (highlights.length === 0) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
        sentences.slice(0, 4).forEach(sentence => {
            highlights.push(sentence.trim());
        });
    }

    return highlights.slice(0, 4); // Return max 4 highlights
}

// Determine theme based on content
function determineTheme(text) {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('arrival') || lowerText.includes('arrive') || lowerText.includes('check-in')) {
        return 'Arrival';
    } else if (lowerText.includes('departure') || lowerText.includes('depart') || lowerText.includes('check-out')) {
        return 'Departure';
    } else if (lowerText.includes('beach') || lowerText.includes('water') || lowerText.includes('sports')) {
        return 'Beach & Adventure';
    } else if (lowerText.includes('fort') || lowerText.includes('palace') || lowerText.includes('temple')) {
        return 'Heritage & Culture';
    } else if (lowerText.includes('market') || lowerText.includes('shopping') || lowerText.includes('bazaar')) {
        return 'Shopping & Markets';
    } else if (lowerText.includes('mountain') || lowerText.includes('hill') || lowerText.includes('trek')) {
        return 'Mountains & Nature';
    } else if (lowerText.includes('food') || lowerText.includes('cuisine') || lowerText.includes('dining')) {
        return 'Food & Dining';
    } else if (lowerText.includes('sightseeing') || lowerText.includes('tour') || lowerText.includes('explore')) {
        return 'Sightseeing';
    } else {
        return 'Activities';
    }
}

// Helper function to get day title
function getDayTitle(dayNumber, packageData) {
    const duration = packageData.duration_days || 1;
    const destination = packageData.destination || '';

    if (dayNumber === 1) return `Arrival in ${destination}`;
    if (dayNumber === duration) return `Departure from ${destination}`;

    const themes = [
        `${destination} City Tour`,
        'Cultural Exploration',
        'Adventure Activities',
        'Nature & Scenery',
        'Local Experiences',
        'Heritage Sites',
        'Beach & Relaxation',
        'Shopping & Markets'
    ];

    const themeIndex = (dayNumber - 2) % themes.length;
    return themes[themeIndex];
}

// Helper function to get default highlights
function getDefaultHighlights(dayNumber, packageData) {
    const destination = packageData.destination || '';

    if (dayNumber === 1) {
        return [
            'Airport/Station pickup',
            'Hotel check-in assistance',
            'Welcome orientation',
            'Evening at leisure'
        ];
    }

    if (dayNumber === packageData.duration_days) {
        return [
            'Breakfast at hotel',
            'Hotel check-out',
            'Departure transfer',
            'Farewell with memories'
        ];
    }

    return [
        'Guided sightseeing tour',
        'Local cultural experiences',
        'Photo opportunities',
        'Free time for personal exploration'
    ];
}

// Generate complete itinerary for all days
function generateCompleteItinerary(packageData) {
    const itinerary = [];
    const duration = packageData.duration_days || 1;
    const destination = packageData.destination || '';

    for (let day = 1; day <= duration; day++) {
        let content = '';
        let theme = '';

        if (day === 1) {
            theme = 'Arrival';
            content = `Welcome to ${destination}! Upon arrival at the airport/railway station, our representative will greet you and assist with transfer to your hotel. Complete check-in formalities and take some time to relax after your journey. Evening is free for you to explore the local surroundings at your own pace.`;
        } else if (day === duration) {
            theme = 'Departure';
            content = `Enjoy your final breakfast at the hotel. Complete check-out procedures (standard check-out time is 12:00 PM). Depending on your departure schedule, you will be transferred to the airport/railway station for your journey back home, carrying beautiful memories of ${destination}.`;
        } else if (destination.toLowerCase().includes('goa')) {
            theme = day === 2 ? 'Beach & Adventure' : 'Culture & Exploration';
            content = `Day ${day} in ${destination} offers a perfect blend of activities. ${day === 2 ? 'Explore the famous beaches, try water sports, and visit historic forts.' : 'Discover local culture, visit spice plantations, and enjoy traditional Goan cuisine.'} Your guide will ensure you experience the best of what ${destination} has to offer.`;
        } else if (destination.toLowerCase().includes('jaipur')) {
            theme = 'Heritage & Culture';
            content = `Day ${day} in the Pink City! Visit magnificent forts, palaces, and markets. Experience Rajasthani culture, traditional arts, and local cuisine. Your guide will share fascinating stories about ${destination}'s rich history.`;
        } else if (destination.toLowerCase().includes('manali')) {
            theme = 'Mountains & Adventure';
            content = `Day ${day} in the mountains of ${destination}! Enjoy breathtaking views, visit temples, explore valleys, and experience local Himachali culture. ${day === 2 ? 'Optional adventure activities available.' : 'Relax in the serene mountain environment.'}`;
        } else {
            theme = 'Exploration';
            content = `Day ${day} of your ${destination} adventure! Today you'll explore the city's highlights, experience local culture, and enjoy included activities. Your guide will provide insights into the best places to visit and things to do.`;
        }

        itinerary.push({
            day: day,
            title: `Day ${day}: ${getDayTitle(day, packageData)}`,
            theme: theme,
            content: content,
            highlights: getDefaultHighlights(day, packageData)
        });
    }

    return itinerary;
}

// Get search parameters from session storage
function getSearchParams() {
    // Try to get from session storage
    const savedParams = sessionStorage.getItem('lastSearchParams');

    if (savedParams) {
        try {
            return JSON.parse(savedParams);
        } catch (e) {
            console.error('Error parsing saved search params:', e);
        }
    }

    // Return empty object if nothing found
    return {};
}

// Function to handle back button click - RETURNS TO EXACT SEARCH STATE
function handleBackClick(event) {
    event.preventDefault();
    event.stopPropagation();

    console.log('Back button clicked - returning to exact search state');

    // Get search parameters from session storage
    const savedParams = sessionStorage.getItem('lastSearchParams');

    if (savedParams) {
        try {
            const searchParams = JSON.parse(savedParams);

            // Build URL with all search parameters
            const urlParams = new URLSearchParams();

            // Add all search parameters
            if (searchParams.destination) urlParams.append('destination', searchParams.destination);
            if (searchParams.startDate) urlParams.append('startDate', searchParams.startDate);
            if (searchParams.endDate) urlParams.append('endDate', searchParams.endDate);
            if (searchParams.budgetMin) urlParams.append('budgetMin', searchParams.budgetMin);
            if (searchParams.budgetMax) urlParams.append('budgetMax', searchParams.budgetMax);
            if (searchParams.travellers) urlParams.append('travellers', searchParams.travellers);

            // Always add preserveSearch flag
            urlParams.append('preserveSearch', 'true');

            const url = 'destinationhtml.html?' + urlParams.toString();
            console.log('Redirecting back to:', url);

            // Redirect to destinations page with all parameters
            window.location.href = url;

        } catch (e) {
            console.error('Error parsing saved params:', e);
            // Fallback to simple back
            window.location.href = 'destinationhtml.html?preserveSearch=true';
        }
    } else {
        // No saved params, still try to preserve
        window.location.href = 'destinationhtml.html?preserveSearch=true';
    }

    return false;
}

// Display package details with complete itinerary
function displayPackageDetails(packageData) {
    const container = document.getElementById('detailsContainer');

    // Parse features into categories
    const features = parseFeatures(packageData.included_features);

    // Parse complete itinerary from database
    const itinerary = parseDetailedItinerary(packageData);

    // Ensure we have the right number of days
    const duration = packageData.duration_days || 1;
    if (itinerary.length < duration) {
        // Fill missing days
        for (let day = itinerary.length + 1; day <= duration; day++) {
            itinerary.push({
                day: day,
                title: `Day ${day}: ${getDayTitle(day, packageData)}`,
                theme: 'Activities',
                content: `Day ${day} of your ${packageData.destination} adventure. Enjoy the included activities and explore at your own pace.`,
                highlights: getDefaultHighlights(day, packageData)
            });
        }
    }

    // Sort by day number to ensure correct order
    itinerary.sort((a, b) => a.day - b.day);

    // Get search parameters
    const searchParams = getSearchParams();

    // Create features HTML
    let featuresHTML = '';
    if (features.categories.length > 0) {
        featuresHTML = `
      <div class="section">
        <h2 class="section-title">What's Included</h2>
        <div class="inclusion-section">
          ${features.categories.map(category => `
            <div class="inclusion-category">
              <div class="category-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9 11 12 14 22 4"></polyline>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
                <span>${category.category}</span>
              </div>
              <div class="inclusion-list">
                ${category.items.map(item => {
                  const parts = item.split(':');
                  if (parts.length > 1) {
                    return `
                      <div class="inclusion-item">
                        <span class="inclusion-icon">✓</span>
                        <div>
                          <strong>${parts[0].trim()}</strong>
                          <div class="inclusion-text">${parts.slice(1).join(':').trim()}</div>
                        </div>
                      </div>
                    `;
                  } else {
                    return `
                      <div class="inclusion-item">
                        <span class="inclusion-icon">✓</span>
                        <span class="inclusion-text">${item}</span>
                      </div>
                    `;
                  }
                }).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  // Create itinerary HTML - ALL DAYS
  let itineraryHTML = '';
  if (itinerary.length > 0) {
    itineraryHTML = `
      <div class="section">
        <h2 class="section-title">Complete ${duration}-Day Itinerary</h2>
        <p style="color: #666; margin-bottom: 20px; font-size: 16px;">
          <strong>${packageData.destination} | ${duration} Days ${duration-1} Nights</strong> - Detailed day-by-day plan
        </p>
        <div class="itinerary-container">
          ${itinerary.map(day => `
            <div class="day-card">
              <div class="day-header">
                <div class="day-title">${day.title}</div>
                <div class="day-theme">${day.theme}</div>
              </div>
              <div class="day-content">
                ${day.content}
              </div>
              <div class="day-highlights">
                <div class="highlight-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 11 12 14 22 4"></polyline>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                  </svg>
                  Day ${day.day} Highlights
                </div>
                <ul class="highlight-list">
                  ${day.highlights.map(highlight => `<li>${highlight}</li>`).join('')}
                </ul>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  // Create package summary HTML
  const summaryHTML = `
    <div class="section">
      <h2 class="section-title">Package Information</h2>
      <div class="info-grid">
        <div class="info-card">
          <div class="info-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            Package Details
          </div>
          <div class="info-content">
            <strong>Duration:</strong> ${duration} Days ${duration-1} Nights<br>
            <strong>Destination:</strong> ${packageData.destination}<br>
            <strong>Group Size:</strong> ${packageData.min_travellers}-${packageData.max_travellers} People<br>
            <strong>Price:</strong> ₹${packageData.price_per_person.toLocaleString()}/person
          </div>
        </div>
        
        <div class="info-card">
          <div class="info-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            Best Time to Visit
          </div>
          <div class="info-content">
            <strong>${getBestTime(packageData.destination)}</strong><br>
            All dates customizable<br>
            Seasonal variations apply<br>
            Weather-appropriate activities
          </div>
        </div>
        
        <div class="info-card">
          <div class="info-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            Important Notes
          </div>
          <div class="info-content">
            • Hotel check-in: 2:00 PM<br>
            • Hotel check-out: 12:00 PM<br>
            • Customization available<br>
            • Guide included in package
          </div>
        </div>
      </div>
    </div>
  `;
  
  // BACK BUTTON THAT RETURNS TO EXACT SEARCH STATE
  const backButtonHTML = `
    <a href="#" class="details-back-btn" onclick="return handleBackClick(event)" id="backToSearchBtn">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5M12 19l-7-7 7-7"/>
      </svg>
      Back to Search Results
    </a>
  `;
  
  // Create the complete HTML structure
  container.innerHTML = backButtonHTML + `
    <div class="package-details-card">
      <div class="package-header">
        <h1 class="package-title">${packageData.title}</h1>
        <div class="package-destination">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          ${packageData.destination} | ${duration} Days ${duration-1} Nights
        </div>
        
        <div class="package-meta">
          <div class="meta-item">
            <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75"/>
            </svg>
            <span>Perfect for ${packageData.min_travellers}-${packageData.max_travellers} travelers</span>
          </div>
          
          <div class="meta-item">
            <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
            </svg>
            <span>Starting from ₹${packageData.price_per_person.toLocaleString()}/person</span>
          </div>
        </div>
        
        <div class="package-price-badge">
          ₹${packageData.price_per_person.toLocaleString()}/person
        </div>
      </div>
      
      <div class="package-content">
        ${packageData.description ? `
          <div class="section">
            <h2 class="section-title">Package Overview</h2>
            <div class="details-text">${packageData.description}</div>
          </div>
        ` : ''}
        
        ${itineraryHTML}
        
        ${featuresHTML}
        
        ${summaryHTML}
      </div>
    </div>
  `;
  
  // Ensure the handleBackClick function is available globally
  window.handleBackClick = handleBackClick;
}

// Helper function to get best time to visit
function getBestTime(destination) {
  const dest = destination.toLowerCase();
  
  if (dest.includes('goa')) return 'November to February';
  if (dest.includes('jaipur')) return 'October to March';
  if (dest.includes('manali')) return 'March to June';
  if (dest.includes('rishikesh')) return 'February to May, September to November';
  if (dest.includes('ayodhya')) return 'October to March';
  
  return 'October to March';
}

// Show error message
function showError(message) {
  const container = document.getElementById('detailsContainer');
  container.innerHTML = `
    <a href="destinationhtml.html" class="details-back-btn" onclick="return handleBackClick(event)">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5M12 19l-7-7 7-7"/>
      </svg>
      Back to Packages
    </a>
    
    <div class="error-message">
      <h2>Error Loading Package Details</h2>
      <p>${message}</p>
      <p>Please try again later or go back to browse other packages.</p>
    </div>
  `;
  
  // Ensure the handleBackClick function is available globally
  window.handleBackClick = handleBackClick;
}

// Initialize the page
async function init() {
  const loadingSpinner = document.getElementById('loadingSpinner');
  
  try {
    const packageId = getPackageIdFromURL();
    
    if (!packageId) {
      showError('No package ID specified in URL.');
      return;
    }
    
    loadingSpinner.style.display = 'block';
    
    const packageData = await fetchPackageDetails(packageId);
    
    loadingSpinner.style.display = 'none';
    displayPackageDetails(packageData);
    
  } catch (error) {
    console.error('Error in init:', error);
    loadingSpinner.style.display = 'none';
    showError(error.message || 'Failed to load package details. Please try again.');
  }
}

// Initialize when page loads
window.addEventListener('DOMContentLoaded', init);