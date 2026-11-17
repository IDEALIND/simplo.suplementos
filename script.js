// ==========================================================================
// SIMPLO SUPLEMENTOS - INTERACTIVE PROPOSAL & LIVE DEMO LOGIC
// VENDEDOR VARELA: VENDEDOR DA LOJA SIMPLO SUPLEMENTOS (+55 81 9247-0607)
// LOGIN ADMIN: ADMIN / SENHA ADMIN: ADMIN
// ==========================================================================

let adminAuthorized = false;
if (sessionStorage.getItem('simplo_gestor_logged') === 'true') {
  adminAuthorized = true;
}

document.addEventListener('DOMContentLoaded', () => {
  loadCategoriesFromStorage();
  initModeSwitcher();
  initAdminAuthModal();
  renderCategoryControls();
  initProductFilter();
  initCartSystem();
  initCountdownTimer();
  loadCustomProductsFromStorage();
  initAdminDashboard();
  initCheckoutModal();
  initAdminPixQrUpload();
  initAdminCombosManager();
  initProductDetailHandlers();
  updateStoreStockBadges();
  if (typeof initSupabaseClient === 'function') initSupabaseClient();

  const mainContent = document.querySelector('main');
  const adminSection = document.getElementById('admin-dashboard');

  // Ao abrir o site, a Vitrine da Loja fica visível e o Painel do Gestor 100% oculto
  if (adminSection) adminSection.style.display = 'none';
  if (mainContent) mainContent.style.display = 'block';

  const savedPixKey = localStorage.getItem('simplo_seller_pix_key');
  const pixKeyInput = document.getElementById('input-store-pix-key');
  if (savedPixKey && pixKeyInput) {
    pixKeyInput.value = savedPixKey;
  }
});



/* --------------------------------------------------------------------------
   Toast Notification Helper
   -------------------------------------------------------------------------- */
function showToast(message) {
  let toast = document.getElementById('toast-msg');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-msg';
    toast.className = 'toast-msg';
    document.body.appendChild(toast);
  }
  toast.innerHTML = message;
  toast.classList.add('show');

  if (toast.timeoutId) clearTimeout(toast.timeoutId);
  toast.timeoutId = setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}

/* --------------------------------------------------------------------------
   Price Parser Helper (Suporta formatos BRL "109,90", "1.099,90" e "109.90")
   -------------------------------------------------------------------------- */
function parsePrice(str) {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  let clean = str.toString().replace(/R\$\s*/g, '').trim();

  if (clean.includes(',') && clean.includes('.')) {
    if (clean.indexOf('.') < clean.indexOf(',')) {
      clean = clean.replace(/\./g, '').replace(',', '.');
    } else {
      clean = clean.replace(/,/g, '');
    }
  } else if (clean.includes(',')) {
    clean = clean.replace(',', '.');
  }

  const val = parseFloat(clean);
  return isNaN(val) ? 0 : val;
}

/* --------------------------------------------------------------------------
   1. Mode Switcher (Loja Ao Vivo vs Painel do Gestor com Autorização)
   -------------------------------------------------------------------------- */
function initModeSwitcher() {
  const btnDemo = document.getElementById('btn-mode-demo');
  const btnAdmin = document.getElementById('btn-mode-admin');
  const btnMobileAdmin = document.getElementById('btn-mobile-switch-admin');
  const adminTriggers = document.querySelectorAll('.btn-open-admin-trigger');

  if (btnDemo) {
    btnDemo.addEventListener('click', showStoreView);
  }

  const openAdminHandler = (e) => {
    if (e) e.preventDefault();

    const mobileMenu = document.getElementById('mobile-menu-drawer');
    if (mobileMenu && mobileMenu.classList.contains('open')) {
      mobileMenu.classList.remove('open');
    }

    if (!adminAuthorized) {
      const authModal = document.getElementById('admin-auth-modal');
      if (authModal) authModal.classList.add('open');
      showToast('🔒 Digite seu Usuário e Senha para acessar o Painel do Gestor');
    } else {
      activateAdminDashboardView();
    }
  };

  window.openAdminHandler = openAdminHandler;

  if (btnAdmin) btnAdmin.addEventListener('click', openAdminHandler);
  if (btnMobileAdmin) btnMobileAdmin.addEventListener('click', openAdminHandler);
  adminTriggers.forEach(btn => btn.addEventListener('click', openAdminHandler));

  // Atalho de Teclado Secreto (Ctrl + Shift + A ou Alt + A)
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') || (e.altKey && e.key.toLowerCase() === 'a')) {
      e.preventDefault();
      openAdminHandler(e);
    }
  });

  // Clique Triplo Secreto na Logo Simplo
  let logoClickCount = 0;
  let logoClickTimer = null;
  document.addEventListener('click', (e) => {
    if (e.target.closest('.brand-logo-img') || e.target.closest('.brand-logo-wrap') || e.target.closest('.footer-brand-logo')) {
      logoClickCount++;
      clearTimeout(logoClickTimer);
      logoClickTimer = setTimeout(() => { logoClickCount = 0; }, 1000);
      if (logoClickCount >= 3) {
        logoClickCount = 0;
        openAdminHandler(e);
      }
    }
  });

  // Atalho de URL (#gestor ou #admin)
  checkUrlHashForAdmin();
  window.addEventListener('hashchange', checkUrlHashForAdmin);
}

function checkUrlHashForAdmin() {
  if (window.location.hash === '#gestor' || window.location.hash === '#admin' || window.location.hash === '#painel') {
    if (typeof window.openAdminHandler === 'function') {
      window.openAdminHandler();
    }
  }
}

window.showStoreView = function showStoreView() {
  const btnDemo = document.getElementById('btn-mode-demo');
  const btnAdmin = document.getElementById('btn-mode-admin');
  const mainContent = document.querySelector('main');
  const adminSection = document.getElementById('admin-dashboard');

  if (btnDemo) btnDemo.classList.add('active');
  if (btnAdmin) btnAdmin.classList.remove('active');

  // Exibir a Vitrine da Loja e Ocultar 100% o Painel do Gestor
  if (mainContent) mainContent.style.display = 'block';
  if (adminSection) adminSection.style.display = 'none';

  window.scrollTo({ top: 0, behavior: 'smooth' });
  showToast('🛒 Exibindo Vitrine da Loja Simplo Suplementos');
};

window.activateAdminDashboardView = function activateAdminDashboardView(tabId) {
  const btnDemo = document.getElementById('btn-mode-demo');
  const btnAdmin = document.getElementById('btn-mode-admin');
  const mainContent = document.querySelector('main');
  const adminSection = document.getElementById('admin-dashboard');

  if (btnAdmin) btnAdmin.classList.add('active');
  if (btnDemo) btnDemo.classList.remove('active');

  // Ocultar a Vitrine da Loja para exibir o Painel do Gestor isolado
  if (mainContent) mainContent.style.display = 'none';

  if (adminSection) {
    adminSection.style.display = 'block';
    if (typeof renderAdminCombosTab === 'function') {
      renderAdminCombosTab();
    }

    if (tabId) {
      const tabBtn = document.querySelector(`.admin-subnav-btn[data-tab="${tabId}"]`);
      if (tabBtn) tabBtn.click();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  showToast('🔓 Painel do Gestor Aberto! Edite o estoque, produtos e combos.');
};

/* --------------------------------------------------------------------------
   Admin Password & Username Auth Modal Logic
   -------------------------------------------------------------------------- */
function initAdminAuthModal() {
  const authModal = document.getElementById('admin-auth-modal');
  const btnCloseAuth = document.getElementById('btn-close-admin-auth');
  const btnSubmitAuth = document.getElementById('btn-submit-admin-auth');
  const userInput = document.getElementById('input-admin-username');
  const passwordInput = document.getElementById('input-admin-password');
  const btnLogout = document.getElementById('btn-admin-logout');

  if (btnCloseAuth && authModal) {
    btnCloseAuth.addEventListener('click', () => {
      authModal.classList.remove('open');
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      adminAuthorized = false;
      sessionStorage.removeItem('simplo_gestor_logged');
      showStoreView();
      showToast('🔒 Você saiu do Painel do Gestor com sucesso!');
    });
  }

  function verifyLogin() {
    const userVal = userInput ? userInput.value.trim() : '';
    const pwdVal = passwordInput ? passwordInput.value.trim() : '';

    if (!userVal || !pwdVal) {
      showToast('⚠️ Informe o Usuário e a Senha para entrar!');
      return;
    }

    // Suporta LOGIN ADMIN e SENHA ADMIN (maiúsculo ou minúsculo) e credencial legada
    const isAdminUser = userVal.toUpperCase() === 'ADMIN';
    const isAdminPwd = pwdVal.toUpperCase() === 'ADMIN';
    const isLegacyAuth = (userVal.toUpperCase() === 'ADMSIMPLO' && pwdVal === 'Sp889260.');

    if ((isAdminUser && isAdminPwd) || isLegacyAuth) {
      adminAuthorized = true;
      sessionStorage.setItem('simplo_gestor_logged', 'true');
      if (authModal) authModal.classList.remove('open');
      if (userInput) {
        userInput.value = '';
        userInput.style.borderColor = '';
      }
      if (passwordInput) {
        passwordInput.value = '';
        passwordInput.style.borderColor = '';
      }
      activateAdminDashboardView();
      const adminDisplayName = isAdminUser ? 'ADMIN' : 'ADMSIMPLO';
      showToast(`🔓 Acesso concedido! Bem-vindo(a), Gestor(a) ${adminDisplayName}.`);
    } else {
      showToast('❌ Usuário ou senha incorretos! Utilize Usuário ADMIN e Senha ADMIN.');
      if (userInput) userInput.style.borderColor = 'var(--accent-red)';
      if (passwordInput) passwordInput.style.borderColor = 'var(--accent-red)';
    }
  }

  if (btnSubmitAuth) {
    btnSubmitAuth.addEventListener('click', verifyLogin);
  }

  [userInput, passwordInput].forEach(inp => {
    if (inp) {
      inp.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') verifyLogin();
      });
    }
  });
}



/* --------------------------------------------------------------------------
   3. Product Filtering in Store Demo
   -------------------------------------------------------------------------- */
function initProductFilter() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const productCards = document.querySelectorAll('.product-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const cat = btn.getAttribute('data-filter');

      productCards.forEach(card => {
        const productCategory = card.getAttribute('data-category');
        if (cat === 'all' || productCategory === cat) {
          card.style.display = 'flex';
          card.style.animation = 'fadeIn 0.4s ease';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  const btnStoreFilter = document.querySelector('.btn-store-filter');
  const filterTabs = document.querySelector('.filter-tabs');

  if (btnStoreFilter && filterTabs) {
    btnStoreFilter.addEventListener('click', () => {
      btnStoreFilter.classList.toggle('active');
      if (filterTabs.style.display === 'none') {
        filterTabs.style.display = 'flex';
        filterTabs.style.animation = 'fadeIn 0.3s ease';
        showToast('🔍 Filtros de categorias exibidos');
      } else {
        filterTabs.style.display = 'none';
        showToast('🔍 Filtros de categorias ocultados');
      }
    });
  }

  const sortSelect = document.querySelector('.store-sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      const val = sortSelect.value;
      const productsGrid = document.querySelector('.products-grid-5cols');
      if (!productsGrid) return;
      const cards = Array.from(productsGrid.querySelectorAll('.product-card'));

      cards.sort((a, b) => {
        const priceA = parsePrice(a.querySelector('.current-price').textContent);
        const priceB = parsePrice(b.querySelector('.current-price').textContent);
        if (val === 'price-asc') return priceA - priceB;
        if (val === 'price-desc') return priceB - priceA;
        return 0;
      });

      cards.forEach(card => productsGrid.appendChild(card));
      showToast('🔄 Produtos reordenados!');
    });
  }
}

window.filterByCategory = function (cat) {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const productCards = document.querySelectorAll('.product-card');
  const lojaSection = document.getElementById('loja');

  filterBtns.forEach(b => {
    if (b.getAttribute('data-filter') === cat) {
      b.classList.add('active');
    } else {
      b.classList.remove('active');
    }
  });

  productCards.forEach(card => {
    const productCategory = card.getAttribute('data-category');
    if (cat === 'all' || productCategory === cat) {
      card.style.display = 'flex';
      card.style.animation = 'fadeIn 0.4s ease';
    } else {
      card.style.display = 'none';
    }
  });

  if (lojaSection) {
    lojaSection.scrollIntoView({ behavior: 'smooth' });
  }

  showToast(`🔍 Produtos filtrados!`);
};

/* --------------------------------------------------------------------------
   4. E-Commerce Cart & Checkout Form Logic
   -------------------------------------------------------------------------- */
let cart = [];
let appliedCoupon = null;

function initCartSystem() {
  const cartTrigger = document.getElementById('cart-trigger');
  const cartOverlay = document.getElementById('cart-overlay');
  const btnCloseCart = document.getElementById('btn-close-cart');
  const btnOpenCheckoutModal = document.getElementById('btn-open-checkout-modal');
  const btnApplyCartCoupon = document.getElementById('btn-apply-cart-coupon');

  renderCart();

  if (cartTrigger && cartOverlay) {
    cartTrigger.addEventListener('click', () => {
      cartOverlay.classList.add('open');
    });
  }

  if (btnCloseCart && cartOverlay) {
    btnCloseCart.addEventListener('click', () => {
      cartOverlay.classList.remove('open');
    });

    cartOverlay.addEventListener('click', (e) => {
      if (e.target === cartOverlay) cartOverlay.classList.remove('open');
    });
  }

  // Event Delegation para Botões de Adicionar ao Carrinho (suporta produtos novos)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-add-cart');
    if (btn) {
      const card = btn.closest('.product-card');
      if (!card) return;
      const id = card.getAttribute('data-id');
      const name = card.querySelector('.product-name').textContent;
      const priceText = card.querySelector('.current-price').textContent;
      const price = parsePrice(priceText);
      const imgSrc = card.querySelector('.product-img').getAttribute('src');

      addToCart(id, name, price, imgSrc);
    }
  });

  if (btnOpenCheckoutModal) {
    btnOpenCheckoutModal.addEventListener('click', () => {
      if (cart.length === 0) {
        showToast('⚠️ Seu carrinho está vazio! Escolha algum suplemento.');
        return;
      }
      const cartOverlay = document.getElementById('cart-overlay');
      if (cartOverlay) cartOverlay.classList.remove('open');

      const checkoutModal = document.getElementById('checkout-modal-overlay');
      if (checkoutModal) {
        checkoutModal.classList.add('open');
        renderCheckoutPixCode();
      }
    });
  }

  if (btnApplyCartCoupon) {
    btnApplyCartCoupon.addEventListener('click', applyCartCoupon);
  }
}

function addToCart(id, name, price, imgSrc) {
  const stockItem = stockData.find(s => s.id === id);
  if (stockItem && stockItem.isPaused) {
    showToast(`⚠️ "${name}" está temporariamente pausado pela loja.`);
    return;
  }

  const existingItem = cart.find(item => item.id === id);
  if (existingItem) {
    existingItem.qty += 1;
  } else {
    cart.push({ id, name, price, imgSrc, qty: 1 });
  }

  renderCart();
  showToast(`🛒 "${name}" adicionado ao carrinho da loja!`);

  const trigger = document.getElementById('cart-trigger');
  if (trigger) {
    trigger.style.transform = 'scale(1.2)';
    setTimeout(() => { trigger.style.transform = 'none'; }, 200);
  }

  const cartOverlay = document.getElementById('cart-overlay');
  if (cartOverlay) cartOverlay.classList.add('open');
}

function applyCartCoupon() {
  const input = document.getElementById('input-cart-coupon');
  if (!input || !input.value) {
    showToast('⚠️ Digite o código do cupom!');
    return;
  }

  const code = input.value.trim().toUpperCase();
  const validCoupon = couponsData.find(c => c.code === code && c.status === 'Ativo');

  if (validCoupon) {
    appliedCoupon = validCoupon;
    showToast(`🎉 Cupom ${code} aplicado com sucesso!`);
    renderCart();
  } else {
    showToast('❌ Cupom inválido ou expirado! Tente SIMPLO10 ou ENTREGAHOJE.');
  }
}

function renderCart() {
  const cartItemsContainer = document.getElementById('cart-items-list') || document.getElementById('cart-items');
  const cartBadge = document.getElementById('cart-count') || document.getElementById('cart-badge-count');
  const cartTotalVal = document.getElementById('cart-total-val');
  const discountRow = document.getElementById('applied-coupon-row') || document.getElementById('coupon-discount-row');
  const activeCouponCode = document.getElementById('active-coupon-code');
  const couponDiscountVal = document.getElementById('coupon-discount-val');

  if (cartBadge) cartBadge.textContent = cart.reduce((sum, item) => sum + item.qty, 0);

  if (!cartItemsContainer) return;

  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  let rawTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  let discountAmount = 0;

  if (appliedCoupon) {
    if (appliedCoupon.code === 'SIMPLO10') {
      discountAmount = rawTotal * 0.10;
    } else if (appliedCoupon.code === 'ENTREGAHOJE') {
      discountAmount = 15.00;
    } else if (appliedCoupon.code === 'CREATINA20') {
      discountAmount = 20.00;
    } else {
      discountAmount = rawTotal * 0.05;
    }

    if (discountRow) {
      discountRow.style.display = 'flex';
      if (activeCouponCode) activeCouponCode.textContent = appliedCoupon.code;
      if (couponDiscountVal) couponDiscountVal.textContent = `- R$ ${discountAmount.toFixed(2)}`;
    }
  } else {
    if (discountRow) discountRow.style.display = 'none';
  }

  const finalTotal = Math.max(0, rawTotal - discountAmount);

  cartBadge.textContent = totalQty;
  cartTotalVal.textContent = `R$ ${finalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<p class="cart-empty-msg">Seu carrinho está vazio.<br>Escolha os suplementos da Simplo Suplementos acima!</p>';
    return;
  }

  cartItemsContainer.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.imgSrc}" alt="${item.name}" class="cart-item-img">
      <div class="cart-item-details">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">R$ ${(item.price * item.qty).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        <div class="cart-item-qty">
          <button class="btn-qty" onclick="updateQty('${item.id}', -1)">-</button>
          <span>${item.qty}</span>
          <button class="btn-qty" onclick="updateQty('${item.id}', 1)">+</button>
        </div>
      </div>
    </div>
  `).join('');
}

window.updateQty = function (id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(i => i.id !== id);
  }
  renderCart();
};

/* --------------------------------------------------------------------------
   4. E-Commerce Cart & Checkout Form Logic com Pix QR Code Dinâmico
   -------------------------------------------------------------------------- */
let currentPixPayload = '';
let registeredPixQrSrc = localStorage.getItem('simplo_seller_pix_qr_src') || '';

function getSellerPixKey() {
  const pixInput = document.getElementById('input-store-pix-key');
  if (pixInput && pixInput.value.trim()) {
    return pixInput.value.trim();
  }
  const savedKey = localStorage.getItem('simplo_seller_pix_key');
  if (savedKey) return savedKey;
  return '81992470607';
}

