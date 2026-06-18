/**
 * OnlineSchool — Main Application JavaScript
 * Complete School Management System
 */

// ============================================================
// CONFIGURATION & CONSTANTS
// ============================================================

const APP_CONFIG = {
  apiBase: `${window.location.origin}/api`,  // ✅ Dynamic backend API URL
  version: '1.0.0',
  roles: ['admin', 'teacher', 'parent', 'student']
};

const DEMO_CREDENTIALS = {
  admin: { email: 'admin@schooldemo.edu', password: 'Demo@School123' },
  teacher: { email: 'teacher@schooldemo.edu', password: 'Demo@Teacher123' },
  parent: { email: 'parent@schooldemo.edu', password: 'Demo@Parent123' },
  student: { email: 'student@schooldemo.edu', password: 'Demo@Student123' }
};

// ============================================================
// DOM ELEMENTS
// ============================================================

const elements = {
  nav: document.getElementById('nav'),
  hamburger: document.getElementById('hamburger'),
  mobileMenu: document.getElementById('mobile-menu'),
  authOverlay: document.getElementById('auth-overlay'),
  authClose: document.getElementById('auth-close'),
  authScreenRole: document.getElementById('auth-screen-role'),
  authScreenForm: document.getElementById('auth-screen-form')
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Smooth scroll to element
 */
function smoothScroll(selector) {
  document.querySelector(selector)?.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Format currency
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

/**
 * Format date
 */
function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date));
}

/**
 * Counter animation
 */
function animateCounter(element, target) {
  const duration = 2000;
  const startValue = parseInt(element.innerText) || 0;
  const increment = (target - startValue) / (duration / 16);
  let current = startValue;
  
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      element.innerText = target.toLocaleString();
      clearInterval(timer);
    } else {
      element.innerText = Math.floor(current).toLocaleString();
    }
  }, 16);
}

// ============================================================
// NAVBAR & SCROLL EVENTS
// ============================================================

window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    elements.nav?.classList.add('scrolled');
  } else {
    elements.nav?.classList.remove('scrolled');
  }
});

// ============================================================
// MOBILE MENU
// ============================================================

function toggleMobileMenu() {
  elements.mobileMenu?.classList.toggle('open');
}

elements.hamburger?.addEventListener('click', toggleMobileMenu);

// Close mobile menu on link click
document.querySelectorAll('.mm-link').forEach(link => {
  link.addEventListener('click', () => {
    elements.mobileMenu?.classList.remove('open');
  });
});

// ============================================================
// AUTH MODAL FUNCTIONS
// ============================================================

let currentAuthRole = null;

function switchAuthScreen(screen) {
  if (screen === 'role') {
    elements.authScreenRole?.classList.add('active');
    elements.authScreenForm?.classList.remove('active');
  } else {
    elements.authScreenRole?.classList.remove('active');
    elements.authScreenForm?.classList.add('active');
  }
}

function selectRole(role) {
  currentAuthRole = role;
  
  // Update pill display
  const roleLabels = {
    admin: 'Administrator',
    teacher: 'Teacher',
    parent: 'Parent',
    student: 'Student'
  };
  
  document.getElementById('auth-pill-label').innerText = roleLabels[role];
  switchAuthScreen('form');
}

function switchAuthTab(tab) {
  const forms = document.querySelectorAll('.auth-form');
  forms.forEach(f => f.classList.remove('active'));

  if (tab === 'login') {
    document.getElementById('form-login')?.classList.add('active');
    document.querySelector('[data-auth-tab="login"]')?.classList.add('active');
    document.querySelector('[data-auth-tab="signup"]')?.classList.remove('active');
  } else if (tab === 'signup') {
    const signupForm = document.getElementById(`form-signup-${currentAuthRole}`);
    if (signupForm) signupForm.classList.add('active');
    document.querySelector('[data-auth-tab="signup"]')?.classList.add('active');
    document.querySelector('[data-auth-tab="login"]')?.classList.remove('active');
  } else if (tab === 'forgot') {
    document.getElementById('form-forgot')?.classList.add('active');
  }
}

function fillDemo() {
  if (!currentAuthRole) currentAuthRole = 'admin';
  const creds = DEMO_CREDENTIALS[currentAuthRole];
  
  document.getElementById('login-email').value = creds.email;
  document.getElementById('login-password').value = creds.password;
}

