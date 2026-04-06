// Sidebar navigation
const navLinks = document.querySelectorAll('.nav-link');
navLinks.forEach(link => {
  link.addEventListener('click', function() {
    navLinks.forEach(l => l.classList.remove('active'));
    this.classList.add('active');
  });
});

// Global state for current data
let users = [];
let packages = [];
let aiGroups = [];

// Modal functions
function openAddPackageModal() {
  document.getElementById('addPackageModal').classList.add('active');
}

function closeAddPackageModal() {
  document.getElementById('addPackageModal').classList.remove('active');
  document.getElementById('addPackageForm').reset();
}

function openEditUserModal(user) {
  document.getElementById('editUserId').value = user.id;
  document.getElementById('editUserName').value = user.name;
  document.getElementById('editUserEmail').value = user.email;
  document.getElementById('editUserPhone').value = user.phone || '';
  document.getElementById('editUserStatus').value = user.status;
  document.getElementById('editUserModal').classList.add('active');
}

function closeEditUserModal() {
  document.getElementById('editUserModal').classList.remove('active');
  document.getElementById('editUserForm').reset();
}

function openViewUserModal(user) {
  const userDetails = document.getElementById('userDetails');
  const statusClass = user.status === 'active' ? 'status-active' : 
                     user.status === 'suspended' ? 'status-suspended' : 'status-pending';
  
  userDetails.innerHTML = `
    <div class="user-detail">
      <strong>ID:</strong> ${user.id}
    </div>
    <div class="user-detail">
      <strong>Name:</strong> ${user.name}
    </div>
    <div class="user-detail">
      <strong>Email:</strong> ${user.email}
    </div>
    <div class="user-detail">
      <strong>Phone:</strong> ${user.phone || 'Not provided'}
    </div>
    <div class="user-detail">
      <strong>Status:</strong> <span class="${statusClass}">${user.status.charAt(0).toUpperCase() + user.status.slice(1)}</span>
    </div>
    <div class="user-detail">
      <strong>Joined:</strong> ${user.joined}
    </div>
    <div class="user-detail">
      <strong>Last Login:</strong> ${user.lastLogin || 'Unknown'}
    </div>
    <div class="modal-actions" style="margin-top: 20px;">
      <button class="btn" onclick="closeViewUserModal()">Close</button>
      <button class="btn btn-primary" onclick="openEditUserModal(${JSON.stringify(user).replace(/"/g, '&quot;')}); closeViewUserModal();">Edit User</button>
    </div>
  `;
  document.getElementById('viewUserModal').classList.add('active');
}

function closeViewUserModal() {
  document.getElementById('viewUserModal').classList.remove('active');
}

function openEditPackageModal(pkg) {
  document.getElementById('editPackageId').value = pkg.id;
  document.getElementById('editPackageTitle').value = pkg.title;
  document.getElementById('editPackageDestination').value = pkg.destination;
  document.getElementById('editPackageDuration').value = pkg.duration;
  document.getElementById('editPackagePrice').value = pkg.price;
  document.getElementById('editPackageStatus').value = pkg.status;
  document.getElementById('editPackageDescription').value = pkg.description || '';
  document.getElementById('editPackageModal').classList.add('active');
}

function closeEditPackageModal() {
  document.getElementById('editPackageModal').classList.remove('active');
  document.getElementById('editPackageForm').reset();
}

