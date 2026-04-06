// Sample data for matches (would come from backend in real app)
const potentialMatches = [
    {
        id: 1,
        name: "Priya Sharma",
        initials: "PS",
        age: 28,
        location: "Delhi",
        matchScore: 94,
        destination: "Goa",
        dates: "Dec 15-22, 2026",
        budget: "Mid-Range",
        groupSize: "4-6 People",
        interests: ["Indian Cuisine", "Adventure Sports", "Beaches", "Photography"],
        bio: "Adventure enthusiast looking for beach and food experiences"
    },
    {
        id: 2,
        name: "Arun Kumar",
        initials: "AK",
        age: 32,
        location: "Bangalore",
        matchScore: 88,
        destination: "Goa",
        dates: "Dec 16-23, 2026",
        budget: "Mid-Range",
        groupSize: "4-6 People",
        interests: ["Adventure Sports", "Photography", "Local Markets", "Nightlife"],
        bio: "Professional photographer seeking adventure and cultural experiences"
    },
    {
        id: 3,
        name: "Neha Patel",
        initials: "NP",
        age: 26,
        location: "Ahmedabad",
        matchScore: 85,
        destination: "Goa",
        dates: "Dec 15-20, 2026",
        budget: "Mid-Range",
        groupSize: "4-6 People",
        interests: ["Indian Cuisine", "Beaches", "Wellness", "Heritage Sites"],
        bio: "Food blogger excited to explore Goan cuisine and beaches"
    },
    {
        id: 4,
        name: "Vikram Singh",
        initials: "VS",
        age: 30,
        location: "Pune",
        matchScore: 82,
        destination: "Goa",
        dates: "Dec 18-25, 2026",
        budget: "Mid-Range",
        groupSize: "4-6 People",
        interests: ["Adventure Sports", "Photography", "Indian Cuisine", "Nightlife"],
        bio: "Software engineer looking for adventure and relaxation mix"
    }
];

// Current user's data
const currentUser = {
    name: "Rahul Jain",
    initials: "RJ",
    interests: ["Adventure Sports", "Indian Cuisine", "Heritage Sites", "Photography"],
    destination: "Goa",
    dates: "Dec 15-22, 2026",
    budget: "Mid-Range",
    groupSize: "4-6 People"
};

// DOM Elements
const criteriaOptions = document.querySelectorAll('.criteria-option');
const findBuddiesBtn = document.getElementById('findBuddiesBtn');
const matchesContainer = document.getElementById('matchesContainer');
const noMatchesMessage = document.getElementById('noMatchesMessage');
const groupModal = document.getElementById('groupModal');
const modalMatchScore = document.getElementById('modalMatchScore');
const modalGroupSize = document.getElementById('modalGroupSize');
const modalCommonInterests = document.getElementById('modalCommonInterests');
const modalDestination = document.getElementById('modalDestination');
const modalDates = document.getElementById('modalDates');
const modalMembers = document.getElementById('modalMembers');
const rejectGroupBtn = document.getElementById('rejectGroupBtn');
const acceptGroupBtn = document.getElementById('acceptGroupBtn');

// Track group formation status
let groupFormed = false;
let groupRejected = false;

// User's selected criteria
let userCriteria = {
    destination: 'goa',
    dates: 'dec2026',
    groupsize: '4-6',
    budget: 'midrange'
};

// Initialize
setupCriteriaSelection();

// Setup criteria selection
function setupCriteriaSelection() {
    criteriaOptions.forEach(option => {
        option.addEventListener('click', function() {
            const criteria = this.getAttribute('data-criteria');
            const value = this.getAttribute('data-value');
            
            // Remove selected class from all options in same group
            document.querySelectorAll(`[data-criteria="${criteria}"]`).forEach(opt => {
                opt.classList.remove('selected');
            });
            
            // Add selected class to clicked option
            this.classList.add('selected');
            
            // Update user criteria
            userCriteria[criteria] = value;
        });
    });
}

// Find Travel Buddies
findBuddiesBtn.addEventListener('click', function() {
    // Reset group formed status when searching again
    groupFormed = false;
    groupRejected = false;
    
    // Show loading
    const originalText = findBuddiesBtn.innerHTML;
    findBuddiesBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Finding Group...';
    findBuddiesBtn.disabled = true;
    
    // Simulate algorithm matching delay
    setTimeout(() => {
        findGroup();
        
        // Reset button
        findBuddiesBtn.innerHTML = originalText;
        findBuddiesBtn.disabled = false;
    }, 2000);
});

