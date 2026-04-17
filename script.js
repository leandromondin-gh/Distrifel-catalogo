/**
 * Distribuidora LJ Norte - Catalog
 * Navigation, Search, Filter & View functionality
 */

document.addEventListener('DOMContentLoaded', () => {
    loadCartFromStorage();
    initNavigation();
    initMobileMenu();
    initSearch();
    initFilters();
    initCategoryChips();
    initViewToggle();
    initVariantSelection();
    initSmoothScroll();
    initLightbox();
    initNamePopup();
    initCart();
    initClientPopup();
    initOfflineDetection();
    registerServiceWorker();
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

// Cart state
const cart = {
    items: [] // { id, name, variant, price, qty }
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

            // Sync category chips if category changed via dropdown
            if (filterType === 'category') {
                document.querySelectorAll('.category-chips .chip').forEach(c => {
                    c.classList.toggle('active', c.dataset.category === value);
                });
            }

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

        // Reset category chips
        document.querySelectorAll('.category-chips .chip').forEach(c => {
            c.classList.toggle('active', c.dataset.category === 'all');
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

/* ============================================================
   NAME POPUP
   ============================================================ */

function initNamePopup() {
    const overlay = document.getElementById('namePopupOverlay');
    const input = document.getElementById('salesRepName');
    const enterBtn = document.getElementById('popupEnterBtn');

    if (!overlay) return;

    const savedName = localStorage.getItem('distrifel_corredor');
    if (savedName) {
        applyCorrName(savedName);
        overlay.remove();
        return;
    }

    requestAnimationFrame(() => overlay.classList.add('visible'));
    setTimeout(() => input && input.focus(), 350);

    const handleEnter = () => {
        const name = input.value.trim();
        if (!name) {
            input.classList.add('popup-input-error');
            input.placeholder = 'Por favor ingresá tu nombre';
            setTimeout(() => {
                input.classList.remove('popup-input-error');
                input.placeholder = 'Tu nombre completo...';
            }, 2000);
            input.focus();
            return;
        }
        localStorage.setItem('distrifel_corredor', name);
        applyCorrName(name);
        overlay.classList.add('hiding');
        setTimeout(() => overlay.remove(), 350);
    };

    enterBtn.addEventListener('click', handleEnter);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleEnter(); });
}

function applyCorrName(name) {
    const navName = document.getElementById('navCorrName');
    const navCorredor = document.getElementById('navCorredor');
    const cartRep = document.getElementById('cartRepName');

    if (navName) navName.textContent = name;
    if (navCorredor) navCorredor.classList.add('visible');
    if (cartRep) cartRep.textContent = `Corredor: ${name}`;
}

/* ============================================================
   CART
   ============================================================ */

function initCart() {
    // Add qty selector + "Agregar" button to every product card
    document.querySelectorAll('.product-card-v2').forEach(card => {
        const cardContent = card.querySelector('.card-content');
        if (!cardContent) return;

        // Wrap info elements in .card-info-col for proper list-view layout
        if (!cardContent.querySelector('.card-info-col')) {
            const title = cardContent.querySelector('.card-title');
            const subtitle = cardContent.querySelector('.card-subtitle');
            const variants = cardContent.querySelector('.card-variants');
            if (title) {
                const wrapper = document.createElement('div');
                wrapper.className = 'card-info-col';
                title.parentNode.insertBefore(wrapper, title);
                wrapper.appendChild(title);
                if (subtitle) wrapper.appendChild(subtitle);
                if (variants) wrapper.appendChild(variants);
            }
        }

        // Quantity selector
        const qtyControl = document.createElement('div');
        qtyControl.className = 'card-qty-control';
        qtyControl.innerHTML = `
            <button type="button" class="card-qty-btn" data-action="dec" aria-label="Reducir cantidad">−</button>
            <span class="card-qty-value">1</span>
            <button type="button" class="card-qty-btn" data-action="inc" aria-label="Aumentar cantidad">+</button>
        `;

        const qtyValue = qtyControl.querySelector('.card-qty-value');
        qtyControl.querySelectorAll('.card-qty-btn').forEach(qBtn => {
            qBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                let qty = parseInt(qtyValue.textContent) || 1;
                qty = qBtn.dataset.action === 'inc' ? Math.min(99, qty + 1) : Math.max(1, qty - 1);
                qtyValue.textContent = qty;
            });
        });

        // Add to cart button
        const btn = document.createElement('button');
        btn.className = 'btn-add-cart';
        btn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16" aria-hidden="true">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            <span>Agregar al pedido</span>
        `;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const qty = parseInt(qtyValue.textContent) || 1;
            addToCart(card, btn, qty);
            qtyValue.textContent = '1';
        });

        cardContent.appendChild(qtyControl);
        cardContent.appendChild(btn);
    });

    document.getElementById('cartFloatBtn')?.addEventListener('click', openCart);
    document.getElementById('cartOverlay')?.addEventListener('click', closeCart);
    document.getElementById('cartClose')?.addEventListener('click', closeCart);

    document.getElementById('cartClearBtn')?.addEventListener('click', () => {
        if (cart.items.length === 0) return;
        if (confirm('¿Limpiar todo el pedido?')) {
            cart.items = [];
            updateCartUI();
        }
    });

    document.getElementById('cartSendWhatsApp')?.addEventListener('click', sendCartWhatsApp);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.body.classList.contains('cart-open')) closeCart();
    });

    // Render initial cart (from localStorage)
    updateCartUI();
}

function addToCart(card, btn, qty = 1) {
    const name = card.querySelector('.card-title')?.textContent.trim() || 'Producto';
    const selectedVariant = card.querySelector('.card-variant.selected');
    const priceEl = card.querySelector('.price-value');

    const variantText = selectedVariant ? selectedVariant.textContent.trim() : null;
    const priceStr = priceEl ? priceEl.textContent : '0';
    const price = parseInt(priceStr.replace(/[^\d]/g, '')) || 0;

    const cardKey = (card.dataset.name || name).replace(/\s+/g, '-');
    const itemId = `${cardKey}__${variantText || 'unico'}`;

    const existing = cart.items.find(i => i.id === itemId);
    if (existing) {
        existing.qty += qty;
    } else {
        cart.items.push({ id: itemId, cardKey, name, variant: variantText, price, qty });
    }

    updateCartUI();
    showToast(name, qty, variantText);
    bumpCart();

    // Visual feedback on button
    if (btn) {
        btn.classList.add('added');
        const span = btn.querySelector('span');
        const prev = span ? span.textContent : '';
        if (span) span.textContent = '¡Agregado!';
        setTimeout(() => {
            btn.classList.remove('added');
            if (span) span.textContent = prev;
        }, 1400);
    }
}

function showToast(name, qty, variant) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';

    const variantText = variant ? ` (${variant})` : '';
    toast.innerHTML = `
        <div class="toast-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" width="16" height="16">
                <polyline points="20 6 9 17 4 12"/>
            </svg>
        </div>
        <span class="toast-message">
            <span class="toast-qty-badge">x${qty}</span>${name}${variantText}
        </span>
    `;
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('visible'));

    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 500);
    }, 2600);
}

function bumpCart() {
    const cartBtn = document.getElementById('cartFloatBtn');
    const badge = document.getElementById('cartFloatBadge');

    if (cartBtn) {
        cartBtn.classList.remove('bumping');
        void cartBtn.offsetWidth;
        cartBtn.classList.add('bumping');
        setTimeout(() => cartBtn.classList.remove('bumping'), 600);
    }

    if (badge) {
        badge.classList.remove('popping');
        void badge.offsetWidth;
        badge.classList.add('popping');
        setTimeout(() => badge.classList.remove('popping'), 500);
    }
}

/* ============================================================
   LOCAL STORAGE PERSISTENCE
   ============================================================ */

function saveCartToStorage() {
    try {
        localStorage.setItem('distrifel_cart', JSON.stringify(cart.items));
    } catch (e) {
        console.warn('No se pudo guardar el carrito en localStorage', e);
    }
}

function loadCartFromStorage() {
    try {
        const stored = localStorage.getItem('distrifel_cart');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) cart.items = parsed;
        }
    } catch (e) {
        cart.items = [];
    }
}

/* ============================================================
   IN-CART INDICATOR ON PRODUCT CARDS
   ============================================================ */

function updateInCartBadges() {
    // Aggregate qty per card (by data-name attribute)
    const qtyByCard = {};
    cart.items.forEach(item => {
        const key = item.cardKey || item.id.split('-').slice(0, -1).join('-');
        qtyByCard[key] = (qtyByCard[key] || 0) + item.qty;
    });

    document.querySelectorAll('.product-card-v2').forEach(card => {
        const key = (card.dataset.name || '').replace(/\s+/g, '-');
        const qty = qtyByCard[key] || 0;
        const existingBadge = card.querySelector('.card-in-cart-badge');

        if (qty > 0) {
            card.classList.add('in-cart');
            if (!existingBadge) {
                const badge = document.createElement('div');
                badge.className = 'card-in-cart-badge';
                badge.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" width="11" height="11">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span>En pedido · x<span class="badge-qty">${qty}</span></span>
                `;
                card.appendChild(badge);
            } else {
                const qtyEl = existingBadge.querySelector('.badge-qty');
                if (qtyEl) qtyEl.textContent = qty;
            }
        } else {
            card.classList.remove('in-cart');
            if (existingBadge) existingBadge.remove();
        }
    });
}

