// Global state management
const state = {
    user: null,
    currentPage: 'dashboard',
    isLoading: false,
    notifications: []
};

// API endpoints
const API = {
    base: '/api',
    auth: '/api/auth',
    transactions: '/api/transactions',
    budgets: '/api/budgets',
    reports: '/api/reports',
    currency: '/api/currency',
    plaid: '/api/plaid'
};

// Utility functions
const utils = {
    formatCurrency: (amount, currency = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    },

    formatDate: (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    showLoading: () => {
        state.isLoading = true;
        document.body.classList.add('loading');
    },

    hideLoading: () => {
        state.isLoading = false;
        document.body.classList.remove('loading');
    },

    showNotification: (message, type = 'info') => {
        const notification = {
            id: Date.now(),
            message,
            type
        };
        state.notifications.push(notification);
        renderNotifications();
        setTimeout(() => {
            state.notifications = state.notifications.filter(n => n.id !== notification.id);
            renderNotifications();
        }, 5000);
    }
};

// Navigation handling
const navigation = {
    init: () => {
        document.querySelectorAll('[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.target.dataset.page;
                navigation.navigateTo(page);
            });
        });
    },

    navigateTo: (page) => {
        state.currentPage = page;
        loadPageContent(page);
        updateActiveNavLink(page);
    },

    updateActiveNavLink: (page) => {
        document.querySelectorAll('[data-page]').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.page === page) {
                link.classList.add('active');
            }
        });
    }
};

// Page content loading
async function loadPageContent(page) {
    utils.showLoading();
    try {
        const response = await fetch(`/pages/${page}.html`);
        if (!response.ok) throw new Error('Failed to load page content');
        const content = await response.text();
        document.getElementById('content').innerHTML = content;
        
        // Initialize page-specific JavaScript
        if (window[`init${page.charAt(0).toUpperCase() + page.slice(1)}`]) {
            window[`init${page.charAt(0).toUpperCase() + page.slice(1)}`]();
        }
    } catch (error) {
        utils.showNotification('Error loading page content', 'error');
        console.error('Error loading page:', error);
    } finally {
        utils.hideLoading();
    }
}

// Notification rendering
function renderNotifications() {
    const container = document.getElementById('notifications') || createNotificationContainer();
    container.innerHTML = state.notifications.map(notification => `
        <div class="alert alert-${notification.type} fade-in">
            ${notification.message}
        </div>
    `).join('');
}

function createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'notifications';
    container.className = 'notification-container';
    document.body.appendChild(container);
    return container;
}

// Authentication state management
const auth = {
    checkAuth: () => {
        const token = localStorage.getItem('token');
        if (token) {
            state.user = JSON.parse(localStorage.getItem('user'));
            updateUIForAuth();
        } else {
            state.user = null;
            updateUIForGuest();
        }
    },

    updateUIForAuth: () => {
        document.querySelectorAll('.auth-only').forEach(el => el.style.display = 'block');
        document.querySelectorAll('.guest-only').forEach(el => el.style.display = 'none');
        if (state.user) {
            document.getElementById('userName').textContent = state.user.name;
        }
    },

    updateUIForGuest: () => {
        document.querySelectorAll('.auth-only').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.guest-only').forEach(el => el.style.display = 'block');
    }
};

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    navigation.init();
    auth.checkAuth();
    loadPageContent(state.currentPage);
});

// Export modules for use in other files
window.app = {
    state,
    API,
    utils,
    navigation,
    auth
}; 