async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const loginBtn = document.querySelector('#form-login button[type="submit"]');
  const errorEl = document.getElementById('login-error');
  
  try {
    // Show loading state
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<span class="material-icons-round" style="animation: spin 1s linear infinite;">hourglass_empty</span> Signing in...';
    errorEl.classList.remove('show');

    // Make API call to backend
    const response = await fetch(`${APP_CONFIG.apiBase}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      // ✅ Login successful
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('userRole', data.user.role);
      
      // Close auth modal
      elements.authOverlay?.classList.remove('open');
      
      // Show success message
      showNotification('success', `Welcome back, ${data.user.first_name}!`);
      
      // Redirect to dashboard
      setTimeout(() => {
        redirectToDashboard(data.user.role);
      }, 500);
    } else {
      // ❌ Login failed
      errorEl.innerHTML = data.detail || 'Invalid email or password. Please try again.';
      errorEl.classList.add('show');
    }
  } catch (error) {
    console.error('Login error:', error);
    errorEl.innerHTML = '⚠️ Connection error. Is the backend running at http://localhost:8000?';
    errorEl.classList.add('show');
  } finally {
    // Reset button
    loginBtn.disabled = false;
    loginBtn.innerHTML = '<span>Sign In</span><span class="material-icons-round">login</span>';
  }
}

async function handleSignup(e) {
  e.preventDefault();

  if (!currentAuthRole) {
    alert('Please select a role first');
    return;
  }

  const signupBtn = e.target.querySelector('button[type="submit"]');
  const formId = `form-signup-${currentAuthRole}`;
  const form = document.getElementById(formId);
  
  // Get form data based on role
  let formData = {};
  const inputs = form.querySelectorAll('input, select');
  inputs.forEach(input => {
    if (input.value) formData[input.placeholder || input.name] = input.value;
  });

  try {
    // Show loading state
    signupBtn.disabled = true;
    const originalText = signupBtn.innerHTML;
    signupBtn.innerHTML = '<span class="material-icons-round" style="animation: spin 1s linear infinite;">hourglass_empty</span> Creating account...';

    // Prepare signup data based on role
    let signupPayload = {};

    if (currentAuthRole === 'admin') {
      const schoolName = form.querySelector('input[placeholder*="School Name"]').value;
      const fullName = form.querySelector('input[placeholder*="Your Full Name"]').value;
      const email = form.querySelector('input[type="email"]').value;
      const phone = form.querySelector('input[placeholder*="Phone"]').value;
      const password = form.querySelector('input[type="password"]').value;

      if (!schoolName || !fullName || !email || !password) {
        throw new Error('Please fill all required fields');
      }

      signupPayload = {
        email,
        password,
        first_name: fullName.split(' ')[0],
        last_name: fullName.split(' ').slice(1).join(' ') || fullName,
        phone,
        role: 'admin',
        school_id: 1  // Default school ID - will need to create school first in real app
      };
    } 
    else if (currentAuthRole === 'teacher') {
      const fullName = form.querySelector('input[placeholder*="Full Name"]').value;
      const email = form.querySelector('input[type="email"]').value;
      const subject = form.querySelector('select').value;
      const password = form.querySelector('input[type="password"]').value;

      if (!fullName || !email || !subject || !password) {
        throw new Error('Please fill all required fields');
      }

      signupPayload = {
        email,
        password,
        first_name: fullName.split(' ')[0],
        last_name: fullName.split(' ').slice(1).join(' ') || fullName,
        role: 'teacher',
        school_id: 1
      };
    } 
    else if (currentAuthRole === 'parent') {
      const fullName = form.querySelector('input[placeholder*="Your Full Name"]').value;
      const email = form.querySelector('input[type="email"]').value;
      const phone = form.querySelector('input[placeholder*="Phone"]').value;
      const password = form.querySelector('input[type="password"]').value;

      if (!fullName || !email || !password) {
        throw new Error('Please fill all required fields');
      }

      signupPayload = {
        email,
        password,
        first_name: fullName.split(' ')[0],
        last_name: fullName.split(' ').slice(1).join(' ') || fullName,
        phone,
        role: 'parent',
        school_id: 1
      };
    } 
    else if (currentAuthRole === 'student') {
      const fullName = form.querySelector('input[placeholder*="Full Name"]').value;
      const email = form.querySelector('input[type="email"]').value;
      const password = form.querySelector('input[type="password"]').value;

      if (!fullName || !email || !password) {
        throw new Error('Please fill all required fields');
      }

      signupPayload = {
        email,
        password,
        first_name: fullName.split(' ')[0],
        last_name: fullName.split(' ').slice(1).join(' ') || fullName,
        role: 'student',
        school_id: 1
      };
    }

    // Call backend API to register
    const response = await fetch(`${APP_CONFIG.apiBase}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signupPayload)
    });

    const data = await response.json();

    if (response.ok) {
      // ✅ Account created successfully
      showNotification('success', `Account created! Logging you in...`);
      
      // Auto-login by filling login form and submitting
      document.getElementById('login-email').value = signupPayload.email;
      document.getElementById('login-password').value = signupPayload.password;
      
      setTimeout(() => {
        switchAuthTab('login');
        document.getElementById('form-login').dispatchEvent(new Event('submit'));
      }, 800);
    } else {
      throw new Error(data.detail || 'Failed to create account');
    }
  } catch (error) {
    console.error('Signup error:', error);
    showNotification('error', error.message || 'Error creating account. Check the browser console for details.');
  } finally {
    // Reset button
    signupBtn.disabled = false;
    signupBtn.innerHTML = originalText;
  }
}

