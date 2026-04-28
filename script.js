/**
 * Distribuidora LJ Norte - Catalog
 * Navigation, Search, Filter & View functionality
 */

// Siempre empezar desde arriba al cargar/refrescar
history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

document.addEventListener('DOMContentLoaded', () => {
    document.body.dataset.mode = APP_MODE;
    renderProducts();
    buildTypeFilter('all');
    initPromoBanner();
    loadCartFromStorage();
    initNavigation();
    initMobileMenu();
    initSearch();
    initFilters();
    initCategoryChips();
    initFilterSidebar();
    initAccordion();
    initViewToggle();
    initVariantSelection();
    initSmoothScroll();
    initLightbox();
    initNamePopup();
    initCart();
    initClientPopup();
    initOfflineDetection();
    initBrandCarousel();
    initOffersModal();
    registerServiceWorker();
});

// State
const state = {
    search: '',
    filters: {
        category: 'all',
        brand: 'all',
        type: 'all'
    },
    discountActive: false
};

const PRICE_MARKUP = window.PRICE_MARKUP || 1.20;

function getDisplayPrice(rawPrice) {
    return state.discountActive ? rawPrice : Math.round(rawPrice * PRICE_MARKUP);
}

function checkClientDiscount(name) {
    const clients = window.DISCOUNT_CLIENTS || [];
    return clients.some(c => c === name.toLowerCase().trim());
}

function refreshAllPrices() {
    document.querySelectorAll('.product-card-v2').forEach(card => {
        const priceEl  = card.querySelector('.price-value');
        if (!priceEl) return;
        const raw = parseInt(priceEl.dataset.rawPrice);
        if (!raw) return;
        priceEl.textContent = formatPrice(getDisplayPrice(raw));
    });
}

// Cart state
const cart = {
    items: [] // { id, name, variant, price, qty }
};

// App mode: 'corredor' (URL has ?corredores=1) or 'cliente' (default)
const APP_MODE = new URLSearchParams(location.search).has('corredores') ? 'corredor' : 'cliente';

/**
 * Navigation Scroll Effect
 */
function initNavigation() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 100);
    });

    const hero = document.querySelector('.hero');
    const homeBtn = document.getElementById('navHomeBtn');
    if (!hero) return;

    let heroHidden = false;
    let savedHeroHeight = 0;

    const hideHero = () => {
        if (heroHidden) return;
        heroHidden = true;
        savedHeroHeight = hero.offsetHeight;
        const curY = window.scrollY;
        hero.style.display = 'none';
        // Compensar: el catálogo sube en el DOM, ajustar scroll para que el usuario
        // vea exactamente el mismo contenido que antes
        window.scrollTo({ top: curY - savedHeroHeight, behavior: 'instant' });
        document.body.classList.add('past-hero');
    };

    const showHero = () => {
        const scrollBeforeShow = window.scrollY; // capturar ANTES del layout change
        heroHidden = false;
        hero.style.display = '';
        document.body.classList.remove('past-hero');
        // Compensar: hero volvió, el contenido bajó savedHeroHeight → ajustar para mismo punto visual
        window.scrollTo({ top: scrollBeforeShow + savedHeroHeight, behavior: 'instant' });
        // Luego scroll suave al tope
        requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    };

    // Ocultar cuando el hero fue completamente scrolleado fuera del viewport
    window.addEventListener('scroll', () => {
        if (!heroHidden && window.scrollY >= hero.offsetTop + hero.offsetHeight) {
            hideHero();
        }
    }, { passive: true });

    // Ocultar también al click en "Ver Catálogo" o en una marca del carousel
    document.addEventListener('click', (e) => {
        const trigger = e.target.closest('a[href="#catalogo"], .brand-btn');
        if (trigger && !heroHidden) {
            // Pequeño delay para que el scroll empiece antes de ocultar
            setTimeout(hideHero, 200);
        }
    });

    homeBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        showHero();
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
 * Filter Sidebar — always-visible lists (no dropdowns)
 */
function initFilters() {
    const clearFiltersBtn = document.getElementById('clearFilters');
    const resetFiltersBtn = document.getElementById('resetFilters');

    document.querySelectorAll('.filter-option').forEach(option => {
        option.addEventListener('click', () => {
            const menu = option.closest('.filter-menu');
            const filterType = menu.dataset.menu;
            const value = option.dataset.value;

            state.filters[filterType] = value;
            menu.querySelectorAll('.filter-option').forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            updateAccordionBadge(filterType, value, option.dataset.label || option.textContent.trim());
            filterProducts();
        });
    });

    const clearAll = () => {
        state.search = '';
        state.filters = { category: 'all', brand: 'all', type: 'all' };

        const searchInput = document.getElementById('searchInput');
        const searchClear = document.getElementById('searchClear');
        if (searchInput) searchInput.value = '';
        if (searchClear) searchClear.classList.remove('visible');

        document.querySelectorAll('.filter-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.value === 'all');
        });

        document.querySelectorAll('.category-chips .chip').forEach(c => {
            c.classList.toggle('active', c.dataset.category === 'all');
        });

        // Reset accordion badges a "Todas"/"Todos"
        ['brand', 'type', 'category'].forEach(t => updateAccordionBadge(t, 'all', ''));

        filterProducts();
    };

    if (clearFiltersBtn) clearFiltersBtn.addEventListener('click', clearAll);
    if (resetFiltersBtn) resetFiltersBtn.addEventListener('click', clearAll);
}

/**
 * Filter Sidebar — toggle en desktop + drawer en mobile
 */
function initFilterSidebar() {
    const layout = document.querySelector('.catalog-layout');
    const sidebar = document.getElementById('filterSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const toggleBtn = document.getElementById('filterToggleBtn');
    const closeBtn = document.getElementById('sidebarClose');

    const isMobile = () => window.innerWidth < 1024;

    const open = () => {
        if (isMobile()) {
            sidebar?.classList.add('open');
            overlay?.classList.add('visible');
            document.body.classList.add('sidebar-open');
        } else {
            layout?.classList.remove('sidebar-collapsed');
        }
    };

    const close = () => {
        if (isMobile()) {
            sidebar?.classList.remove('open');
            overlay?.classList.remove('visible');
            document.body.classList.remove('sidebar-open');
        } else {
            layout?.classList.add('sidebar-collapsed');
        }
    };

    const toggle = () => {
        if (isMobile()) {
            sidebar?.classList.contains('open') ? close() : open();
        } else {
            layout?.classList.contains('sidebar-collapsed') ? open() : close();
        }
    };

    toggleBtn?.addEventListener('click', toggle);
    closeBtn?.addEventListener('click', close);
    overlay?.addEventListener('click', close);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && (sidebar?.classList.contains('open') || layout?.classList.contains('sidebar-collapsed') === false)) {
            close();
        }
    });
}