// Find group based on criteria
function findGroup() {
    // Clear previous matches
    matchesContainer.innerHTML = '';
    
    // If group was rejected, show rejection message
    if (groupRejected) {
        showRejectionMessage();
        return;
    }
    
    // If group is already formed, show group
    if (groupFormed) {
        showGroupSuccess();
        return;
    }
    
    // Check if we have enough matches
    const filteredMatches = potentialMatches.filter(match => {
        return match.destination.toLowerCase() === 'goa' && 
               match.budget === 'Mid-Range' &&
               match.groupSize === '4-6 People';
    });
    
    if (filteredMatches.length >= 3) {
        // Show group invitation
        showGroupInvitation(filteredMatches.slice(0, 4));
    } else {
        // Not enough matches for a group
        noMatchesMessage.style.display = 'block';
        matchesContainer.style.display = 'none';
        matchesContainer.innerHTML = '';
    }
}

// Show group invitation
function showGroupInvitation(members) {
    // Calculate group statistics
    const totalMembers = members.length + 1; // +1 for current user
    const commonInterests = calculateCommonInterests(members);
    const avgMatchScore = Math.round(members.reduce((sum, m) => sum + m.matchScore, 0) / members.length);
    
    // Update modal content
    modalMatchScore.textContent = `${avgMatchScore}%`;
    modalGroupSize.textContent = totalMembers;
    modalCommonInterests.textContent = commonInterests.length;
    modalDestination.textContent = 'Goa, India';
    modalDates.textContent = 'Dec 15-22, 2026';
    
    // Show group members
    modalMembers.innerHTML = '';
    
    // Add current user
    addMemberToModal(currentUser.initials, currentUser.name);
    
    // Add other members
    members.forEach(member => {
        addMemberToModal(member.initials, member.name);
    });
    
    // Show modal
    groupModal.style.display = 'flex';
}

// Add member to modal
function addMemberToModal(initials, name) {
    const memberDiv = document.createElement('div');
    memberDiv.className = 'group-member';
    memberDiv.innerHTML = `
        <div class="member-avatar">${initials}</div>
        <div class="member-name">${name}</div>
    `;
    modalMembers.appendChild(memberDiv);
}

// Calculate common interests among group
function calculateCommonInterests(members) {
    const allInterests = [...currentUser.interests];
    members.forEach(member => {
        allInterests.push(...member.interests);
    });
    
    // Find interests that appear multiple times
    const interestCounts = {};
    allInterests.forEach(interest => {
        interestCounts[interest] = (interestCounts[interest] || 0) + 1;
    });
    
    return Object.keys(interestCounts).filter(interest => interestCounts[interest] >= 3);
}

// Handle group acceptance
acceptGroupBtn.addEventListener('click', function() {
    acceptGroupBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Joining Group...';
    acceptGroupBtn.disabled = true;
    
    setTimeout(() => {
        // In real app, this would send to backend
        alert('Successfully joined the group! Your trip details will be shared soon.');
        
        // Close modal
        groupModal.style.display = 'none';
        
        // Reset button
        acceptGroupBtn.innerHTML = '<i class="fas fa-check"></i> Accept & Join Group';
        acceptGroupBtn.disabled = false;
        
        // Set group formed flag
        groupFormed = true;
        
        // Show group success
        showGroupSuccess();
    }, 1500);
});

// Handle group rejection
rejectGroupBtn.addEventListener('click', function() {
    if (confirm('Are you sure you want to reject this group?')) {
        // Set group rejected flag
        groupRejected = true;
        
        // Close modal
        groupModal.style.display = 'none';
        
        // Show rejection message
        showRejectionMessage();
    }
});

