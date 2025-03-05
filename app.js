// Initialize Telegram WebApp
let tg = window.Telegram.WebApp;
tg.expand();

// State management
let state = {
    cart: [],
    categories: [],
    products: [],
    user: null,
    isAssistantOpen: false,
    isLoading: false,
    currentCategory: null
};

// DOM Elements
const cartBtn = document.getElementById('cartBtn');
const cartModal = document.getElementById('cartModal');
const closeButton = document.querySelector('.close-button');
const cartItems = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');
const checkoutBtn = document.getElementById('checkoutBtn');
const toggleAssistant = document.getElementById('toggleAssistant');
const chatContainer = document.getElementById('chatContainer');
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendMessage = document.getElementById('sendMessage');
const categoryGrid = document.getElementById('categoryGrid');
const productGrid = document.getElementById('productGrid');

// Event Listeners
cartBtn.addEventListener('click', toggleCart);
closeButton.addEventListener('click', toggleCart);
checkoutBtn.addEventListener('click', handleCheckout);
toggleAssistant.addEventListener('click', toggleAssistant);
sendMessage.addEventListener('click', sendUserMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendUserMessage();
});

// Initialize the app
async function initApp() {
    try {
        showLoading();
        
        // Initialize Telegram WebApp
        tg.ready();
        
        // Set up theme
        setupTheme();
        
        // Load user data
        await loadUserData();
        
        // Load categories and products
        await Promise.all([
            loadCategories(),
            loadProducts()
        ]);
        
        // Initialize AI assistant
        initAssistant();
        
        // Update UI
        updateCartCount();
        renderCategories();
        renderProducts();
        
        hideLoading();
    } catch (error) {
        console.error('Error initializing app:', error);
        showError('Failed to load the store. Please try again later.');
    }
}

// Setup theme based on Telegram theme
function setupTheme() {
    const isDark = tg.colorScheme === 'dark';
    document.body.classList.toggle('dark-theme', isDark);
    
    // Update CSS variables based on theme
    const root = document.documentElement;
    if (isDark) {
        root.style.setProperty('--primary-color', '#ECF0F1');
        root.style.setProperty('--text-color', '#ECF0F1');
        root.style.setProperty('--light-gray', '#2C3E50');
        root.style.setProperty('--border-color', '#34495E');
    }
}

// Load user data from Telegram
async function loadUserData() {
    try {
        const initData = tg.initData;
        if (initData) {
            const response = await fetch('/api/user/telegram', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Telegram-Init-Data': initData
                }
            });
            
            if (response.ok) {
                state.user = await response.json();
            }
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// Load categories from backend
async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        if (!response.ok) throw new Error('Failed to load categories');
        state.categories = await response.json();
    } catch (error) {
        console.error('Error loading categories:', error);
        throw error;
    }
}

// Load products from backend
async function loadProducts(categoryId = null) {
    try {
        const url = categoryId 
            ? `/api/products?category_id=${categoryId}`
            : '/api/products';
            
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to load products');
        state.products = await response.json();
    } catch (error) {
        console.error('Error loading products:', error);
        throw error;
    }
}

// Render categories
function renderCategories() {
    categoryGrid.innerHTML = state.categories.map(category => `
        <div class="category-card ${state.currentCategory === category.id ? 'active' : ''}" 
             onclick="filterProducts(${category.id})">
            <img src="${category.image_url}" alt="${category.name}" loading="lazy">
            <h3>${category.name}</h3>
        </div>
    `).join('');
}

// Render products
function renderProducts(filteredProducts = state.products) {
    productGrid.innerHTML = filteredProducts.map(product => `
        <div class="product-card">
            <img src="${product.image_url}" alt="${product.name}" loading="lazy">
            <h3>${product.name}</h3>
            <p class="description">${product.description}</p>
            <div class="price">$${product.price.toFixed(2)}</div>
            <button onclick="addToCart(${product.id})" class="add-to-cart">
                Add to Cart
            </button>
        </div>
    `).join('');
}

// Filter products by category
async function filterProducts(categoryId) {
    try {
        showLoading();
        state.currentCategory = categoryId;
        await loadProducts(categoryId);
        renderCategories();
        renderProducts();
    } catch (error) {
        console.error('Error filtering products:', error);
        showError('Failed to filter products. Please try again.');
    } finally {
        hideLoading();
    }
}

// Cart functions
function addToCart(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = state.cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        state.cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image_url: product.image_url,
            quantity: 1
        });
    }

    updateCartCount();
    showNotification('Product added to cart');
    
    // Save cart to localStorage
    saveCart();
}

function updateCartCount() {
    const count = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelector('.cart-count').textContent = count;
}

function toggleCart() {
    cartModal.style.display = cartModal.style.display === 'block' ? 'none' : 'block';
    if (cartModal.style.display === 'block') {
        renderCart();
    }
}

function renderCart() {
    cartItems.innerHTML = state.cart.map(item => `
        <div class="cart-item">
            <img src="${item.image_url}" alt="${item.name}" loading="lazy">
            <div class="cart-item-details">
                <h4>${item.name}</h4>
                <div class="cart-item-quantity">
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                </div>
                <div class="price">$${(item.price * item.quantity).toFixed(2)}</div>
            </div>
        </div>
    `).join('');

    const total = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = `$${total.toFixed(2)}`;
}

function updateQuantity(productId, change) {
    const item = state.cart.find(item => item.id === productId);
    if (!item) return;

    item.quantity += change;
    if (item.quantity <= 0) {
        state.cart = state.cart.filter(item => item.id !== productId);
    }

    updateCartCount();
    renderCart();
    saveCart();
}

// Checkout handling
async function handleCheckout() {
    if (state.cart.length === 0) {
        showError('Your cart is empty');
        return;
    }

    try {
        showLoading();
        
        const response = await fetch('/api/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                items: state.cart,
                userId: state.user?.id
            })
        });

        if (!response.ok) throw new Error('Checkout failed');

        const result = await response.json();
        showPaymentOptions(result.paymentUrl);
    } catch (error) {
        console.error('Checkout error:', error);
        showError('Failed to process checkout. Please try again.');
    } finally {
        hideLoading();
    }
}

// AI Assistant functions
function initAssistant() {
    addMessage('assistant', 'Hello! I\'m your shopping assistant. How can I help you today?');
}

function toggleAssistant() {
    state.isAssistantOpen = !state.isAssistantOpen;
    chatContainer.style.display = state.isAssistantOpen ? 'block' : 'none';
    if (state.isAssistantOpen) {
        messageInput.focus();
    }
}

async function sendUserMessage() {
    const message = messageInput.value.trim();
    if (!message) return;

    addMessage('user', message);
    messageInput.value = '';

    try {
        const response = await fetch('/api/assistant', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });

        if (!response.ok) throw new Error('Failed to get assistant response');

        const result = await response.json();
        addMessage('assistant', result.response);
    } catch (error) {
        console.error('Assistant error:', error);
        addMessage('assistant', 'Sorry, I\'m having trouble processing your request.');
    }
}

function addMessage(sender, text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    messageDiv.textContent = text;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Utility functions
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function showError(message) {
    showNotification(message);
}

function showLoading() {
    state.isLoading = true;
    document.body.classList.add('loading');
}

function hideLoading() {
    state.isLoading = false;
    document.body.classList.remove('loading');
}

function showPaymentOptions(paymentUrl) {
    // Implement payment options UI
    window.location.href = paymentUrl;
}

// Local storage functions
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(state.cart));
}

function loadCart() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        state.cart = JSON.parse(savedCart);
        updateCartCount();
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    initApp();
}); 