/**
 * Sidebar accordion — toggle + badge con filtro activo
 */
function initAccordion() {
    document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
            header.closest('.accordion-section')?.classList.toggle('expanded');
        });
    });
}

const ACCORDION_DEFAULTS = { category: 'Todas', brand: 'Todas', type: 'Todos' };

function updateAccordionBadge(filterType, value, label) {
    const badge = document.querySelector(`.accordion-badge[data-section="${filterType}"]`);
    if (!badge) return;
    badge.textContent = (value === 'all' || !value)
        ? ACCORDION_DEFAULTS[filterType]
        : label;
    badge.classList.add('active');
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
            const rawPrice = parseInt(price);
            priceElement.dataset.rawPrice = rawPrice;
            priceElement.style.transform = 'scale(1.1)';
            priceElement.style.color = '#5ab8a5';
            priceElement.textContent = formatPrice(getDisplayPrice(rawPrice));
            
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

    // ALWAYS wire the enter button — works for both first entry and future edits
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
        const key = APP_MODE === 'corredor' ? 'distrifel_corredor' : 'distrifel_cliente';
        localStorage.setItem(key, name);
        applyCorrName(name);
        hideNamePopup();
        wireNameEdit();
    };

    enterBtn.addEventListener('click', handleEnter);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleEnter(); });

    const storageKey = APP_MODE === 'corredor' ? 'distrifel_corredor' : 'distrifel_cliente';
    const savedName = localStorage.getItem(storageKey);

    // Cliente mode: never show the initial popup (user identifies when sending)
    if (APP_MODE === 'cliente') {
        if (savedName) applyCorrName(savedName);
        hideNamePopup();
        wireNameEdit();
        return;
    }

    // Corredor mode: show popup only if no name saved
    if (savedName) {
        applyCorrName(savedName);
        hideNamePopup();
        wireNameEdit();
        return;
    }

    // First-time corredor: adapt texts and show popup
    const title = overlay.querySelector('.popup-title');
    const subtitle = overlay.querySelector('.popup-subtitle');
    if (title) title.innerHTML = '🚚 Modo Corredor';
    if (subtitle) subtitle.textContent = 'Ingresá tu nombre para iniciar tu jornada';
    if (input) input.placeholder = 'Tu nombre (ej: Leandro M.)';

    overlay.style.display = 'flex';
    requestAnimationFrame(() => overlay.classList.add('visible'));
    setTimeout(() => input && input.focus(), 350);

    wireNameEdit();
}

function hideNamePopup() {
    const overlay = document.getElementById('namePopupOverlay');
    if (!overlay) return;
    overlay.classList.add('hiding');
    setTimeout(() => {
        overlay.classList.remove('visible', 'hiding');
        overlay.style.display = 'none';
    }, 350);
    document.body.classList.remove('name-popup-open');
}

function wireNameEdit() {
    const navCorredor = document.getElementById('navCorredor');
    const closeBtn = document.getElementById('namePopupClose');

    if (navCorredor && !navCorredor.dataset.editWired) {
        // Add pencil icon next to name (once)
        const existingEdit = navCorredor.querySelector('.nav-corredor-edit');
        if (!existingEdit) {
            const pencil = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            pencil.setAttribute('class', 'nav-corredor-edit');
            pencil.setAttribute('viewBox', '0 0 24 24');
            pencil.setAttribute('fill', 'none');
            pencil.setAttribute('stroke', 'currentColor');
            pencil.setAttribute('stroke-width', '2');
            pencil.setAttribute('width', '12');
            pencil.setAttribute('height', '12');
            pencil.setAttribute('aria-hidden', 'true');
            pencil.innerHTML = '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4L16.5 3.5z"/>';
            navCorredor.appendChild(pencil);
        }

        navCorredor.addEventListener('click', openEditNamePopup);
        navCorredor.title = 'Click para editar tu nombre';
        navCorredor.dataset.editWired = '1';
    }

    if (closeBtn && !closeBtn.dataset.wired) {
        closeBtn.addEventListener('click', hideNamePopup);
        closeBtn.dataset.wired = '1';
    }

    // Click outside to close (only when editing)
    const overlay = document.getElementById('namePopupOverlay');
    if (overlay && !overlay.dataset.outsideWired) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay && overlay.dataset.mode === 'edit') {
                hideNamePopup();
            }
        });
        overlay.dataset.outsideWired = '1';
    }
}

function openEditNamePopup() {
    const overlay = document.getElementById('namePopupOverlay');
    if (!overlay) return;

    const input = document.getElementById('salesRepName');
    const title = overlay.querySelector('.popup-title');
    const subtitle = overlay.querySelector('.popup-subtitle');
    const enterText = overlay.querySelector('.popup-enter-text');
    const closeBtn = document.getElementById('namePopupClose');

    const key = APP_MODE === 'corredor' ? 'distrifel_corredor' : 'distrifel_cliente';
    const currentName = localStorage.getItem(key) || '';

    if (input) input.value = currentName;
    if (title) title.innerHTML = '✏️ Cambiar nombre';
    if (subtitle) {
        subtitle.textContent = APP_MODE === 'corredor'
            ? 'Actualizá tu nombre de corredor'
            : 'Actualizá tu nombre';
    }
    if (enterText) enterText.textContent = 'Guardar';
    if (closeBtn) closeBtn.style.display = 'flex';

    overlay.dataset.mode = 'edit';
    overlay.style.display = 'flex';
    document.body.classList.add('name-popup-open');
    requestAnimationFrame(() => overlay.classList.add('visible'));
    setTimeout(() => {
        input?.focus();
        input?.select();
    }, 300);
}