/* ============================================================
   CATEGORY CHIPS
   ============================================================ */

function initCategoryChips() {
    const chips = document.querySelectorAll('.category-chips .chip');
    if (!chips.length) return;

    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            const category = chip.dataset.category;
            setCategory(category);
        });
    });
}

function setCategory(category) {
    state.filters.category = category;

    // Sync chips
    document.querySelectorAll('.category-chips .chip').forEach(c => {
        c.classList.toggle('active', c.dataset.category === category);
    });

    // Sync dropdown filter
    const dropdownOptions = document.querySelectorAll('[data-menu="category"] .filter-option');
    dropdownOptions.forEach(opt => {
        opt.classList.toggle('active', opt.dataset.value === category);
    });

    // Sync dropdown button text
    const filterBtn = document.querySelector('[data-filter="category"]');
    if (filterBtn) {
        const valueEl = filterBtn.querySelector('.filter-value');
        const activeOpt = document.querySelector(`[data-menu="category"] [data-value="${category}"]`);
        if (valueEl && activeOpt) {
            valueEl.textContent = category === 'all' ? 'Todas' : activeOpt.textContent.replace(/[💧🔥⚙️✨]/g, '').trim();
        }
    }

    filterProducts();
}

/* ============================================================
   CLIENT INFO POPUP (before WhatsApp send)
   ============================================================ */

