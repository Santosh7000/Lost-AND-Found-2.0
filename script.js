/* === STATE MANAGEMENT === */
const state = {
    currentUser: JSON.parse(localStorage.getItem('currentUser')) || null,
    items: JSON.parse(localStorage.getItem('items')) || []
};

/* === INITIALIZATION === */
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    setupScrollAnimation();
    
    // If logged in, go to dashboard, else landing
    if(state.currentUser) {
        navTo('dashboard');
    } else {
        navTo('home');
    }
});

/* === NAVIGATION === */
function navTo(pageId) {
    const landing = document.getElementById('landing-view');
    const auth = document.getElementById('auth-view');
    const dashboard = document.getElementById('dashboard-view');
    const mobileMenu = document.querySelector('.nav-links');

    // Reset views
    landing.classList.add('hidden');
    auth.classList.add('hidden');
    dashboard.classList.add('hidden');
    mobileMenu.classList.remove('active'); // Close mobile menu

    if (pageId === 'home') {
        landing.classList.remove('hidden');
        window.scrollTo(0,0);
    } else if (pageId === 'auth') {
        auth.classList.remove('hidden');
    } else if (pageId === 'dashboard') {
        if (!state.currentUser) {
            showToast('Please login first');
            navTo('auth');
            return;
        }
        dashboard.classList.remove('hidden');
        document.getElementById('user-name-display').textContent = state.currentUser.name;
        renderItems(); // Load initial data
    }
}

function toggleMobileMenu() {
    document.querySelector('.nav-links').classList.toggle('active');
}

/* === AUTHENTICATION SYSTEM === */
function toggleAuth(mode) {
    const loginForm = document.getElementById('login-form');
    const regForm = document.getElementById('register-form');
    
    if(mode === 'register') {
        loginForm.classList.add('hidden');
        regForm.classList.remove('hidden');
    } else {
        regForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    }
}

function register() {
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-pass').value;

    if(!name || !email || pass.length < 6) {
        showToast('Please fill all fields (Pass min 6 chars)');
        return;
    }

    const users = JSON.parse(localStorage.getItem('users')) || [];
    if(users.find(u => u.email === email)) {
        showToast('Email already exists');
        return;
    }

    const newUser = { name, email, pass };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Auto login
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    state.currentUser = newUser;
    
    showToast('Registration Successful!');
    updateAuthUI();
    navTo('dashboard');
}

function login() {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    
    // 1. Check for Admin Credential first
    if (email === "satoshi.maharjan700@gmail.com" && pass === "admin123") { // Set a specific password for admin
        const adminUser = { name: "Admin Satoshi", email: email, isAdmin: true };
        localStorage.setItem('currentUser', JSON.stringify(adminUser));
        state.currentUser = adminUser;
        showToast('Welcome, Admin Satoshi!');
        updateAuthUI();
        navTo('admin'); // Special redirect
        return;
    }

    // 2. Regular User Login
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.email === email && u.pass === pass);

    if(user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        state.currentUser = user;
        showToast('Welcome back!');
        updateAuthUI();
        navTo('dashboard');
    } else {
        showToast('Invalid credentials');
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    state.currentUser = null;
    updateAuthUI();
    navTo('home');
    showToast('Logged out');
}

function updateAuthUI() {
    const authLink = document.getElementById('auth-link');
    const logoutLink = document.getElementById('logout-link');
    
    if(state.currentUser) {
        authLink.style.display = 'none';
        logoutLink.style.display = 'block';
    } else {
        authLink.style.display = 'block';
        logoutLink.style.display = 'none';
    }
}

function checkAuthAndRedirect(target) {
    if(state.currentUser) {
        navTo('dashboard');
        // Simple timeout to allow DOM to switch before clicking tab
        setTimeout(() => switchDashTab(target), 100);
    } else {
        navTo('auth');
    }
}