function applyCorrName(name) {
    const navName = document.getElementById('navCorrName');
    const navCorredor = document.getElementById('navCorredor');
    const cartRep = document.getElementById('cartRepName');

    if (navName) navName.textContent = name;
    if (navCorredor) navCorredor.classList.add('visible');

    // Descuento por cliente
    const wasActive = state.discountActive;
    state.discountActive = checkClientDiscount(name);
    if (state.discountActive !== wasActive) refreshAllPrices();

    // Banner premium en el carrito
    const banner = document.getElementById('cartPremiumBanner');
    const bannerText = document.getElementById('cartPremiumText');
    if (banner) {
        banner.style.display = state.discountActive ? 'flex' : 'none';
        if (bannerText && state.discountActive) {
            bannerText.textContent = `${name} · Cliente Premium — -20% aplicado`;
        }
    }

    // Badge de descuento activo en el nav
    const existingBadge = navCorredor?.querySelector('.discount-badge');
    if (state.discountActive && navCorredor && !existingBadge) {
        const badge = document.createElement('span');
        badge.className = 'discount-badge';
        badge.textContent = '-20%';
        navCorredor.appendChild(badge);
    } else if (!state.discountActive && existingBadge) {
        existingBadge.remove();
    }

    if (APP_MODE === 'corredor') {
        const svg = navCorredor?.querySelector('svg');
        if (svg && !svg.dataset.truckified) {
            svg.setAttribute('viewBox', '0 0 24 24');
            svg.innerHTML = '<path d="M1 3h13v13H1z"/><path d="M14 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/>';
            svg.dataset.truckified = '1';
        }
        if (cartRep) cartRep.textContent = `🚚 Corredor: ${name}`;
    } else {
        if (cartRep) cartRep.textContent = `Cliente: ${name}`;
    }
}

/* ============================================================
   CART
   ============================================================ */

function initCart() {
    // Set initial cart drawer label based on mode
    const cartRep = document.getElementById('cartRepName');
    if (cartRep) {
        cartRep.textContent = APP_MODE === 'corredor' ? '🚚 Corredor: —' : 'Cliente: —';
    }

    // Add qty selector + "Agregar" button to every product card
    document.querySelectorAll('.product-card-v2').forEach(card => {
        const cardContent = card.querySelector('.card-content');
        if (!cardContent) return;

        // Wrap info elements in .card-info-col (includes card-list-meta for list view)
        if (!cardContent.querySelector('.card-info-col')) {
            const meta = cardContent.querySelector('.card-list-meta');
            const title = cardContent.querySelector('.card-title');
            const subtitle = cardContent.querySelector('.card-subtitle');
            const variants = cardContent.querySelector('.card-variants');
            if (title) {
                const wrapper = document.createElement('div');
                wrapper.className = 'card-info-col';
                title.parentNode.insertBefore(wrapper, meta || title);
                if (meta) wrapper.appendChild(meta);
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
            <input type="number" class="card-qty-value" inputmode="numeric" min="1" max="999" value="1">
            <button type="button" class="card-qty-btn" data-action="inc" aria-label="Aumentar cantidad">+</button>
        `;

        const qtyValue = qtyControl.querySelector('.card-qty-value');
        // Solo números, mínimo 1
        qtyValue.addEventListener('input', () => {
            qtyValue.value = qtyValue.value.replace(/[^\d]/g, '');
        });
        qtyValue.addEventListener('blur', () => {
            const v = parseInt(qtyValue.value) || 1;
            qtyValue.value = Math.max(1, Math.min(999, v));
        });
        qtyValue.addEventListener('click', (e) => e.stopPropagation());

        qtyControl.querySelectorAll('.card-qty-btn').forEach(qBtn => {
            qBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                let qty = parseInt(qtyValue.value) || 1;
                qty = qBtn.dataset.action === 'inc' ? Math.min(999, qty + 1) : Math.max(1, qty - 1);
                qtyValue.value = qty;
            });
        });

        // Add to cart button
        const btn = document.createElement('button');
        btn.className = 'btn-add-cart';
        btn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16" aria-hidden="true">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
            </svg>
            <span>Agregar</span>
        `;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const qty = parseInt(qtyValue.value) || 1;
            addToCart(card, btn, qty);
            qtyValue.value = '1';
        });

        // Wrap price + (qty+btn row) in action panel
        const cardPrice = cardContent.querySelector('.card-price');
        if (cardPrice) {
            const actionPanel = document.createElement('div');
            actionPanel.className = 'card-action-panel';

            // Qty + btn in a dedicated row div
            const qtyBtnRow = document.createElement('div');
            qtyBtnRow.className = 'card-qty-btn-row';
            qtyBtnRow.appendChild(qtyControl);
            qtyBtnRow.appendChild(btn);

            cardContent.insertBefore(actionPanel, cardPrice);
            actionPanel.appendChild(cardPrice);
            actionPanel.appendChild(qtyBtnRow);
        } else {
            cardContent.appendChild(qtyControl);
            cardContent.appendChild(btn);
        }
    });

    document.getElementById('cartFloatBtn')?.addEventListener('click', openCart);
    document.getElementById('cartOverlay')?.addEventListener('click', closeCart);
    document.getElementById('cartOverlay')?.addEventListener('touchend', closeCart);
    document.getElementById('cartClose')?.addEventListener('click', closeCart);
    document.getElementById('cartClose')?.addEventListener('touchend', closeCart);

    document.getElementById('cartClearBtn')?.addEventListener('click', () => {
        if (cart.items.length === 0) return;
        openConfirm(() => {
            cart.items = [];
            updateCartUI();
        });
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

    // Detectar si este producto+variante tiene una oferta activa
    const offer = (window.DISTRIFEL_OFFERS || []).find(o =>
        o.title.toLowerCase().trim() === name.toLowerCase().trim() &&
        o.variant.toLowerCase().trim() === (variantText || '').toLowerCase().trim()
    );

    const existing = cart.items.find(i => i.id === itemId);
    let item;
    if (existing) {
        existing.qty += qty;
        item = existing;
    } else {
        item = { id: itemId, cardKey, name, variant: variantText, price, qty };
        cart.items.push(item);
    }

    // Si hay oferta, agregar metadata y recalcular precio según qty
    if (offer) {
        const realFinal = Math.round(offer.originalPrice * (1 - offer.discount / 100));
        item.isOffer        = true;
        item.originalPrice  = getDisplayPrice(offer.originalPrice);
        item.discountedPrice = getDisplayPrice(realFinal);
        item.boxQty         = offer.boxQty;
        item.price          = item.qty >= offer.boxQty ? item.discountedPrice : item.originalPrice;
    }

    updateCartUI();
    showToast(name, qty, variantText);
    bumpCart();

    // Visual feedback on button: pulse + icon swap (cart → check), no color change
    if (btn) {
        btn.classList.add('added');
        const span = btn.querySelector('span');
        const svg = btn.querySelector('svg');
        const prevText = span ? span.textContent : '';
        const prevSvg = svg ? svg.innerHTML : '';

        if (span) {
            span.dataset.addedState = '1';
            span.textContent = '¡Agregado!';
        }
        if (svg) svg.innerHTML = '<polyline points="20 6 9 17 4 12"/>';

        setTimeout(() => {
            btn.classList.remove('added');
            if (span) {
                delete span.dataset.addedState;
                span.textContent = prevText;
            }
            if (svg) svg.innerHTML = prevSvg;
            // Re-sync button label with in-cart state after animation
            updateInCartBadges();
        }, 1100);
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
        const key = item.cardKey || (item.id || '').split('__')[0];
        qtyByCard[key] = (qtyByCard[key] || 0) + item.qty;
    });

    document.querySelectorAll('.product-card-v2').forEach(card => {
        const key = (card.dataset.name || '').replace(/\s+/g, '-');
        const qty = qtyByCard[key] || 0;

        // Remove legacy floating badge if present
        const legacyBadge = card.querySelector('.card-in-cart-badge');
        if (legacyBadge) legacyBadge.remove();

        // Badge carrito top-right del card
        let badge = card.querySelector('.card-in-cart-qty');

        if (qty > 0) {
            card.classList.add('in-cart');

            if (!badge) {
                badge = document.createElement('div');
                badge.className = 'card-in-cart-qty';
                badge.innerHTML = `
                    <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14" aria-hidden="true">
                        <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
                    </svg>
                    <span class="inline-qty">${qty}</span>
                `;
                card.appendChild(badge);
            } else {
                const qtyEl = badge.querySelector('.inline-qty');
                if (qtyEl) qtyEl.textContent = qty;
            }

            // Update button label to "Agregar más"
            const btn = card.querySelector('.btn-add-cart span');
            if (btn && !btn.dataset.addedState) btn.textContent = 'Agregar';
        } else {
            card.classList.remove('in-cart');
            if (badge) badge.remove();

            // Reset button label
            const btn = card.querySelector('.btn-add-cart span');
            if (btn && !btn.dataset.addedState) btn.textContent = 'Agregar';
        }
    });
}

/* ============================================================
   CATEGORY CHIPS
   ============================================================ */

function initCategoryChips() {
    // Badges iniciales
    updateAccordionBadge('category', 'all', '');
    updateAccordionBadge('brand', 'all', '');
    updateAccordionBadge('type', 'all', '');

    const chips = document.querySelectorAll('.category-chips .chip');
    if (!chips.length) return;

    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            const category = chip.dataset.category;
            const label = chip.querySelector('span:last-child')?.textContent.trim() || '';
            setCategory(category);
            updateAccordionBadge('category', category, label);
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
            valueEl.textContent = category === 'all' ? 'Todas' : activeOpt.textContent.replace(/[💧🔥⚙️✨🧰]/g, '').trim();
        }
    }

    // Actualizar filtro de tipo según la categoría seleccionada
    buildTypeFilter(category);

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
        const clientName   = nameInput.value.trim();
        const phone        = document.getElementById('clientPhone')?.value.trim() || '';
        const email        = document.getElementById('clientEmail')?.value.trim() || '';
        const business     = document.getElementById('clientBusiness')?.value.trim() || '';
        const localidad    = document.getElementById('clientLocalidad')?.value.trim() || '';
        const notes        = document.getElementById('clientNotes')?.value.trim() || '';

        // Solo nombre es requerido
        if (!clientName) {
            nameInput.classList.add('error');
            nameInput.focus();
            setTimeout(() => nameInput.classList.remove('error'), 1500);
            return;
        }

        // Persist cliente info
        if (APP_MODE === 'cliente') {
            localStorage.setItem('distrifel_cliente', clientName);
            if (phone) localStorage.setItem('distrifel_cliente_phone', phone);
            applyCorrName(clientName);
        }

        const msg = APP_MODE === 'cliente'
            ? buildClienteMessage(clientName, phone, email, business, localidad, notes)
            : buildCorredorMessage(clientName, notes);

        window.open(`https://wa.me/5491164639441?text=${encodeURIComponent(msg)}`, '_blank');

        // Clear only the "notes" field (keep name+phone pre-filled for next time)
        if (notesInput) notesInput.value = '';
        close();
        closeCart();
    });
}

