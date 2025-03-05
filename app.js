// Initialize Telegram WebApp
const webApp = window.Telegram.WebApp;
webApp.ready();
webApp.expand();

// Setup theme
const setupTheme = () => {
    document.documentElement.style.setProperty('--background-color', webApp.backgroundColor);
    document.documentElement.style.setProperty('--text-color', webApp.textColor);
    if (webApp.colorScheme === 'dark') {
        document.documentElement.style.setProperty('--primary-color', '#ffffff');
        document.documentElement.style.setProperty('--secondary-color', '#000000');
        document.documentElement.style.setProperty('--accent-color', '#333333');
    }
};

// State management
let currentCategory = null;
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let isLoading = false;

// DOM Elements
const categoryGrid = document.getElementById('categoryGrid');
const productGrid = document.getElementById('productGrid');
const cartModal = document.getElementById('cartModal');
const cartItems = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');
const cartCount = document.querySelector('.cart-count');
const cartBtn = document.getElementById('cartBtn');
const closeBtn = document.querySelector('.close-button');
const checkoutBtn = document.getElementById('checkoutBtn');

// Mock data
const categories = [
    { id: 1, name: 'New Arrivals' },
    { id: 2, name: 'Outerwear' },
    { id: 3, name: 'Tops' },
    { id: 4, name: 'Bottoms' },
    { id: 5, name: 'Accessories' }
];

const products = [
    {
        id: 1,
        name: 'Oversized Down Jacket',
        price: 1200,
        image: 'https://via.placeholder.com/400x533',
        category: 2
    },
    {
        id: 2,
        name: 'Technical Cargo Pants',
        price: 450,
        image: 'https://via.placeholder.com/400x533',
        category: 4
    },
    {
        id: 3,
        name: 'Structured T-Shirt',
        price: 180,
        image: 'https://via.placeholder.com/400x533',
        category: 3
    },
    {
        id: 4,
        name: 'Utility Vest',
        price: 380,
        image: 'https://via.placeholder.com/400x533',
        category: 2
    }
];

// Render functions
const renderCategories = () => {
    categoryGrid.innerHTML = categories.map(category => `
        <button class="category-item ${currentCategory === category.id ? 'active' : ''}" 
                data-id="${category.id}">
            ${category.name}
        </button>
    `).join('');

    // Add event listeners
    categoryGrid.querySelectorAll('.category-item').forEach(button => {
        button.addEventListener('click', () => {
            const id = parseInt(button.dataset.id);
            currentCategory = currentCategory === id ? null : id;
            renderCategories();
            renderProducts();
        });
    });
};

const renderProducts = () => {
    const filteredProducts = currentCategory 
        ? products.filter(p => p.category === currentCategory)
        : products;

    productGrid.innerHTML = filteredProducts.map(product => `
        <div class="product-card">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" loading="lazy">
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-price">$${product.price}</p>
                <button class="add-to-cart" data-id="${product.id}">Add to Cart</button>
            </div>
        </div>
    `).join('');

    // Add event listeners
    productGrid.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', () => {
            const id = parseInt(button.dataset.id);
            addToCart(products.find(p => p.id === id));
        });
    });
};

const renderCart = () => {
    if (cart.length === 0) {
        cartItems.innerHTML = '<p>Your cart is empty</p>';
        cartTotal.textContent = '$0.00';
    } else {
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-image">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="cart-item-details">
                    <h4 class="cart-item-name">${item.name}</h4>
                    <p class="cart-item-price">$${item.price}</p>
                </div>
            </div>
        `).join('');

        const total = cart.reduce((sum, item) => sum + item.price, 0);
        cartTotal.textContent = `$${total.toFixed(2)}`;
    }
    cartCount.textContent = cart.length;
};

// Cart functions
const addToCart = (product) => {
    cart.push(product);
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
    webApp.HapticFeedback.impactOccurred('medium');
};

const clearCart = () => {
    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
};

// Event listeners
cartBtn.addEventListener('click', () => {
    cartModal.style.display = 'block';
    webApp.HapticFeedback.impactOccurred('light');
});

closeBtn.addEventListener('click', () => {
    cartModal.style.display = 'none';
});

checkoutBtn.addEventListener('click', () => {
    if (cart.length === 0) {
        webApp.HapticFeedback.notificationOccurred('error');
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    webApp.MainButton.text = `Pay $${total.toFixed(2)}`;
    webApp.MainButton.show();
    webApp.MainButton.onClick(() => {
        webApp.HapticFeedback.notificationOccurred('success');
        clearCart();
        cartModal.style.display = 'none';
        webApp.MainButton.hide();
    });
});

// Initialize
setupTheme();
renderCategories();
renderProducts();
renderCart(); 