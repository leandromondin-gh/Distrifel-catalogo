/**
 * Distribuidora LJ Norte - Catalog
 * Navigation, Search, Filter & View functionality
 */

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initMobileMenu();
    initSearch();
    initFilters();
    initViewToggle();
    initVariantSelection();
    initSmoothScroll();
    initLightbox();
});

// State
const state = {
    search: '',
    filters: {
        category: 'all',
        brand: 'all',
        type: 'all'
    }
};

/**
 * Navigation Scroll Effect
 */
function initNavigation() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.scrollY;
        
        // Add scrolled class
        navbar.classList.toggle('scrolled', currentScroll > 100);
        
        lastScroll = currentScroll;
    });
}

/**
 * Mobile Menu Toggle
 */
function initMobileMenu() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (!navToggle || !navMenu) return;
    
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('open');
        navToggle.classList.toggle('open');
        document.body.style.overflow = navMenu.classList.contains('open') ? 'hidden' : '';
    });
    
    // Close menu when clicking a link
    navMenu.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('open');
            navToggle.classList.remove('open');
            document.body.style.overflow = '';
        });
    });
    
    // Close on escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navMenu.classList.contains('open')) {
            navMenu.classList.remove('open');
            navToggle.classList.remove('open');
            document.body.style.overflow = '';
        }
    });
}

/**
 * Smooth Scroll
 */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (!targetElement) return;
            
            e.preventDefault();
            
            const navHeight = document.querySelector('.navbar')?.offsetHeight || 0;
            const targetPosition = targetElement.offsetTop - navHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        });
    });
}

/**
 * Search Functionality
 */
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClear');
    
    if (!searchInput) return;
    
    // Search input handler with debounce
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            state.search = e.target.value.toLowerCase().trim();
            filterProducts();
            
            // Show/hide clear button
            searchClear.classList.toggle('visible', state.search.length > 0);
        }, 200);
    });
    
    // Clear search
    searchClear.addEventListener('click', () => {
        searchInput.value = '';
        state.search = '';
        searchClear.classList.remove('visible');
        filterProducts();
        searchInput.focus();
    });
    
    // Focus search on Ctrl/Cmd + K
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            searchInput.focus();
            searchInput.select();
        }
    });
}

/**
 * Filter Dropdowns
 */
function initFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const clearFiltersBtn = document.getElementById('clearFilters');
    const resetFiltersBtn = document.getElementById('resetFilters');
    
    // Toggle dropdown menus
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const filterType = btn.dataset.filter;
            const menu = document.querySelector(`[data-menu="${filterType}"]`);
            
            // Close other menus
            document.querySelectorAll('.filter-menu.open').forEach(m => {
                if (m !== menu) m.classList.remove('open');
            });
            document.querySelectorAll('.filter-btn.active').forEach(b => {
                if (b !== btn) b.classList.remove('active');
            });
            
            // Toggle current menu
            menu.classList.toggle('open');
            btn.classList.toggle('active');
        });
    });
    
    // Filter option selection
    document.querySelectorAll('.filter-option').forEach(option => {
        option.addEventListener('click', () => {
            const menu = option.closest('.filter-menu');
            const filterType = menu.dataset.menu;
            const value = option.dataset.value;
            const btn = document.querySelector(`[data-filter="${filterType}"]`);
            
            // Update state
            state.filters[filterType] = value;
            
            // Update UI
            menu.querySelectorAll('.filter-option').forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            
            // Update button text
            let displayValue = value === 'all' ? (filterType === 'type' ? 'Todos' : 'Todas') : option.textContent.replace(/[💧🔥⚙️]/g, '').trim();
            btn.querySelector('.filter-value').textContent = displayValue;
            
            // Close menu
            menu.classList.remove('open');
            btn.classList.remove('active');
            
            // Apply filter
            filterProducts();
        });
    });
    
    // Close menus on outside click
    document.addEventListener('click', () => {
        document.querySelectorAll('.filter-menu.open').forEach(m => m.classList.remove('open'));
        document.querySelectorAll('.filter-btn.active').forEach(b => b.classList.remove('active'));
    });
    
    // Clear all filters
    const clearAll = () => {
        state.search = '';
        state.filters = { category: 'all', brand: 'all', type: 'all' };
        
        // Reset UI
        const searchInput = document.getElementById('searchInput');
        const searchClear = document.getElementById('searchClear');
        
        if (searchInput) searchInput.value = '';
        if (searchClear) searchClear.classList.remove('visible');
        
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.querySelector('.filter-value').textContent = btn.dataset.filter === 'type' ? 'Todos' : 'Todas';
        });
        
        document.querySelectorAll('.filter-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.value === 'all');
        });
        
        filterProducts();
    };
    
    if (clearFiltersBtn) clearFiltersBtn.addEventListener('click', clearAll);
    if (resetFiltersBtn) resetFiltersBtn.addEventListener('click', clearAll);
}