function openClientPopup() {
    const overlay = document.getElementById('clientPopupOverlay');
    if (!overlay) return;

    const title = overlay.querySelector('.client-popup-title');
    const subtitle = overlay.querySelector('.client-popup-subtitle');
    const nameLabel = overlay.querySelector('label[for="clientName"]');
    const nameInput = document.getElementById('clientName');
    const phoneField = document.getElementById('clientPhoneField');
    const phoneInput = document.getElementById('clientPhone');
    const notesLabel = overlay.querySelector('label[for="clientNotes"]');
    const notesInput = document.getElementById('clientNotes');

    const phoneEmailRow       = overlay.querySelector('#clientPhoneEmailRow');
    const businessLocalidadRow = overlay.querySelector('#clientBusinessLocalidadRow');

    if (APP_MODE === 'corredor') {
        if (title) title.textContent = 'Datos del cliente';
        if (subtitle) subtitle.textContent = 'Completá la información antes de enviar el pedido al depósito';
        if (nameLabel) nameLabel.innerHTML = 'Nombre del cliente <span class="client-required">*</span>';
        if (nameInput) { nameInput.placeholder = 'Ej: Ferretería López'; nameInput.autocomplete = 'off'; }
        if (phoneEmailRow) phoneEmailRow.style.display = 'none';
        if (businessLocalidadRow) businessLocalidadRow.style.display = 'none';
        if (notesInput) notesInput.placeholder = 'Ej: entregar en la mañana, traer caja cerrada';
    } else {
        if (title) title.textContent = 'Finalizar pedido';
        if (subtitle) subtitle.textContent = 'Completá tus datos para coordinar la entrega';
        if (nameLabel) nameLabel.innerHTML = 'Nombre <span class="client-required">*</span>';
        if (nameInput) {
            nameInput.placeholder = 'Ej: Juan García';
            nameInput.autocomplete = 'name';
            const saved = localStorage.getItem('distrifel_cliente');
            if (saved && !nameInput.value) nameInput.value = saved;
        }
        if (phoneEmailRow) phoneEmailRow.style.display = 'grid';
        if (phoneInput) {
            const savedPhone = localStorage.getItem('distrifel_cliente_phone');
            if (savedPhone && !phoneInput.value) phoneInput.value = savedPhone;
        }
        if (businessLocalidadRow) businessLocalidadRow.style.display = 'grid';
        if (notesInput) notesInput.placeholder = 'Ej: entregar a la mañana, paga en efectivo';
    }

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

/* ============================================================
   PRODUCT RENDERING (from window.DISTRIFEL_PRODUCTS)
   ============================================================ */

const BRAND_LOGOS = {
    alarsa:     'Brands-icons/alarsa.png',
    latyn:      'Brands-icons/latyn-flex.png',
    paz:        'Brands-icons/paz.png',
    duke:       'Brands-icons/duke.png',
    canplast:   'Brands-icons/canplast.png',
    aislatech:  'Brands-icons/aislatech.jpg',
    covertex:   'Brands-icons/covertex.png',
    salustri:   'Brands-icons/salustri.png',
    smartfix:   'Brands-icons/smartfix.webp',
    tcoat:      'Brands-icons/t-coat.png'
};

const BRAND_NAMES = {
    alarsa: 'Alarsa', latyn: 'Latynflex', canplast: 'Canplast',
    salustri: 'Salustri', paz: 'PAZ', duke: 'Duke', tcoat: 'T-Coat',
    covertex: 'Covertex', aislatech: 'Aislatech', cirino: 'Cirino',
    espumafoam: 'Espuma Foam', smartfix: 'Smart-Fix'
};

const CATEGORY_LABELS = {
    agua: 'Agua', gas: 'Gas', otros: 'Otros'
};

const CATEGORY_TAG_CLASS = {
    agua: 'tag-agua', gas: 'tag-gas', otros: 'tag-otros'
};

const TYPE_LABELS = {
    flexible:      'Flexible',
    regulador:     'Regulador',
    accesorio:     'Accesorio',
    membrana:      'Membrana',
    aislante:      'Aislante',
    'bronce-roscado': 'Bronce Roscado',
    canilla:       'Canilla',
    fasion:        'Fasión',
    flotante:      'Flotante',
    fuelle:        'Fuelle',
    fusion:        'Fusión',
    gabinete:      'Gabinete',
    'hidro-bronce':'Hidro Bronce',
    'llave-gas':   'Llave de Gas',
    montura:       'Montura',
    otros:         'Otros',
    puerta:        'Puerta',
    pilar:         'Pilar',
    reja:          'Reja',
    sopapa:        'Sopapa',
    tapa:          'Tapa',
    terraja:       'Terraja',
    tubo:          'Tubo',
    valvula:       'Válvula',
};

function buildTypeFilter(category) {
    const menu = document.getElementById('typeFilterMenu');
    if (!menu) return;

    const products = window.DISTRIFEL_PRODUCTS || [];

    // Tipos disponibles para la categoría seleccionada
    const types = [...new Set(
        products
            .filter(p => category === 'all' || p.category === category)
            .map(p => p.type)
            .filter(Boolean)
    )].sort((a, b) => (TYPE_LABELS[a] || a).localeCompare(TYPE_LABELS[b] || b));

    menu.innerHTML = `<button class="filter-option active" data-value="all" data-label="Todos">Todos</button>` +
        types.map(t =>
            `<button class="filter-option" data-value="${escapeHtml(t)}" data-label="${escapeHtml(TYPE_LABELS[t] || t)}">${escapeHtml(TYPE_LABELS[t] || t)}</button>`
        ).join('');

    // Re-registrar click handlers
    menu.querySelectorAll('.filter-option').forEach(opt => {
        opt.addEventListener('click', () => {
            menu.querySelectorAll('.filter-option').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            state.filters.type = opt.dataset.value;
            updateAccordionBadge('type', opt.dataset.value, opt.dataset.label || opt.textContent.trim());
            filterProducts();
        });
    });

    // Resetear tipo activo si ya no existe en la nueva lista
    if (state.filters.type !== 'all' && !types.includes(state.filters.type)) {
        state.filters.type = 'all';
        updateAccordionBadge('type', 'all', '');
    }
}

function escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function placeholderImg(title) {
    const txt = encodeURIComponent((title || 'Producto').slice(0, 20));
    return `https://placehold.co/400x300/f0fdf9/2d8a78?text=${txt}`;
}

function renderProducts() {
    const container = document.getElementById('productsGrid');
    const products = window.DISTRIFEL_PRODUCTS;
    if (!container || !Array.isArray(products)) return;

    container.innerHTML = '';

    const fragment = document.createDocumentFragment();
    for (const p of products) {
        const card = document.createElement('article');
        card.className = 'product-card-v2';
        card.dataset.category = p.category || 'otros';
        card.dataset.brand = p.brand || '';
        card.dataset.type = p.type || '';
        card.dataset.name = p.searchName || p.title.toLowerCase();

        // Prices
        const prices = p.variants.map(v => v.price).filter(n => n > 0);
        const firstPrice = p.variants[0]?.price || 0;
        const minPrice = prices.length ? Math.min(...prices) : 0;
        const maxPrice = prices.length ? Math.max(...prices) : 0;
        const showDesde = prices.length > 1 && minPrice !== maxPrice;

        // Mostrar todas las variantes (sin truncar con "···")
        let variantsHtml = '';
        if (p.variants.length > 1) {
            const vItems = p.variants.map((v, idx) => {
                const label = v.desc || v.code || 'Único';
                return `<span class="card-variant${idx === 0 ? ' selected' : ''}" data-price="${v.price || 0}" data-code="${escapeHtml(v.code)}">${escapeHtml(label)}</span>`;
            }).join('');

            variantsHtml = `<div class="card-variants">${vItems}</div>`;
        }

        // Image
        const imgSrc = p.image || placeholderImg(p.title);
        const fallback = placeholderImg(p.title);

        // Category tag
        const tagClass = CATEGORY_TAG_CLASS[p.category] || 'tag-otros';
        const tagLabel = CATEGORY_LABELS[p.category] || 'Otros';

        // Brand (only show logo if we have it locally)
        const brandHtml = (p.brand && BRAND_LOGOS[p.brand])
            ? `<div class="card-brand"><img src="${BRAND_LOGOS[p.brand]}" alt="${escapeHtml(p.brand)}"></div>`
            : '';

        const brandName = p.brand ? (BRAND_NAMES[p.brand] || p.brand) : '';

        card.innerHTML = `
            <div class="card-header">
                ${brandHtml}
            </div>
            <div class="card-content">
                <div class="card-image">
                    <img src="${imgSrc}" alt="${escapeHtml(p.title)}" loading="lazy" onerror="this.onerror=null;this.src='${fallback}';">
                </div>
                <div class="card-list-meta">
                    ${brandName ? `<span class="card-brand-name">${escapeHtml(brandName)}</span>` : ''}
                </div>
                <h3 class="card-title">${escapeHtml(p.title)}</h3>
                ${variantsHtml}
                <div class="card-price">
                    ${showDesde ? '<span class="price-from">desde</span>' : ''}
                    <span class="price-value" data-raw-price="${firstPrice}">${formatPrice(getDisplayPrice(firstPrice))}</span>
                </div>
            </div>
        `;

        fragment.appendChild(card);
    }

    container.appendChild(fragment);

    // Update initial results count
    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount) resultsCount.textContent = products.length;
}