function initAdminPixQrUpload() {
  const fileInput = document.getElementById('input-store-pix-qr-file');
  const urlInput = document.getElementById('input-store-pix-qr-url');
  const previewWrap = document.getElementById('admin-pix-qr-preview-wrap');
  const previewImg = document.getElementById('admin-pix-qr-preview');
  const btnRemove = document.getElementById('btn-remove-custom-pix-qr');

  if (registeredPixQrSrc) {
    if (previewImg) previewImg.src = registeredPixQrSrc;
    if (previewWrap) previewWrap.style.display = 'block';
  }

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          registeredPixQrSrc = event.target.result;
          if (previewImg) previewImg.src = registeredPixQrSrc;
          if (previewWrap) previewWrap.style.display = 'block';
          localStorage.setItem('simplo_seller_pix_qr_src', registeredPixQrSrc);
          renderCheckoutPixCode();
          showToast('✅ Imagem do QR Code Pix cadastrada com sucesso!');
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (urlInput) {
    urlInput.addEventListener('input', () => {
      const val = urlInput.value.trim();
      if (val) {
        registeredPixQrSrc = val;
        if (previewImg) previewImg.src = registeredPixQrSrc;
        if (previewWrap) previewWrap.style.display = 'block';
        localStorage.setItem('simplo_seller_pix_qr_src', registeredPixQrSrc);
        renderCheckoutPixCode();
      }
    });
  }

  if (btnRemove) {
    btnRemove.addEventListener('click', () => {
      registeredPixQrSrc = '';
      localStorage.removeItem('simplo_seller_pix_qr_src');
      if (previewWrap) previewWrap.style.display = 'none';
      if (fileInput) fileInput.value = '';
      if (urlInput) urlInput.value = '';
      renderCheckoutPixCode();
      showToast('ℹ️ QR Code cadastrado removido. Voltando ao modo dinâmico.');
    });
  }
}

function calcCRC16(str) {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= (str.charCodeAt(i) << 8);
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function formatPixKeyForEMV(key) {
  let k = (key || '81992470607').trim();
  if (k.includes('@') || (k.includes('-') && k.length > 20)) {
    return k;
  }
  const digits = k.replace(/\D/g, '');
  if (digits.length === 10 || digits.length === 11) {
    if (k.startsWith('+')) return k;
    return `+55${digits}`;
  }
  return k;
}

function generatePixPayload(pixKey, merchantName, merchantCity, amount, txid = 'SIMPLO') {
  const cleanKey = formatPixKeyForEMV(pixKey);
  const cleanName = (merchantName || 'VENDEDOR VARELA').normalize("NFD").replace(/[\u0300-\u036f]/g, "").substring(0, 25).toUpperCase();
  const cleanCity = (merchantCity || 'RECIFE').normalize("NFD").replace(/[\u0300-\u036f]/g, "").substring(0, 15).toUpperCase();

  function emv(id, val) {
    const len = val.length.toString().padStart(2, '0');
    return `${id}${len}${val}`;
  }

  const gui = emv('00', 'br.gov.bcb.pix');
  const keyField = emv('01', cleanKey);
  const merchantAccount = emv('26', gui + keyField);
  const amountStr = amount > 0 ? amount.toFixed(2) : '';

  let payload =
    emv('00', '01') +
    merchantAccount +
    emv('52', '0000') +
    emv('53', '986') +
    (amountStr ? emv('54', amountStr) : '') +
    emv('58', 'BR') +
    emv('59', cleanName) +
    emv('60', cleanCity) +
    emv('62', emv('05', txid));

  payload += '6304';
  const crc = calcCRC16(payload);
  return payload + crc;
}

function renderCheckoutPixCode() {
  const pixBox = document.getElementById('pix-payment-box');
  const pixQrImg = document.getElementById('pix-qr-image');
  const pixTotalVal = document.getElementById('pix-total-amount');
  const pixKeyDisplay = document.getElementById('pix-key-display');

  if (!pixBox) return;

  let rawTotal = 0;
  cart.forEach(item => {
    rawTotal += item.price * item.qty;
  });

  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.code === 'SIMPLO10') discount = rawTotal * 0.10;
    else if (appliedCoupon.code === 'ENTREGAHOJE') discount = 15.00;
    else if (appliedCoupon.code === 'CREATINA20') discount = 20.00;
    else discount = rawTotal * 0.05;
  }

  const finalTotal = Math.max(0, rawTotal - discount);
  const rawPixKey = getSellerPixKey();

  if (pixTotalVal) pixTotalVal.textContent = `R$ ${finalTotal.toFixed(2).replace('.', ',')}`;
  if (pixKeyDisplay) pixKeyDisplay.textContent = rawPixKey;

  // Gerar o Payload BR Code oficial do BACEN com o valor exato da compra (ex: 100.00)
  currentPixPayload = generatePixPayload(rawPixKey, 'VENDEDOR VARELA', 'RECIFE', finalTotal, 'SIMPLO');

  if (pixQrImg) {
    // Gerar QR Code dinâmico que carrega automaticamente o valor exato (ex: R$ 100,00) no app do banco
    pixQrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(currentPixPayload)}`;
  }
}

function initCheckoutModal() {
  const modalOverlay = document.getElementById('checkout-modal-overlay');
  const btnCloseModal = document.getElementById('btn-close-checkout-modal');
  const btnConfirmCheckout = document.getElementById('btn-confirm-checkout');
  const paymentSelect = document.getElementById('checkout-client-payment');
  const btnCopyPix = document.getElementById('btn-copy-pix-code');

  if (btnCloseModal && modalOverlay) {
    btnCloseModal.addEventListener('click', () => {
      modalOverlay.classList.remove('open');
    });
  }

  if (btnConfirmCheckout) {
    btnConfirmCheckout.addEventListener('click', confirmRealOrderCheckout);
  }

  if (paymentSelect) {
    paymentSelect.addEventListener('change', () => {
      const pixBox = document.getElementById('pix-payment-box');
      if (pixBox) {
        if (paymentSelect.value.includes('PIX')) {
          pixBox.classList.remove('hidden');
          renderCheckoutPixCode();
        } else {
          pixBox.classList.add('hidden');
        }
      }
    });
  }

  if (btnCopyPix) {
    btnCopyPix.addEventListener('click', () => {
      const textToCopy = currentPixPayload || getSellerPixKey();
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(textToCopy).then(() => {
          showToast('✅ Código Pix Copia e Cola copiado com sucesso!');
        }).catch(() => {
          fallbackCopyTextToClipboard(textToCopy);
        });
      } else {
        fallbackCopyTextToClipboard(textToCopy);
      }
    });
  }
}

function fallbackCopyTextToClipboard(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
    showToast('✅ Código Pix Copia e Cola copiado!');
  } catch (err) {
    showToast('⚠️ Copie a Chave Pix manualmente: ' + text);
  }
  document.body.removeChild(textArea);
}

function confirmRealOrderCheckout() {
  const nameInput = document.getElementById('checkout-client-name');
  const phoneInput = document.getElementById('checkout-client-phone');
  const addressInput = document.getElementById('checkout-client-address');
  const paymentSelect = document.getElementById('checkout-client-payment');

  if (cart.length === 0) {
    showToast('⚠️ Seu carrinho está vazio! Adicione suplementos.');
    return;
  }

  const clientName = (nameInput && nameInput.value.trim()) ? nameInput.value.trim() : 'Cliente da Loja';
  const rawPhone = (phoneInput && phoneInput.value.trim()) ? phoneInput.value.replace(/\D/g, '') : '';
  const formattedPhone = (phoneInput && phoneInput.value.trim()) ? phoneInput.value.trim() : 'Não informado';
  const address = (addressInput && addressInput.value.trim()) ? addressInput.value.trim() : 'Entrega no Mesmo Dia (Recife / PE)';
  const paymentMethod = paymentSelect ? paymentSelect.value : '⚡ PIX (Pagamento Instantâneo)';

  const sellerPhone = getSellerWhatsAppNumber();

  let text = `Olá Vendedor Varela! Gostaria de fazer o pedido abaixo para *ENTREGA NO MESMO DIA*:\n\n`;
  let rawTotal = 0;
  let itemsSummary = [];

  cart.forEach(item => {
    const itemTotal = item.price * item.qty;
    rawTotal += itemTotal;
    text += `• ${item.qty}x ${item.name} - R$ ${itemTotal.toFixed(2)}\n`;
    itemsSummary.push(`${item.qty}x ${item.name}`);
  });

  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.code === 'SIMPLO10') discount = rawTotal * 0.10;
    else if (appliedCoupon.code === 'ENTREGAHOJE') discount = 15.00;
    else if (appliedCoupon.code === 'CREATINA20') discount = 20.00;
    else discount = rawTotal * 0.05;

    text += `\n*Cupom Aplicado:* ${appliedCoupon.code} (- R$ ${discount.toFixed(2)})`;
  }

  const finalTotal = Math.max(0, rawTotal - discount);
  text += `\n*Valor Total:* R$ ${finalTotal.toFixed(2)}`;
  text += `\n\n*DADOS PARA ENTREGA:*`;
  text += `\n👤 *Cliente:* ${clientName}`;
  text += `\n📱 *WhatsApp:* ${formattedPhone}`;
  text += `\n🏠 *Endereço:* ${address}`;
  text += `\n💳 *Forma de Pagamento:* ${paymentMethod}`;
  if (paymentMethod.includes('PIX')) {
    text += `\n📌 *Chave Pix Vendedor Varela:* ${getSellerPixKey()}`;
    text += `\n📲 *Envio o comprovante Pix a seguir!*`;
  }
  text += `\n\n⚡ *Solicito confirmação de Entrega no Mesmo Dia!*`;

  const newOrderId = `#10${43 + ordersData.length}`;
  ordersData.unshift({
    id: newOrderId,
    client: clientName,
    phone: rawPhone ? (rawPhone.length >= 10 ? (rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`) : rawPhone) : sellerPhone,
    formattedPhone: formattedPhone,
    address: address,
    payment: paymentMethod,
    items: itemsSummary.join(', '),
    total: `R$ ${finalTotal.toFixed(2)}`,
    status: "🟡 Em Andamento",
    approvalState: "pending",
    class: "status-low"
  });

  // Sincronização Automática com o Estoque, Vendas e Registro de Movimentação
  cart.forEach(item => {
    const stockItem = stockData.find(s => s.id === item.id);
    if (stockItem) {
      stockItem.stock = Math.max(0, stockItem.stock - item.qty);
      stockItem.sales += item.qty;
      stockItem.status = stockItem.stock === 0 ? 'danger' : (stockItem.stock <= 10 ? 'low' : 'ok');

      // Registrar Saída
      addStockMovement('SAÍDA', stockItem.name, item.qty, `Venda Pedido ${newOrderId} (${clientName})`);
      syncStockToSupabase(stockItem.id, stockItem.stock, stockItem.isPaused);
    }
  });

  // Sincronizar Novo Pedido no Supabase Cloud
  const newOrderObj = ordersData[0];
  if (newOrderObj) syncOrderToSupabase(newOrderObj);

  // Atualizar uso de cupom
  if (appliedCoupon) {
    const currUses = parseInt(appliedCoupon.uses) || 0;
    appliedCoupon.uses = `${currUses + 1} vezes`;
    renderCouponsTable();
  }

  // Recalcular Ranking dos Produtos
  recalculateProductRanks();

  saveOrdersToLocalStorage();
  saveMovementsToLocalStorage();
  saveCouponsToLocalStorage();

  renderOrdersTable();
  renderAdminTable('all');
  updateStoreStockBadges();
  updateAdminKpis();

  const modalOverlay = document.getElementById('checkout-modal-overlay');
  if (modalOverlay) modalOverlay.classList.remove('open');

  // Reset cart
  cart = [];
  appliedCoupon = null;
  renderCart();

  const encoded = encodeURIComponent(text);
  const whatsappUrlWa = `https://wa.me/${sellerPhone}?text=${encoded}`;
  const whatsappUrlApi = `https://api.whatsapp.com/send?phone=${sellerPhone}&text=${encoded}`;

  showToast(`✅ Pedido ${newOrderId} registrado! Redirecionando para o WhatsApp... <a href="${whatsappUrlWa}" target="_blank" style="color:#fff;text-decoration:underline;margin-left:8px;font-weight:bold;">Abrir WhatsApp</a>`);

  setTimeout(() => {
    try {
      const w = window.open(whatsappUrlWa, '_blank');
      if (!w || w.closed || typeof w.closed === 'undefined') {
        window.location.href = whatsappUrlApi;
      }
    } catch (e) {
      window.location.href = whatsappUrlApi;
    }
  }, 300);
}

function getSellerWhatsAppNumber() {
  const phone1Input = document.getElementById('input-store-phone-1');
  if (phone1Input) {
    const digits = phone1Input.value.replace(/\D/g, '');
    if (digits && digits.length >= 10) {
      return digits.startsWith('55') ? digits : `55${digits}`;
    }
  }
  return '5581992470607';
}
function initCountdownTimer() {
  const timerElement = document.getElementById('countdown-timer');
  if (!timerElement) return;

  let totalSeconds = 4 * 3600 + 18 * 60 + 42; // 04:18:42

  setInterval(() => {
    if (totalSeconds > 0) {
      totalSeconds--;
    } else {
      totalSeconds = 8 * 3600; // Reset
    }

    const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const s = String(totalSeconds % 60).padStart(2, '0');

    timerElement.textContent = `${h}h : ${m}m : ${s}s`;
  }, 1000);
}



/* --------------------------------------------------------------------------
   7. Social Proof Live Purchase Popups
   -------------------------------------------------------------------------- */
const recentPurchases = [
  { name: "Lucas M. (Recife)", text: "Acabou de comprar 1x Whey 100% Pure Morango Integralmédica", avatar: "L" },
  { name: "Gabriel S. (Olinda)", text: "Comprou 1x Pré-Treino Hórus Citrus (Entrega Hoje!)", avatar: "G" },
  { name: "Felipe T. (Caruaru)", text: "Comprou 1x Creatina Hardcore Integralmédica 300g", avatar: "F" },
  { name: "Mariana K. (Jaboatão)", text: "Comprou 1x Combo Hipertrofia Completo", avatar: "M" }
];

function initSocialProofPopups() {
  let index = 0;
  const popup = document.getElementById('social-proof-popup');
  const avatar = document.getElementById('sp-avatar');
  const user = document.getElementById('sp-user');
  const desc = document.getElementById('sp-desc');

  if (!popup || !user || !desc) return;

  function triggerPopup() {
    const item = recentPurchases[index];
    avatar.textContent = item.avatar;
    user.textContent = item.name;
    desc.textContent = item.text;

    popup.classList.add('active');

    setTimeout(() => {
      popup.classList.remove('active');
    }, 4500);

    index = (index + 1) % recentPurchases.length;
  }

  setTimeout(triggerPopup, 3000);
  setInterval(triggerPopup, 12000);
}

/* --------------------------------------------------------------------------
   8. PAINEL DO GESTOR MULTIFUNCIONAL (ADMIN DASHBOARD)
   -------------------------------------------------------------------------- */
let stockData = [
  { id: "p1", name: "Whey Protein Concentrado 900g", brand: "Integralmédica", stock: 25, sales: 0, rank: "1º", status: "ok", isPaused: false },
  { id: "p2", name: "Pré-Treino Explosão 300g", brand: "Max Titanium", stock: 18, sales: 0, rank: "2º", status: "ok", isPaused: false },
  { id: "p3", name: "Creatina Monohidratada 300g", brand: "Integralmédica", stock: 30, sales: 0, rank: "3º", status: "ok", isPaused: false },
  { id: "p4", name: "BCAA 2:1:1 200g Pura Nutrição", brand: "Simplo", stock: 15, sales: 0, rank: "4º", status: "ok", isPaused: false },
  { id: "p5", name: "Protein Bar Chocolate 60g", brand: "Simplo", stock: 45, sales: 0, rank: "5º", status: "ok", isPaused: false }
];

let ordersData = [];

let stockMovements = [];

let couponsData = [
  { code: "SIMPLO10", discount: "10% OFF em todo o site", uses: "0 vezes", status: "Ativo" },
  { code: "ENTREGAHOJE", discount: "R$ 15,00 OFF de Frete Grátis", uses: "0 vezes", status: "Ativo" },
  { code: "CREATINA20", discount: "R$ 20,00 OFF em Creatina", uses: "0 vezes", status: "Ativo" }
];

function initAdminDashboard() {
  const subnavBtns = document.querySelectorAll('.admin-subnav-btn');
  const tabContents = document.querySelectorAll('.admin-tab-content');

  subnavBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      subnavBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(tc => tc.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      const targetContent = document.getElementById(targetId);
      if (targetContent) targetContent.classList.add('active');
      if (targetId === 'tab-combos') {
        renderAdminCombosTab();
      }
    });
  });

  renderAdminTable('all');
  renderOrdersTable();
  renderCouponsTable();
  renderManageProductsTable();
  renderAdminCombosTab();
  updateAdminKpis();

  // Stock Filter Event Delegation
  const adminFilterBtns = document.querySelectorAll('.admin-filter-btn');
  adminFilterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (e && e.preventDefault) e.preventDefault();
      adminFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.getAttribute('data-admin-filter') || 'all';
      renderAdminTable(filter);
    });
  });

  // Movement Report Listeners
  const btnMovReport = document.getElementById('btn-movement-report');
  const movModal = document.getElementById('daily-movement-modal');
  const btnCloseMovModal = document.getElementById('btn-close-movement-modal');
  const btnSendMovWhatsapp = document.getElementById('btn-send-movement-whatsapp');
  const btnCopyMovReport = document.getElementById('btn-copy-movement-report');

  if (btnMovReport && movModal) {
    btnMovReport.addEventListener('click', () => {
      renderMovementTable();
      movModal.classList.add('open');
    });
  }

  if (btnCloseMovModal && movModal) {
    btnCloseMovModal.addEventListener('click', () => {
      movModal.classList.remove('open');
    });
  }

  if (btnSendMovWhatsapp) {
    btnSendMovWhatsapp.addEventListener('click', sendMovementWhatsAppReport);
  }

  if (btnCopyMovReport) {
    btnCopyMovReport.addEventListener('click', copyMovementReport);
  }

  // PDF Receipt Listeners
  const pdfModal = document.getElementById('pdf-receipt-modal');
  const btnClosePdfModal = document.getElementById('btn-close-pdf-modal');
  const btnDownloadPdfNow = document.getElementById('btn-download-pdf-now');
  const btnPrintPdfNow = document.getElementById('btn-print-pdf-now');

  if (btnClosePdfModal && pdfModal) {
    btnClosePdfModal.addEventListener('click', () => {
      pdfModal.classList.remove('open');
    });
  }

  if (btnDownloadPdfNow) {
    btnDownloadPdfNow.addEventListener('click', downloadPdfReceipt);
  }

  if (btnPrintPdfNow) {
    btnPrintPdfNow.addEventListener('click', () => {
      window.print();
    });
  }

  // Create Coupon Form
  const btnCreateCoupon = document.getElementById('btn-create-coupon');
  if (btnCreateCoupon) {
    btnCreateCoupon.addEventListener('click', addNewCoupon);
  }

  // Toggle Daily Offer Listener
  const btnToggleOffer = document.getElementById('btn-toggle-offer');
  if (btnToggleOffer) {
    btnToggleOffer.addEventListener('click', toggleDailyOffer);
  }

  // Update Settings Form
  const btnSaveSettings = document.getElementById('btn-save-settings');
  if (btnSaveSettings) {
    btnSaveSettings.addEventListener('click', saveStoreSettings);
  }

  // Initialize New Product Form
  initNewProductForm();

  // Initialize Combos Manager
  initAdminCombosManager();
}