// ============================================================
// NOTIFICATION & HELPER FUNCTIONS
// ============================================================

/**
 * Show notification toast message
 */
function showNotification(type, message) {
  const notifContainer = document.getElementById('notification-container') || createNotificationContainer();
  
  const notif = document.createElement('div');
  notif.className = `notification notification-${type}`;
  notif.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 24px;
    background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    font-weight: 500;
    max-width: 400px;
    animation: slideIn 0.3s ease;
  `;
  notif.textContent = message;
  
  notifContainer.appendChild(notif);
  
  // Auto remove after 4 seconds
  setTimeout(() => {
    notif.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notif.remove(), 300);
  }, 4000);
}

function createNotificationContainer() {
  const container = document.createElement('div');
  container.id = 'notification-container';
  document.body.appendChild(container);
  return container;
}

/**
 * Logout user and redirect to home
 */
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('userRole');
  showNotification('success', 'Logged out successfully');
  setTimeout(() => {
    window.location.href = '/';
  }, 500);
}

function redirectToDashboard(role) {
  const dashboards = {
    admin: '/admin/dashboard',
    teacher: '/teacher/dashboard',
    parent: '/parent/dashboard',
    student: '/student/dashboard'
  };
  
  window.location.href = dashboards[role] || '/';
}

// ============================================================
// MODAL CONTROLS
// ============================================================

// Auth modal open/close
document.querySelectorAll('[data-auth]').forEach(el => {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    elements.authOverlay?.classList.add('open');
    switchAuthScreen('role');
  });
});

elements.authClose?.addEventListener('click', () => {
  elements.authOverlay?.classList.remove('open');
});

elements.authOverlay?.addEventListener('click', (e) => {
  if (e.target === elements.authOverlay) {
    elements.authOverlay.classList.remove('open');
  }
});

// ============================================================
// SCROLL REVEAL ANIMATIONS
// ============================================================

const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

document.querySelectorAll('.reveal').forEach(el => {
  observer.observe(el);
});

// COUNTER ANIMATION TRIGGERS

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !entry.target.dataset.animated) {
      const target = parseInt(entry.target.dataset.target) || parseInt(entry.target.dataset.count);
      animateCounter(entry.target, target);
      entry.target.dataset.animated = true;
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('[data-count], [data-target]').forEach(el => {
  counterObserver.observe(el);
});

// PRICING TOGGLE

const billingToggle = document.getElementById('billing-toggle');
const pricingValues = {
  monthly: [49, 149, 399],
  annual: [39, 119, 319]
};

billingToggle?.addEventListener('click', () => {
  billingToggle.classList.toggle('annual');
  
  const isAnnual = billingToggle.classList.contains('annual');
  const prices = isAnnual ? pricingValues.annual : pricingValues.monthly;
  
  document.getElementById('pv1').innerText = prices[0];
  document.getElementById('pv2').innerText = prices[1];
  document.getElementById('pv3').innerText = prices[2];
  
  document.getElementById('lbl-monthly').classList.toggle('on');
  document.getElementById('lbl-annual').classList.toggle('on');
});


// ROLE TABS when unswitched


document.querySelectorAll('.r-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const role = tab.dataset.role;
    
    // Remove active from all tabs and panels
    document.querySelectorAll('.r-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.role-panel').forEach(p => p.classList.remove('active'));
    
    // Add active to clicked tab and corresponding panel
    tab.classList.add('active');
    document.querySelector(`[data-panel="${role}"]`)?.classList.add('active');
  });
});

// FAQ ACCORDION


document.querySelectorAll('.faq-q').forEach(question => {
  question.addEventListener('click', () => {
    const item = question.closest('.faq-item');
    
    // Close all other items
    document.querySelectorAll('.faq-item').forEach(i => {
      if (i !== item) i.classList.remove('open');
    });
    
    // Toggle current item
    item?.classList.toggle('open');
  });
});

async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  
  const defaultOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  // Add authorization header if token exists
  if (token) {
    defaultOptions.headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(`${APP_CONFIG.apiBase}${endpoint}`, {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers
      }
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
      }
      throw new Error(`API Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}
}

// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('OnlineSchool v' + APP_CONFIG.version + ' initialized');
  
  // Check if user is already logged in
  const authToken = localStorage.getItem('authToken');
  if (authToken) {
    // User is logged in, handle accordingly
  }
});

// Export for use in other modules
window.OnlineSchool = {
  apiCall,
  selectRole,
  handleLogin,
  handleSignup,
  switchAuthTab,
  logout,
  showNotification,
  redirectToDashboard,
  fillDemo,
  APP_CONFIG,
  DEMO_CREDENTIALS
};

// Make key functions globally available for onclick handlers
window.logout = logout;
window.apiCall = apiCall;
window.handleLogin = handleLogin;
window.handleSignup = handleSignup;
window.switchAuthTab = switchAuthTab;
window.showNotification = showNotification;
window.selectRole = selectRole;
window.fillDemo = fillDemo;