/* ============================================================
   PROMO BANNER
   ============================================================ */

function initPromoBanner() {
    const banner = document.getElementById('promoBanner');
    if (!banner) return;

    const promoId = banner.dataset.promoId || 'default';
    const dismissedKey = `distrifel_promo_dismissed_${promoId}`;

    // Honor previous dismissal
    if (localStorage.getItem(dismissedKey) === '1') {
        document.body.classList.remove('has-promo');
        banner.remove();
        return;
    }

    // "Ver más" → apply category filter + smooth scroll to catalog
    const link = document.getElementById('promoLink');
    link?.addEventListener('click', (e) => {
        e.preventDefault();
        const category = banner.dataset.promoCategory;
        if (category && typeof setCategory === 'function') {
            setCategory(category);
        }
        const catalog = document.getElementById('catalogo');
        if (catalog) {
            const promoHeight = banner.offsetHeight || 40;
            const navHeight = document.querySelector('.navbar')?.offsetHeight || 0;
            const offset = promoHeight + navHeight + 8;
            const top = catalog.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    });

    // Close button → dismiss + persist
    const closeBtn = document.getElementById('promoClose');
    closeBtn?.addEventListener('click', () => {
        localStorage.setItem(dismissedKey, '1');
        banner.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
        banner.style.transform = 'translateY(-100%)';
        banner.style.opacity = '0';
        setTimeout(() => {
            document.body.classList.remove('has-promo');
            banner.remove();
        }, 300);
    });
}

/* ============================================================
   CONFIRM MODAL
   ============================================================ */

function openConfirm(onOk) {
    const overlay = document.getElementById('confirmOverlay');
    if (!overlay) { if (onOk) onOk(); return; }

    overlay.style.display = 'flex';
    requestAnimationFrame(() => overlay.classList.add('visible'));

    const close = () => {
        overlay.classList.remove('visible');
        setTimeout(() => { overlay.style.display = 'none'; }, 250);
    };

    const okBtn = document.getElementById('confirmOk');
    const cancelBtn = document.getElementById('confirmCancel');

    const handleOk = () => {
        close();
        cleanup();
        if (onOk) onOk();
    };

    const handleCancel = () => {
        close();
        cleanup();
    };

    const handleKey = (e) => {
        if (e.key === 'Escape') handleCancel();
        if (e.key === 'Enter') handleOk();
    };

    // Use one-time listeners
    okBtn.addEventListener('click', handleOk, { once: true });
    cancelBtn.addEventListener('click', handleCancel, { once: true });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) handleCancel(); }, { once: true });
    document.addEventListener('keydown', handleKey, { once: true });

    const cleanup = () => document.removeEventListener('keydown', handleKey);

    setTimeout(() => okBtn.focus(), 200);
}