function initClientPopup() {
    const overlay = document.getElementById('clientPopupOverlay');
    const closeBtn = document.getElementById('clientPopupClose');
    const cancelBtn = document.getElementById('clientBtnCancel');
    const sendBtn = document.getElementById('clientBtnSend');
    const nameInput = document.getElementById('clientName');

    if (!overlay) return;

    const close = () => {
        overlay.classList.remove('visible');
        document.body.classList.remove('client-popup-open');
    };

    closeBtn?.addEventListener('click', close);
    cancelBtn?.addEventListener('click', close);

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('visible')) close();
    });

    sendBtn?.addEventListener('click', () => {
        const clientName = nameInput.value.trim();
        const notes = document.getElementById('clientNotes').value;

        if (!clientName) {
            nameInput.classList.add('error');
            nameInput.focus();
            setTimeout(() => nameInput.classList.remove('error'), 1500);
            return;
        }

        const msg = buildWhatsAppMessage(clientName, notes);
        window.open(`https://wa.me/5491164639441?text=${encodeURIComponent(msg)}`, '_blank');

        // Clear client fields (not cart — cart persists until "Limpiar pedido")
        nameInput.value = '';
        document.getElementById('clientNotes').value = '';
        close();
        closeCart();
    });
}

function openClientPopup() {
    const overlay = document.getElementById('clientPopupOverlay');
    if (!overlay) return;
    overlay.classList.add('visible');
    document.body.classList.add('client-popup-open');
    setTimeout(() => document.getElementById('clientName')?.focus(), 300);
}

/* ============================================================
   SWIPE TO DELETE (cart items on touch)
   ============================================================ */

function attachSwipeToDelete(itemEl, itemId) {
    let startX = 0;
    let currentX = 0;
    let isSwipeActive = false;

    const onStart = (e) => {
        const touch = e.touches ? e.touches[0] : e;
        startX = touch.clientX;
        currentX = startX;
        isSwipeActive = true;
        itemEl.style.transition = 'none';
    };

    const onMove = (e) => {
        if (!isSwipeActive) return;
        const touch = e.touches ? e.touches[0] : e;
        currentX = touch.clientX;
        const diff = currentX - startX;
        if (diff < 0 && diff > -220) {
            itemEl.style.transform = `translateX(${diff}px)`;
            itemEl.style.opacity = String(1 + diff / 300);
        }
    };

    const onEnd = () => {
        if (!isSwipeActive) return;
        isSwipeActive = false;
        const diff = currentX - startX;
        itemEl.style.transition = '';

        if (diff < -100) {
            itemEl.classList.add('swipe-removing');
            setTimeout(() => removeCartItem(itemId), 280);
        } else {
            itemEl.style.transform = '';
            itemEl.style.opacity = '';
        }
    };

    itemEl.addEventListener('touchstart', onStart, { passive: true });
    itemEl.addEventListener('touchmove', onMove, { passive: true });
    itemEl.addEventListener('touchend', onEnd);
    itemEl.addEventListener('touchcancel', onEnd);
}

/* ============================================================
   OFFLINE DETECTION
   ============================================================ */

function initOfflineDetection() {
    const banner = document.createElement('div');
    banner.className = 'offline-banner';
    banner.textContent = '⚠ Sin conexión — seguís pudiendo armar el pedido, se enviará cuando vuelva la red';
    document.body.appendChild(banner);

    const update = () => {
        banner.classList.toggle('visible', !navigator.onLine);
    };

    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    update();
}

