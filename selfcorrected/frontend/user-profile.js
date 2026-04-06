// User Data Model
const UserData = {
    id: "TC-2023-001247",
    name: "Rajesh Kumar",
    email: "rajesh.kumar@example.com",
    phone: "+91 **********",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80",
    dob: "1990-03-15",
    gender: "male",
    bio: "Adventure enthusiast from India who loves exploring the Himalayas and experiencing diverse cultures. Passionate about photography and trying local cuisines. Always looking for travel buddies to explore hidden gems across India!",
    location: "New Delhi, India",
    status: "active",
    lastLogin: new Date().toISOString(),
    accountCreated: "2026-01-10",
};

// Application State
const TripConnectApp = {
    currentUser: null,
    cancelTripData: null,
    elements: {},
    
    init: function() {
        this.loadUserData();
        this.cacheElements();
        this.bindEvents();
        this.updateUI();
        this.showNotification('Welcome back, ' + this.currentUser.name + '!', 'success');
    },
    
    loadUserData: function() {
        // Try to load from localStorage, otherwise use default
        const savedData = localStorage.getItem('tripConnectUserData');
        this.currentUser = savedData ? JSON.parse(savedData) : UserData;
        
        // Update last login
        this.currentUser.lastLogin = new Date().toISOString();
        this.saveUserData();
    },
    
    saveUserData: function() {
        localStorage.setItem('tripConnectUserData', JSON.stringify(this.currentUser));
    },
    
    cacheElements: function() {
        // Profile elements
        this.elements.profileName = document.getElementById('profile-name');
        this.elements.profileEmail = document.getElementById('profile-email');
        this.elements.profilePhone = document.getElementById('profile-phone');
        this.elements.profileLocation = document.getElementById('profile-location');
        this.elements.profileDob = document.getElementById('profile-dob');
        this.elements.profileGender = document.getElementById('profile-gender');
        this.elements.profileStatus = document.getElementById('profile-status');
        this.elements.profileAvatar = document.getElementById('profile-avatar');
        
        // Info box
        this.elements.infoUserId = document.getElementById('info-user-id');
        this.elements.infoCreated = document.getElementById('info-created');
        this.elements.infoLastLogin = document.getElementById('info-last-login');
        
        // Forms
        this.elements.profileForm = document.getElementById('profile-form');
        
        // Form fields
        this.elements.fullName = document.getElementById('full-name');
        this.elements.email = document.getElementById('email');
        this.elements.phone = document.getElementById('phone');
        this.elements.dob = document.getElementById('dob');
        this.elements.location = document.getElementById('location');
        this.elements.bio = document.getElementById('bio');
        
        // Buttons
        this.elements.dashboardBtn = document.getElementById('dashboard-btn');
        this.elements.profileBtn = document.getElementById('profile-btn');
        this.elements.logoutBtn = document.getElementById('logout-btn');
        this.elements.planNewTripBtn = document.getElementById('plan-new-trip-btn');
        this.elements.cancelEditBtn = document.getElementById('cancel-edit');
        this.elements.avatarUploadBtn = document.getElementById('avatar-upload-btn');
        this.elements.avatarInput = document.getElementById('avatar-input');
        
        // Modal
        this.elements.cancelTripModal = document.getElementById('cancel-trip-modal');
        this.elements.closeCancelModal = document.getElementById('close-cancel-modal');
        this.elements.cancelTripNo = document.getElementById('cancel-trip-no');
        this.elements.cancelTripYes = document.getElementById('cancel-trip-yes');
        this.elements.cancelTripMessage = document.getElementById('cancel-trip-message');
    },
    
    bindEvents: function() {
        // Tab switching
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e));
        });
        
        // Profile form submission
        this.elements.profileForm.addEventListener('submit', (e) => this.saveProfile(e));
        
        // Cancel edit button
        this.elements.cancelEditBtn.addEventListener('click', () => this.cancelEdit());
        
        // Avatar upload
        this.elements.avatarUploadBtn.addEventListener('click', () => {
            this.elements.avatarInput.click();
        });
        
        this.elements.avatarInput.addEventListener('change', (e) => this.updateAvatar(e));
        
        // Navigation buttons (only bind click events for buttons that don't have href redirects)
        this.elements.profileBtn.addEventListener('click', (e) => this.goToProfile(e));
        this.elements.planNewTripBtn.addEventListener('click', () => this.planNewTrip());
        
        // Cancel trip buttons (delegated event handling for dynamic content)
        document.addEventListener('click', (e) => {
            if (e.target.closest('.cancel-trip-btn')) {
                this.showCancelTripModal(e);
            }
        });
        
        // Modal events
        this.elements.closeCancelModal.addEventListener('click', () => this.closeModal());
        this.elements.cancelTripNo.addEventListener('click', () => this.closeModal());
        this.elements.cancelTripYes.addEventListener('click', () => this.confirmCancelTrip());
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === this.elements.cancelTripModal) {
                this.closeModal();
            }
        });
    },
    
    updateUI: function() {
        const user = this.currentUser;
        
        // Update profile header
        this.elements.profileName.textContent = user.name;
        this.elements.profileEmail.textContent = user.email;
        this.elements.profilePhone.textContent = user.phone;
        this.elements.profileLocation.textContent = user.location;
        this.elements.profileDob.textContent = this.formatDate(user.dob);
        this.elements.profileGender.textContent = this.capitalizeFirstLetter(user.gender);
        this.elements.profileAvatar.src = user.avatar;
        
        // Update status
        this.updateStatusDisplay();
        
        // Update info box
        this.elements.infoUserId.textContent = user.id;
        this.elements.infoCreated.textContent = this.formatDate(user.accountCreated);
        this.elements.infoLastLogin.textContent = this.formatLastLogin(user.lastLogin);
        
        // Update form fields
        this.elements.fullName.value = user.name;
        this.elements.email.value = user.email;
        this.elements.phone.value = user.phone;
        this.elements.dob.value = user.dob;
        this.elements.location.value = user.location;
        this.elements.bio.value = user.bio;
        
        // Set gender radio
        const genderRadio = document.querySelector(`input[name="gender"][value="${user.gender}"]`);
        if (genderRadio) {
            genderRadio.checked = true;
        }
    },
    
    updateStatusDisplay: function() {
        const status = this.currentUser.status;
        
        let statusText, statusClass;
        
        if (status === "active") {
            statusText = "Active";
            statusClass = "status-active";
        } else if (status === "inactive") {
            statusText = "Inactive";
            statusClass = "status-inactive";
        } else {
            statusText = "Active";
            statusClass = "status-active";
        }
        
        this.elements.profileStatus.className = `user-status ${statusClass}`;
        this.elements.profileStatus.innerHTML = `<i class="fas fa-circle"></i> ${statusText}`;
    },
    
    formatDate: function(dateString) {
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-IN', options);
    },
    
    formatLastLogin: function(dateString) {
        const now = new Date();
        const lastLogin = new Date(dateString);
        const diffMs = now - lastLogin;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        
        if (diffMins < 1) {
            return "Just now";
        } else if (diffMins < 60) {
            return `${diffMins} minutes ago`;
        } else if (diffHours < 24) {
            return "Today, " + lastLogin.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        } else if (diffHours < 48) {
            return "Yesterday, " + lastLogin.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        } else {
            return this.formatDate(dateString);
        }
    },
    
    capitalizeFirstLetter: function(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    },
    
    switchTab: function(e) {
        const targetTab = e.currentTarget.dataset.tab;
        
        // Remove active class from all tabs and contents
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding content
        e.currentTarget.classList.add('active');
        document.getElementById(targetTab).classList.add('active');
    },
    
    switchToTab: function(tabName) {
        // Remove active class from all tabs and contents
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        // Add active class to target tab
        const tabElement = document.querySelector(`[data-tab="${tabName}"]`);
        const contentElement = document.getElementById(tabName);
        
        if (tabElement) tabElement.classList.add('active');
        if (contentElement) contentElement.classList.add('active');
    },
    
    saveProfile: function(e) {
        e.preventDefault();
        
        // Update user data
        this.currentUser.name = this.elements.fullName.value;
        this.currentUser.email = this.elements.email.value;
        this.currentUser.phone = this.elements.phone.value;
        this.currentUser.dob = this.elements.dob.value;
        
        const selectedGender = document.querySelector('input[name="gender"]:checked');
        if (selectedGender) {
            this.currentUser.gender = selectedGender.value;
        }
        
        this.currentUser.location = this.elements.location.value;
        this.currentUser.bio = this.elements.bio.value;
        
        // Save to localStorage
        this.saveUserData();
        
        // Update UI
        this.updateUI();
        
        this.showNotification('Profile updated successfully!', 'success');
    },
    
    cancelEdit: function() {
        // Reset form to current user data
        this.updateUI();
        this.showNotification('Changes discarded', 'info');
    },
    
    updateAvatar: function(e) {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                this.currentUser.avatar = event.target.result;
                this.elements.profileAvatar.src = event.target.result;
                this.saveUserData();
                this.showNotification('Profile picture updated!', 'success');
            };
            
            reader.readAsDataURL(e.target.files[0]);
        }
    },
    
    goToProfile: function(e) {
        e.preventDefault();
        // Already on profile page, just switch to personal tab
        this.switchToTab('personal');
        this.showNotification('You are on your profile page.', 'info');
    },
    
    planNewTrip: function() {
        this.showNotification('Opening trip planner...', 'info');
        setTimeout(() => {
            alert('Trip planner would open here to plan a new trip!');
        }, 500);
    },
    
    showCancelTripModal: function(e) {
        e.preventDefault();
        
        const cancelBtn = e.target.closest('.cancel-trip-btn');
        
        // Check if button is disabled (completed trips)
        if (cancelBtn.disabled) {
            this.showNotification('Cannot cancel completed trips.', 'error');
            return;
        }
        
        const tripName = cancelBtn.getAttribute('data-trip-name');
        const tripCard = cancelBtn.closest('.trip-card');
        const tripId = tripCard.getAttribute('data-trip-id');
        
        // Store trip data for cancellation
        this.cancelTripData = {
            tripName: tripName,
            tripId: tripId,
            tripCard: tripCard,
            cancelBtn: cancelBtn
        };
        
        // Update modal message
        this.elements.cancelTripMessage.textContent = `Are you sure you want to cancel "${tripName}"?`;
        
        // Show modal
        this.elements.cancelTripModal.style.display = 'flex';
    },
    
    closeModal: function() {
        this.elements.cancelTripModal.style.display = 'none';
        this.cancelTripData = null;
    },
    
    confirmCancelTrip: function() {
        if (!this.cancelTripData) return;
        
        const { tripName, tripId, tripCard, cancelBtn } = this.cancelTripData;
        
        // Update trip status in UI
        const statusElement = tripCard.querySelector('.trip-status');
        statusElement.textContent = 'Cancelled';
        statusElement.className = 'trip-status trip-cancelled';
        
        // Disable the cancel button
        cancelBtn.disabled = true;
        cancelBtn.innerHTML = '<i class="fas fa-ban"></i> Cancelled';
        cancelBtn.classList.remove('btn-danger');
        cancelBtn.classList.add('btn-secondary');
        
        // Close modal
        this.closeModal();
        
        // Show success notification
        this.showNotification(`Trip "${tripName}" has been cancelled successfully.`, 'success');
        
        // Log the cancellation
        console.log(`Trip ${tripId} (${tripName}) cancelled by user.`);
    },
    
    showNotification: function(message, type = 'info') {
        const notificationContainer = document.getElementById('notification-container');
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        // Set icon based on type
        let icon = 'info-circle';
        if (type === 'success') icon = 'check-circle';
        if (type === 'error') icon = 'exclamation-circle';
        if (type === 'warning') icon = 'exclamation-triangle';
        
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="fas fa-${icon}"></i>
            </div>
            <div class="notification-message">${message}</div>
            <button class="notification-close">&times;</button>
        `;
        
        // Add to container
        notificationContainer.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Auto remove after 5 seconds
        const autoRemove = setTimeout(() => {
            this.removeNotification(notification);
        }, 5000);
        
        // Close button event
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            clearTimeout(autoRemove);
            this.removeNotification(notification);
        });
    },
    
    removeNotification: function(notification) {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
};

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    TripConnectApp.init();
});