/* ============================================================
   BRAND CAROUSEL — click to filter
   ============================================================ */

function initBrandCarousel() {
    document.querySelectorAll('.brand-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            setBrandFilter(btn.dataset.brand);
        });
    });
}

function setBrandFilter(brand) {
    state.filters.brand = brand;

    // Sync dropdown options
    document.querySelectorAll('[data-menu="brand"] .filter-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.value === brand);
    });

    // Actualizar badge del acordeón
    const activeOpt = document.querySelector(`[data-menu="brand"] [data-value="${brand}"]`);
    const activeLabel = activeOpt?.dataset.label || activeOpt?.textContent.trim() || brand;
    updateAccordionBadge('brand', brand, activeLabel);

    // Sync dropdown button label
    const filterBtn = document.querySelector('[data-filter="brand"]');
    if (filterBtn) {
        const valueEl = filterBtn.querySelector('.filter-value');
        if (valueEl) {
            valueEl.textContent = brand === 'all' ? 'Todas' : activeLabel;
        }
    }

    filterProducts();

    // Abrir acordeón de marca en el sidebar
    const brandMenu = document.querySelector('[data-menu="brand"]');
    if (brandMenu) {
        brandMenu.closest('.accordion-section')?.classList.add('expanded');
    }

    // Smooth scroll to catalog
    const catalog = document.getElementById('catalogo');
    if (catalog) {
        const navH = document.querySelector('.navbar')?.offsetHeight || 80;
        const top = catalog.getBoundingClientRect().top + window.pageYOffset - navH - 10;
        window.scrollTo({ top, behavior: 'smooth' });
    }
}

function offerGroupBlockHtml(g, groupIdx, hideAddBtn = false) {
    const first      = g.items[0].o;
    const firstFinal = Math.round(first.originalPrice * (1 - first.discount / 100));

    const chips = g.items.map(({ o, idx }, i) => {
        const final = Math.round(o.originalPrice * (1 - o.discount / 100));
        return `<span class="offer-chip${i === 0 ? ' selected' : ''}"
            data-idx="${idx}"
            data-original="${o.originalPrice}"
            data-final="${final}"
            data-boxqty="${o.boxQty}"
            data-condition="${escapeHtml(o.condition)}">${escapeHtml(o.variant)}</span>`;
    }).join('');

    return `
    <div class="offer-variant-block" data-group="${groupIdx}">
        <div class="offer-variant-name">${escapeHtml(g.title)}</div>
        <div class="offer-chips">${chips}</div>
        <div class="offer-variant-prices">
            <span class="offer-variant-original">$ ${first.originalPrice.toLocaleString('es-AR')}</span>
            <span class="offer-variant-final">$ ${firstFinal.toLocaleString('es-AR')}</span>
        </div>
        ${!hideAddBtn ? `<span class="offer-variant-condition">${escapeHtml(first.condition)} · ${first.boxQty} u.</span>` : ''}
        ${!hideAddBtn ? `
        <button class="offer-add-btn" data-idx="${g.items[0].idx}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="12" height="12">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            <span>Agregar (${first.boxQty} u.)</span>
        </button>` : ''}
    </div>`;
}