/* ============================================================
   SERVICE WORKER (offline support)
   ============================================================ */

function registerServiceWorker() {
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js')
                .then(() => console.log('📦 Service Worker registrado'))
                .catch(err => console.warn('Service Worker no se pudo registrar:', err));
        });
    }
}

function removeCartItem(id) {
    cart.items = cart.items.filter(i => i.id !== id);
    updateCartUI();
}

function changeItemQty(id, delta) {
    const item = cart.items.find(i => i.id === id);
    if (!item) return;
    item.qty = Math.max(1, item.qty + delta);
    updateCartUI();
}

function updateCartUI() {
    const itemsList = document.getElementById('cartItemsList');
    const emptyState = document.getElementById('cartEmptyState');
    const footer = document.getElementById('cartDrawerFooter');
    const totalEl = document.getElementById('cartTotalValue');
    const badge = document.getElementById('cartFloatBadge');

    const totalQty = cart.items.reduce((s, i) => s + i.qty, 0);
    const totalPrice = cart.items.reduce((s, i) => s + i.price * i.qty, 0);

    // Save to localStorage
    saveCartToStorage();

    // Update in-cart badges on product cards
    updateInCartBadges();

    // Cart float badge
    if (badge) {
        badge.textContent = totalQty;
        badge.style.display = totalQty > 0 ? 'flex' : 'none';
    }

    // Show/hide sections
    const hasItems = cart.items.length > 0;
    if (emptyState) emptyState.style.display = hasItems ? 'none' : 'flex';
    if (itemsList) itemsList.style.display = hasItems ? 'flex' : 'none';
    if (footer) footer.style.display = hasItems ? 'flex' : 'none';

    // Render items
    if (itemsList) {
        itemsList.innerHTML = cart.items.map(item => `
            <li class="cart-item" data-id="${item.id}">
                <div class="cart-item-info">
                    <span class="cart-item-name">${item.name}</span>
                    ${item.variant ? `<span class="cart-item-variant">${item.variant}</span>` : ''}
                    <span class="cart-item-price">${formatPrice(item.price)} c/u</span>
                </div>
                <div class="cart-item-controls">
                    <button class="cart-qty-btn" data-action="dec" data-id="${item.id}" aria-label="Reducir">−</button>
                    <span class="cart-item-qty">${item.qty}</span>
                    <button class="cart-qty-btn" data-action="inc" data-id="${item.id}" aria-label="Aumentar">+</button>
                    <button class="cart-remove-btn" data-id="${item.id}" aria-label="Eliminar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                        </svg>
                    </button>
                </div>
                <div class="cart-item-subtotal">${formatPrice(item.price * item.qty)}</div>
            </li>
        `).join('');

        itemsList.querySelectorAll('.cart-qty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const delta = btn.dataset.action === 'inc' ? 1 : -1;
                changeItemQty(btn.dataset.id, delta);
            });
        });

        itemsList.querySelectorAll('.cart-remove-btn').forEach(btn => {
            btn.addEventListener('click', () => removeCartItem(btn.dataset.id));
        });

        // Attach swipe-to-delete for touch devices
        itemsList.querySelectorAll('.cart-item').forEach(item => {
            attachSwipeToDelete(item, item.dataset.id);
        });
    }

    if (totalEl) totalEl.textContent = formatPrice(totalPrice);
}

function openCart() {
    document.getElementById('cartDrawer')?.classList.add('open');
    document.getElementById('cartOverlay')?.classList.add('visible');
    document.body.classList.add('cart-open');
}

function closeCart() {
    document.getElementById('cartDrawer')?.classList.remove('open');
    document.getElementById('cartOverlay')?.classList.remove('visible');
    document.body.classList.remove('cart-open');
}

function sendCartWhatsApp() {
    if (cart.items.length === 0) return;
    openClientPopup();
}

function buildWhatsAppMessage(clientName, notes) {
    const corredor = localStorage.getItem('distrifel_corredor') || 'Corredor';

    let msg = `Hola! Soy *${corredor}*.\n`;
    msg += `Paso el siguiente pedido de:\n`;
    msg += `👤 *Cliente:* ${clientName}\n\n`;
    msg += `📦 *PEDIDO DISTRIFEL*\n`;
    msg += `─────────────────────\n`;

    cart.items.forEach(item => {
        const v = item.variant ? ` (${item.variant})` : '';
        msg += `▪️ ${item.name}${v} x${item.qty} — ${formatPrice(item.price * item.qty)}\n`;
    });

    const total = cart.items.reduce((s, i) => s + i.price * i.qty, 0);
    msg += `─────────────────────\n`;
    msg += `💰 *Total estimado: ${formatPrice(total)}*`;

    if (notes && notes.trim()) {
        msg += `\n\n📝 *Comentarios:*\n${notes.trim()}`;
    }

    return msg;
}