function openViewAIGroupModal(group) {
  const aiGroupDetails = document.getElementById('aiGroupDetails');
  const statusClass = group.status === 'pending' ? 'status-pending' : 
                     group.status === 'approved' ? 'status-approved' : 'status-rejected';
  
  const membersHTML = group.members.map(member => `
    <div class="member-tag">
      <span class="member-avatar">${member.charAt(0).toUpperCase()}</span>
      ${member}
    </div>
  `).join('');
  
  aiGroupDetails.innerHTML = `
    <div class="ai-group-detail">
      <strong>Group ID:</strong> ${group.id}
    </div>
    <div class="ai-group-detail">
      <strong>Group Name:</strong> ${group.name}
    </div>
    <div class="ai-group-detail">
      <strong>Destination:</strong> ${group.destination}
    </div>
    <div class="ai-group-detail">
      <strong>Start Date:</strong> ${group.startDate}
    </div>
    <div class="ai-group-detail">
      <strong>Duration:</strong> ${group.duration}
    </div>
    <div class="ai-group-detail">
      <strong>Total Members:</strong> ${group.members.length}
    </div>
    <div class="ai-group-detail">
      <strong>Status:</strong> <span class="${statusClass}">${group.status.charAt(0).toUpperCase() + group.status.slice(1)}</span>
    </div>
    <div class="ai-group-detail">
      <strong>Members:</strong>
      <div class="member-list">
        ${membersHTML}
      </div>
    </div>
    <div class="ai-group-detail">
      <strong>Created:</strong> ${group.created}
    </div>
    <div class="ai-group-detail">
      <strong>AI Match Score:</strong> ${group.matchScore}%
    </div>
    <div class="modal-actions" style="margin-top: 20px;">
      <button class="btn" onclick="closeViewAIGroupModal()">Close</button>
      ${group.status === 'pending' ? `
        <button class="btn btn-success" onclick="approveGroup(${group.id}); closeViewAIGroupModal();">✅ Approve</button>
        <button class="btn btn-danger" onclick="rejectGroup(${group.id}); closeViewAIGroupModal();">❌ Reject</button>
      ` : ''}
    </div>
  `;
  document.getElementById('viewAIGroupModal').classList.add('active');
}

function closeViewAIGroupModal() {
  document.getElementById('viewAIGroupModal').classList.remove('active');
}

// User management functions
async function refreshUsers() {
  try {
    // Replace with your actual API endpoint
    // const response = await fetch('/api/admin/users');
    // const data = await response.json();
    
    // Mock data for demonstration
    const mockUsers = [
      { id: 1, name: 'Rajesh Sharma', email: 'rajesh@example.com', phone: '+9875******', joined: '2024-01-15', status: 'active', lastLogin: '2024-03-20 14:30' },
      { id: 2, name: 'Harsh Tiwari',  email: 'harsh@example.com',  phone: '+9076******', joined: '2024-02-20', status: 'active', lastLogin: '2024-03-20 10:15' },
      { id: 3, name: 'Aakriti Gupta', email: 'aakriti@example.com',phone: '+8192******', joined: '2024-03-10', status: 'suspended', lastLogin: '2024-03-15 09:45' },
      { id: 4, name: 'Seema Chauhan', email: 'seema@example.com',  phone: '+7142******', joined: '2024-03-25', status: 'pending', lastLogin: null }
    ];
    
    users = mockUsers;
    renderUsersTable();
    updateUserMetrics();
  } catch (error) {
    console.error('Error fetching users:', error);
    alert('Failed to fetch users');
  }
}