function initOffersModal() {
    const overlay   = document.getElementById('offersOverlay');
    const closeBtn  = document.getElementById('offersClose');
    const openBtn   = document.getElementById('offersBtn');
    const carousel  = document.getElementById('offersCarousel');
    const dotsWrap  = document.getElementById('offersDots');
    const prevBtn   = document.getElementById('offersPrev');
    const nextBtn   = document.getElementById('offersNext');
    if (!overlay || !openBtn || !carousel) return;

    const offers = window.DISTRIFEL_OFFERS || [];

    // Agrupar por título de producto
    const groups = [];
    const seen   = {};
    offers.forEach((o, idx) => {
        if (!seen[o.title]) { seen[o.title] = []; groups.push({ title: o.title, items: seen[o.title] }); }
        seen[o.title].push({ o, idx });
    });

    // Render slides — imagen única + bloques de variante
    carousel.innerHTML = groups.map((g, gi) => {
        const first    = g.items[0].o;
        const logoSrc  = BRAND_LOGOS[first.brand] || '';
        const brandHtml = logoSrc
            ? `<div class="offer-slide-hero-brand"><img src="${logoSrc}" alt="${escapeHtml(first.brand)}"></div>`
            : '';
        const blocks = offerGroupBlockHtml(g, gi);
        const heroHtml = first.banner
            ? `<div class="offer-slide-banner-wrap${first.darkBanner ? ' offer-slide-banner-wrap--dark' : ''}">
                <img class="offer-slide-banner" src="${escapeHtml(first.banner)}" alt="${escapeHtml(g.title)}" onerror="this.style.display='none'">
                <div class="offer-slide-banner-overlay">
                    ${offerGroupBlockHtml(g, gi, true)}
                    <button class="offer-add-btn-side" data-idx="${g.items[0].idx}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18">
                            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                            <line x1="3" y1="6" x2="21" y2="6"/>
                            <path d="M16 10a4 4 0 01-8 0"/>
                        </svg>
                        <span>Agregar (${first.boxQty} u.)</span>
                    </button>
                </div>
               </div>`
            : `<div class="offer-slide-hero">
                <div class="offer-slide-hero-img-wrap">
                    <img class="offer-slide-hero-img" src="${escapeHtml(first.image)}" alt="${escapeHtml(g.title)}" onerror="this.style.opacity='0'">
                    ${brandHtml}
                </div>
                <div class="offer-slide-hero-info">
                    <div class="offer-slide-hero-name">${escapeHtml(g.title)}</div>
                    <span class="offer-slide-hero-discount">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                        -${first.discount}% por caja cerrada
                    </span>
                </div>
            </div>`;
        return `
        <div class="offers-slide${first.banner ? ' offers-slide--banner' : ''}">
            ${heroHtml}
            ${!first.banner ? `<div class="offer-variants-grid">${blocks}</div>` : ''}
        </div>`;
    }).join('');

    // Dots
    let current = 0;
    dotsWrap.innerHTML = groups.map((_, i) =>
        `<button class="offers-dot${i === 0 ? ' active' : ''}" data-i="${i}"></button>`
    ).join('');

    function goTo(i) {
        current = ((i % groups.length) + groups.length) % groups.length;
        carousel.style.transform = `translateX(-${current * 100}%)`;
        dotsWrap.querySelectorAll('.offers-dot').forEach((d, idx) => d.classList.toggle('active', idx === current));
        if (prevBtn) prevBtn.disabled = false;
        if (nextBtn) nextBtn.disabled = false;
    }
    goTo(0);

    // Autoplay — pausa si el usuario interactúa
    let autoplay = null;
    function startAutoplay() {
        stopAutoplay();
        autoplay = setInterval(() => goTo(current + 1), 3000);
    }
    function stopAutoplay() {
        if (autoplay) { clearInterval(autoplay); autoplay = null; }
    }

    prevBtn?.addEventListener('click', () => { goTo(current - 1); stopAutoplay(); });
    nextBtn?.addEventListener('click', () => { goTo(current + 1); stopAutoplay(); });
    dotsWrap.addEventListener('click', e => { if (e.target.closest('.offers-dot')) stopAutoplay(); });
    dotsWrap.addEventListener('click', e => {
        const dot = e.target.closest('.offers-dot');
        if (dot) goTo(parseInt(dot.dataset.i));
    });

    // Wireup directo para chips del banner overlay (más confiable que delegation)
    carousel.querySelectorAll('.offer-slide-banner-overlay .offer-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const overlay = chip.closest('.offer-slide-banner-overlay');
            const sideBtn = overlay?.querySelector('.offer-add-btn-side');
            if (!sideBtn) return;
            const boxQty  = parseInt(chip.dataset.boxqty) || 0;
            const span    = sideBtn.querySelector('span');
            if (span) span.textContent = `Agregar (${boxQty} u.)`;
            sideBtn.dataset.idx = chip.dataset.idx;
        });
    });

    // Chip click → actualizar precio y botón
    carousel.addEventListener('click', e => {
        const chip = e.target.closest('.offer-chip');
        if (chip) {
            const block = chip.closest('.offer-variant-block');
            block.querySelectorAll('.offer-chip').forEach(c => c.classList.remove('selected'));
            chip.classList.add('selected');
            const original = parseInt(chip.dataset.original);
            const final    = parseInt(chip.dataset.final);
            const boxQty   = parseInt(chip.dataset.boxqty);
            block.querySelector('.offer-variant-original').textContent = `$ ${original.toLocaleString('es-AR')}`;
            block.querySelector('.offer-variant-final').textContent    = `$ ${final.toLocaleString('es-AR')}`;
            block.querySelector('.offer-variant-condition').textContent = `${chip.dataset.condition} · ${boxQty} u.`;
            if (block.querySelector('.offer-add-btn')) {
                block.querySelector('.offer-add-btn').dataset.idx = chip.dataset.idx;
                block.querySelector('.offer-add-btn span').textContent = `Agregar (${boxQty} u.)`;
            }
            // Botón lateral (banner) — buscar desde el slide padre
            const slide   = chip.closest('.offers-slide');
            const sideBtn = slide?.querySelector('.offer-add-btn-side');
            if (sideBtn) {
                sideBtn.dataset.idx = chip.dataset.idx;
                const sideSpan = sideBtn.querySelector('span');
                if (sideSpan) sideSpan.textContent = `Agregar (${boxQty} u.)`;
            }
        }
    });

    // Agregar al carrito
    carousel.addEventListener('click', e => {
        const addBtn = e.target.closest('.offer-add-btn, .offer-add-btn-side');
        if (!addBtn) return;
        // Si es el botón lateral del banner, leer el chip seleccionado
        let idx = addBtn.dataset.idx;
        if (addBtn.classList.contains('offer-add-btn-side')) {
            const overlay = addBtn.closest('.offer-slide-banner-overlay');
            const selectedChip = overlay?.querySelector('.offer-chip.selected');
            if (selectedChip) idx = selectedChip.dataset.idx;
        }
        const offer      = offers[idx];
        const qty        = offer.boxQty;
        const finalPrice = Math.round(offer.originalPrice * (1 - offer.discount / 100));
        const itemId     = `oferta__${offer.title}__${offer.variant}`.replace(/\s+/g, '-').toLowerCase();
        const existing   = cart.items.find(i => i.id === itemId);
        if (existing) {
            existing.qty += qty;
            existing.price = existing.qty >= offer.boxQty ? finalPrice : offer.originalPrice;
        } else {
            cart.items.push({ id: itemId, cardKey: itemId, name: offer.title, variant: offer.variant,
                price: finalPrice, qty, isOffer: true, originalPrice: offer.originalPrice,
                discountedPrice: finalPrice, boxQty: offer.boxQty });
        }
        updateCartUI();
        showToast(offer.title, qty, offer.variant);
        bumpCart();
        const span    = addBtn.querySelector('span');
        const svg     = addBtn.querySelector('svg');
        const prevSvg = svg.innerHTML;
        const isSide  = addBtn.classList.contains('offer-add-btn-side');
        const prevText = span.textContent;
        // Fijar ancho para que no cambie al cambiar el texto
        addBtn.style.width = addBtn.offsetWidth + 'px';
        span.textContent = '¡Agregado!';
        svg.innerHTML = '<polyline points="20 6 9 17 4 12"/>';
        addBtn.classList.add('added');
        setTimeout(() => {
            span.textContent = isSide ? prevText : `Agregar caja (${offer.boxQty} u.)`;
            svg.innerHTML = prevSvg;
            addBtn.classList.remove('added');
            addBtn.style.width = '';
        }, 1100);
    });

    openBtn.addEventListener('click', () => { goTo(0); overlay.classList.add('open'); startAutoplay(); });
    closeBtn.addEventListener('click', () => { overlay.classList.remove('open'); stopAutoplay(); });
    overlay.addEventListener('click', e => { if (e.target === overlay) { overlay.classList.remove('open'); stopAutoplay(); } });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { overlay.classList.remove('open'); stopAutoplay(); } });
}

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
    if (item.isOffer) {
        item.price = item.qty >= item.boxQty ? item.discountedPrice : item.originalPrice;
    }
    updateCartUI();
}

