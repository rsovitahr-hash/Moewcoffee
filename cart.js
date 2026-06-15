/* =============================================
   ANTEIKU COFFEE — cart.js
   Shopping cart logic, shared across all pages
   ============================================= */

const Cart = (() => {
  const STORAGE_KEY = "anteiku_cart";

  /* ---- State ---- */
  let items = load();

  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  /* ---- Core operations ---- */
  function add(name, price) {
    const existing = items.find(i => i.name === name);
    if (existing) {
      existing.qty += 1;
    } else {
      items.push({ name, price: parseFloat(price), qty: 1 });
    }
    save();
    render();
    showToast(`Added "${name}" to cart`);
  }

  function remove(name) {
    items = items.filter(i => i.name !== name);
    save();
    render();
  }

  function updateQty(name, delta) {
    const item = items.find(i => i.name === name);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
      remove(name);
      return;
    }
    save();
    render();
  }

  function clear() {
    items = [];
    save();
    render();
  }

  function total() {
    return items.reduce((sum, i) => sum + i.price * i.qty, 0);
  }

  function totalQty() {
    return items.reduce((sum, i) => sum + i.qty, 0);
  }

  /* ---- UI Rendering ---- */
  function render() {
    const list  = document.getElementById("cart-items-list");
    const badge = document.getElementById("cart-badge");
    const totalEl = document.getElementById("cart-total-price");

    if (!list) return;

    const qty = totalQty();

    // Badge
    badge.textContent = qty;
    badge.classList.toggle("visible", qty > 0);

    // Total
    if (totalEl) totalEl.textContent = `$${total().toFixed(2)}`;

    // List
    if (items.length === 0) {
      list.innerHTML = `
        <div class="cart-empty">
          <span class="cart-empty-icon">☕</span>
          Your cart is empty.<br>Add something from the menu!
        </div>`;
      return;
    }

    list.innerHTML = items.map(item => `
      <div class="cart-item" data-name="${escHtml(item.name)}">
        <div class="cart-item-info">
          <div class="cart-item-name">${escHtml(item.name)}</div>
          <div class="cart-item-price">$${item.price.toFixed(2)} each</div>
        </div>
        <div class="cart-item-qty">
          <button class="qty-btn" data-action="dec" data-name="${escHtml(item.name)}">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" data-action="inc" data-name="${escHtml(item.name)}">+</button>
        </div>
        <button class="cart-item-remove" data-name="${escHtml(item.name)}" title="Remove">✕</button>
      </div>
    `).join("");

    // Attach qty/remove listeners
    list.querySelectorAll(".qty-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const delta = btn.dataset.action === "inc" ? 1 : -1;
        updateQty(btn.dataset.name, delta);
      });
    });

    list.querySelectorAll(".cart-item-remove").forEach(btn => {
      btn.addEventListener("click", () => remove(btn.dataset.name));
    });
  }

  function escHtml(str) {
    return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }

  /* ---- Toast ---- */
  function showToast(msg) {
    let toast = document.getElementById("cart-toast");
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove("show"), 2500);
  }

  /* ---- Sidebar toggle ---- */
  function initSidebar() {
    const openBtn  = document.getElementById("cart-open-btn");
    const closeBtn = document.getElementById("cart-close-btn");
    const sidebar  = document.getElementById("cart-sidebar");
    const overlay  = document.getElementById("cart-overlay");
    const clearBtn = document.getElementById("cart-clear-btn");
    const checkoutBtn = document.getElementById("cart-checkout-btn");

    if (!openBtn || !sidebar) return;

    openBtn.addEventListener("click",  () => openCart());
    closeBtn.addEventListener("click", () => closeCart());
    overlay.addEventListener("click",  () => closeCart());

    if (clearBtn) clearBtn.addEventListener("click", () => {
      if (confirm("Clear your entire cart?")) clear();
    });

    if (checkoutBtn) checkoutBtn.addEventListener("click", handleCheckout);
  }

  function openCart() {
    document.getElementById("cart-sidebar").classList.add("open");
    document.getElementById("cart-overlay").classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeCart() {
    document.getElementById("cart-sidebar").classList.remove("open");
    document.getElementById("cart-overlay").classList.remove("open");
    document.body.style.overflow = "";
  }

  function handleCheckout() {
    if (items.length === 0) {
      showToast("Your cart is empty!");
      return;
    }
    showToast(`Order placed! Total: $${total().toFixed(2)} ☕`);
    setTimeout(() => {
      clear();
      closeCart();
    }, 1500);
  }

  /* ---- Init ---- */
  function init() {
    initSidebar();
    render();

    // "Add to cart" buttons anywhere on the page
    document.querySelectorAll("[data-add-to-cart]").forEach(btn => {
      btn.addEventListener("click", () => {
        add(btn.dataset.name, btn.dataset.price);
      });
    });
  }

  // Auto-init when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  return { add, remove, updateQty, clear, total, totalQty, open: openCart, close: closeCart };
})();