function renderUsersTable() {
  const tbody = document.getElementById('userTableBody');
  if (users.length === 0) {
    tbody.innerHTML = '<tr class="placeholder-row"><td colspan="6">No users available</td></tr>';
    return;
  }
  
  tbody.innerHTML = users.map(user => `
    <tr>
      <td>${user.id}</td>
      <td>${user.name}</td>
      <td>${user.email}</td>
      <td>${user.phone || 'N/A'}</td>
      <td>${user.joined}</td>
      <td>
        <div class="btn-action-group">
          <button class="btn btn-xs" onclick="viewUser(${user.id})">👁️ View</button>
          <button class="btn btn-xs btn-primary" onclick="editUser(${user.id})">✏️ Edit</button>
          <button class="btn btn-xs btn-danger" onclick="suspendUser(${user.id})" ${user.status === 'suspended' ? 'disabled' : ''}>
            ${user.status === 'suspended' ? '⛔ Suspended' : '⛔ Suspend'}
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function updateUserMetrics() {
  const total = users.length;
  const active = users.filter(u => u.status === 'active').length;
  const suspended = users.filter(u => u.status === 'suspended').length;
  
  document.getElementById('totalUsers').textContent = total;
  document.getElementById('activeUsers').textContent = active;
  document.getElementById('suspendedUsers').textContent = suspended;
  document.getElementById('metricUsers').textContent = total;
}

async function viewUser(id) {
  const user = users.find(u => u.id === id);
  if (user) {
    openViewUserModal(user);
  } else {
    alert('User not found');
  }
}

async function editUser(id) {
  const user = users.find(u => u.id === id);
  if (user) {
    openEditUserModal(user);
  } else {
    alert('User not found');
  }
}

async function suspendUser(id) {
  const user = users.find(u => u.id === id);
  if (!user) {
    alert('User not found');
    return;
  }
  
  const action = user.status === 'suspended' ? 'activate' : 'suspend';
  if (confirm(`Are you sure you want to ${action} user "${user.name}"?`)) {
    try {
      // Replace with actual API call
      // await fetch(`/api/admin/users/${id}/suspend`, { method: 'POST' });
      
      // Update local state
      user.status = user.status === 'suspended' ? 'active' : 'suspended';
      renderUsersTable();
      updateUserMetrics();
      
      alert(`User ${user.name} ${user.status === 'suspended' ? 'suspended' : 'activated'} successfully`);
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status');
    }
  }
}

// Package management functions
async function refreshPackages() {
  try {
    // Replace with your actual API endpoint
    // const response = await fetch('/api/admin/packages');
    // const data = await response.json();
    
    // Mock data for demonstration
    const mockPackages = [
      { id: 1, title: 'Jaipur Golden Triangle', destination: 'Jaipur', duration: '7D/6N', price: 24999, status: 'active', description: 'Explore the royal heritage of Jaipur' },
      { id: 2, title: 'Beautiful Mountains', destination: 'Manali', duration: '5D/4N', price: 18999, status: 'active', description: 'Experience the scene of beautiful Mountains of Manali' },
      { id: 3, title: 'Goa Beach Holiday', destination: 'Goa', duration: '4D/3N', price: 12999, status: 'active', description: 'Relax on the beautiful beaches of Goa' },
      { id: 4, title: 'Rishikesh Adventure', destination: 'Rishikesh', duration: '8D/7N', price: 34999, status: 'inactive', description: 'Adventure trip to the mountains of Rishikesh' }
    ];
    
    packages = mockPackages;
    renderPackagesTable();
    updatePackageMetrics();
  } catch (error) {
    console.error('Error fetching packages:', error);
    alert('Failed to fetch packages');
  }
}

function renderPackagesTable() {
  const tbody = document.getElementById('packageTableBody');
  if (packages.length === 0) {
    tbody.innerHTML = '<tr class="placeholder-row"><td colspan="6">No packages available</td></tr>';
    return;
  }
  
  tbody.innerHTML = packages.map(pkg => `
    <tr>
      <td>${pkg.id}</td>
      <td>${pkg.title}</td>
      <td>${pkg.destination}</td>
      <td>${pkg.duration}</td>
      <td>₹${pkg.price.toLocaleString()}</td>
      <td>
        <div class="btn-action-group">
          <button class="btn btn-xs" onclick="viewPackage(${pkg.id})">👁️ View</button>
          <button class="btn btn-xs btn-primary" onclick="editPackage(${pkg.id})">✏️ Edit</button>
          <button class="btn btn-xs btn-danger" onclick="deletePackage(${pkg.id})">🗑️ Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function updatePackageMetrics() {
  const total = packages.length;
  const active = packages.filter(p => p.status === 'active').length;
  
  document.getElementById('totalPackages').textContent = total;
  document.getElementById('activePackages').textContent = active;
}

async function viewPackage(id) {
  const pkg = packages.find(p => p.id === id);
  if (pkg) {
    alert(`Package Details:\n\nTitle: ${pkg.title}\nDestination: ${pkg.destination}\nDuration: ${pkg.duration}\nPrice: ₹${pkg.price.toLocaleString()}\nStatus: ${pkg.status}\n\nDescription: ${pkg.description || 'No description available'}`);
  } else {
    alert('Package not found');
  }
}

async function editPackage(id) {
  const pkg = packages.find(p => p.id === id);
  if (pkg) {
    openEditPackageModal(pkg);
  } else {
    alert('Package not found');
  }
}

async function deletePackage(id) {
  const pkg = packages.find(p => p.id === id);
  if (!pkg) {
    alert('Package not found');
    return;
  }
  
  if (confirm(`Are you sure you want to delete package "${pkg.title}"? This action cannot be undone.`)) {
    try {
      // Replace with actual API call
      // await fetch(`/api/admin/packages/${id}`, { method: 'DELETE' });
      
      // Update local state
      packages = packages.filter(p => p.id !== id);
      renderPackagesTable();
      updatePackageMetrics();
      
      alert(`Package "${pkg.title}" deleted successfully`);
    } catch (error) {
      console.error('Error deleting package:', error);
      alert('Failed to delete package');
    }
  }
}

// AI Group Management Functions
async function refreshAIGroups() {
  try {
    // Replace with your actual API endpoint
    // const response = await fetch('/api/admin/ai-groups');
    // const data = await response.json();
    
    // Mock data for demonstration
    const mockAIGroups = [
      { 
        id: 101, 
        name: 'Mountain Explorers', 
        members: ['Rajesh Sharma', 'Harsh Tiwari', 'Aakriti Gupta', 'Seema Chauhan'],
        destination: 'Rishikesh',
        startDate: '2024-04-15',
        duration: '8D/7N',
        status: 'pending',
        created: '2024-03-18',
        matchScore: 92
      },
      { 
        id: 102, 
        name: 'Beach Lovers', 
        members: ['Rajesh Sharma', 'Harsh Tiwari', 'Aakriti Gupta', 'Seema Chauhan'],
        destination: 'Goa',
        startDate: '2024-04-20',
        duration: '4D/3N',
        status: 'pending',
        created: '2024-03-19',
        matchScore: 87
      },
      { 
        id: 103, 
        name: 'Cultural Heritage', 
        members: ['Rajesh Sharma', 'Harsh Tiwari', 'Aakriti Gupta', 'Seema Chauhan'],
        destination: 'Jaipur, Rajasthan',
        startDate: '2024-05-10',
        duration: '7D/6N',
        status: 'approved',
        created: '2024-03-15',
        matchScore: 95
      },
      { 
        id: 104, 
        name: 'Beautiful Mountains', 
        members: ['Rajesh Sharma', 'Harsh Tiwari', 'Aakriti Gupta'],
        destination: 'Manali,Himachal',
        startDate: '2024-04-25',
        duration: '5D/4N',
        status: 'rejected',
        created: '2024-03-20',
        matchScore: 65
      },
      { 
        id: 105, 
        name: 'Himalayan Trekkers', 
        members: ['Rajesh Sharma', 'Harsh Tiwari', 'Aakriti Gupta', 'Seema Chauhan'],
        destination: 'Manali, Himachal',
        startDate: '2024-05-05',
        duration: '6D/5N',
        status: 'pending',
        created: '2024-03-21',
        matchScore: 89
      }
    ];
    
    aiGroups = mockAIGroups;
    renderAIGroupsTable();
    updateAIGroupMetrics();
  } catch (error) {
    console.error('Error fetching AI groups:', error);
    alert('Failed to fetch AI groups');
  }
}

function renderAIGroupsTable() {
  const tbody = document.getElementById('approvalTableBody');
  if (aiGroups.length === 0) {
    tbody.innerHTML = '<tr class="placeholder-row"><td colspan="7">No AI groups pending approval</td></tr>';
    return;
  }
  
  tbody.innerHTML = aiGroups.map(group => {
    const statusClass = group.status === 'pending' ? 'status-pending' : 
                       group.status === 'approved' ? 'status-approved' : 'status-rejected';
    
    return `
    <tr>
      <td>${group.id}</td>
      <td>${group.name}</td>
      <td>${group.members.length}</td>
      <td>${group.destination}</td>
      <td>${group.startDate}</td>
      <td><span class="${statusClass}">${group.status.charAt(0).toUpperCase() + group.status.slice(1)}</span></td>
      <td>
        <div class="btn-action-group">
          <button class="btn btn-xs" onclick="viewAIGroup(${group.id})">👁️ View</button>
          ${group.status === 'pending' ? `
            <button class="btn btn-xs btn-success" onclick="approveGroup(${group.id})">✅ Approve</button>
            <button class="btn btn-xs btn-danger" onclick="rejectGroup(${group.id})">❌ Reject</button>
          ` : ''}
          ${group.status === 'approved' ? `
            <button class="btn btn-xs btn-warning" onclick="undoApproveGroup(${group.id})">↩️ Undo</button>
          ` : ''}
        </div>
      </td>
    </tr>
  `}).join('');
}

function updateAIGroupMetrics() {
  const pending = aiGroups.filter(g => g.status === 'pending').length;
  
  document.getElementById('pendingApprovals').textContent = pending;
}

function viewAIGroup(id) {
  const group = aiGroups.find(g => g.id === id);
  if (group) {
    openViewAIGroupModal(group);
  } else {
    alert('AI Group not found');
  }
}

async function approveGroup(id) {
  const group = aiGroups.find(g => g.id === id);
  if (!group) {
    alert('AI Group not found');
    return;
  }
  
  if (confirm(`Are you sure you want to approve group "${group.name}" with ${group.members.length} members?`)) {
    try {
      // Replace with actual API call
      // await fetch(`/api/admin/ai-groups/${id}/approve`, { method: 'POST' });
      
      // Update local state
      group.status = 'approved';
      renderAIGroupsTable();
      updateAIGroupMetrics();
      
      alert(`Group "${group.name}" approved successfully!`);
    } catch (error) {
      console.error('Error approving group:', error);
      alert('Failed to approve group');
    }
  }
}

async function rejectGroup(id) {
  const group = aiGroups.find(g => g.id === id);
  if (!group) {
    alert('AI Group not found');
    return;
  }
  
  if (confirm(`Are you sure you want to reject group "${group.name}"? This action cannot be undone.`)) {
    try {
      // Replace with actual API call
      // await fetch(`/api/admin/ai-groups/${id}/reject`, { method: 'POST' });
      
      // Update local state
      group.status = 'rejected';
      renderAIGroupsTable();
      updateAIGroupMetrics();
      
      alert(`Group "${group.name}" rejected successfully!`);
    } catch (error) {
      console.error('Error rejecting group:', error);
      alert('Failed to reject group');
    }
  }
}

async function undoApproveGroup(id) {
  const group = aiGroups.find(g => g.id === id);
  if (!group) {
    alert('AI Group not found');
    return;
  }
  
  if (confirm(`Are you sure you want to undo approval for group "${group.name}"?`)) {
    try {
      // Replace with actual API call
      // await fetch(`/api/admin/ai-groups/${id}/undo-approve`, { method: 'POST' });
      
      // Update local state
      group.status = 'pending';
      renderAIGroupsTable();
      updateAIGroupMetrics();
      
      alert(`Approval for group "${group.name}" has been undone!`);
    } catch (error) {
      console.error('Error undoing approval:', error);
      alert('Failed to undo approval');
    }
  }
}

// Form submission handlers
document.addEventListener('DOMContentLoaded', function() {
  // Add package form
  const addPackageForm = document.getElementById('addPackageForm');
  if (addPackageForm) {
    addPackageForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const formData = new FormData(this);
      const packageData = Object.fromEntries(formData);
      
      try {
        // Replace with actual API call
        // const response = await fetch('/api/admin/packages', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(packageData)
        // });
        
        // Mock response
        const newPackage = {
          id: packages.length > 0 ? Math.max(...packages.map(p => p.id)) + 1 : 1,
          ...packageData,
          price: parseInt(packageData.price),
          status: 'active'
        };
        
        packages.push(newPackage);
        renderPackagesTable();
        updatePackageMetrics();
        
        alert(`Package "${packageData.title}" added successfully!`);
        closeAddPackageModal();
      } catch (error) {
        console.error('Error adding package:', error);
        alert('Failed to add package');
      }
    });
  }
  
  // Edit user form
  const editUserForm = document.getElementById('editUserForm');
  if (editUserForm) {
    editUserForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const formData = new FormData(this);
      const userData = Object.fromEntries(formData);
      userData.id = parseInt(userData.id);
      
      try {
        // Replace with actual API call
        // await fetch(`/api/admin/users/${userData.id}`, {
        //   method: 'PUT',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(userData)
        // });
        
        // Update local state
        const userIndex = users.findIndex(u => u.id == userData.id);
        if (userIndex !== -1) {
          users[userIndex] = { ...users[userIndex], ...userData };
          renderUsersTable();
          updateUserMetrics();
        }
        
        alert('User updated successfully!');
        closeEditUserModal();
      } catch (error) {
        console.error('Error updating user:', error);
        alert('Failed to update user');
      }
    });
  }
  
  // Edit package form
  const editPackageForm = document.getElementById('editPackageForm');
  if (editPackageForm) {
    editPackageForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const formData = new FormData(this);
      const packageData = Object.fromEntries(formData);
      packageData.id = parseInt(packageData.id);
      packageData.price = parseInt(packageData.price);
      
      try {
        // Replace with actual API call
        // await fetch(`/api/admin/packages/${packageData.id}`, {
        //   method: 'PUT',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(packageData)
        // });
        
        // Update local state
        const pkgIndex = packages.findIndex(p => p.id == packageData.id);
        if (pkgIndex !== -1) {
          packages[pkgIndex] = { 
            ...packages[pkgIndex], 
            ...packageData
          };
          renderPackagesTable();
          updatePackageMetrics();
        }
        
        alert('Package updated successfully!');
        closeEditPackageModal();
      } catch (error) {
        console.error('Error updating package:', error);
        alert('Failed to update package');
      }
    });
  }
  
  // Close modals on backdrop click
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', function(e) {
      if (e.target === this) {
        closeAddPackageModal();
        closeEditUserModal();
        closeViewUserModal();
        closeEditPackageModal();
        closeViewAIGroupModal();
      }
    });
  });
  
  // Close modals on Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeAddPackageModal();
      closeEditUserModal();
      closeViewUserModal();
      closeEditPackageModal();
      closeViewAIGroupModal();
    }
  });
  
  // Load initial data
  refreshUsers();
  refreshPackages();
  refreshAIGroups();
  
  // Initialize other metrics
  document.getElementById('metricTrips').textContent = '0';
  document.getElementById('metricRevenue').textContent = '0';
  document.getElementById('metricNotifications').textContent = '0';
  document.getElementById('minGroupSize').textContent = '4';
});

// Payments and notifications
function refreshPayments() {
  alert('Fetch payments from /api/admin/payments');
}

function markAllNotificationsRead() {
  if (confirm('Mark all notifications as read?')) {
    alert('All notifications marked as read');
  }
}