/**
 * Filter Products
 */
function filterProducts() {
    const products = document.querySelectorAll('.product-card, .product-card-v2');
    const noResults = document.getElementById('noResults');
    const productsGrid = document.getElementById('productsGrid');
    let visibleCount = 0;
    
    products.forEach(product => {
        const category = product.dataset.category;
        const brand = product.dataset.brand;
        const type = product.dataset.type;
        const name = product.dataset.name || '';
        
        // Check filters
        const matchesCategory = state.filters.category === 'all' || category === state.filters.category;
        const matchesBrand = state.filters.brand === 'all' || brand === state.filters.brand;
        const matchesType = state.filters.type === 'all' || type === state.filters.type;
        
        // Check search
        const matchesSearch = state.search === '' || 
            name.includes(state.search) ||
            category.includes(state.search) ||
            brand.includes(state.search) ||
            type.includes(state.search);
        
        const isVisible = matchesCategory && matchesBrand && matchesType && matchesSearch;
        
        product.classList.toggle('hidden', !isVisible);
        
        if (isVisible) visibleCount++;
    });
    
    // Update counter
    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount) resultsCount.textContent = visibleCount;
    
    // Show/hide no results message
    if (noResults) noResults.classList.toggle('visible', visibleCount === 0);
    if (productsGrid) productsGrid.style.display = visibleCount === 0 ? 'none' : '';
}

/**
 * View Toggle (Grid/List)
 */
function initViewToggle() {
    const viewBtns = document.querySelectorAll('.view-btn');
    const productsGrid = document.getElementById('productsGrid');
    
    viewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            
            // Update buttons
            viewBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update grid
            if (productsGrid) {
                productsGrid.classList.toggle('view-list', view === 'list');
            }
        });
    });
}

/**
 * Variant Selection & Price Update
 */
function initVariantSelection() {
    // Support both old and new card variants
    const variants = document.querySelectorAll('.variant[data-price], .card-variant[data-price]');
    
    variants.forEach(variant => {
        variant.addEventListener('click', () => {
            const card = variant.closest('.product-card, .product-card-v2');
            const variantsContainer = variant.closest('.product-variants, .card-variants');
            const priceElement = card.querySelector('.price-value');
            const price = variant.dataset.price;
            
            // Remove selected from siblings
            variantsContainer.querySelectorAll('.variant, .card-variant').forEach(v => {
                v.classList.remove('selected');
            });
            
            // Add selected to clicked
            variant.classList.add('selected');
            
            // Update price with animation
            priceElement.style.transform = 'scale(1.1)';
            priceElement.style.color = '#5ab8a5';
            priceElement.textContent = formatPrice(parseInt(price));
            
            setTimeout(() => {
                priceElement.style.transform = 'scale(1)';
                priceElement.style.color = '';
            }, 200);
        });
    });
    
    // Format initial prices
    document.querySelectorAll('.price-value').forEach(el => {
        const text = el.textContent;
        const match = text.match(/\$?([\d.,]+)/);
        
        if (match) {
            const cleanNumber = match[1].replace(/\./g, '').replace(',', '.');
            const number = parseFloat(cleanNumber);
            if (!isNaN(number)) {
                el.textContent = formatPrice(number);
            }
        }
    });
}

/**
 * Format number as Argentine Peso
 */
function formatPrice(number) {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(number);
}

// Initial count update
setTimeout(() => {
    const count = document.querySelectorAll('.product-card:not(.hidden), .product-card-v2:not(.hidden)').length;
    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount) resultsCount.textContent = count;
}, 100);

/**
 * Lightbox for Product Images
 */
function initLightbox() {
    const productImages = document.querySelectorAll('.product-image, .card-image');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    
    if (!lightbox) return;
    
    productImages.forEach(imageContainer => {
        imageContainer.addEventListener('click', () => {
            const img = imageContainer.querySelector('img');
            const card = imageContainer.closest('.product-card, .product-card-v2');
            const productName = card.querySelector('.product-name, .card-title')?.textContent || '';
            
            if (img) {
                lightboxImg.src = img.src;
                lightboxImg.alt = img.alt;
                lightboxCaption.textContent = productName;
                lightbox.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    });
    
    // Close on background click
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('active')) {
            closeLightbox();
        }
    });
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }
}

console.log('🔧 Distribuidora Distrifel - Catálogo cargado correctamente');