/* === DASHBOARD LOGIC === */
function switchDashTab(tabName) {
    // Hide all panels
    document.querySelectorAll('.dash-panel').forEach(p => p.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

    // Show selected
    document.getElementById(tabName + '-tab').classList.remove('hidden');
    // Find button with specific onclick and add active class (simplified)
    const buttons = document.querySelectorAll('.tab-btn');
    if(tabName === 'lost') buttons[0].classList.add('active');
    if(tabName === 'found') buttons[1].classList.add('active');
    if(tabName === 'feed') {
        buttons[2].classList.add('active');
        renderItems();
    }
}

/* === ITEM HANDLING (CORE FEATURE) === */
async function handleItemSubmit(e, type) {
    e.preventDefault();
    const form = e.target;
    
    // Get file if exists
    const fileInput = type === 'lost' ? document.getElementById('lost-file-input') : document.getElementById('found-file-input');
    let imageBase64 = null;
    
    if(fileInput.files.length > 0) {
        // Compress/Convert to Base64
        imageBase64 = await convertBase64(fileInput.files[0]);
    } else if (type === 'found') {
        // Require image for found items
        showToast('Please provide an image for found items');
        return;
    }

    const newItem = {
        id: Date.now(),
        type: type, // 'lost' or 'found'
        name: form['item-name'].value,
        description: form['description'].value.toLowerCase(), // lower case for search
        location: form['location'].value,
        date: type === 'lost' ? form['date'].value : new Date().toLocaleDateString(),
        contact: type === 'found' ? form['contact'].value : state.currentUser.email,
        image: imageBase64 || 'https://via.placeholder.com/200?text=No+Image'
    };

    // Save to LocalStorage
    state.items.push(newItem);
    localStorage.setItem('items', JSON.stringify(state.items));

    form.reset();
    showToast(`${type === 'lost' ? 'Report' : 'Item'} Submitted Successfully`);

    if(type === 'lost') {
        // Trigger Matching Logic
        findMatches(newItem);
    } else {
        switchDashTab('feed');
    }
}

/* === MATCHING ALGORITHM === */
function findMatches(lostItem) {
    const resultsDiv = document.getElementById('match-results');
    resultsDiv.innerHTML = '<h4>Searching Database...</h4>';

    // Filter items: Must be 'found', and description must include keywords
    const matches = state.items.filter(item => {
        if(item.type !== 'found') return false;
        
        // Simple keyword matching logic
        const lostWords = lostItem.description.split(' ');
        const isMatch = lostWords.some(word => item.description.includes(word) && word.length > 3);
        
        return isMatch || item.name.toLowerCase().includes(lostItem.name.toLowerCase());
    });

    resultsDiv.innerHTML = '';
    
    if(matches.length === 0) {
        resultsDiv.innerHTML = '<p>No matches found yet. We will notify you if something turns up.</p>';
        return;
    }

    resultsDiv.innerHTML = '<h4>Possible Matches Found:</h4>';
    matches.forEach(match => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <span class="item-tag">Match Found</span>
            <img src="${match.image}" class="item-img" alt="Item">
            <h4>${match.name}</h4>
            <p>${match.location}</p>
            <p><strong>Contact:</strong> ${match.contact}</p>
        `;
        resultsDiv.appendChild(card);
    });
}

function renderItems() {
    const grid = document.getElementById('found-items-grid');
    grid.innerHTML = '';
    
    const foundItems = state.items.filter(i => i.type === 'found').reverse(); // Show newest first

    if(foundItems.length === 0) {
        grid.innerHTML = '<p>No items reported found recently.</p>';
        return;
    }

    foundItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'card hover-card';
        div.innerHTML = `
            <img src="${item.image}" class="item-img" alt="Item">
            <h3>${item.name}</h3>
            <p class="text-sm">${item.description}</p>
            <p><strong>Loc:</strong> ${item.location}</p>
            <p><strong>Contact:</strong> ${item.contact}</p>
        `;
        grid.appendChild(div);
    });
}

/* === UTILITIES === */
function convertBase64(file) {
    return new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.readAsDataURL(file);
        fileReader.onload = () => resolve(fileReader.result);
        fileReader.onerror = (error) => reject(error);
    });
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

function handleContact(e) {
    e.preventDefault();
    showToast('Message Sent! We will reply shortly.');
    e.target.reset();
}

/* === SCROLL ANIMATION === */
function setupScrollAnimation() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if(entry.isIntersecting) {
                entry.target.classList.add('scroll-show');
            }
        });
    });

    const hiddenElements = document.querySelectorAll('.scroll-hidden');
    hiddenElements.forEach((el) => observer.observe(el));
}
/* === ADMIN LOGIC === */

function renderAdminStats() {
    // Show stats panel, hide others
    document.getElementById('admin-stats').classList.remove('hidden');
    document.getElementById('admin-items').classList.add('hidden');
    document.getElementById('admin-users').classList.add('hidden');

    // Calculate Data
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const items = JSON.parse(localStorage.getItem('items')) || [];
    const lostCount = items.filter(i => i.type === 'lost').length;
    const foundCount = items.filter(i => i.type === 'found').length;

    // Update UI
    document.getElementById('stat-users').textContent = users.length;
    document.getElementById('stat-lost').textContent = lostCount;
    document.getElementById('stat-found').textContent = foundCount;
}

function renderAdminItems() {
    document.getElementById('admin-stats').classList.add('hidden');
    document.getElementById('admin-items').classList.remove('hidden');
    document.getElementById('admin-users').classList.add('hidden');

    const tbody = document.querySelector('#admin-items-table tbody');
    tbody.innerHTML = '';
    const items = JSON.parse(localStorage.getItem('items')) || [];

    items.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><img src="${item.image}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;"></td>
            <td>${item.name}</td>
            <td><span class="${item.type === 'lost' ? 'badge-lost' : 'badge-found'}">${item.type.toUpperCase()}</span></td>
            <td>${item.contact}</td>
            <td><button class="btn-danger" onclick="adminDeleteItem(${index})">Delete</button></td>
        `;
        tbody.appendChild(row);
    });
}

