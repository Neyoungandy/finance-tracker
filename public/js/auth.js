// Authentication module
const authModule = {
    init: () => {
        // Initialize login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', authModule.handleLogin);
        }

        // Initialize signup form
        const signupForm = document.getElementById('signupForm');
        if (signupForm) {
            signupForm.addEventListener('submit', authModule.handleSignup);
        }

        // Initialize auth buttons
        const loginBtn = document.getElementById('loginBtn');
        const signupBtn = document.getElementById('signupBtn');
        const logoutBtn = document.getElementById('logoutBtn');

        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
                loginModal.show();
            });
        }

        if (signupBtn) {
            signupBtn.addEventListener('click', () => {
                const signupModal = new bootstrap.Modal(document.getElementById('signupModal'));
                signupModal.show();
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', authModule.handleLogout);
        }
    },

    handleLogin: async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            app.utils.showLoading();
            const response = await fetch(`${app.API.auth}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            // Store auth data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            app.state.user = data.user;

            // Update UI
            app.auth.updateUIForAuth();
            app.utils.showNotification('Login successful', 'success');

            // Close modal
            const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
            loginModal.hide();

            // Redirect to dashboard
            app.navigation.navigateTo('dashboard');
        } catch (error) {
            app.utils.showNotification(error.message, 'error');
        } finally {
            app.utils.hideLoading();
        }
    },

    handleSignup: async (e) => {
        e.preventDefault();
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;

        try {
            app.utils.showLoading();
            const response = await fetch(`${app.API.auth}/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Signup failed');
            }

            // Store auth data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            app.state.user = data.user;

            // Update UI
            app.auth.updateUIForAuth();
            app.utils.showNotification('Account created successfully', 'success');

            // Close modal
            const signupModal = bootstrap.Modal.getInstance(document.getElementById('signupModal'));
            signupModal.hide();

            // Redirect to dashboard
            app.navigation.navigateTo('dashboard');
        } catch (error) {
            app.utils.showNotification(error.message, 'error');
        } finally {
            app.utils.hideLoading();
        }
    },

    handleLogout: () => {
        // Clear auth data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        app.state.user = null;

        // Update UI
        app.auth.updateUIForGuest();
        app.utils.showNotification('Logged out successfully', 'info');

        // Redirect to home
        app.navigation.navigateTo('dashboard');
    },

    // Check if user is authenticated
    isAuthenticated: () => {
        return !!localStorage.getItem('token');
    },

    // Get auth token
    getToken: () => {
        return localStorage.getItem('token');
    },

    // Get current user
    getCurrentUser: () => {
        return JSON.parse(localStorage.getItem('user'));
    }
};

// Initialize auth module when DOM is loaded
document.addEventListener('DOMContentLoaded', authModule.init);

// Export auth module
window.authModule = authModule; 