function renderAdminTable(filter = 'all') {
  const tableBody = document.getElementById('admin-table-body');
  if (!tableBody) return;

  // Atualizar o status calculado de cada item conforme a quantidade real de estoque
  stockData.forEach(item => {
    if (item.stock === 0) item.status = 'danger';
    else if (item.stock <= 10) item.status = 'low';
    else item.status = 'ok';
  });

  let filtered = [...stockData];

  if (filter === 'danger') {
    // Filtro 1: Produtos sem estoque (0 unidades)
    filtered = stockData.filter(i => i.stock === 0 || i.status === 'danger');
  } else if (filter === 'low') {
    // Filtro 2: Produtos com estoque baixo (1 a 10 unidades)
    filtered = stockData.filter(i => (i.stock > 0 && i.stock <= 10) || i.status === 'low');
  } else if (filter === 'ok') {
    // Filtro 3: Produtos em estoque normal (> 10 unidades)
    filtered = stockData.filter(i => i.stock > 10);
  }

  if (filtered.length === 0) {
    let emptyMsg = 'Nenhum produto cadastrado no estoque.';
    if (filter === 'danger') emptyMsg = '🎉 Excelente! Nenhum produto está zerado no momento.';
    if (filter === 'low') emptyMsg = '👍 Nenhum produto em estoque baixo (abaixo de 10 unidades).';
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem; font-weight: 700;">${emptyMsg}</td></tr>`;
    return;
  }

  tableBody.innerHTML = filtered.map(item => {
    let badgeClass = 'status-ok';
    let statusLabel = 'Em Estoque';

    if (item.stock === 0) {
      badgeClass = 'status-danger';
      statusLabel = 'Sem Estoque (0 un)';
    } else if (item.stock <= 10) {
      badgeClass = 'status-low';
      statusLabel = 'Estoque Baixo';
    }

    return `
      <tr>
        <td><strong>${item.name}</strong><br><small style="color: var(--text-muted);">${item.brand}</small></td>
        <td><span class="stock-status-badge ${badgeClass}">${statusLabel}</span></td>
        <td>
          <!-- Campo Editável de Estoque Personalizável (0 a 100) -->
          <input type="number" min="0" max="100" id="stock-input-${item.id}" value="${item.stock}" onchange="updateProductStock('${item.id}', this.value)" class="admin-input-field" style="width: 85px; text-align: center; font-weight: 800; font-size: 1rem; color: #fff; background: #0A1C30; padding: 0.4rem 0.5rem; border-radius: 8px;">
          <small style="color: var(--text-muted);"> un.</small>
        </td>
        <td style="color: var(--accent-green); font-weight: 800;">${item.sales} un.</td>
        <td style="font-weight: 700; color: var(--primary-orange);">${item.rank}</td>
        <td style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
          <button class="btn-admin-action btn-admin-approve" style="background: linear-gradient(135deg, var(--accent-green), #059669); border-color: var(--accent-green); color: #fff;" title="Salvar alteração deste produto" onclick="saveProductStock('${item.id}')"><i class="fa-solid fa-floppy-disk"></i> Salvar</button>
          <button class="btn-admin-action btn-admin-quick-add" title="Adicionar 10 unidades ao estoque" onclick="updateProductStock('${item.id}', ${Math.min(100, item.stock + 10)})"><i class="fa-solid fa-plus"></i> 10</button>
          <button class="btn-admin-action btn-admin-quick-add" title="Definir estoque em 50 un." onclick="updateProductStock('${item.id}', 50)"><i class="fa-solid fa-sliders"></i> 50</button>
          <button class="btn-admin-action btn-admin-approve" title="Definir estoque máximo (100 un.)" onclick="updateProductStock('${item.id}', 100)"><i class="fa-solid fa-bolt"></i> 100</button>
          <button class="btn-admin-action btn-admin-reset" title="Zerar estoque (0 un.)" onclick="updateProductStock('${item.id}', 0)"><i class="fa-solid fa-rotate-left"></i> 0</button>
        </td>
      </tr>
    `;
  }).join('');
}

window.saveProductStock = function (id) {
  const input = document.getElementById(`stock-input-${id}`);
  const val = input ? input.value : null;
  const item = stockData.find(i => i.id === id);
  if (!item) return;

  if (val !== null) {
    updateProductStock(id, val);
  }

  saveStockToLocalStorage();
  showToast(`💾 Estoque de "${item.name}" salvo com sucesso (${item.stock} un.)!`);
};

window.saveAllStockChanges = function () {
  stockData.forEach(item => {
    const input = document.getElementById(`stock-input-${item.id}`);
    if (input) {
      const val = parseInt(input.value);
      if (!isNaN(val) && val >= 0) {
        item.stock = Math.min(100, val);
        item.status = item.stock === 0 ? 'danger' : (item.stock <= 10 ? 'low' : 'ok');
      }
    }
  });

  saveStockToLocalStorage();
  stockData.forEach(item => {
    syncStockToSupabase(item.id, item.stock, item.isPaused);
  });
  renderAdminTable('all');
  updateAdminKpis();
  updateStoreStockBadges();
  showToast('💾 Todas as alterações de estoque foram salvas com sucesso!');
};

function saveStockToLocalStorage() {
  const stockMap = {};
  stockData.forEach(s => {
    stockMap[s.id] = { stock: s.stock, status: s.status, sales: s.sales, isPaused: s.isPaused };
  });
  localStorage.setItem('simplo_stock_map', JSON.stringify(stockMap));

  const saved = localStorage.getItem('simplo_custom_products');
  if (saved) {
    try {
      const list = JSON.parse(saved);
      list.forEach(p => {
        const matching = stockData.find(s => s.id === p.id);
        if (matching) {
          p.stock = matching.stock;
        }
      });
      localStorage.setItem('simplo_custom_products', JSON.stringify(list));
    } catch (e) { }
  }
}

function saveOrdersToLocalStorage() {
  localStorage.setItem('simplo_orders_data', JSON.stringify(ordersData));
}

function saveMovementsToLocalStorage() {
  localStorage.setItem('simplo_stock_movements', JSON.stringify(stockMovements));
}

function saveCouponsToLocalStorage() {
  localStorage.setItem('simplo_coupons_data', JSON.stringify(couponsData));
}

window.updateProductStock = function (id, val) {
  const item = stockData.find(i => i.id === id);
  if (!item) return;

  let qty = parseInt(val);
  if (isNaN(qty) || qty < 0) qty = 0;
  if (qty > 100) qty = 100;

  const oldStock = item.stock;
  item.stock = qty;

  if (qty > oldStock) {
    addStockMovement('ENTRADA', item.name, qty - oldStock, 'Reposição no Painel do Gestor');
  } else if (qty < oldStock) {
    addStockMovement('SAÍDA', item.name, oldStock - qty, 'Ajuste de Estoque pelo Gestor');
  }

  if (item.stock === 0) {
    item.status = 'danger';
  } else if (item.stock <= 10) {
    item.status = 'low';
  } else {
    item.status = 'ok';
  }

  saveStockToLocalStorage();
  syncStockToSupabase(item.id, item.stock, item.isPaused);
  recalculateProductRanks();
  renderAdminTable('all');
  updateAdminKpis();
  updateStoreStockBadges();
  showToast(`📦 Estoque de "${item.name}" ajustado e salvo em ${item.stock} un.`);
};

function recalculateProductRanks() {
  const sorted = [...stockData].sort((a, b) => b.sales - a.sales);
  sorted.forEach((item, idx) => {
    if (item.sales > 0) {
      item.rank = `#${idx + 1} Mais Vendido`;
    } else {
      item.rank = `-`;
    }
  });
}

function updateStoreStockBadges() {
  stockData.forEach(item => {
    const badge = document.getElementById(`stock-tag-${item.id}`);
    if (!badge) return;

    if (item.stock === 0) {
      badge.textContent = 'Estoque: 0 un. (Sem Estoque)';
      badge.style.background = 'rgba(239, 68, 68, 0.2)';
      badge.style.borderColor = 'var(--accent-red)';
      badge.style.color = 'var(--accent-red)';
    } else if (item.stock <= 10) {
      badge.textContent = `Estoque: ${item.stock} un. (Baixo)`;
      badge.style.background = 'rgba(245, 158, 11, 0.2)';
      badge.style.borderColor = 'var(--accent-yellow)';
      badge.style.color = 'var(--accent-yellow)';
    } else {
      badge.textContent = `Estoque: ${item.stock} un.`;
      badge.style.background = 'rgba(16, 185, 129, 0.2)';
      badge.style.borderColor = 'var(--accent-green)';
      badge.style.color = 'var(--accent-green)';
    }
  });
}

function renderOrdersTable() {
  const ordersBody = document.getElementById('orders-table-body');
  if (!ordersBody) return;

  if (ordersData.length === 0) {
    ordersBody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2rem;">Nenhum pedido registrado hoje.</td></tr>';
    updateAdminKpis();
    return;
  }

  ordersBody.innerHTML = ordersData.map(o => {
    let actionsHtml = '';

    if (o.approvalState === 'approved') {
      actionsHtml = `<span class="stock-status-badge status-ok" style="margin-right: 0.3rem;"><i class="fa-solid fa-check"></i> Aprovado</span>`;
    } else if (o.approvalState === 'rejected') {
      actionsHtml = `<span class="stock-status-badge status-danger" style="margin-right: 0.3rem;"><i class="fa-solid fa-xmark"></i> Reprovado</span>`;
    } else {
      actionsHtml = `
        <button class="btn-admin-action btn-admin-approve" onclick="approveOrder('${o.id}')"><i class="fa-solid fa-circle-check"></i> Aprovar</button>
        <button class="btn-admin-action btn-admin-reject" onclick="rejectOrder('${o.id}')"><i class="fa-solid fa-circle-xmark"></i> Reprovar</button>
      `;
    }

    return `
      <tr>
        <td style="font-weight: 800; color: var(--accent-cyan);">${o.id}</td>
        <td><strong>${o.client}</strong><br><small style="color: var(--accent-green); font-weight: 700;"><i class="fa-brands fa-whatsapp"></i> ${o.formattedPhone}</small></td>
        <td style="font-size: 0.8rem; color: var(--text-muted); max-width: 170px;">${o.address || 'Recife / PE'}</td>
        <td style="font-size: 0.8rem; font-weight: 700; color: var(--primary-orange);">${o.payment || 'PIX'}</td>
        <td style="color: var(--text-muted); font-size: 0.85rem;">${o.items}</td>
        <td style="font-weight: 800; color: var(--accent-green);">${o.total}</td>
        <td>
          <!-- Selector Personalizado de Status do Pedido -->
          <select class="admin-input-field" style="font-size: 0.8rem; padding: 0.35rem 0.5rem; cursor: pointer; border-radius: 8px; font-weight: 700; background: #0A1C30;" onchange="changeOrderStatus('${o.id}', this.value)">
            <option value="🟡 Em Andamento" ${o.status.includes('Andamento') ? 'selected' : ''}>🟡 Em Andamento</option>
            <option value="🛵 Em Trânsito" ${o.status.includes('Trânsito') ? 'selected' : ''}>🛵 Em Trânsito</option>
            <option value="✅ Concluído" ${o.status.includes('Concluído') || o.status.includes('Entregue') ? 'selected' : ''}>✅ Concluído</option>
            <option value="🔴 Reprovado" ${o.status.includes('Reprovado') ? 'selected' : ''}>🔴 Reprovado</option>
          </select>
        </td>
        <td style="display: flex; gap: 0.4rem; align-items: center; flex-wrap: wrap;">
          ${actionsHtml}
          <button class="btn-admin-action btn-admin-whatsapp" onclick="notifyOrderWhatsApp('${o.phone}', '${o.client}', '${o.status}', '${o.id}')"><i class="fa-brands fa-whatsapp"></i> Notificar</button>
          <button class="btn-admin-action btn-admin-quick-add" style="background: linear-gradient(135deg, #00C6FF, #0072FF); border-color: #00C6FF; color: #fff;" title="Gerar e Baixar Recibo em PDF" onclick="generateOrderPdfReceipt('${o.id}')"><i class="fa-solid fa-file-pdf"></i> Recibo PDF</button>
        </td>
      </tr>
    `;
  }).join('');
}

window.openOrdersReportModal = function () {
  const modal = document.getElementById('orders-report-modal');
  if (modal) {
    renderOrdersReportTable();
    modal.classList.add('open');
  }
};

window.closeOrdersReportModal = function () {
  const modal = document.getElementById('orders-report-modal');
  if (modal) modal.classList.remove('open');
};

window.renderOrdersReportTable = function () {
  const tableBody = document.getElementById('orders-report-table-body');
  const countEl = document.getElementById('ord-rep-kpi-count');
  const revEl = document.getElementById('ord-rep-kpi-revenue');
  const appEl = document.getElementById('ord-rep-kpi-approved');
  const rejEl = document.getElementById('ord-rep-kpi-rejected');

  let totalRev = 0;
  let approvedCount = 0;
  let rejectedCount = 0;

  ordersData.forEach(o => {
    const num = parsePrice(o.total || '0');
    totalRev += num;
    if (o.approvalState === 'rejected') rejectedCount++;
    else approvedCount++;
  });

  if (countEl) countEl.textContent = ordersData.length;
  if (revEl) revEl.textContent = `R$ ${totalRev.toFixed(2).replace('.', ',')}`;
  if (appEl) appEl.textContent = approvedCount;
  if (rejEl) rejEl.textContent = rejectedCount;

  if (!tableBody) return;

  if (ordersData.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:1.8rem; color:var(--text-muted);">Nenhum pedido registrado hoje para exibição no relatório.</td></tr>`;
    return;
  }

  tableBody.innerHTML = ordersData.map(o => {
    let statusBadge = '<span class="stock-status-badge status-low">🟡 Em Andamento</span>';
    if (o.approvalState === 'approved') statusBadge = '<span class="stock-status-badge status-ok">✅ Aprovado</span>';
    else if (o.approvalState === 'rejected') statusBadge = '<span class="stock-status-badge status-danger">❌ Cancelado</span>';

    return `
      <tr>
        <td><strong>${o.id}</strong></td>
        <td>${o.client}</td>
        <td>${o.phone || '-'}</td>
        <td>${o.payment || 'PIX'}</td>
        <td style="max-width:220px; font-size:0.8rem; color:#CBD5E1;">${o.items}</td>
        <td style="color:var(--accent-green); font-weight:800;">${o.total}</td>
        <td>${statusBadge}</td>
      </tr>
    `;
  }).join('');
};

window.sendOrdersWhatsAppReport = function () {
  const text = generateOrdersReportText();
  const rawKey = getSellerPixKey();
  const digits = rawKey.replace(/\D/g, '') || '5581992470607';
  const cleanPhone = digits.length <= 11 ? `55${digits}` : digits;
  const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
};

window.copyOrdersReportText = function () {
  const text = generateOrdersReportText();
  navigator.clipboard.writeText(text).then(() => {
    showToast('📋 Relatório de Pedidos copiado com sucesso!');
  }).catch(() => {
    showToast('❌ Não foi possível copiar automaticamente.');
  });
};

function generateOrdersReportText() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  let totalRev = 0;
  let approvedCount = 0;
  let rejectedCount = 0;

  ordersData.forEach(o => {
    const num = parsePrice(o.total || '0');
    totalRev += num;
    if (o.approvalState === 'rejected') rejectedCount++;
    else approvedCount++;
  });

  let msg = `📊 *RELATÓRIO DE PEDIDOS DO DIA - SIMPLO SUPLEMENTOS*\n`;
  msg += `📅 *Data:* ${dateStr} às ${timeStr}\n`;
  msg += `───────────────\n`;
  msg += `📦 *Total de Pedidos:* ${ordersData.length}\n`;
  msg += `💰 *Faturamento Total:* R$ ${totalRev.toFixed(2).replace('.', ',')}\n`;
  msg += `✅ *Em Andamento / Aprovados:* ${approvedCount}\n`;
  msg += `❌ *Cancelados / Reprovados:* ${rejectedCount}\n`;
  msg += `───────────────\n`;
  msg += `*LISTA DE PEDIDOS:* \n\n`;

  if (ordersData.length === 0) {
    msg += `Nenhum pedido registrado hoje.\n`;
  } else {
    ordersData.forEach((o, i) => {
      msg += `*${i + 1}. Pedido ${o.id}*\n`;
      msg += `👤 *Cliente:* ${o.client}\n`;
      msg += `📱 *WhatsApp:* ${o.phone || 'Não informado'}\n`;
      msg += `💳 *Pagamento:* ${o.payment}\n`;
      msg += `🛒 *Itens:* ${o.items}\n`;
      msg += `💵 *Total:* ${o.total}\n`;
      msg += `📍 *Status:* ${o.status || '🟡 Em Andamento'}\n\n`;
    });
  }

  msg += `⚡ *Relatório Gerado pelo Painel do Gestor (Vendedor Varela)*`;
  return msg;
}

window.changeOrderStatus = function (orderId, newStatus) {
  const order = ordersData.find(o => o.id === orderId);
  if (!order) return;

  order.status = newStatus;

  if (newStatus.includes('Concluído')) {
    order.approvalState = 'approved';
    order.class = 'status-ok';
  } else if (newStatus.includes('Reprovado')) {
    order.approvalState = 'rejected';
    order.class = 'status-danger';
  } else if (newStatus.includes('Trânsito')) {
    order.class = 'order-transit';
  }

  syncOrderToSupabase(order);
  renderOrdersTable();
  updateAdminKpis();
  showToast(`⚡ Status do pedido ${orderId} alterado para: "${newStatus}"!`);
};

window.approveOrder = function (orderId) {
  const order = ordersData.find(o => o.id === orderId);
  if (!order) return;

  order.approvalState = "approved";
  order.status = "🟡 Em Andamento";
  order.class = "order-delivered";

  syncOrderToSupabase(order);
  renderOrdersTable();
  updateAdminKpis();
  showToast(`✅ Pedido ${orderId} de ${order.client} foi APROVADO!`);
};

window.rejectOrder = function (orderId) {
  const order = ordersData.find(o => o.id === orderId);
  if (!order) return;

  order.approvalState = "rejected";
  order.status = "🔴 Reprovado";
  order.class = "status-danger";

  saveOrdersToLocalStorage();
  syncOrderToSupabase(order);
  renderOrdersTable();
  updateAdminKpis();
  showToast(`❌ Pedido ${orderId} de ${order.client} foi REPROVADO!`);
};

window.notifyOrderWhatsApp = function (phone, clientName, status, orderId) {
  const text = `Olá ${clientName}! Atualização do seu pedido ${orderId} na Simplo Suplementos: O status atual do seu pedido é: *${status}*. Qualquer dúvida fale conosco!`;
  const encoded = encodeURIComponent(text);
  window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
  showToast(`📲 Abrindo WhatsApp para enviar notificação para ${clientName}!`);
};

function renderCouponsTable() {
  const couponsBody = document.getElementById('coupons-table-body');
  if (!couponsBody) return;

  couponsBody.innerHTML = couponsData.map(c => `
    <tr>
      <td><span class="coupon-code-badge">${c.code}</span></td>
      <td><strong>${c.discount}</strong></td>
      <td style="color: var(--text-muted);">${c.uses}</td>
      <td><span class="stock-status-badge status-ok">${c.status}</span></td>
      <td>
        ${c.status === 'Ativo' ?
      `<button class="btn-admin-action btn-admin-reject" title="Pausar cupom" onclick="toggleCoupon('${c.code}')"><i class="fa-solid fa-pause"></i> Pausar</button>` :
      `<button class="btn-admin-action btn-admin-approve" title="Ativar cupom" onclick="toggleCoupon('${c.code}')"><i class="fa-solid fa-play"></i> Ativar</button>`
    }
      </td>
    </tr>
  `).join('');
}

window.toggleCoupon = function (code) {
  const coupon = couponsData.find(c => c.code === code);
  if (!coupon) return;

  coupon.status = coupon.status === 'Ativo' ? 'Pausado' : 'Ativo';
  renderCouponsTable();
  showToast(`🏷️ Status do cupom ${code} alterado para ${coupon.status}!`);
};