// Show group success with "Get Your Customized Trip" link/button
function showGroupSuccess() {
    // Clear matches container
    matchesContainer.innerHTML = '';
    
    // Hide no matches message
    noMatchesMessage.style.display = 'none';
    
    // Remove any existing custom trip button/link
    const existingCustomTripBtn = document.getElementById('customTripBtn');
    if (existingCustomTripBtn) {
        existingCustomTripBtn.remove();
    }
    
    // Create group success card
    const successDiv = document.createElement('div');
    successDiv.className = 'group-success-card';
    
    successDiv.innerHTML = `
        <button class="leave-group-btn" id="leaveGroupBtn">
            <i class="fas fa-sign-out-alt"></i> Leave Group
        </button>
        
        <i class="fas fa-check-circle group-success-icon"></i>
        <h3>Group Successfully Formed!</h3>
        <p>Your travel group for Goa is ready. You'll receive trip details shortly.</p>
        
        <div class="group-stats">
            <div class="group-stat-item">
                <div class="group-stat-value">5</div>
                <div class="group-stat-label">Members</div>
            </div>
            <div class="group-stat-item">
                <div class="group-stat-value">94%</div>
                <div class="group-stat-label">Match Score</div>
            </div>
            <div class="group-stat-item">
                <div class="group-stat-value">7 Days</div>
                <div class="group-stat-label">Duration</div>
            </div>
            <div class="group-stat-item">
                <div class="group-stat-value">Dec 15-22</div>
                <div class="group-stat-label">Dates</div>
            </div>
        </div>
        
        <div class="group-members-display">
            <div class="group-member-small">
                <div class="member-avatar-small">RJ</div>
                <div class="member-name-small">Rahul</div>
            </div>
            <div class="group-member-small">
                <div class="member-avatar-small">PS</div>
                <div class="member-name-small">Priya</div>
            </div>
            <div class="group-member-small">
                <div class="member-avatar-small">AK</div>
                <div class="member-name-small">Arun</div>
            </div>
            <div class="group-member-small">
                <div class="member-avatar-small">NP</div>
                <div class="member-name-small">Neha</div>
            </div>
            <div class="group-member-small">
                <div class="member-avatar-small">VS</div>
                <div class="member-name-small">Vikram</div>
            </div>
        </div>
    `;
    
    matchesContainer.appendChild(successDiv);
    matchesContainer.style.display = 'block';
    
    // Add event listener to leave group button
    document.getElementById('leaveGroupBtn').addEventListener('click', function() {
        if (confirm('Are you sure you want to leave this group? You will need to search for a new group.')) {
            alert('You have left the group. You can now search for a new travel group.');
            groupFormed = false;
            findBuddiesBtn.click(); // Trigger new search
        }
    });
    
    // Add "Get Your Customized Trip" link/button after a short delay
    setTimeout(() => {
        addCustomTripLink();
    }, 500);
}

// Add "Get Your Customized Trip" link/button
function addCustomTripLink() {
    // Create the link element styled as a button
    const customTripLink = document.createElement('a');
    customTripLink.className = 'custom-trip-link';
    customTripLink.id = 'customTripBtn';
    customTripLink.href = 'rishikesh.html'; // Link to rishikesh.html
    customTripLink.innerHTML = '<i class="fas fa-map-marked-alt"></i> Get Your Customized Trip';
    
    // Insert the link after the matches container
    matchesContainer.parentNode.insertBefore(customTripLink, matchesContainer.nextSibling);
}

// Show rejection message
function showRejectionMessage() {
    // Clear matches container
    matchesContainer.innerHTML = '';
    
    // Hide no matches message
    noMatchesMessage.style.display = 'none';
    
    // Remove any existing custom trip button
    const existingCustomTripBtn = document.getElementById('customTripBtn');
    if (existingCustomTripBtn) {
        existingCustomTripBtn.remove();
    }
    
    // Create rejection message
    const rejectionDiv = document.createElement('div');
    rejectionDiv.className = 'match-card';
    rejectionDiv.style.textAlign = 'center';
    rejectionDiv.style.padding = '40px';
    
    rejectionDiv.innerHTML = `
        <i class="fas fa-times-circle" style="font-size: 4rem; color: #e74c3c; margin-bottom: 20px;"></i>
        <h3 style="color: #2c3e50; margin-bottom: 15px;">Group Rejected</h3>
        <p style="color: #7f8c8d; margin-bottom: 25px;">You have rejected the suggested travel group.</p>
        <p style="color: #7f8c8d; margin-bottom: 30px;">Click "Find Travel Buddies" again to search for a new group.</p>
        <button class="cta-button" id="searchAgainBtn" style="max-width: 300px; margin: 0 auto;">
            <i class="fas fa-search"></i> Search Again
        </button>
    `;
    
    matchesContainer.appendChild(rejectionDiv);
    matchesContainer.style.display = 'block';
    
    // Add event listener to search again button
    document.getElementById('searchAgainBtn').addEventListener('click', function() {
        groupRejected = false;
        findBuddiesBtn.click();
    });
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    if (event.target === groupModal) {
        groupModal.style.display = 'none';
    }
});