function setItemQty(id, qty) {
    const item = cart.items.find(i => i.id === id);
    if (!item) return;
    item.qty = Math.max(1, Math.min(999, qty));
    if (item.isOffer) {
        item.price = item.qty >= item.boxQty ? item.discountedPrice : item.originalPrice;
    }
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
        itemsList.innerHTML = cart.items.map(item => {
            const discountActive = item.isOffer && item.qty >= item.boxQty;
            const discountLost   = item.isOffer && item.qty < item.boxQty;
            const offerBadge = discountActive
                ? `<span class="cart-offer-badge cart-offer-badge--on">-${Math.round((1 - item.discountedPrice / item.originalPrice) * 100)}% aplicado</span>`
                : discountLost
                    ? `<span class="cart-offer-badge cart-offer-badge--off">Necesitás ${item.boxQty} u. para el descuento</span>`
                    : '';
            return `
            <li class="cart-item" data-id="${item.id}">
                <div class="cart-item-info">
                    <span class="cart-item-name">${item.name}</span>
                    ${item.variant ? `<span class="cart-item-variant">${item.variant}</span>` : ''}
                    <span class="cart-item-price">${formatPrice(item.price)} c/u</span>
                    ${offerBadge}
                </div>
                <div class="cart-item-controls">
                    <button class="cart-qty-btn" data-action="dec" data-id="${item.id}" aria-label="Reducir">−</button>
                    <input type="number" class="cart-item-qty" inputmode="numeric" min="1" max="999" value="${item.qty}" data-id="${item.id}">
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
        `}).join('');

        itemsList.querySelectorAll('.cart-qty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const delta = btn.dataset.action === 'inc' ? 1 : -1;
                changeItemQty(btn.dataset.id, delta);
            });
        });

        itemsList.querySelectorAll('.cart-remove-btn').forEach(btn => {
            btn.addEventListener('click', () => removeCartItem(btn.dataset.id));
        });

        // Inputs editables de cantidad: solo dígitos, mínimo 1
        itemsList.querySelectorAll('.cart-item-qty').forEach(input => {
            input.addEventListener('input', () => {
                input.value = input.value.replace(/[^\d]/g, '');
            });
            input.addEventListener('blur', () => {
                const v = parseInt(input.value) || 1;
                setItemQty(input.dataset.id, v);
            });
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') input.blur();
            });
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

function buildWhatsAppMessage(fieldValue, notes) {
    if (APP_MODE === 'corredor') {
        return buildCorredorMessage(fieldValue, notes);
    }
    return buildClienteMessage(fieldValue, notes);
}

function buildCorredorMessage(clientName, notes) {
    const corredor = localStorage.getItem('distrifel_corredor') || 'Corredor';

    let msg = `🚚 *PEDIDO PARA DEPÓSITO*\n`;
    msg += `─────────────────────\n`;
    msg += `👤 Corredor: *${corredor}*\n`;
    msg += `🏪 Cliente: *${clientName}*\n`;
    msg += `🕐 ${formatTimestamp()}\n\n`;

    cart.items.forEach(item => {
        const v = item.variant ? ` (${item.variant})` : '';
        msg += `▪️ ${item.name}${v} — *x${item.qty}*\n`;
    });

    const totalQty = cart.items.reduce((s, i) => s + i.qty, 0);
    msg += `─────────────────────\n`;
    msg += `📦 *Total: ${totalQty} ${totalQty === 1 ? 'unidad' : 'unidades'}*`;

    if (notes && notes.trim()) {
        msg += `\n\n📝 *Comentarios:*\n${notes.trim()}`;
    }

    return msg;
}

function buildClienteMessage(clientName, phone, email, business, localidad, notes) {
    let msg = `Hola! Soy *${clientName}* y quiero hacer el siguiente pedido:\n\n`;

    if (business)  msg += `🏪 *Comercio:* ${business}\n`;
    if (localidad) msg += `📍 *Localidad:* ${localidad}\n`;
    if (phone)     msg += `📞 *Teléfono:* ${phone}\n`;
    if (email)     msg += `✉️ *Email:* ${email}\n`;
    if (business || localidad || phone || email) msg += `\n`;

    msg += `📦 *PEDIDO DISTRIFEL*\n`;
    msg += `─────────────────────\n`;

    cart.items.forEach(item => {
        const v = item.variant ? ` (${item.variant})` : '';
        msg += `▪️ ${item.name}${v} x${item.qty} — ${formatPrice(item.price * item.qty)}\n`;
    });

    const total = cart.items.reduce((s, i) => s + i.price * i.qty, 0);
    msg += `─────────────────────\n`;
    msg += `💰 *Total estimado: ${formatPrice(total)}*`;

    if (notes) msg += `\n\n📝 *Comentarios:*\n${notes}`;

    return msg;
}

function formatTimestamp() {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const h = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    return `${d}/${m} ${h}:${min}`;
}