function addNewCoupon() {
  const codeInput = document.getElementById('input-coupon-code');
  const descInput = document.getElementById('input-coupon-desc');

  if (!codeInput || !descInput || !codeInput.value) {
    showToast('⚠️ Preencha o código do cupom!');
    return;
  }

  couponsData.push({
    code: codeInput.value.toUpperCase(),
    discount: descInput.value || 'Desconto Especial',
    uses: '0 vezes',
    status: 'Ativo'
  });

  saveCouponsToLocalStorage();
  codeInput.value = '';
  descInput.value = '';
  renderCouponsTable();
  showToast(`✅ Novo cupom cadastrado com sucesso!`);
}

let dailyOfferActive = true;

function toggleDailyOffer() {
  dailyOfferActive = !dailyOfferActive;
  const topBar = document.querySelector('.top-announcement-bar');
  const btnToggle = document.getElementById('btn-toggle-offer');
  const badgeStatus = document.getElementById('offer-status-badge');

  if (dailyOfferActive) {
    if (topBar) topBar.style.display = 'flex';
    if (btnToggle) {
      btnToggle.style.background = 'linear-gradient(135deg, var(--accent-red), #B91C1C)';
      btnToggle.innerHTML = '<i class="fa-solid fa-power-off"></i> Desativar Oferta do Dia na Loja';
    }
    if (badgeStatus) {
      badgeStatus.className = 'stock-status-badge status-ok';
      badgeStatus.innerHTML = '<i class="fa-solid fa-circle-check"></i> ATIVADA';
    }
    showToast('🔥 Oferta do Dia ATIVADA na loja!');
  } else {
    if (topBar) topBar.style.display = 'none';
    if (btnToggle) {
      btnToggle.style.background = 'linear-gradient(135deg, var(--accent-green), #059669)';
      btnToggle.innerHTML = '<i class="fa-solid fa-power-off"></i> Ativar Oferta do Dia na Loja';
    }
    if (badgeStatus) {
      badgeStatus.className = 'stock-status-badge status-danger';
      badgeStatus.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> DESATIVADA';
    }
    showToast('🔴 Oferta do Dia DESATIVADA na loja!');
  }
}

function saveStoreSettings() {
  const bannerInput = document.getElementById('input-store-banner');
  const phoneInput1 = document.getElementById('input-store-phone-1');
  const pixKeyInput = document.getElementById('input-store-pix-key');

  if (bannerInput && bannerInput.value) {
    const topBarSpan = document.querySelector('.top-announcement-bar span');
    if (topBarSpan) topBarSpan.textContent = bannerInput.value;
  }

  if (pixKeyInput && pixKeyInput.value.trim()) {
    localStorage.setItem('simplo_seller_pix_key', pixKeyInput.value.trim());
  }

  if (registeredPixQrSrc) {
    localStorage.setItem('simplo_seller_pix_qr_src', registeredPixQrSrc);
  }

  showToast('⚙️ Configurações salvas! Texto do anúncio, WhatsApp, Chave Pix e QR Code cadastrado do Vendedor Varela atualizados.');
}

function updateAdminKpis() {
  const kpiRevenue = document.getElementById('kpi-revenue');
  const kpiOrders = document.getElementById('kpi-orders');
  const kpiTicket = document.getElementById('kpi-ticket');
  const kpiStockAlert = document.getElementById('kpi-stock-alert');

  const kpiRevenueTag = document.getElementById('kpi-revenue-tag');
  const kpiOrdersTag = document.getElementById('kpi-orders-tag');
  const kpiTicketTag = document.getElementById('kpi-ticket-tag');
  const kpiStockAlertTag = document.getElementById('kpi-stock-alert-tag');

  const ordersCountSpan = document.getElementById('admin-orders-count');

  const activeOrders = ordersData.filter(o => o.approvalState !== 'rejected' && !o.status.includes('Reprovado'));

  if (ordersCountSpan) ordersCountSpan.textContent = activeOrders.length;

  let totalRev = 0;
  activeOrders.forEach(o => {
    const val = parsePrice(o.total);
    if (!isNaN(val)) totalRev += val;
  });

  const count = activeOrders.length;
  const avgTicket = count > 0 ? (totalRev / count) : 0;
  const lowStockCount = stockData.filter(i => i.status === 'low' || i.status === 'danger').length;

  if (kpiRevenue) kpiRevenue.textContent = `R$ ${totalRev.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  if (kpiOrders) kpiOrders.textContent = `${count} Pedidos`;
  if (kpiTicket) kpiTicket.textContent = `R$ ${avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  if (kpiStockAlert) kpiStockAlert.textContent = `${lowStockCount} Produtos`;

  if (kpiRevenueTag) kpiRevenueTag.textContent = count > 0 ? `Calculado via ${count} pedido(s)` : `0% em relação a ontem`;
  if (kpiOrdersTag) kpiOrdersTag.textContent = `${count} Entregas no Mesmo Dia`;

  const topProduct = [...stockData].sort((a, b) => b.sales - a.sales)[0];
  if (kpiTicketTag) {
    kpiTicketTag.textContent = topProduct && topProduct.sales > 0 ? `${topProduct.name.split(' ')[0]} lidera vendas` : `Nenhum pedido realizado`;
  }

  if (kpiStockAlertTag) {
    kpiStockAlertTag.textContent = lowStockCount > 0 ? `${lowStockCount} com estoque crítico/baixo` : `Estoque Regular`;
  }
}

function addStockMovement(type, product, qty, detail) {
  const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  stockMovements.unshift({ time, type, product, qty, detail });
}

function renderMovementTable() {
  const tbody = document.getElementById('movement-table-body');
  const kpiIn = document.getElementById('mov-kpi-in');
  const kpiOut = document.getElementById('mov-kpi-out');
  const kpiRev = document.getElementById('mov-kpi-rev');

  let totalIn = 0;
  let totalOut = 0;
  let totalRev = 0;

  const activeOrders = ordersData.filter(o => o.approvalState !== 'rejected' && !o.status.includes('Reprovado'));
  activeOrders.forEach(o => {
    const val = parsePrice(o.total);
    if (!isNaN(val)) totalRev += val;
  });

  stockMovements.forEach(m => {
    if (m.type === 'ENTRADA') totalIn += m.qty;
    if (m.type === 'SAÍDA') totalOut += m.qty;
  });

  if (kpiIn) kpiIn.textContent = `${totalIn} un.`;
  if (kpiOut) kpiOut.textContent = `${totalOut} un.`;
  if (kpiRev) kpiRev.textContent = `R$ ${totalRev.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  if (!tbody) return;

  if (stockMovements.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">Nenhuma movimentação registrada hoje.</td></tr>';
    return;
  }

  tbody.innerHTML = stockMovements.map(m => {
    const badgeColor = m.type === 'ENTRADA' ? 'status-ok' : 'status-danger';
    const sign = m.type === 'ENTRADA' ? '+' : '-';

    return `
      <tr>
        <td style="font-weight: 700; color: var(--text-muted);">${m.time}</td>
        <td><span class="stock-status-badge ${badgeColor}">${m.type}</span></td>
        <td><strong>${m.product}</strong></td>
        <td style="font-weight: 800; font-size: 1rem; color: ${m.type === 'ENTRADA' ? 'var(--accent-green)' : 'var(--accent-red)'};">${sign}${m.qty} un.</td>
        <td style="font-size: 0.8rem; color: var(--text-muted);">${m.detail}</td>
      </tr>
    `;
  }).join('');
}

function generateMovementReportText() {
  const today = new Date().toLocaleDateString('pt-BR');
  let totalIn = stockMovements.filter(m => m.type === 'ENTRADA').reduce((sum, m) => sum + m.qty, 0);
  let totalOut = stockMovements.filter(m => m.type === 'SAÍDA').reduce((sum, m) => sum + m.qty, 0);
  const activeOrders = ordersData.filter(o => o.approvalState !== 'rejected' && !o.status.includes('Reprovado'));
  let totalRev = activeOrders.reduce((sum, o) => {
    const val = parsePrice(o.total);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  let text = `📊 *RELATÓRIO DIÁRIO DE ENTRADAS & SAÍDAS DE ESTOQUE*\n`;
  text += `🏢 *Simplo Suplementos* - Data: ${today}\n\n`;
  text += `📥 *TOTAL DE ENTRADAS (REPOSIÇÕES):* ${totalIn} un.\n`;
  text += `📤 *TOTAL DE SAÍDAS (VENDAS):* ${totalOut} un.\n`;
  text += `💰 *FATURAMENTO DO DIA:* R$ ${totalRev.toFixed(2)}\n`;
  text += `🛍️ *TOTAL DE PEDIDOS CONFIRMADOS:* ${activeOrders.length} pedido(s)\n\n`;

  text += `*DETALHAMENTO DE MOVIMENTAÇÃO (EXTRATO DO DIA):*\n`;
  if (stockMovements.length === 0) {
    text += `• Nenhum registro de movimentação hoje.\n`;
  } else {
    stockMovements.forEach(m => {
      const sign = m.type === 'ENTRADA' ? '+' : '-';
      text += `• ${m.time} [${m.type}] ${sign}${m.qty}un - ${m.product} (${m.detail})\n`;
    });
  }

  text += `\n*SALDO ATUAL EM ESTOQUE:*\n`;
  stockData.forEach(s => {
    text += `• ${s.name}: ${s.stock} un. (${s.sales} vendidas hoje)\n`;
  });

  text += `\n(Relatório Gerado Automaticamente via Painel do Gestor)`;
  return text;
}

function sendMovementWhatsAppReport() {
  const text = generateMovementReportText();
  const encoded = encodeURIComponent(text);
  const sellerPhone = getSellerWhatsAppNumber();
  const whatsappUrlWa = `https://wa.me/${sellerPhone}?text=${encoded}`;
  const whatsappUrlApi = `https://api.whatsapp.com/send?phone=${sellerPhone}&text=${encoded}`;
  try {
    const w = window.open(whatsappUrlWa, '_blank');
    if (!w || w.closed || typeof w.closed === 'undefined') {
      window.location.href = whatsappUrlApi;
    }
  } catch (e) {
    window.location.href = whatsappUrlApi;
  }
  showToast('📲 Abrindo WhatsApp para enviar Relatório de Entradas & Saídas!');
}

function copyMovementReport() {
  const text = generateMovementReportText();
  navigator.clipboard.writeText(text).then(() => {
    showToast('📋 Relatório Diário de Entradas & Saídas copiado com sucesso!');
  }).catch(() => {
    showToast('⚠️ Erro ao copiar relatório. Use a exportação pelo WhatsApp.');
  });
}



/* --------------------------------------------------------------------------
   Cadastro de Novos Produtos pelo Gestor (com upload/Preview de Imagem)
   -------------------------------------------------------------------------- */
let uploadedImgSrc = '';

function initNewProductForm() {
  const fileInput = document.getElementById('input-new-prod-file');
  const urlInput = document.getElementById('input-new-prod-imgurl');
  const previewWrap = document.getElementById('new-prod-img-preview-wrap');
  const previewImg = document.getElementById('new-prod-img-preview');
  const btnAddProduct = document.getElementById('btn-add-new-product');

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          uploadedImgSrc = event.target.result;
          if (previewImg) previewImg.src = uploadedImgSrc;
          if (previewWrap) previewWrap.style.display = 'block';
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (urlInput) {
    urlInput.addEventListener('input', () => {
      const val = urlInput.value.trim();
      if (val) {
        uploadedImgSrc = val;
        if (previewImg) previewImg.src = uploadedImgSrc;
        if (previewWrap) previewWrap.style.display = 'block';
      }
    });
  }

  if (btnAddProduct) {
    btnAddProduct.addEventListener('click', addNewProductFromAdmin);
  }
}

/* --------------------------------------------------------------------------
   GERENCIADOR DE CATEGORIAS E FILTROS DINÂMICOS DA LOJA (IMAGENS EDITÁVEIS)
   -------------------------------------------------------------------------- */
let defaultStoreCategories = [
  { id: 'cat_whey', name: 'WHEY PROTEIN', imgSrc: 'whey_integralmedica.png', filterId: 'hipertrofia', isCustom: false },
  { id: 'cat_pretreino', name: 'PRÉ-TREINO', imgSrc: 'pretreino_horus.png', filterId: 'performance', isCustom: false },
  { id: 'cat_creatina', name: 'CREATINA', imgSrc: 'creatina_integralmedica.png', filterId: 'saude', isCustom: false },
  { id: 'cat_bcaa', name: 'BCAA', imgSrc: 'hero_supplements_pedestal.png', filterId: 'saude', isCustom: false },
  { id: 'cat_acessorios', name: 'ACESSÓRIOS', imgSrc: 'shaker_bottle.png', filterId: 'all', isCustom: false },
  { id: 'cat_barras', name: 'BARRAS E SNACKS', imgSrc: 'protein_bar.png', filterId: 'hipertrofia', isCustom: false }
];

let storeCategories = [...defaultStoreCategories];

function loadCategoriesFromStorage() {
  const saved = localStorage.getItem('simplo_store_categories');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        storeCategories = parsed;
      }
    } catch (e) { }
  }
}

function saveCategoriesToStorage() {
  localStorage.setItem('simplo_store_categories', JSON.stringify(storeCategories));
  if (typeof syncCategoriesToSupabase === 'function') syncCategoriesToSupabase();
}

function getAllCategories() {
  return storeCategories;
}

window.renderHomepageCategories = function renderHomepageCategories() {
  const container = document.getElementById('homepage-categories-grid');
  if (!container) return;

  container.innerHTML = storeCategories.map(cat => `
    <a href="#loja" class="category-card" onclick="filterByCategory('${cat.filterId || 'all'}')">
      <div class="category-img-wrap">
        <img src="${cat.imgSrc}" alt="${cat.name}" class="category-img">
      </div>
      <span class="category-name">${cat.name} <i class="fa-solid fa-chevron-right"></i></span>
    </a>
  `).join('');
};

