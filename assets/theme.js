(function () {
  const selectors = {
    cartShell: '[data-cart-shell]',
    cartDrawer: '[data-cart-drawer]',
    cartItems: '[data-cart-items]',
    cartCount: '[data-cart-count]',
    cartSubtotal: '[data-cart-subtotal]'
  };

  const moneyFormat = window.LMRA && window.LMRA.moneyFormat ? window.LMRA.moneyFormat : '${{amount}}';

  function formatMoney(cents) {
    const value = (Number(cents || 0) / 100).toFixed(2);
    return moneyFormat
      .replace(/\{\{\s*amount_with_comma_separator\s*\}\}/, value.replace('.', ','))
      .replace(/\{\{\s*amount\s*\}\}/, value);
  }

  function getCartShell() {
    return document.querySelector(selectors.cartShell);
  }

  function openCart() {
    const shell = getCartShell();
    const drawer = document.querySelector(selectors.cartDrawer);
    if (!shell || !drawer) return;
    shell.hidden = false;
    document.body.classList.add('cart-open');
    drawer.focus();
  }

  function closeCart() {
    const shell = getCartShell();
    if (!shell) return;
    shell.hidden = true;
    document.body.classList.remove('cart-open');
  }

  async function fetchCart() {
    const response = await fetch('/cart.js', {
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) throw new Error('Could not load cart.');
    return response.json();
  }

  async function refreshCart(openAfterRefresh) {
    const cart = await fetchCart();
    renderCart(cart);
    if (openAfterRefresh) openCart();
    return cart;
  }

  function renderCart(cart) {
    document.querySelectorAll(selectors.cartCount).forEach((node) => {
      node.textContent = cart.item_count;
    });

    document.querySelectorAll(selectors.cartSubtotal).forEach((node) => {
      node.textContent = `${formatMoney(cart.total_price)} ${cart.currency || ''}`.trim();
    });

    const itemsContainer = document.querySelector(selectors.cartItems);
    if (!itemsContainer) return;

    if (!cart.items.length) {
      itemsContainer.innerHTML = '<p class="cart-drawer__empty">Your cart is empty.</p>';
      return;
    }

    itemsContainer.innerHTML = cart.items.map((item) => {
      const image = item.image || '';
      const variant = item.variant_title && item.variant_title !== 'Default Title' ? item.variant_title : '';
      const comparePrice = item.variant_options && item.original_line_price > item.final_line_price
        ? `<s>${formatMoney(item.original_line_price)}</s>`
        : '';

      return `
        <div class="cart-item" data-line-key="${item.key}">
          <img src="${image}" alt="${escapeHtml(item.product_title)}" width="90" height="90">
          <div class="cart-item__details">
            <h3>${escapeHtml(item.product_title)}</h3>
            <p>${escapeHtml(variant)}</p>
            <div class="cart-item__controls">
              <button type="button" data-cart-decrement aria-label="Decrease quantity">-</button>
              <span>${item.quantity}</span>
              <button type="button" data-cart-increment aria-label="Increase quantity">+</button>
              <button class="cart-item__remove" type="button" data-cart-remove aria-label="Remove item">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18m-2 0-.7 14H5.7L5 6m4 0V4h6v2"/></svg>
              </button>
            </div>
          </div>
          <div class="cart-item__price">
            ${comparePrice}
            <strong>${formatMoney(item.final_line_price)}</strong>
          </div>
        </div>
      `;
    }).join('');
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  async function changeCartItem(key, quantity) {
    const response = await fetch('/cart/change.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({ id: key, quantity })
    });
    if (!response.ok) throw new Error('Could not update cart.');
    const cart = await response.json();
    renderCart(cart);
  }

  function initGallery(scope) {
    scope.querySelectorAll('[data-product-section]').forEach((section) => {
      const main = section.querySelector('[data-gallery-main]');
      if (!main) return;

      section.querySelectorAll('[data-gallery-thumb]').forEach((thumb) => {
        thumb.addEventListener('click', () => {
          const full = thumb.getAttribute('data-full');
          if (full) main.src = full;
          const img = thumb.querySelector('img');
          if (img && img.alt) main.alt = img.alt;
          section.querySelectorAll('[data-gallery-thumb]').forEach((node) => node.classList.remove('is-active'));
          thumb.classList.add('is-active');
        });
      });
    });
  }

  function initProductForms(scope) {
    scope.querySelectorAll('[data-product-section]').forEach((section) => {
      const form = section.querySelector('[data-product-form]');
      if (!form) return;

      const variantInput = form.querySelector('[data-variant-id]');
      const quantityInput = form.querySelector('[data-product-quantity]');
      const productScript = form.querySelector('[data-product-json]');
      const productData = productScript ? JSON.parse(productScript.textContent) : null;
      const selectedOptions = productData && productData.variants.length ? [...productData.variants[0].options] : [];

      function updateVariant() {
        if (!productData || !variantInput) return;
        const variant = productData.variants.find((candidate) => {
          return candidate.options.every((option, index) => {
            return !selectedOptions[index] || selectedOptions[index] === option;
          });
        });
        if (variant) {
          variantInput.value = variant.id;
          const submit = form.querySelector('[data-add-to-cart]');
          if (submit) submit.disabled = !variant.available;
        }
      }

      form.querySelectorAll('[data-option-value]').forEach((button) => {
        button.addEventListener('click', () => {
          const group = button.closest('[data-option-group]');
          const index = Number(button.getAttribute('data-option-index') || 0);
          selectedOptions[index] = button.getAttribute('data-option-value');
          if (group) {
            group.querySelectorAll('[data-option-value]').forEach((node) => {
              node.classList.toggle('is-active', node === button);
              node.setAttribute('aria-pressed', node === button ? 'true' : 'false');
            });
          }
          updateVariant();
        });
      });

      form.querySelectorAll('[data-bundle-quantity]').forEach((input) => {
        input.addEventListener('change', () => {
          const quantity = input.getAttribute('data-bundle-quantity') || '1';
          if (quantityInput) quantityInput.value = quantity;
          form.querySelectorAll('.bundle-card').forEach((card) => {
            const radio = card.querySelector('[data-bundle-quantity]');
            card.classList.toggle('is-active', radio && radio.checked);
          });
        });
      });

      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const message = form.querySelector('[data-form-message]');
        const variantId = variantInput ? variantInput.value : '';
        const quantity = quantityInput ? Number(quantityInput.value || 1) : 1;
        const bundle = form.querySelector('[data-bundle-quantity]:checked');

        if (!variantId) {
          if (message) message.textContent = 'Select the real Shopify product in the theme customizer before selling.';
          return;
        }

        const submit = form.querySelector('[data-add-to-cart]');
        if (submit) submit.disabled = true;
        if (message) message.textContent = 'Adding...';

        try {
          const response = await fetch('/cart/add.js', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json'
            },
            body: JSON.stringify({
              id: Number(variantId),
              quantity,
              properties: bundle ? {
                Bundle: bundle.getAttribute('data-bundle-label') || `Buy ${quantity}`
              } : {}
            })
          });

          if (!response.ok) throw new Error('Could not add item.');
          await refreshCart(true);
          if (message) message.textContent = 'Added to cart.';
        } catch (error) {
          if (message) message.textContent = error.message;
        } finally {
          if (submit) submit.disabled = false;
        }
      });

      section.querySelectorAll('[data-sticky-add]').forEach((button) => {
        button.addEventListener('click', () => {
          if (typeof form.requestSubmit === 'function') {
            form.requestSubmit();
          } else {
            form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
          }
        });
      });

      updateVariant();
    });
  }

  function initFaq(scope) {
    scope.querySelectorAll('[data-accordion-trigger]').forEach((trigger) => {
      trigger.addEventListener('click', () => {
        const expanded = trigger.getAttribute('aria-expanded') === 'true';
        const panel = document.getElementById(trigger.getAttribute('aria-controls'));
        trigger.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        if (panel) panel.hidden = expanded;
      });
    });
  }

  function initCollectionSorting(scope) {
    scope.querySelectorAll('[data-sort-by]').forEach((select) => {
      select.addEventListener('change', () => {
        const url = new URL(window.location.href);
        url.searchParams.set('sort_by', select.value);
        window.location.href = url.toString();
      });
    });
  }

  function initCartEvents(scope) {
    scope.querySelectorAll('[data-cart-open]').forEach((button) => {
      button.addEventListener('click', async () => {
        try {
          await refreshCart(true);
        } catch (error) {
          openCart();
        }
      });
    });

    scope.querySelectorAll('[data-cart-close]').forEach((button) => {
      button.addEventListener('click', closeCart);
    });

    scope.querySelectorAll('[data-checkout]').forEach((button) => {
      button.addEventListener('click', () => {
        window.location.href = '/checkout';
      });
    });
  }

  function initDelegatedCartEvents() {
    document.addEventListener('click', async (event) => {
      const item = event.target.closest('.cart-item');
      if (!item) return;
      const key = item.getAttribute('data-line-key');
      const quantity = Number(item.querySelector('.cart-item__controls span').textContent || 1);

      try {
        if (event.target.closest('[data-cart-increment]')) {
          await changeCartItem(key, quantity + 1);
        }
        if (event.target.closest('[data-cart-decrement]')) {
          await changeCartItem(key, Math.max(0, quantity - 1));
        }
        if (event.target.closest('[data-cart-remove]')) {
          await changeCartItem(key, 0);
        }
      } catch (error) {
        console.error(error);
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeCart();
    });
  }

  function initStickyAtc() {
    const bar = document.querySelector('[data-sticky-atc]');
    const submit = document.querySelector('[data-add-to-cart]');
    if (!bar || !submit) return;

    function update() {
      const rect = submit.getBoundingClientRect();
      const inView = rect.top >= 0 && rect.bottom <= window.innerHeight;
      bar.classList.toggle('is-hidden', inView);
    }

    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  function init(scope) {
    initGallery(scope);
    initProductForms(scope);
    initFaq(scope);
    initCollectionSorting(scope);
    initCartEvents(scope);
  }

  document.addEventListener('DOMContentLoaded', () => {
    init(document);
    initDelegatedCartEvents();
    initStickyAtc();
  });

  document.addEventListener('shopify:section:load', (event) => {
    init(event.target);
  });
})();