function renderAdminUsers() {
    document.getElementById('admin-stats').classList.add('hidden');
    document.getElementById('admin-items').classList.add('hidden');
    document.getElementById('admin-users').classList.remove('hidden');

    const tbody = document.querySelector('#admin-users-table tbody');
    tbody.innerHTML = '';
    const users = JSON.parse(localStorage.getItem('users')) || [];

    users.forEach((user, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td><button class="btn-danger" onclick="adminDeleteUser(${index})">Ban</button></td>
        `;
        tbody.appendChild(row);
    });
}

function adminDeleteItem(index) {
    if(confirm('Are you sure you want to delete this item?')) {
        const items = JSON.parse(localStorage.getItem('items')) || [];
        items.splice(index, 1); // Remove item at index
        localStorage.setItem('items', JSON.stringify(items));
        state.items = items; // Update global state
        renderAdminItems(); // Refresh table
        showToast('Item deleted by Admin');
    }
}

function adminDeleteUser(index) {
    if(confirm('Are you sure you want to ban this user?')) {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        users.splice(index, 1);
        localStorage.setItem('users', JSON.stringify(users));
        renderAdminUsers(); // Refresh table
        showToast('User banned');
    }
}

/* === NEW ADMIN UI LOGIC === */

// 1. Main Render Function
function renderAdminStats() {
    // Just a wrapper to load the cards view by default
    filterAdminView('all');
}

// 2. Filter & Render Cards
function filterAdminView(filterType) {
    const container = document.getElementById('admin-cards-container');
    const totalCount = document.getElementById('total-count');
    container.innerHTML = '';
    
    // Get Items
    const allItems = JSON.parse(localStorage.getItem('items')) || [];
    
    // Filter Items
    const filteredItems = allItems.filter(item => {
        if(filterType === 'all') return true;
        return item.type === filterType;
    });

    totalCount.textContent = filteredItems.length;

    if(filteredItems.length === 0) {
        container.innerHTML = '<div style="text-align:center; color:#94a3b8; margin-top:2rem;">No items found.</div>';
        return;
    }

    // Generate HTML for each card
    filteredItems.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'admin-card';
        card.onclick = () => showAdminDetails(item, card); // Click event
        
        // Define tag style
        const tagClass = item.type === 'lost' ? 'tag-lost' : 'tag-found';
        const tagLabel = item.type === 'lost' ? 'High Priority' : 'Resolved'; // Mimicking reference text style

        card.innerHTML = `
            <img src="${item.image}" class="card-img-thumb" alt="img">
            <div class="card-info">
                <div class="card-title">${item.name}</div>
                <div class="card-meta">
                    <span>📍 ${item.location}</span>
                    <span>📅 ${item.date}</span>
                </div>
            </div>
            <span class="tag ${tagClass}">${item.type.toUpperCase()}</span>
        `;
        container.appendChild(card);
    });
}

// 3. Show Details in Right Panel (The "Reference" Look)
function showAdminDetails(item, cardElement) {
    // Highlight selected card
    document.querySelectorAll('.admin-card').forEach(c => c.classList.remove('selected'));
    cardElement.classList.add('selected');

    const panel = document.getElementById('details-panel');
    
    panel.innerHTML = `
        <div class="panel-header">
            <h2 style="margin:0;">Item Details</h2>
            <span style="font-size:0.8rem; color:#64748b;">ID: ${item.id}</span>
        </div>
        
        <img src="${item.image}" class="panel-img">
        
        <div class="detail-row">
            <div class="detail-label">Description</div>
            <div class="detail-value">${item.description}</div>
        </div>

        <div class="detail-row">
            <div class="detail-label">Location & Date</div>
            <div class="detail-value">
                Found at <strong>${item.location}</strong><br>
                On ${item.date}
            </div>
        </div>

        <div class="detail-row">
            <div class="detail-label">Contact Info</div>
            <div class="detail-value" style="background: #f0fdf4; padding: 10px; border-radius: 8px; color: #166534;">
                ${item.contact}
            </div>
        </div>

        <div style="margin-top: 3rem; display:grid; gap:10px;">
            <button class="btn-primary" style="width:100%;" onclick="alert('Email sent to user!')">Contact User</button>
            <button class="btn-secondary" style="width:100%; background:#ef4444; color:white;" onclick="adminDeleteItemById(${item.id})">Delete Post</button>
        </div>
    `;
}

// Helper to delete by ID (since we used index before)
function adminDeleteItemById(id) {
    if(confirm('Delete this item permanently?')) {
        let items = JSON.parse(localStorage.getItem('items')) || [];
        items = items.filter(i => i.id !== id);
        localStorage.setItem('items', JSON.stringify(items));
        
        // Refresh view
        filterAdminView('all');
        document.getElementById('details-panel').innerHTML = '<div class="empty-state"><p>Select an item to view details</p></div>';
        showToast('Item Deleted');
    }
}