window.renderCategoryControls = function renderCategoryControls() {
  const gridEl = document.getElementById('manage-categories-grid');
  if (gridEl) {
    gridEl.innerHTML = storeCategories.map(cat => `
      <div style="background: rgba(8, 19, 33, 0.95); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 16px; padding: 1rem; display: flex; flex-direction: column; align-items: center; position: relative; transition: all 0.3s ease;">
        
        <div style="width: 100%; height: 110px; background: rgba(0, 0, 0, 0.35); border-radius: 12px; display: flex; align-items: center; justify-content: center; padding: 0.5rem; margin-bottom: 0.8rem; border: 1px solid rgba(255, 255, 255, 0.05); overflow: hidden; position: relative;">
          <img src="${cat.imgSrc}" alt="${cat.name}" id="cat-img-preview-${cat.id}" style="max-width: 100%; max-height: 100%; object-fit: contain; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.5));">
        </div>

        <div style="font-weight: 900; color: #FFF; font-size: 0.9rem; margin-bottom: 0.2rem; text-align: center; text-transform: uppercase; letter-spacing: 0.5px;">
          ${cat.name}
        </div>
        
        <span style="font-size: 0.72rem; color: var(--accent-cyan); background: rgba(2, 132, 199, 0.15); padding: 0.2rem 0.6rem; border-radius: 10px; margin-bottom: 0.8rem; font-weight: 700;">
          Filtro: ${cat.filterId || 'geral'}
        </span>

        <!-- Botões de Ação da Imagem e Categoria -->
        <div style="display: flex; flex-direction: column; gap: 0.4rem; width: 100%;">
          <input type="file" id="cat-file-input-${cat.id}" accept="image/*" style="display: none;" onchange="handleCategoryImageUpload('${cat.id}', event)">
          
          <button type="button" onclick="triggerCategoryImageUpload('${cat.id}')" class="btn-primary" style="background: linear-gradient(135deg, #F58220, #D96F0E); font-size: 0.78rem; padding: 0.45rem; width: 100%; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem; cursor: pointer;">
            <i class="fa-solid fa-camera"></i> Alterar Imagem
          </button>

          <div style="display: flex; gap: 0.4rem;">
            <button type="button" onclick="editCategoryDetails('${cat.id}')" style="background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15); color: #FFF; font-size: 0.75rem; padding: 0.4rem; flex: 1; border-radius: 8px; cursor: pointer; font-weight: 700;" title="Editar Nome ou URL">
              <i class="fa-solid fa-pen"></i> Editar
            </button>
            <button type="button" onclick="deleteCategory('${cat.id}')" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); color: #EF4444; font-size: 0.75rem; padding: 0.4rem; border-radius: 8px; cursor: pointer; font-weight: 700;" title="Excluir Categoria">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  // Atualizar Select no formulário de Cadastro de Produto
  const catSelect = document.getElementById('input-new-prod-category');
  if (catSelect) {
    const currentVal = catSelect.value;
    catSelect.innerHTML = storeCategories.map(c =>
      `<option value="${c.filterId || c.id}">${c.name}</option>`
    ).join('') + `<option value="__new__">➕ + Criar Nova Categoria / Filtro...</option>`;
    if (currentVal && currentVal !== '__new__') catSelect.value = currentVal;
  }

  renderHomepageCategories();
  renderStoreCategoryFilterTabs();
  if (typeof renderManageProductsTable === 'function') renderManageProductsTable();
};

window.triggerCategoryImageUpload = function (catId) {
  const fileInput = document.getElementById(`cat-file-input-${catId}`);
  if (fileInput) fileInput.click();
};

window.handleCategoryImageUpload = function (catId, event) {
  const file = event.target && event.target.files ? event.target.files[0] : null;
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const newImgSrc = e.target.result;
    const cat = storeCategories.find(c => c.id === catId);
    if (cat) {
      cat.imgSrc = newImgSrc;
      saveCategoriesToStorage();
      renderCategoryControls();
      showToast(`📸 Imagem da categoria "${cat.name}" alterada com sucesso!`);
    }
  };
  reader.readAsDataURL(file);
};

window.editCategoryDetails = function (catId) {
  const cat = storeCategories.find(c => c.id === catId);
  if (!cat) return;

  const newName = prompt(`Digite o novo nome para a categoria "${cat.name}":`, cat.name);
  if (newName === null) return;

  const newUrl = prompt(`Deseja alterar a URL da imagem da categoria? (Deixe em branco para manter a atual):`, '');

  if (newName.trim()) cat.name = newName.trim().toUpperCase();
  if (newUrl && newUrl.trim()) cat.imgSrc = newUrl.trim();

  saveCategoriesToStorage();
  renderCategoryControls();
  showToast(`✏️ Categoria "${cat.name}" atualizada!`);
};

window.addNewStoreCategoryWithImage = function () {
  const titleInput = document.getElementById('input-new-cat-title');
  const filterSelect = document.getElementById('input-new-cat-filter-id');
  const fileInput = document.getElementById('input-new-cat-image-file');
  const urlInput = document.getElementById('input-new-cat-image-url');

  const title = titleInput ? titleInput.value.trim() : '';
  if (!title) {
    showToast('⚠️ Digite o nome da nova categoria!');
    if (titleInput) titleInput.focus();
    return;
  }

  const filterId = filterSelect ? filterSelect.value : 'all';
  const slug = 'cat_' + title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '_');

  let imgSrc = 'whey_integralmedica.png';

  if (urlInput && urlInput.value.trim()) {
    imgSrc = urlInput.value.trim();
  }

  const file = fileInput && fileInput.files ? fileInput.files[0] : null;

  function finalizeCategoryCreation(imageSource) {
    const newCat = {
      id: slug + '_' + Date.now(),
      name: title.toUpperCase(),
      imgSrc: imageSource,
      filterId: filterId,
      isCustom: true
    };
    storeCategories.push(newCat);
    saveCategoriesToStorage();
    renderCategoryControls();

    if (titleInput) titleInput.value = '';
    if (urlInput) urlInput.value = '';
    if (fileInput) fileInput.value = '';

    showToast(`✨ Nova categoria "${title}" criada com sucesso!`);
  }

  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      finalizeCategoryCreation(e.target.result);
    };
    reader.readAsDataURL(file);
  } else {
    finalizeCategoryCreation(imgSrc);
  }
};

window.deleteCategory = function (catId) {
  const cat = storeCategories.find(c => c.id === catId);
  const catName = cat ? cat.name : 'categoria';
  if (!confirm(`Deseja realmente remover a categoria "${catName}" da loja?`)) return;

  storeCategories = storeCategories.filter(c => c.id !== catId);
  saveCategoriesToStorage();
  renderCategoryControls();
  showToast('🗑️ Categoria removida da loja!');
};

window.resetCategoriesToDefault = function () {
  if (confirm('Deseja realmente restaurar as 6 categorias e fotos originais da loja?')) {
    storeCategories = JSON.parse(JSON.stringify(defaultStoreCategories));
    saveCategoriesToStorage();
    renderCategoryControls();
    showToast('🔄 Categorias e fotos padrão restauradas com sucesso!');
  }
};

function renderStoreCategoryFilterTabs() {
  const filterTabsContainer = document.querySelector('.filter-tabs');
  if (!filterTabsContainer) return;

  const activeBtn = filterTabsContainer.querySelector('.filter-btn.active');
  const activeFilter = activeBtn ? activeBtn.getAttribute('data-filter') : 'all';

  let html = `<button class="filter-btn ${activeFilter === 'all' ? 'active' : ''}" data-filter="all">Todos os Produtos</button>`;

  const uniqueFilters = [];
  storeCategories.forEach(c => {
    const fid = c.filterId || 'all';
    if (!uniqueFilters.includes(fid)) uniqueFilters.push(fid);
  });

  uniqueFilters.forEach(fid => {
    let filterLabel = fid.toUpperCase();
    if (fid === 'hipertrofia') filterLabel = '🔥 Hipertrofia & Ganho';
    else if (fid === 'performance') filterLabel = '⚡ Pré-Treino & Energia';
    else if (fid === 'saude') filterLabel = '🛡️ Força & Saúde';

    const isActive = activeFilter === fid ? 'active' : '';
    html += `<button class="filter-btn ${isActive}" data-filter="${fid}">${filterLabel}</button>`;
  });

  filterTabsContainer.innerHTML = html;
  initProductFilter();
}

window.changeProductCategory = function (productId, newCategory) {
  const item = stockData.find(s => s.id === productId);
  if (item) item.category = newCategory;

  const card = document.querySelector(`.product-card[data-id="${productId}"]`);
  if (card) card.setAttribute('data-category', newCategory);

  const saved = localStorage.getItem('simplo_custom_products');
  if (saved) {
    try {
      const list = JSON.parse(saved);
      const target = list.find(p => p.id === productId);
      if (target) {
        target.category = newCategory;
        localStorage.setItem('simplo_custom_products', JSON.stringify(list));
      }
    } catch (e) { }
  }
  showToast(`🏷️ Categoria do produto alterada com sucesso!`);
};

window.quickFillFlavors = function (type) {
  const input = document.getElementById('input-new-prod-flavors');
  if (!input) return;
  if (type === 'whey') input.value = 'Chocolate Gourmet, Baunilha Pura, Morango Silvestre, Cookies & Cream';
  if (type === 'creatina') input.value = 'Sem Sabor / Pura (100% Monohidratada), Limão Taiti, Uva Roxa';
  if (type === 'pretreino') input.value = 'Frutas Vermelhas, Melancia Tropical, Maçã Verde Refrescante';
};

function addNewProductFromAdmin(e) {
  if (e && e.preventDefault) e.preventDefault();

  const nameInput = document.getElementById('input-new-prod-name');
  const brandInput = document.getElementById('input-new-prod-brand');
  const priceInput = document.getElementById('input-new-prod-price');
  const oldPriceInput = document.getElementById('input-new-prod-oldprice');
  const stockInput = document.getElementById('input-new-prod-stock');
  const categorySelect = document.getElementById('input-new-prod-category');
  const descInput = document.getElementById('input-new-prod-desc');
  const flavorsInput = document.getElementById('input-new-prod-flavors');
  const fileInput = document.getElementById('input-new-prod-file');
  const urlInput = document.getElementById('input-new-prod-imgurl');
  const previewWrap = document.getElementById('new-prod-img-preview-wrap');

  if (!nameInput || !nameInput.value.trim()) {
    showToast('⚠️ Preencha o nome do produto!');
    if (nameInput) nameInput.focus();
    return;
  }
  if (!brandInput || !brandInput.value.trim()) {
    showToast('⚠️ Preencha a marca do produto!');
    if (brandInput) brandInput.focus();
    return;
  }
  if (!priceInput || !priceInput.value) {
    showToast('⚠️ Preencha o preço atual do produto!');
    if (priceInput) priceInput.focus();
    return;
  }

  const name = nameInput.value.trim();
  const brand = brandInput.value.trim();
  const rawPrice = priceInput.value.toString().replace(',', '.');
  const price = parseFloat(rawPrice);

  if (isNaN(price) || price <= 0) {
    showToast('⚠️ Preencha um preço válido para o produto!');
    if (priceInput) priceInput.focus();
    return;
  }

  const rawOldPrice = oldPriceInput && oldPriceInput.value ? oldPriceInput.value.toString().replace(',', '.') : '';
  const oldPrice = rawOldPrice && !isNaN(parseFloat(rawOldPrice)) ? parseFloat(rawOldPrice) : (price * 1.25);

  let stock = parseInt(stockInput ? stockInput.value : 0);
  if (isNaN(stock) || stock < 0) stock = 0;
  if (stock > 100) stock = 100;

  let category = categorySelect ? categorySelect.value : 'hipertrofia';
  if (category === '__new__') {
    const customCatInput = document.getElementById('input-custom-category-name');
    const customName = customCatInput ? customCatInput.value.trim() : '';
    if (customName) {
      const createdId = createNewCategoryFromAdmin(customName);
      if (createdId) category = createdId;
    } else {
      showToast('⚠️ Digite o nome da nova categoria!');
      if (customCatInput) customCatInput.focus();
      return;
    }
  }

  const desc = descInput && descInput.value.trim() ? descInput.value.trim() : 'Suplementação premium para alta performance nos treinos.';
  const flavors = flavorsInput && flavorsInput.value.trim() ? flavorsInput.value.trim() : 'Chocolate Gourmet, Baunilha Pura, Morango Silvestre';
  const imgSrc = uploadedImgSrc || (urlInput && urlInput.value.trim() ? urlInput.value.trim() : 'whey_integralmedica.png');

  const newId = 'prod_' + Date.now();

  // Adicionar ao Estoque da aplicação
  stockData.push({
    id: newId,
    name: name,
    brand: brand,
    price: price,
    stock: stock,
    category: category,
    desc: desc,
    flavors: flavors,
    imgSrc: imgSrc,
    sales: 0,
    rank: '-',
    status: stock === 0 ? 'danger' : (stock <= 10 ? 'low' : 'ok'),
    isPaused: false
  });

  if (stock > 0) {
    addStockMovement('ENTRADA', name, stock, 'Estoque Inicial do Produto Cadastrado');
  }

  // Adicionar o card à vitrine de produtos da loja
  const productsGrid = document.querySelector('.products-grid-5cols') || document.querySelector('.products-grid');
  if (productsGrid) {
    const newCard = document.createElement('div');
    newCard.className = 'product-card';
    newCard.setAttribute('data-id', newId);
    newCard.setAttribute('data-category', category);
    newCard.style.animation = 'fadeIn 0.5s ease';

    newCard.innerHTML = `
      <div class="product-img-wrap" onclick="openProductDetail('${newId}')" style="cursor:pointer;">
        <img src="${imgSrc}" alt="${name}" class="product-img">
      </div>
      <div class="product-info">
        <h3 class="product-name" onclick="openProductDetail('${newId}')" style="cursor:pointer;">${name.toUpperCase()}</h3>
        <div class="product-rating">
          <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
          <span>(0)</span>
        </div>
        <div class="product-price-row">
          <span class="current-price">R$ ${price.toFixed(2).replace('.', ',')}</span>
        </div>
        <button class="btn-add-cart">
          COMPRAR <i class="fa-solid fa-cart-shopping"></i>
        </button>
      </div>
    `;

    productsGrid.appendChild(newCard);
  }

  // Salvar no localStorage para persistência permanente
  const customProdObj = {
    id: newId,
    name: name,
    brand: brand,
    price: price,
    oldPrice: oldPrice,
    stock: stock,
    category: category,
    desc: desc,
    flavors: flavors,
    imgSrc: imgSrc,
    sales: 0,
    isPaused: false
  };
  const savedProds = JSON.parse(localStorage.getItem('simplo_custom_products') || '[]');
  savedProds.push(customProdObj);
  localStorage.setItem('simplo_custom_products', JSON.stringify(savedProds));

  saveStockToLocalStorage();
  recalculateProductRanks();
  renderAdminTable('all');
  renderCategoryControls();
  renderManageProductsTable();
  updateAdminKpis();
  if (typeof syncStockToSupabase === 'function') syncStockToSupabase(newId, stock, false);

  // Limpar Formulário
  nameInput.value = '';
  brandInput.value = '';
  priceInput.value = '';
  if (oldPriceInput) oldPriceInput.value = '';
  if (stockInput) stockInput.value = '25';
  if (descInput) descInput.value = '';
  if (flavorsInput) flavorsInput.value = '';
  if (fileInput) fileInput.value = '';
  if (urlInput) urlInput.value = '';
  const customCatInput = document.getElementById('input-custom-category-name');
  if (customCatInput) customCatInput.value = '';
  const customWrap = document.getElementById('custom-category-input-wrap');
  if (customWrap) customWrap.style.display = 'none';
  uploadedImgSrc = '';
  if (previewWrap) previewWrap.style.display = 'none';

  showToast(`🎉 Produto "${name}" cadastrado com sucesso com opção de sabores e adicionado à loja!`);
}

function renderManageProductsTable() {
  const tbody = document.getElementById('manage-products-table-body');
  if (!tbody) return;

  if (stockData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">Nenhum produto cadastrado na loja.</td></tr>';
    return;
  }

  const allCats = getAllCategories();

  tbody.innerHTML = stockData.map(p => {
    const currentCat = p.category || 'hipertrofia';
    const catOptionsHtml = allCats.map(c =>
      `<option value="${c.id}" ${currentCat === c.id ? 'selected' : ''}>${c.name}</option>`
    ).join('');

    return `
      <tr>
        <td><strong>${p.name}</strong></td>
        <td><span class="product-tag" style="position: static;">${(p.brand || 'SIMPLO').toUpperCase()}</span></td>
        <td>
          <select class="admin-input-field" style="font-size: 0.8rem; padding: 0.3rem 0.5rem; background: #0A1C30; border-radius: 8px; font-weight:700;" onchange="changeProductCategory('${p.id}', this.value)">
            ${catOptionsHtml}
          </select>
        </td>
        <td>
          ${p.isPaused ?
        `<span class="stock-status-badge status-danger"><i class="fa-solid fa-pause-circle"></i> Pausado</span>` :
        `<span class="stock-status-badge status-ok"><i class="fa-solid fa-circle-check"></i> Ativo</span>`
      }
        </td>
        <td style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
          ${p.isPaused ?
        `<button class="btn-admin-action btn-admin-approve" title="Ativar produto na loja" onclick="togglePauseProduct('${p.id}')"><i class="fa-solid fa-play"></i> Ativar</button>` :
        `<button class="btn-admin-action btn-admin-reject" title="Pausar produto temporariamente" onclick="togglePauseProduct('${p.id}')"><i class="fa-solid fa-pause"></i> Pausar</button>`
      }
          <button class="btn-admin-action btn-admin-reset" title="Remover produto da loja definitivamente" onclick="deleteProductFromStore('${p.id}')"><i class="fa-solid fa-trash-can"></i> Remover</button>
        </td>
      </tr>
    `;
  }).join('');
}

window.togglePauseProduct = function (id) {
  const item = stockData.find(s => s.id === id);
  if (!item) return;

  item.isPaused = !item.isPaused;

  const saved = localStorage.getItem('simplo_custom_products');
  if (saved) {
    try {
      const list = JSON.parse(saved);
      const target = list.find(p => p.id === id);
      if (target) {
        target.isPaused = item.isPaused;
        localStorage.setItem('simplo_custom_products', JSON.stringify(list));
      }
    } catch (e) { }
  }

  const card = document.querySelector(`.product-card[data-id="${id}"]`);
  if (card) {
    if (item.isPaused) {
      card.classList.add('paused-card');
    } else {
      card.classList.remove('paused-card');
    }
  }

  renderManageProductsTable();
  renderAdminTable('all');
  syncStockToSupabase(item.id, item.stock, item.isPaused);

  if (item.isPaused) {
    showToast(`⏸️ Produto "${item.name}" foi PAUSADO na loja.`);
  } else {
    showToast(`▶️ Produto "${item.name}" foi ATIVADO na loja.`);
  }
};

window.deleteProductFromStore = function (id) {
  const item = stockData.find(s => s.id === id);
  if (!item) return;

  if (!confirm(`Deseja realmente remover o produto "${item.name}" da loja e do estoque?`)) {
    return;
  }

  stockData = stockData.filter(s => s.id !== id);

  const saved = localStorage.getItem('simplo_custom_products');
  if (saved) {
    try {
      const list = JSON.parse(saved).filter(p => p.id !== id);
      localStorage.setItem('simplo_custom_products', JSON.stringify(list));
    } catch (e) { }
  }

  deleteProductFromSupabase(id);

  const card = document.querySelector(`.product-card[data-id="${id}"]`);
  if (card) card.remove();

  recalculateProductRanks();
  renderManageProductsTable();
  renderAdminTable('all');
  updateAdminKpis();

  showToast(`🗑️ Produto "${item.name}" removido da loja com sucesso!`);
};

function loadCustomProductsFromStorage() {
  const savedStockMap = localStorage.getItem('simplo_stock_map');
  if (savedStockMap) {
    try {
      const map = JSON.parse(savedStockMap);
      stockData.forEach(s => {
        if (map[s.id]) {
          s.stock = map[s.id].stock;
          s.status = s.stock === 0 ? 'danger' : (s.stock <= 10 ? 'low' : 'ok');
          if (typeof map[s.id].sales === 'number') s.sales = map[s.id].sales;
          if (typeof map[s.id].isPaused === 'boolean') s.isPaused = map[s.id].isPaused;
        }
      });
    } catch (e) { }
  }

  const savedOrders = localStorage.getItem('simplo_orders_data');
  if (savedOrders) {
    try { ordersData = JSON.parse(savedOrders); } catch (e) { }
  }

  const savedMovements = localStorage.getItem('simplo_stock_movements');
  if (savedMovements) {
    try { stockMovements = JSON.parse(savedMovements); } catch (e) { }
  }

  const savedCoupons = localStorage.getItem('simplo_coupons_data');
  if (savedCoupons) {
    try { couponsData = JSON.parse(savedCoupons); } catch (e) { }
  }

  const saved = localStorage.getItem('simplo_custom_products');
  if (!saved) return;
  try {
    const list = JSON.parse(saved);
    const productsGrid = document.querySelector('.products-grid-5cols') || document.querySelector('.products-grid');

    list.forEach(item => {
      const existing = stockData.find(s => s.id === item.id);
      if (!existing) {
        stockData.push({
          id: item.id,
          name: item.name,
          brand: item.brand,
          price: item.price,
          oldPrice: item.oldPrice,
          stock: item.stock,
          category: item.category || 'hipertrofia',
          desc: item.desc || '',
          imgSrc: item.imgSrc || 'whey_integralmedica.png',
          sales: item.sales || 0,
          rank: '-',
          status: item.stock === 0 ? 'danger' : (item.stock <= 10 ? 'low' : 'ok'),
          isPaused: item.isPaused || false
        });
      } else {
        existing.category = item.category || existing.category || 'hipertrofia';
        existing.desc = item.desc || existing.desc || '';
        existing.imgSrc = item.imgSrc || existing.imgSrc || '';
      }

      if (productsGrid && !document.querySelector(`.product-card[data-id="${item.id}"]`)) {
        const newCard = document.createElement('div');
        newCard.className = 'product-card' + (item.isPaused ? ' paused-card' : '');
        newCard.setAttribute('data-id', item.id);
        newCard.setAttribute('data-category', item.category || 'hipertrofia');

        const stockText = item.stock === 0 ? 'Estoque: 0 un. (Sem Estoque)' : (item.stock <= 10 ? `Estoque: ${item.stock} un. (Baixo)` : `Estoque: ${item.stock} un.`);
        const stockColor = item.stock === 0 ? 'rgba(239, 68, 68, 0.2)' : (item.stock <= 10 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)');
        const stockBorder = item.stock === 0 ? 'var(--accent-red)' : (item.stock <= 10 ? 'var(--accent-yellow)' : 'var(--accent-green)');
        const stockTextColor = item.stock === 0 ? 'var(--accent-red)' : (item.stock <= 10 ? 'var(--accent-yellow)' : 'var(--accent-green)');

        newCard.innerHTML = `
          <div class="product-img-wrap" onclick="openProductDetail('${item.id}')" style="cursor:pointer;">
            <img src="${item.imgSrc}" alt="${item.name}" class="product-img">
          </div>
          <div class="product-info">
            <h3 class="product-name" onclick="openProductDetail('${item.id}')" style="cursor:pointer;">${item.name.toUpperCase()}</h3>
            <div class="product-rating">
              <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
              <span>(0)</span>
            </div>
            <div class="product-price-row">
              <span class="current-price">R$ ${item.price.toFixed(2).replace('.', ',')}</span>
            </div>
            <button class="btn-add-cart">
              COMPRAR <i class="fa-solid fa-cart-shopping"></i>
            </button>
          </div>
        `;
        productsGrid.appendChild(newCard);
      }
    });
  } catch (e) {
    console.error('Erro ao carregar produtos salvos', e);
  }
}

let currentReceiptOrderId = '';

window.generateOrderPdfReceipt = function (orderId) {
  const o = ordersData.find(ord => ord.id === orderId);
  if (!o) return;

  currentReceiptOrderId = orderId;
  const container = document.getElementById('pdf-receipt-content');
  const modal = document.getElementById('pdf-receipt-modal');

  if (!container || !modal) return;

  const todayStr = new Date().toLocaleDateString('pt-BR');
  const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const itemList = o.items.split(',').map(i => i.trim());
  const itemRowsHtml = itemList.map(item => `
    <tr>
      <td style="padding: 0.65rem; border-bottom: 1px solid #E2E8F0; color: #0F172A; font-weight: 600;">${item}</td>
      <td style="padding: 0.65rem; border-bottom: 1px solid #E2E8F0; text-align: center; color: #475569; font-weight: 700;">1 un.</td>
      <td style="padding: 0.65rem; border-bottom: 1px solid #E2E8F0; text-align: right; font-weight: 800; color: #059669;">-</td>
    </tr>
  `).join('');

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #F58220; padding-bottom: 1rem; margin-bottom: 1.2rem;">
      <div>
        <h1 style="margin: 0; font-size: 1.6rem; color: #0F172A; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 900;">
          <span style="color: #F58220;">SIMPLO</span> SUPLEMENTOS
        </h1>
        <p style="margin: 0.2rem 0 0; font-size: 0.8rem; color: #64748B; font-weight: 600;">Atendimento Especializado • Vendedor Varela (+55 81 99247-0607)</p>
        <p style="margin: 0.1rem 0 0; font-size: 0.78rem; color: #059669; font-weight: bold;">⚡ Loja Oficial • Entrega Garantida no Mesmo Dia</p>
      </div>
      <div style="text-align: right;">
        <span style="background: #F1F5F9; color: #0F172A; font-weight: 900; padding: 0.4rem 0.9rem; border-radius: 8px; font-size: 1rem; border: 1px solid #CBD5E1; display: inline-block;">RECIBO ${o.id}</span>
        <p style="margin: 0.4rem 0 0; font-size: 0.78rem; color: #64748B; font-weight: 600;">Emissão: ${todayStr} às ${timeStr}</p>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; background: #F8FAFC; padding: 1.2rem; border-radius: 10px; margin-bottom: 1.2rem; border: 1px solid #E2E8F0;">
      <div>
        <small style="color: #64748B; font-size: 0.7rem; text-transform: uppercase; font-weight: 800; letter-spacing: 0.05em; display: block;">Dados do Cliente</small>
        <strong style="font-size: 1rem; color: #0F172A; display: block; margin-top: 0.2rem;">${o.client}</strong>
        <span style="font-size: 0.85rem; color: #334155; font-weight: 600; display: block; margin-top: 0.2rem;">📱 WhatsApp: ${o.formattedPhone}</span>
        <p style="margin: 0.3rem 0 0; font-size: 0.82rem; color: #64748B;">📍 ${o.address || 'Recife - PE'}</p>
      </div>
      <div>
        <small style="color: #64748B; font-size: 0.7rem; text-transform: uppercase; font-weight: 800; letter-spacing: 0.05em; display: block;">Status & Pagamento</small>
        <strong style="font-size: 0.92rem; color: #2563EB; display: block; margin-top: 0.2rem;">💳 Pagamento: ${o.payment}</strong>
        <span style="font-size: 0.85rem; color: #059669; font-weight: bold; display: block; margin-top: 0.2rem;">Status: ${o.status}</span>
        <p style="margin: 0.3rem 0 0; font-size: 0.82rem; color: #64748B;">Situação: ${o.approvalState === 'approved' ? '✓ Pedido Aprovado' : (o.approvalState === 'rejected' ? '❌ Pedido Reprovado' : '🟡 Aguardando Confirmação')}</p>
      </div>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 1.2rem; font-size: 0.88rem;">
      <thead>
        <tr style="background: #F1F5F9; color: #334155; text-align: left;">
          <th style="padding: 0.7rem; border-bottom: 2px solid #CBD5E1; font-weight: 800;">Descrição dos Produtos</th>
          <th style="padding: 0.7rem; border-bottom: 2px solid #CBD5E1; text-align: center; font-weight: 800;">Quantidade</th>
          <th style="padding: 0.7rem; border-bottom: 2px solid #CBD5E1; text-align: right; font-weight: 800;">Valor Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemRowsHtml}
      </tbody>
    </table>

    <div style="display: flex; justify-content: space-between; align-items: center; background: #0F172A; color: #FFFFFF; padding: 1.1rem 1.4rem; border-radius: 10px;">
      <span style="font-size: 0.95rem; font-weight: 800; letter-spacing: 0.03em;">VALOR TOTAL PAGO:</span>
      <span style="font-size: 1.5rem; font-weight: 900; color: #10B981;">${o.total}</span>
    </div>

    <div style="margin-top: 1.2rem; text-align: center; border-top: 1px dashed #CBD5E1; padding-top: 0.9rem; font-size: 0.75rem; color: #64748B; line-height: 1.4;">
      Comprovante emitido via <strong>Simplo Suplementos • Painel do Gestor</strong><br>
      Vendedor Principal: Vendedor Varela (+55 81 99247-0607) • Obrigado por comprar conosco!
    </div>
  `;

  modal.classList.add('open');
};

function downloadPdfReceipt() {
  const element = document.getElementById('pdf-receipt-content');
  if (!element) return;

  const opt = {
    margin: [0.4, 0.4, 0.4, 0.4],
    filename: `Recibo_Simplo_${currentReceiptOrderId.replace('#', '')}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  };

  if (typeof html2pdf !== 'undefined') {
    html2pdf().set(opt).from(element).save();
    showToast('📄 PDF baixado com sucesso!');
  } else {
    window.print();
  }
}

/* Mobile Menu Drawer & Product Detail Modal Handlers */
let detailQty = 1;
let currentProductId = 'p1';

function initProductDetailHandlers() {
  const btnMobileMenu = document.getElementById('btn-mobile-menu');
  const mobileMenuDrawer = document.getElementById('mobile-menu-drawer');
  const btnCloseMobileMenu = document.getElementById('btn-close-mobile-menu');
  const btnMobileSwitchAdmin = document.getElementById('btn-mobile-switch-admin');

  if (btnMobileMenu && mobileMenuDrawer) {
    btnMobileMenu.addEventListener('click', () => {
      mobileMenuDrawer.classList.add('open');
    });
  }

  if (btnCloseMobileMenu && mobileMenuDrawer) {
    btnCloseMobileMenu.addEventListener('click', () => {
      mobileMenuDrawer.classList.remove('open');
    });
  }

  if (btnMobileSwitchAdmin) {
    btnMobileSwitchAdmin.addEventListener('click', () => {
      if (mobileMenuDrawer) mobileMenuDrawer.classList.remove('open');
      activateAdminDashboardView();
    });
  }

  /* Product Detail Modal Handler */
  const productDetailModal = document.getElementById('product-detail-modal');
  const btnCloseProductDetail = document.getElementById('btn-close-product-detail');
  const btnDetailBuyNow = document.getElementById('btn-detail-buy-now');
  const btnDetailAddCart = document.getElementById('btn-detail-add-cart');
  const btnQtyMinus = document.getElementById('btn-qty-minus');
  const btnQtyPlus = document.getElementById('btn-qty-plus');
  const detailQtyVal = document.getElementById('detail-qty-val');

  if (btnCloseProductDetail && productDetailModal) {
    btnCloseProductDetail.addEventListener('click', () => {
      productDetailModal.classList.remove('open');
    });
  }

  if (btnQtyMinus && detailQtyVal) {
    btnQtyMinus.addEventListener('click', () => {
      if (detailQty > 1) {
        detailQty--;
        detailQtyVal.textContent = detailQty;
      }
    });
  }

  if (btnQtyPlus && detailQtyVal) {
    btnQtyPlus.addEventListener('click', () => {
      detailQty++;
      detailQtyVal.textContent = detailQty;
    });
  }

  if (btnDetailAddCart && productDetailModal) {
    btnDetailAddCart.addEventListener('click', () => {
      const detailName = document.getElementById('detail-name');
      const detailPrice = document.getElementById('detail-price');
      const detailImg = document.getElementById('detail-img');

      if (detailName && detailPrice && detailImg) {
        const priceNum = parsePrice(detailPrice.textContent);
        for (let i = 0; i < detailQty; i++) {
          addToCart(currentProductId, detailName.textContent, priceNum, detailImg.getAttribute('src'));
        }
      }
      productDetailModal.classList.remove('open');
    });
  }

  if (btnDetailBuyNow && productDetailModal) {
    btnDetailBuyNow.addEventListener('click', () => {
      if (btnDetailAddCart) btnDetailAddCart.click();
      const cartOverlay = document.getElementById('cart-overlay');
      if (cartOverlay) cartOverlay.classList.add('open');
    });
  }
}

window.openProductDetail = function (productId) {
  currentProductId = productId;
  const productDetailModal = document.getElementById('product-detail-modal');
  const detailQtyVal = document.getElementById('detail-qty-val');
  const detailImg = document.getElementById('detail-img');
  const detailName = document.getElementById('detail-name');
  const detailPrice = document.getElementById('detail-price');
  const detailInstallment = document.getElementById('detail-installment');
  const flavorSelect = document.getElementById('detail-flavor-select');
  const categoryTag = document.getElementById('detail-category-tag');
  const stockStatusTag = document.getElementById('detail-stock-status-tag');
  const descTextEl = document.getElementById('detail-desc-text');
  const usageTextEl = document.getElementById('detail-usage-text');

  const nutriVal1 = document.getElementById('nutri-val-1');
  const nutriLbl1 = document.getElementById('nutri-lbl-1');
  const nutriVal2 = document.getElementById('nutri-val-2');
  const nutriLbl2 = document.getElementById('nutri-lbl-2');
  const nutriVal3 = document.getElementById('nutri-val-3');
  const nutriLbl3 = document.getElementById('nutri-lbl-3');
  const nutriVal4 = document.getElementById('nutri-val-4');
  const nutriLbl4 = document.getElementById('nutri-lbl-4');

  const stockItem = stockData.find(s => s.id === productId);
  const card = document.querySelector(`.product-card[data-id="${productId}"]`);

  let nameText = stockItem ? stockItem.name : (card ? card.querySelector('.product-name').textContent : 'Suplemento');
  let priceText = card ? card.querySelector('.current-price').textContent : (stockItem ? `R$ ${stockItem.price.toFixed(2).replace('.', ',')}` : 'R$ 99,90');
  let imgSrc = card ? card.querySelector('.product-img').getAttribute('src') : 'whey_integralmedica.png';
  let brandText = stockItem ? stockItem.brand : 'Simplo';
  let customDesc = stockItem && stockItem.desc ? stockItem.desc : '';

  if (detailImg) detailImg.setAttribute('src', imgSrc);
  if (detailName) detailName.textContent = nameText.toUpperCase();
  if (detailPrice) detailPrice.textContent = priceText;

  const priceNum = parsePrice(priceText);
  const instVal = (priceNum / 12).toFixed(2).replace('.', ',');
  if (detailInstallment) detailInstallment.textContent = `R$ ${instVal}`;

  // Atualizar Status de Estoque
  if (stockStatusTag) {
    const stockQty = stockItem ? stockItem.stock : 25;
    const isPaused = stockItem ? stockItem.isPaused : false;

    if (isPaused) {
      stockStatusTag.className = 'stock-status-badge status-danger';
      stockStatusTag.innerHTML = '<i class="fa-solid fa-pause-circle"></i> Temporariamente Pausado';
    } else if (stockQty === 0) {
      stockStatusTag.className = 'stock-status-badge status-danger';
      stockStatusTag.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Sem Estoque no Momento';
    } else {
      stockStatusTag.className = 'stock-status-badge status-ok';
      stockStatusTag.innerHTML = '<i class="fa-solid fa-circle-check"></i> Em Estoque (Pronta Entrega)';
    }
  }

  const lowerName = nameText.toLowerCase();
  const isCreatine = productId === 'p3' || lowerName.includes('creatina');
  const isPreTreino = productId === 'p2' || lowerName.includes('pré-treino') || lowerName.includes('pre-treino') || lowerName.includes('horus');
  const isBcaa = productId === 'p4' || lowerName.includes('bcaa');
  const isBar = productId === 'p5' || lowerName.includes('bar') || lowerName.includes('barra');

  if (categoryTag) {
    const catName = isCreatine ? 'CREATINA MONOHIDRATADA' : (isPreTreino ? 'PRÉ-TREINO EXPLOSÃO' : (isBcaa ? 'BCAA AMINOÁCIDOS' : (isBar ? 'BARRINHA PROTEICA' : 'WHEY PROTEIN')));
    categoryTag.textContent = `${brandText.toUpperCase()} > ${catName}`;
  }

  if (descTextEl) {
    if (customDesc) {
      descTextEl.textContent = customDesc;
    } else if (isCreatine) {
      descTextEl.textContent = 'Creatina Monohidratada 100% Pura de altíssima micronização. Auxilia no aumento da força muscular, ressíntese de ATP e ganho de volume muscular com hidratação celular superior.';
    } else if (isPreTreino) {
      descTextEl.textContent = 'Fórmula ultra concentrada para máxima vasodilatação, foco psíquico extremo e resistência muscular intensa. Combina Cafeína Anidra, Beta-Alanina e Taurina de alta absorção.';
    } else if (isBcaa) {
      descTextEl.textContent = 'Aminoácidos de Cadeia Ramificada (L-Leucina, L-Isoleucina e L-Valina) na proporção 2:1:1. Combate o catabolismo muscular e acelera a regeneração das fibras pós-treino.';
    } else if (isBar) {
      descTextEl.textContent = 'Barra proteica deliciosa sabor Chocolate Gourmet com recheio cremoso. Fonte de proteína de rápida praticidade para lanches intermediários e pré ou pós-treino.';
    } else {
      descTextEl.textContent = 'Whey Protein de altíssimo valor biológico enriquecido com aminoácidos essenciais. Garante síntese proteica acelerada, hipertrofia muscular constante e rápida digestibilidade.';
    }
  }

  if (usageTextEl) {
    if (isCreatine) {
      usageTextEl.textContent = 'Diluir 3g (1 dosador) em 200ml de água ou suco. Consumir diariamente, mesmo em dias sem treino, para saturação muscular constante.';
    } else if (isPreTreino) {
      usageTextEl.textContent = 'Consumir 1 dose (5g) em 200ml de água fria cerca de 20 a 30 minutos antes do treino. Não exceder a recomendação diária.';
    } else if (isBcaa) {
      usageTextEl.textContent = 'Consumir 5g a 10g antes ou imediatamente após o treino diluído em água fria para interromper o catabolismo.';
    } else if (isBar) {
      usageTextEl.textContent = 'Consumir 1 a 2 barras ao dia nos intervalos das refeições ou como opção prática de pós-treino proteico.';
    } else {
      usageTextEl.textContent = 'Diluir 30g (1 scoop) em 200ml de água fria ou leite desnatado pós-treino ou no café da manhã.';
    }
  }

  if (flavorSelect) {
    const customFlavors = stockItem && stockItem.flavors ? stockItem.flavors : '';
    if (customFlavors.trim()) {
      const list = customFlavors.split(',').map(f => f.trim()).filter(Boolean);
      flavorSelect.innerHTML = list.map(f => `<option value="${f}">${f}</option>`).join('');
    } else if (isCreatine) {
      flavorSelect.innerHTML = '<option>Sem Sabor / Pura (100% Monohidratada)</option><option>Uva Iced</option><option>Limão Taiti</option>';
    } else if (isPreTreino) {
      flavorSelect.innerHTML = '<option>Citrus Intense</option><option>Maçã Verde Explosão</option><option>Melancia Freeze</option>';
    } else if (isBcaa) {
      flavorSelect.innerHTML = '<option>Limão Refrescante</option><option>Uva Iced</option><option>Sem Sabor / Puro</option>';
    } else if (isBar) {
      flavorSelect.innerHTML = '<option>Chocolate Gourmet</option><option>Cookies & Cream</option><option>Peanut Butter</option>';
    } else {
      flavorSelect.innerHTML = '<option>Chocolate Gourmet</option><option>Baunilha Pura</option><option>Morango Silvestre</option><option>Cookies & Cream</option>';
    }
  }

  if (isCreatine) {
    if (nutriVal1) nutriVal1.textContent = '100%';
    if (nutriLbl1) nutriLbl1.textContent = 'PUREZA MONOHIDRATADA';
    if (nutriVal2) nutriVal2.textContent = '3.000mg';
    if (nutriLbl2) nutriLbl2.textContent = 'CREATINA por porção';
    if (nutriVal3) nutriVal3.textContent = '0g';
    if (nutriLbl3) nutriLbl3.textContent = 'AÇÚCAR e zero glúten';
    if (nutriVal4) nutriVal4.textContent = '100%';
    if (nutriLbl4) nutriLbl4.textContent = 'MATÉRIA-PRIMA importada';
  } else if (isPreTreino) {
    if (nutriVal1) nutriVal1.textContent = '200mg';
    if (nutriLbl1) nutriLbl1.textContent = 'CAFEÍNA anidra';
    if (nutriVal2) nutriVal2.textContent = '2.000mg';
    if (nutriLbl2) nutriLbl2.textContent = 'BETA-ALANINA pura';
    if (nutriVal3) nutriVal3.textContent = '1.000mg';
    if (nutriLbl3) nutriLbl3.textContent = 'TAURINA por porção';
    if (nutriVal4) nutriVal4.textContent = '100%';
    if (nutriLbl4) nutriLbl4.textContent = 'FOCO & EXPLOSÃO';
  } else if (isBcaa) {
    if (nutriVal1) nutriVal1.textContent = '5g';
    if (nutriLbl1) nutriLbl1.textContent = 'AMINOÁCIDOS 2:1:1';
    if (nutriVal2) nutriVal2.textContent = '2.500mg';
    if (nutriLbl2) nutriLbl2.textContent = 'L-LEUCINA isolada';
    if (nutriVal3) nutriVal3.textContent = '0g';
    if (nutriLbl3) nutriLbl3.textContent = 'CARBOIDRATOS / Açúcar';
    if (nutriVal4) nutriVal4.textContent = '100%';
    if (nutriLbl4) nutriLbl4.textContent = 'ANTI-CATABÓLICO';
  } else if (isBar) {
    if (nutriVal1) nutriVal1.textContent = '16g';
    if (nutriLbl1) nutriLbl1.textContent = 'PROTEÍNA por barra';
    if (nutriVal2) nutriVal2.textContent = '3g';
    if (nutriLbl2) nutriLbl2.textContent = 'FIBRAS ALIMENTARES';
    if (nutriVal3) nutriVal3.textContent = '0g';
    if (nutriLbl3) nutriLbl3.textContent = 'AÇÚCAR ADICIONADO';
    if (nutriVal4) nutriVal4.textContent = '100%';
    if (nutriLbl4) nutriLbl4.textContent = 'PRATICIDADE PROTEICA';
  } else {
    if (nutriVal1) nutriVal1.textContent = '24g';
    if (nutriLbl1) nutriLbl1.textContent = 'PROTEÍNA por porção';
    if (nutriVal2) nutriVal2.textContent = '5,4g';
    if (nutriLbl2) nutriLbl2.textContent = 'BCAAs por porção';
    if (nutriVal3) nutriVal3.textContent = '4g';
    if (nutriLbl3) nutriLbl3.textContent = 'GLUTAMINA por porção';
    if (nutriVal4) nutriVal4.textContent = '100%';
    if (nutriLbl4) nutriLbl4.textContent = 'MATÉRIA-PRIMA importada';
  }

  detailQty = 1;
  if (detailQtyVal) detailQtyVal.textContent = 1;

  if (productDetailModal) productDetailModal.classList.add('open');
};

/* --------------------------------------------------------------------------
   RECOMENDADOR INTERATIVO DE COMBOS DO VENDEDOR VARELA & ADMIN MANAGER
   -------------------------------------------------------------------------- */
let defaultAdminCombosData = {
  massa_pro: {
    id: 'massa_pro',
    name: 'Combo 1: Ganho de Massa PRO',
    title: '🏆 Combo Super Massa PRO (Vendedor Varela)',
    desc: 'Recomendação de Elite para quem treina de 5 a 7x na semana com foco total em Ganho de Massa Muscular e Hipertrofia!',
    img: 'hero_supplements_pedestal.png',
    oldPrice: 319.70,
    price: 249.90,
    saveBadge: 'ECONOMIZE R$ 69,80',
    itemsText: '1x Whey Protein Concentrado 900g | Construção e reparo de tecidos musculares\n1x Creatina Monohidratada 300g | Aumento real de força e volume muscular\n1x Pré-Treino Explosão 300g | Energia brutal e foco mental extremo\n1x Coqueteleira Shaker Simplo (BRINDE) | Misturador profissional grátis'
  },
  massa_essencial: {
    id: 'massa_essencial',
    name: 'Combo 2: Hipertrofia Custo-Benefício',
    title: '🔥 Combo Hipertrofia Essencial',
    desc: 'Indicação perfeita para quem quer acelerar a hipertrofia com o melhor custo-benefício!',
    img: 'hero_supplements_pedestal.png',
    oldPrice: 229.80,
    price: 184.90,
    saveBadge: 'ECONOMIZE R$ 44,90',
    itemsText: '1x Whey Protein Concentrado 900g | Aporte de proteínas diárias de altíssima pureza\n1x Creatina Monohidratada 300g | Síntese de ATP e força contínua\n1x Coqueteleira Shaker Simplo (BRINDE) | Brinde exclusivo da Simplo Suplementos'
  },
  definicao_pro: {
    id: 'definicao_pro',
    name: 'Combo 3: Definição & Emagrecimento PRO',
    title: '⚡ Combo Definição PRO (Vendedor Varela)',
    desc: 'Kit de alta performance para secar gordura mantendo massa magra em treinos diários!',
    img: 'hero_supplements_pedestal.png',
    oldPrice: 279.70,
    price: 219.90,
    saveBadge: 'ECONOMIZE R$ 59,80',
    itemsText: '1x Whey Protein Concentrado 900g | Manutenção da massa magra durante o déficit\n1x Pré-Treino Explosão 300g | Termogênese e queima calórica acelerada\n1x BCAA 2:1:1 200g Pura Nutrição | Proteção muscular de alta intensidade\n1x Coqueteleira Shaker Simplo (BRINDE) | Shaker profissional grátis'
  },
  definicao_essencial: {
    id: 'definicao_essencial',
    name: 'Combo 4: Definição Custo-Benefício',
    title: '⚡ Combo Definição & Shape Trincado',
    desc: 'Montado especialmente focado em Queima de Gordura preservando sua Massa Magra com o menor custo!',
    img: 'hero_supplements_pedestal.png',
    oldPrice: 154.80,
    price: 119.90,
    saveBadge: 'ECONOMIZE R$ 34,90',
    itemsText: '1x Pré-Treino Explosão 300g | Acelera a queima calórica e combate a fadiga\n1x BCAA 2:1:1 200g Pura Nutrição | Anti-catabólico poderoso durante o treino\n1x Protein Bar Chocolate 60g (BRINDE) | Lanche fit proteico para matar a vontade de doce'
  },
  energia_pro: {
    id: 'energia_pro',
    name: 'Combo 5: Energia & Performance PRO',
    title: '🚀 Combo Energia & Explosão Max PRO',
    desc: 'Combinação suprema de energia, pump e foco para treinos de alta carga e rendimento!',
    img: 'hero_supplements_pedestal.png',
    oldPrice: 319.70,
    price: 239.90,
    saveBadge: 'ECONOMIZE R$ 79,80',
    itemsText: '1x Whey Protein Concentrado 900g | Reconstrução acelerada de fibras masculinas\n1x Pré-Treino Explosão 300g | Foco inabalável e vaso-dilatação extrema\n1x Creatina Monohidratada 300g | ATP e força constante nas séries pesadas\n1x Coqueteleira Shaker Simplo (BRINDE) | Misturador profissional grátis'
  },
  energia_essencial: {
    id: 'energia_essencial',
    name: 'Combo 6: Energia & Foco Custo-Benefício',
    title: '🚀 Combo Energia, Pump & Foco Total',
    desc: 'Ideal para transformar seu rendimento nos treinos, eliminando a preguiça!',
    img: 'hero_supplements_pedestal.png',
    oldPrice: 179.80,
    price: 139.90,
    saveBadge: 'ECONOMIZE R$ 39,90',
    itemsText: '1x Pré-Treino Explosão 300g | Vaso-dilatação e energia de sobra\n1x Creatina Monohidratada 300g | Manutenção da resistência muscular em séries pesadas\n1x Coqueteleira Shaker Simplo (BRINDE) | Misturador prático para levar à academia'
  }
};

function getAdminCombosData() {
  const saved = localStorage.getItem('simplo_admin_combos_data');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Garantir que todos os 6 combos existam
      return Object.assign({}, defaultAdminCombosData, parsed);
    } catch (e) { }
  }
  return defaultAdminCombosData;
}

function initAdminCombosManager() {
  const btnSave = document.getElementById('btn-save-admin-combos');
  if (btnSave) {
    btnSave.addEventListener('click', saveAdminCombosConfig);
  }
  renderAdminCombosTab();
}

function renderAdminCombosTab() {
  const data = getAdminCombosData();

  Object.keys(data).forEach(key => {
    const c = data[key];
    const titleEl = document.getElementById(`combo-title-${key}`);
    const badgeEl = document.getElementById(`combo-badge-${key}`);
    const oldPriceEl = document.getElementById(`combo-oldprice-${key}`);
    const priceEl = document.getElementById(`combo-price-${key}`);
    const imgEl = document.getElementById(`combo-img-${key}`);
    const previewImg = document.getElementById(`combo-img-preview-${key}`);
    const descEl = document.getElementById(`combo-desc-${key}`);
    const itemsEl = document.getElementById(`combo-items-${key}`);
    const fileInput = document.getElementById(`combo-imgfile-${key}`);

    if (titleEl && c.title) titleEl.value = c.title;
    if (badgeEl && c.saveBadge) badgeEl.value = c.saveBadge;
    if (oldPriceEl && c.oldPrice) oldPriceEl.value = c.oldPrice;
    if (priceEl && c.price) priceEl.value = c.price;
    if (imgEl && c.img) imgEl.value = c.img;
    if (previewImg && c.img) previewImg.src = c.img;
    if (descEl && c.desc) descEl.value = c.desc;
    if (itemsEl && c.itemsText) itemsEl.value = c.itemsText;

    if (fileInput && !fileInput.dataset.bound) {
      fileInput.dataset.bound = 'true';
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            const imgSrc = evt.target.result;
            if (imgEl) imgEl.value = imgSrc;
            if (previewImg) previewImg.src = imgSrc;
            showToast('📷 Imagem do combo carregada com sucesso!');
          };
          reader.readAsDataURL(file);
        }
      });
    }

    if (imgEl && !imgEl.dataset.bound) {
      imgEl.dataset.bound = 'true';
      imgEl.addEventListener('input', () => {
        if (previewImg) previewImg.src = imgEl.value.trim();
      });
    }
  });
}

function saveAdminCombosConfig() {
  const currentData = getAdminCombosData();

  Object.keys(currentData).forEach(key => {
    const titleEl = document.getElementById(`combo-title-${key}`);
    const badgeEl = document.getElementById(`combo-badge-${key}`);
    const oldPriceEl = document.getElementById(`combo-oldprice-${key}`);
    const priceEl = document.getElementById(`combo-price-${key}`);
    const imgEl = document.getElementById(`combo-img-${key}`);
    const descEl = document.getElementById(`combo-desc-${key}`);
    const itemsEl = document.getElementById(`combo-items-${key}`);

    if (titleEl) currentData[key].title = titleEl.value.trim();
    if (badgeEl) currentData[key].saveBadge = badgeEl.value.trim();
    if (oldPriceEl && oldPriceEl.value) currentData[key].oldPrice = parseFloat(oldPriceEl.value);
    if (priceEl && priceEl.value) currentData[key].price = parseFloat(priceEl.value);
    if (imgEl) currentData[key].img = imgEl.value.trim();
    if (descEl) currentData[key].desc = descEl.value.trim();
    if (itemsEl) currentData[key].itemsText = itemsEl.value.trim();
  });

  localStorage.setItem('simplo_admin_combos_data', JSON.stringify(currentData));
  showToast('⚙️ Configurações de Combos salvas! Preços, brindes e imagens atualizados na loja.');
}

function parseComboItemsText(text) {
  if (!text) return [];
  return text.split('\n').filter(line => line.trim()).map(line => {
    const parts = line.split('|');
    return {
      name: parts[0] ? parts[0].trim() : '',
      detail: parts[1] ? parts[1].trim() : 'Suplemento oficial Simplo Suplementos'
    };
  });
}

// Mapeador Inteligente: Retorna Imagem Recortada sem Fundo, Badge e Instruções de Uso
function getProductInfoForItem(name, detail) {
  const lower = ((name || '') + ' ' + (detail || '')).toLowerCase();

  if (lower.includes('whey') || lower.includes('isolado') || lower.includes('concentrado')) {
    return {
      id: 'p1',
      name: name || 'Whey Protein Concentrado 900g',
      price: 139.90,
      img: 'whey_crop.png',
      badge: 'Pós-Treino',
      badgeBg: 'rgba(255, 107, 0, 0.2)',
      badgeColor: 'var(--primary-orange)',
      badgeBorder: 'rgba(255, 107, 0, 0.45)',
      badgeIcon: 'fa-dumbbell',
      howToTake: 'Tomar 1 scoop (30g) diluído em 200ml de água logo após o treino.'
    };
  }
  if (lower.includes('creatina')) {
    return {
      id: 'p3',
      name: name || 'Creatina Monohidratada 300g',
      price: 89.90,
      img: 'creatina_crop.png',
      badge: 'Uso Diário',
      badgeBg: 'rgba(16, 185, 129, 0.2)',
      badgeColor: 'var(--accent-green)',
      badgeBorder: 'rgba(16, 185, 129, 0.45)',
      badgeIcon: 'fa-clock',
      howToTake: 'Tomar 1 dosador (3g) diariamente em água ou suco (inclusive sem treino).'
    };
  }
  if (lower.includes('pré-treino') || lower.includes('pre-treino') || lower.includes('pretreino') || lower.includes('horus') || lower.includes('hórus') || lower.includes('explosão') || lower.includes('explosao')) {
    return {
      id: 'p2',
      name: name || 'Pré-Treino Explosão 300g',
      price: 89.90,
      img: 'pretreino_crop.png',
      badge: 'Pré-Treino',
      badgeBg: 'rgba(239, 68, 68, 0.2)',
      badgeColor: '#EF4444',
      badgeBorder: 'rgba(239, 68, 68, 0.45)',
      badgeIcon: 'fa-fire-flame-curved',
      howToTake: 'Tomar 1 dose de 20 a 30 minutos antes do treino.'
    };
  }
  if (lower.includes('bcaa') || lower.includes('aminoácid') || lower.includes('aminoacid')) {
    return {
      id: 'p4',
      name: name || 'BCAA 2:1:1 200g Pura Nutrição',
      price: 49.90,
      img: 'pretreino_crop.png',
      badge: 'Anti-Catabólico',
      badgeBg: 'rgba(2, 132, 199, 0.2)',
      badgeColor: 'var(--accent-cyan)',
      badgeBorder: 'rgba(2, 132, 199, 0.45)',
      badgeIcon: 'fa-shield-halved',
      howToTake: 'Consumir 5g antes ou após os treinos intensos.'
    };
  }
  if (lower.includes('protein bar') || lower.includes('barra') || lower.includes('barrinha') || lower.includes('snack')) {
    return {
      id: 'p5',
      name: name || 'Protein Bar Chocolate 60g',
      price: 14.90,
      img: 'protein_bar_crop.png',
      badge: 'Lanche Proteico',
      badgeBg: 'rgba(234, 179, 8, 0.2)',
      badgeColor: 'var(--accent-yellow)',
      badgeBorder: 'rgba(234, 179, 8, 0.45)',
      badgeIcon: 'fa-cookie-bite',
      howToTake: '1 barra como lanche proteico prático no intervalo das refeições.'
    };
  }
  if (lower.includes('coqueteleira') || lower.includes('shaker') || lower.includes('garrafa') || lower.includes('misturador')) {
    return {
      id: 'brinde_shaker',
      name: name || 'Coqueteleira Shaker Simplo (BRINDE)',
      price: 0,
      img: 'shaker_crop.png',
      badge: 'Brinde VIP',
      badgeBg: 'rgba(16, 185, 129, 0.25)',
      badgeColor: 'var(--accent-green)',
      badgeBorder: 'rgba(16, 185, 129, 0.5)',
      badgeIcon: 'fa-gift',
      howToTake: 'Coqueteleira oficial para preparar suas doses com praticidade.'
    };
  }

  // Fallback se for algum produto customizado
  const matchStock = (typeof stockData !== 'undefined' && Array.isArray(stockData))
    ? stockData.find(s => s.name && s.name.toLowerCase().includes(lower.substring(0, 10)))
    : null;

  if (matchStock) {
    return {
      id: matchStock.id,
      name: name,
      price: matchStock.price || 49.90,
      img: matchStock.imgSrc || 'whey_crop.png',
      badge: 'Suplemento Recomendado',
      badgeBg: 'rgba(255, 107, 0, 0.2)',
      badgeColor: 'var(--primary-orange)',
      badgeBorder: 'rgba(255, 107, 0, 0.45)',
      badgeIcon: 'fa-circle-check',
      howToTake: 'Consumir conforme orientação da embalagem'
    };
  }

  return {
    id: 'prod_custom_' + Math.random().toString(36).substr(2, 4),
    name: name,
    price: 49.90,
    img: 'whey_crop.png',
    badge: 'Suplemento Indicado',
    badgeBg: 'rgba(255, 107, 0, 0.2)',
    badgeColor: 'var(--primary-orange)',
    badgeBorder: 'rgba(255, 107, 0, 0.45)',
    badgeIcon: 'fa-circle-check',
    howToTake: 'Consumir conforme orientação da embalagem'
  };
}

let quizState = {
  frequency: '',
  frequencyLabel: '',
  goal: '',
  goalLabel: '',
  investment: '',
  generatedCombo: null
};

window.selectQuizStep = function (step, value, label) {
  if (step === 1) {
    quizState.frequency = value;
    quizState.frequencyLabel = label;
    goToQuizStep(2);
  } else if (step === 2) {
    quizState.goal = value;
    quizState.goalLabel = label;
    goToQuizStep(3);
  }
};

window.goToQuizStep = function (stepNum) {
  for (let i = 1; i <= 3; i++) {
    const stepEl = document.getElementById(`quiz-step-${i}`);
    const dotEl = document.getElementById(`step-dot-${i}`);
    if (stepEl) stepEl.style.display = (i === stepNum) ? 'block' : 'none';
    if (dotEl) {
      if (i === stepNum) dotEl.classList.add('active');
      else dotEl.classList.remove('active');
    }
  }

  const resultEl = document.getElementById('quiz-step-result');
  if (resultEl) resultEl.style.display = 'none';

  const labelEl = document.getElementById('quiz-step-label');
  if (labelEl) {
    if (stepNum === 1) labelEl.textContent = 'Passo 1 de 3: Frequência de Treino';
    else if (stepNum === 2) labelEl.textContent = 'Passo 2 de 3: Objetivo Principal';
    else if (stepNum === 3) labelEl.textContent = 'Passo 3 de 3: Perfil de Investimento';
  }
};

window.finishQuiz = function (investmentVal) {
  quizState.investment = investmentVal;
  calculateRecommendedCombo();
};

window.restartQuiz = function () {
  quizState = { frequency: '', frequencyLabel: '', goal: '', goalLabel: '', investment: '', generatedCombo: null };
  goToQuizStep(1);
};

function calculateRecommendedCombo() {
  const { frequency, goal, investment } = quizState;
  const combos = getAdminCombosData();

  let targetKey = 'massa_essencial';

  if (goal === 'massa') {
    if (investment === 'pro' || frequency === '5-7') {
      targetKey = 'massa_pro';
    } else {
      targetKey = 'massa_essencial';
    }
  } else if (goal === 'definicao') {
    if (investment === 'pro' || frequency === '5-7') {
      targetKey = 'definicao_pro';
    } else {
      targetKey = 'definicao_essencial';
    }
  } else if (goal === 'energia') {
    if (investment === 'pro' || frequency === '5-7') {
      targetKey = 'energia_pro';
    } else {
      targetKey = 'energia_essencial';
    }
  }

  const rawCombo = combos[targetKey] || combos['massa_pro'];
  const items = parseComboItemsText(rawCombo.itemsText);

  // Mapeia TODOS os produtos que o usuário deve tomar com imagens, badges e instruções completas
  const resolvedProducts = items.map(it => {
    const info = getProductInfoForItem(it.name, it.detail);
    return {
      ...info,
      originalName: it.name,
      detail: it.detail
    };
  });

  const combo = {
    title: rawCombo.title,
    desc: rawCombo.desc,
    img: rawCombo.img,
    items: items,
    resolvedProducts: resolvedProducts,
    oldPrice: rawCombo.oldPrice,
    price: rawCombo.price,
    saveBadge: rawCombo.saveBadge
  };

  quizState.generatedCombo = combo;

  for (let i = 1; i <= 3; i++) {
    const stepEl = document.getElementById(`quiz-step-${i}`);
    if (stepEl) stepEl.style.display = 'none';
  }
  const resultEl = document.getElementById('quiz-step-result');
  if (resultEl) resultEl.style.display = 'block';

  const labelEl = document.getElementById('quiz-step-label');
  if (labelEl) labelEl.textContent = 'Indicação Pronta: Seu Protocolo Personalizado';

  const titleEl = document.getElementById('result-combo-title');
  if (titleEl) titleEl.textContent = combo.title;

  const descEl = document.getElementById('result-combo-desc');
  if (descEl) descEl.textContent = combo.desc;

  const oldPriceEl = document.getElementById('result-combo-oldprice');
  if (oldPriceEl) oldPriceEl.textContent = `R$ ${combo.oldPrice.toFixed(2).replace('.', ',')}`;

  const priceEl = document.getElementById('result-combo-price');
  if (priceEl) priceEl.textContent = `R$ ${combo.price.toFixed(2).replace('.', ',')}`;

  const badgeEl = document.getElementById('result-combo-badge');
  if (badgeEl) badgeEl.textContent = combo.saveBadge;

  // 1. RENDERIZA AS IMAGENS SEM FUNDO JUNTAS NO PALCO CENTRAL (SEM CARDS INDIVIDUAIS)
  const unifiedStage = document.getElementById('result-combo-unified-stage');
  if (unifiedStage) {
    // Organiza para que o produto mais alto (ex: Whey) fique centralizado e os outros ladeando
    const stageItems = [...resolvedProducts];
    const wheyIdx = stageItems.findIndex(p => p.id === 'p1');
    if (wheyIdx > -1 && stageItems.length >= 3) {
      const whey = stageItems.splice(wheyIdx, 1)[0];
      const mid = Math.floor(stageItems.length / 2);
      stageItems.splice(mid, 0, whey);
    }

    const total = stageItems.length;
    unifiedStage.innerHTML = stageItems.map((p, idx) => {
      // Determina classe de tamanho e profundidade
      const isWhey = p.id === 'p1';
      const isShaker = p.id === 'brinde_shaker';
      const isBar = p.id === 'p5';
      const sizeClass = isWhey ? 'tall' : (isBar ? 'small' : (isShaker ? 'tall' : 'medium'));
      
      // Camada z-index: itens centrais mais à frente
      const distFromCenter = Math.abs(idx - (total - 1) / 2);
      const zIndex = Math.max(1, 6 - Math.round(distFromCenter * 2));

      return `
        <div class="combo-stage-item ${sizeClass}" style="z-index: ${zIndex};" title="${p.originalName}">
          <img src="${p.img}" alt="${p.originalName}" class="combo-stage-item-img">
        </div>
      `;
    }).join('');
  }

  // 2. RENDERIZA O PROTOCOLO DE ROTINA DIÁRIA (COMO TOMAR CADA UM, SEM FORMATO DE CARD)
  const routineList = document.getElementById('result-combo-routine-list');
  if (routineList) {
    routineList.innerHTML = resolvedProducts.map(p => `
      <div class="combo-routine-item">
        <div class="combo-routine-thumb">
          <img src="${p.img}" alt="${p.originalName}">
        </div>
        <div class="combo-routine-body">
          <div class="combo-routine-top">
            <span class="combo-routine-prod-name">${p.originalName}</span>
            <span class="combo-routine-badge" style="color: ${p.badgeColor}; background: ${p.badgeBg}; border: 1px solid ${p.badgeBorder};">
              <i class="fa-solid ${p.badgeIcon}"></i> ${p.badge}
            </span>
          </div>
          <p class="combo-routine-instruction">
            <strong>Como tomar:</strong> ${p.howToTake}
          </p>
        </div>
      </div>
    `).join('');
  }

  // Compatibilidade com elementos legados caso existam
  const legacyComboImg = document.getElementById('result-combo-img');
  if (legacyComboImg) legacyComboImg.src = combo.img;
  const legacyItemsUl = document.getElementById('result-combo-items');
  if (legacyItemsUl) {
    legacyItemsUl.innerHTML = resolvedProducts.map(p => `<li>${p.originalName}</li>`).join('');
  }

  // 3. Adicionar Todos os Produtos ao Carrinho da Loja
  const btnAddCombo = document.getElementById('btn-add-quiz-combo');
  if (btnAddCombo) {
    btnAddCombo.onclick = function () {
      resolvedProducts.forEach(prod => {
        const existing = cart.find(item => item.id === prod.id);
        if (existing) {
          existing.qty += 1;
        } else {
          cart.push({
            id: prod.id,
            name: prod.originalName,
            price: prod.price,
            imgSrc: prod.img,
            qty: 1
          });
        }
      });
      renderCart();
      showToast(`🛒 Todos os produtos do seu combo foram adicionados ao carrinho!`);
      const cartOverlay = document.getElementById('cart-overlay');
      if (cartOverlay) cartOverlay.classList.add('open');
    };
  }
}

/* --------------------------------------------------------------------------
   SUPABASE CLOUD DATABASE REAL-TIME INTEGRATION & FIXED CONNECTION MANAGER
   -------------------------------------------------------------------------- */
const DEFAULT_SUPABASE_URL = 'https://gojwbyqfywmofspnirqk.supabase.co';
let supabaseClient = null;
let supabaseChannel = null;
let supabaseRetryCount = 0;
let supabaseHeartbeatTimer = null;
let isSupabaseConnecting = false;

window.initSupabaseClient = async function initSupabaseClient() {
  let storedUrl = localStorage.getItem('simplo_supabase_url') || DEFAULT_SUPABASE_URL;
  let storedKey = localStorage.getItem('simplo_supabase_key') || '';

  const urlInput = document.getElementById('input-supabase-url');
  const keyInput = document.getElementById('input-supabase-key');

  if (urlInput && !urlInput.value) urlInput.value = storedUrl;
  if (keyInput && storedKey && !keyInput.value) keyInput.value = storedKey;

  const badge = document.getElementById('supabase-status-badge');

  // Aguardar carregamento da biblioteca Supabase JS CDN se ainda estiver baixando
  if (typeof window.supabase === 'undefined') {
    if (supabaseRetryCount < 15) {
      supabaseRetryCount++;
      if (badge) {
        badge.className = 'stock-status-badge status-low';
        badge.innerHTML = '🟡 Carregando SDK Supabase...';
      }
      setTimeout(initSupabaseClient, 500);
      return;
    } else {
      if (badge) {
        badge.className = 'stock-status-badge status-danger';
        badge.innerHTML = '🔴 SDK Supabase não carregado';
      }
      return;
    }
  }

  // Se não houver chave salva, avisar no painel
  if (!storedUrl || !storedKey) {
    if (badge) {
      badge.className = 'stock-status-badge status-low';
      badge.innerHTML = '🟡 Local (Aguardando Chave)';
    }
    return;
  }

  if (isSupabaseConnecting) return;
  isSupabaseConnecting = true;

  try {
    if (badge) {
      badge.className = 'stock-status-badge status-low';
      badge.innerHTML = '🟡 Conectando ao Supabase...';
    }

    // Criar cliente Supabase com persistência de sessão e auto-reconexão
    supabaseClient = window.supabase.createClient(storedUrl, storedKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });

    // Testar Conexão REST/DB
    const { data, error } = await supabaseClient.from('products').select('id').limit(1);

    if (error) {
      console.error('Erro na resposta do Supabase:', error);
      if (badge) {
        badge.className = 'stock-status-badge status-danger';
        badge.innerHTML = '🔴 Erro na Chave do Supabase';
      }
      isSupabaseConnecting = false;
      return;
    }

    supabaseRetryCount = 0;

    if (badge) {
      badge.className = 'stock-status-badge status-ok';
      badge.innerHTML = '🟢 Supabase Conectado (Nuvem)';
    }

    // Iniciar Sincronização de Dados de Entrada e Saída
    await fetchSupabaseData();

    // Inscrição Realtime com reconexão automática
    setupSupabaseRealtimeChannel(badge);

    // Iniciar Heartbeat para manter a conexão ativa (a cada 30 seg)
    startSupabaseHeartbeat();

  } catch (e) {
    console.error('Erro ao conectar ao Supabase:', e);
    if (badge) {
      badge.className = 'stock-status-badge status-danger';
      badge.innerHTML = '🔴 Erro de Conexão (Reconectando...)';
    }
    // Tentar reconectar em 5 segundos
    setTimeout(() => {
      isSupabaseConnecting = false;
      initSupabaseClient();
    }, 5000);
  } finally {
    isSupabaseConnecting = false;
  }
};

function setupSupabaseRealtimeChannel(badge) {
  if (!supabaseClient) return;

  if (supabaseChannel) {
    try {
      supabaseClient.removeChannel(supabaseChannel);
    } catch (err) { }
  }

  supabaseChannel = supabaseClient
    .channel('public:orders_and_products')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
      if (payload.eventType === 'INSERT') {
        const newOrd = payload.new;
        if (!ordersData.find(o => o.id === newOrd.id)) {
          ordersData.unshift({
            id: newOrd.id,
            client: newOrd.client,
            phone: newOrd.phone,
            formattedPhone: newOrd.formatted_phone || newOrd.phone,
            address: newOrd.address,
            payment: newOrd.payment,
            items: newOrd.items,
            total: newOrd.total,
            status: newOrd.status,
            approvalState: newOrd.approval_state || 'pending',
            class: newOrd.status.includes('Concluído') ? 'status-ok' : (newOrd.status.includes('Reprovado') ? 'status-danger' : 'status-low')
          });
          saveOrdersToLocalStorage();
          renderOrdersTable();
          updateAdminKpis();
          showToast(`⚡ NOVO PEDIDO RECEBIDO DA NUVEM! (${newOrd.id} - ${newOrd.client})`);
        }
      } else if (payload.eventType === 'UPDATE') {
        const updated = payload.new;
        const target = ordersData.find(o => o.id === updated.id);
        if (target) {
          target.status = updated.status;
          target.approvalState = updated.approval_state;
          target.class = updated.status.includes('Concluído') ? 'status-ok' : (updated.status.includes('Reprovado') ? 'status-danger' : 'status-low');
          saveOrdersToLocalStorage();
          renderOrdersTable();
          updateAdminKpis();
        }
      }
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
      if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
        const p = payload.new;
        let item = stockData.find(s => s.id === p.id);
        if (item) {
          item.name = p.name || item.name;
          item.brand = p.brand || item.brand;
          item.price = p.price !== undefined ? p.price : item.price;
          item.oldPrice = p.old_price || item.oldPrice;
          item.stock = p.stock !== undefined ? p.stock : item.stock;
          item.isPaused = p.is_paused !== undefined ? p.is_paused : item.isPaused;
          item.category = p.category || item.category;
          item.desc = p.description || item.desc;
          item.imgSrc = p.img_src || item.imgSrc;
          item.status = item.stock === 0 ? 'danger' : (item.stock <= 10 ? 'low' : 'ok');
        } else {
          item = {
            id: p.id,
            name: p.name,
            brand: p.brand,
            price: p.price,
            oldPrice: p.old_price || p.price * 1.25,
            stock: p.stock,
            sales: p.sales || 0,
            category: p.category || 'hipertrofia',
            desc: p.description || '',
            imgSrc: p.img_src || 'whey_integralmedica.png',
            rank: '-',
            status: p.stock === 0 ? 'danger' : (p.stock <= 10 ? 'low' : 'ok'),
            isPaused: p.is_paused || false
          };
          stockData.push(item);
          showToast(`⚡ NOVO PRODUTO ADICIONADO À LOJA VIA NUVEM! (${p.name})`);
        }

        // Salvar no localStorage
        const savedProds = JSON.parse(localStorage.getItem('simplo_custom_products') || '[]');
        const idx = savedProds.findIndex(sp => sp.id === item.id);
        if (idx >= 0) savedProds[idx] = item;
        else savedProds.push(item);
        localStorage.setItem('simplo_custom_products', JSON.stringify(savedProds));

        if (typeof ensureProductCardOnStorefront === 'function') ensureProductCardOnStorefront(item);
        renderAdminTable('all');
        renderManageProductsTable();
        updateStoreStockBadges();
      } else if (payload.eventType === 'DELETE') {
        const deletedId = payload.old ? payload.old.id : null;
        if (deletedId) {
          stockData = stockData.filter(s => s.id !== deletedId);
          const card = document.querySelector(`.product-card[data-id="${deletedId}"]`);
          if (card) card.remove();
          renderAdminTable('all');
          renderManageProductsTable();
          updateStoreStockBadges();
        }
      }
    })
    .subscribe((status) => {
      console.log('Status da Conexão Realtime Supabase:', status);
      if (status === 'SUBSCRIBED') {
        if (badge) {
          badge.className = 'stock-status-badge status-ok';
          badge.innerHTML = '🟢 Supabase Conectado (Realtime ON)';
        }
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        if (badge) {
          badge.className = 'stock-status-badge status-low';
          badge.innerHTML = '🟡 Reconectando Realtime...';
        }
        setTimeout(() => {
          if (supabaseClient) setupSupabaseRealtimeChannel(badge);
        }, 3000);
      }
    });
}

function startSupabaseHeartbeat() {
  if (supabaseHeartbeatTimer) clearInterval(supabaseHeartbeatTimer);
  supabaseHeartbeatTimer = setInterval(async () => {
    if (!supabaseClient) return;
    try {
      const { error } = await supabaseClient.from('products').select('id').limit(1);
      if (error) {
        console.warn('Alerta do Supabase Heartbeat: Falha de ping REST. Tentando reconectar...', error);
        initSupabaseClient();
      }
    } catch (e) {
      console.warn('Erro de rede no Heartbeat do Supabase:', e);
      initSupabaseClient();
    }
  }, 30000);
}

// Auto-reconectar em eventos do sistema
window.addEventListener('online', () => {
  console.log('⚡ Conexão de Internet restabelecida. Reconectando ao Supabase...');
  initSupabaseClient();
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    initSupabaseClient();
  }
});

window.saveSupabaseConfig = async function saveSupabaseConfig() {
  const urlInput = document.getElementById('input-supabase-url');
  const keyInput = document.getElementById('input-supabase-key');

  let url = urlInput && urlInput.value.trim() ? urlInput.value.trim() : DEFAULT_SUPABASE_URL;
  let key = keyInput ? keyInput.value.trim() : '';

  if (urlInput) urlInput.value = url;

  if (!key) {
    showToast('⚠️ Cole a sua Chave Pública (Publishable Key / Anon Key) no campo indicado!');
    if (keyInput) keyInput.focus();
    return;
  }

  localStorage.setItem('simplo_supabase_url', url);
  localStorage.setItem('simplo_supabase_key', key);

  showToast('⚡ Conexão salva e fixada! Testando sincronização em tempo real...');
  await initSupabaseClient();
};

async function fetchSupabaseData() {
  if (!supabaseClient) return;
  try {
    // 1. Pedidos da Nuvem
    const { data: dbOrders, error: errOrders } = await supabaseClient.from('orders').select('*').order('created_at', { ascending: false });
    if (!errOrders && dbOrders) {
      if (dbOrders.length > 0) {
        dbOrders.forEach(o => {
          const target = ordersData.find(local => local.id === o.id);
          if (!target) {
            ordersData.push({
              id: o.id,
              client: o.client,
              phone: o.phone,
              formattedPhone: o.formatted_phone || o.phone,
              address: o.address,
              payment: o.payment,
              items: o.items,
              total: o.total,
              status: o.status,
              approvalState: o.approval_state || 'pending',
              class: o.status.includes('Concluído') ? 'status-ok' : (o.status.includes('Reprovado') ? 'status-danger' : 'status-low')
            });
          } else {
            target.status = o.status;
            target.approvalState = o.approval_state || 'pending';
          }
        });
        saveOrdersToLocalStorage();
        renderOrdersTable();
        updateAdminKpis();
      }

      // Enviar pedidos locais para a nuvem se não existirem no Supabase
      ordersData.forEach(o => {
        const foundInDb = dbOrders.find(db => db.id === o.id);
        if (!foundInDb) {
          syncOrderToSupabase(o);
        }
      });
    }

    // 2. Produtos do Estoque
    const { data: dbProducts, error: errProds } = await supabaseClient.from('products').select('*');
    if (!errProds && dbProducts) {
      if (dbProducts.length > 0) {
        dbProducts.forEach(p => {
          let existing = stockData.find(s => s.id === p.id);
          if (existing) {
            existing.stock = p.stock;
            existing.isPaused = p.is_paused;
            existing.price = p.price || existing.price;
            if (p.category) existing.category = p.category;
            if (p.img_src) existing.imgSrc = p.img_src;
            existing.status = p.stock === 0 ? 'danger' : (p.stock <= 10 ? 'low' : 'ok');
            if (typeof ensureProductCardOnStorefront === 'function') ensureProductCardOnStorefront(existing);
          } else {
            const newProd = {
              id: p.id,
              name: p.name,
              brand: p.brand,
              price: p.price,
              oldPrice: p.old_price || p.price * 1.25,
              stock: p.stock,
              sales: p.sales || 0,
              category: p.category || 'hipertrofia',
              desc: p.description || '',
              imgSrc: p.img_src || 'whey_integralmedica.png',
              rank: '-',
              status: p.stock === 0 ? 'danger' : (p.stock <= 10 ? 'low' : 'ok'),
              isPaused: p.is_paused || false
            };
            stockData.push(newProd);
            if (typeof ensureProductCardOnStorefront === 'function') ensureProductCardOnStorefront(newProd);
          }
        });
        renderAdminTable('all');
        renderManageProductsTable();
        updateStoreStockBadges();
      }

      // Sincronizar produtos locais com a nuvem
      stockData.forEach(s => {
        const foundInDb = dbProducts.find(db => db.id === s.id);
        if (!foundInDb) {
          syncStockToSupabase(s.id, s.stock, s.isPaused);
        }
      });
    }

    // 3. Categorias e Imagens da Loja
    const { data: catSetting } = await supabaseClient.from('store_settings').select('*').eq('key', 'simplo_store_categories').single();
    if (catSetting && catSetting.value) {
      try {
        const parsedCats = JSON.parse(catSetting.value);
        if (Array.isArray(parsedCats) && parsedCats.length > 0) {
          storeCategories = parsedCats;
          saveCategoriesToStorage();
          renderCategoryControls();
        }
      } catch (e) { }
    }
  } catch (e) {
    console.error('Erro ao buscar dados do Supabase:', e);
  }
}

async function syncOrderToSupabase(orderObj) {
  if (!supabaseClient || !orderObj) return;
  try {
    await supabaseClient.from('orders').upsert({
      id: orderObj.id,
      client: orderObj.client,
      phone: orderObj.phone,
      formatted_phone: orderObj.formattedPhone,
      address: orderObj.address,
      payment: orderObj.payment,
      items: orderObj.items,
      total: orderObj.total,
      status: orderObj.status,
      approval_state: orderObj.approvalState
    });
  } catch (e) {
    console.error('Erro ao sincronizar pedido no Supabase', e);
  }
}

async function syncStockToSupabase(id, stockVal, isPausedVal) {
  if (!supabaseClient) return;
  try {
    const item = stockData.find(s => s.id === id);
    if (!item) return;
    await supabaseClient.from('products').upsert({
      id: item.id,
      name: item.name,
      brand: item.brand,
      price: item.price || 99.90,
      old_price: item.oldPrice || item.price * 1.25,
      stock: stockVal !== undefined ? stockVal : item.stock,
      category: item.category || 'hipertrofia',
      description: item.desc || '',
      img_src: item.imgSrc || '',
      is_paused: isPausedVal !== undefined ? isPausedVal : item.isPaused,
      sales: item.sales || 0
    });
  } catch (e) {
    console.error('Erro ao sincronizar estoque no Supabase', e);
  }
}

window.ensureProductCardOnStorefront = function ensureProductCardOnStorefront(item) {
  if (!item || !item.id) return;
  const productsGrid = document.querySelector('.products-grid-5cols') || document.querySelector('.products-grid');
  if (!productsGrid) return;

  let card = document.querySelector(`.product-card[data-id="${item.id}"]`);
  if (card) {
    card.setAttribute('data-category', item.category || 'hipertrofia');
    if (item.isPaused) card.classList.add('paused-card');
    else card.classList.remove('paused-card');

    const imgEl = card.querySelector('.product-img');
    if (imgEl && item.imgSrc) imgEl.src = item.imgSrc;

    const nameEl = card.querySelector('.product-name');
    if (nameEl && item.name) nameEl.innerText = item.name.toUpperCase();

    const priceEl = card.querySelector('.current-price');
    if (priceEl && item.price) priceEl.innerText = `R$ ${item.price.toFixed(2).replace('.', ',')}`;
    return;
  }

  const newCard = document.createElement('div');
  newCard.className = 'product-card' + (item.isPaused ? ' paused-card' : '');
  newCard.setAttribute('data-id', item.id);
  newCard.setAttribute('data-category', item.category || 'hipertrofia');
  newCard.style.animation = 'fadeIn 0.5s ease';

  newCard.innerHTML = `
    <div class="product-img-wrap" onclick="openProductDetail('${item.id}')" style="cursor:pointer;">
      <img src="${item.imgSrc || 'whey_integralmedica.png'}" alt="${item.name}" class="product-img">
    </div>
    <div class="product-info">
      <h3 class="product-name" onclick="openProductDetail('${item.id}')" style="cursor:pointer;">${(item.name || '').toUpperCase()}</h3>
      <div class="product-rating">
        <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
        <span>(0)</span>
      </div>
      <div class="product-price-row">
        <span class="current-price">R$ ${(item.price || 0).toFixed(2).replace('.', ',')}</span>
      </div>
      <button class="btn-add-cart">
        COMPRAR <i class="fa-solid fa-cart-shopping"></i>
      </button>
    </div>
  `;

  productsGrid.appendChild(newCard);
};

async function deleteProductFromSupabase(id) {
  if (!supabaseClient) return;
  try {
    await supabaseClient.from('products').delete().eq('id', id);
  } catch (e) {
    console.error('Erro ao deletar produto do Supabase', e);
  }
}

async function syncCategoriesToSupabase() {
  if (!supabaseClient) return;
  try {
    await supabaseClient.from('store_settings').upsert({
      key: 'simplo_store_categories',
      value: JSON.stringify(storeCategories),
      updated_at: new Date().toISOString()
    });
  } catch (e) {
    console.error('Erro ao sincronizar categorias no Supabase', e);
  }
}
