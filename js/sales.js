// sales.js
import { database, ref, push, set, onValue } from './firebase.js';
import { getProducts, updateProductStock } from './products.js';

let withdrawals = [];
let cart = [];

export function sellProduct(productId) {
  const products = getProducts();
  const product = products.find(p => p.id === productId);
  
  if (product && product.stock > 0) {
    addToCart(productId);
  } else {
    alert('Produto sem estoque!');
  }
}

export function addToCart(productId) {
  const products = getProducts();
  const product = products.find(p => p.id === productId);
  
  if (!product) return;

  const existingItem = cart.find(item => item.id === productId);
  
  if (existingItem) {
    if (existingItem.quantity < product.stock) {
      existingItem.quantity += 1;
    } else {
      alert(`Estoque insuficiente de ${product.name}. Apenas ${product.stock} unidades disponíveis.`);
      return;
    }
  } else {
    if (product.stock > 0) {
      cart.push({
        id: product.id,
        name: product.name,
        type: product.type,
        quantity: 1,
        currentStock: product.stock // Guardar estoque atual
      });
    } else {
      alert(`Produto ${product.name} fora de estoque.`);
      return;
    }
  }
  
  updateCartDisplay();
  updateProductsDisplay(); // Atualizar exibição dos produtos
}

export function updateCartDisplay() {
  const cartItems = document.getElementById('cart-items');
  const cartTotal = document.getElementById('cart-total');
  const checkoutBtn = document.getElementById('checkout-btn');
  const leadTimeResult = document.getElementById('lead-time-result');
  
  if (!cartItems) return;
  
  cartItems.innerHTML = '';
  
  if (cart.length === 0) {
    cartItems.innerHTML = '<p style="text-align: center; opacity: 0.7;">Carrinho vazio</p>';
    if (cartTotal) cartTotal.textContent = 'Total de Itens: 0';
    if (checkoutBtn) checkoutBtn.disabled = true;
    if (leadTimeResult) leadTimeResult.textContent = 'Tempo estimado: 0 minutos';
    return;
  }
  
  let totalItems = 0;
  
  cart.forEach(item => {
    totalItems += item.quantity;
    
    const cartItem = document.createElement('div');
    cartItem.className = 'cart-item';
    cartItem.innerHTML = `
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-details">${item.type}</div>
        <div class="cart-item-stock" style="font-size: 0.8rem; color: #00ff88;">
          Estoque disponível: ${item.currentStock}
        </div>
      </div>
      <div class="cart-item-controls">
        <button class="quantity-btn decrease" data-id="${item.id}">-</button>
        <span class="quantity">${item.quantity}</span>
        <button class="quantity-btn increase" data-id="${item.id}">+</button>
        <button class="remove-btn" data-id="${item.id}">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
    cartItems.appendChild(cartItem);
  });
  
  // Atualizar event listeners
  updateCartEventListeners();
  
  if (cartTotal) cartTotal.textContent = `Total de Itens: ${totalItems}`;
  if (checkoutBtn) checkoutBtn.disabled = cart.length === 0;
  
  const leadTimeMinutes = 2 + (totalItems * 0.5);
  if (leadTimeResult) leadTimeResult.textContent = `Tempo estimado: ${leadTimeMinutes.toFixed(1)} minutos`;
}

function updateCartEventListeners() {
  document.querySelectorAll('.quantity-btn.decrease').forEach(btn => {
    btn.addEventListener('click', function() {
      const id = parseInt(this.getAttribute('data-id'));
      decreaseQuantity(id);
    });
  });
  
  document.querySelectorAll('.quantity-btn.increase').forEach(btn => {
    btn.addEventListener('click', function() {
      const id = parseInt(this.getAttribute('data-id'));
      increaseQuantity(id);
    });
  });
  
  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const id = parseInt(this.getAttribute('data-id'));
      removeFromCart(id);
    });
  });
}

function decreaseQuantity(productId) {
  const item = cart.find(item => item.id === productId);
  if (item) {
    if (item.quantity > 1) {
      item.quantity -= 1;
      // Atualizar estoque atual no item do carrinho
      const products = getProducts();
      const product = products.find(p => p.id === productId);
      if (product) {
        item.currentStock = product.stock;
      }
    } else {
      removeFromCart(productId);
      return;
    }
    updateCartDisplay();
  }
}

function increaseQuantity(productId) {
  const item = cart.find(item => item.id === productId);
  const products = getProducts();
  const product = products.find(p => p.id === productId);
  
  if (item && product) {
    if (item.quantity < product.stock) {
      item.quantity += 1;
      item.currentStock = product.stock; // Atualizar estoque atual
      updateCartDisplay();
    } else {
      alert(`Estoque insuficiente de ${product.name}. Apenas ${product.stock} unidades disponíveis.`);
    }
  }
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  updateCartDisplay();
  updateProductsDisplay();
}

// Atualizar exibição dos produtos
export function updateProductsDisplay() {
  const products = getProducts();
  if (window.displayProducts) {
    window.displayProducts(products);
  }
}

export async function checkout() {
  if (cart.length === 0) {
    alert('Não é possível finalizar a retirada. Carrinho vazio.');
    return;
  }
  
  // Verificar estoque atual antes de finalizar
  const products = getProducts();
  for (const item of cart) {
    const product = products.find(p => p.id === item.id);
    if (!product || product.stock < item.quantity) {
      alert(`Estoque insuficiente para ${item.name}. Disponível: ${product ? product.stock : 0}`);
      updateCartDisplay();
      updateProductsDisplay();
      return;
    }
  }
  
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
  const leadTimeMinutes = 2 + (totalItems * 0.5);
  
  const withdrawal = {
    user: 'current_user',
    userName: document.getElementById('user-name')?.textContent || 'Usuário',
    items: [...cart],
    date: new Date().toISOString(),
    leadTime: leadTimeMinutes.toFixed(1),
    status: 'completed'
  };
  
  try {
    const withdrawalsRef = ref(database, 'withdrawals');
    await push(withdrawalsRef, withdrawal);
    
    // Atualizar estoque no Firebase
    for (const item of cart) {
      const product = products.find(p => p.id === item.id);
      if (product) {
        const newStock = product.stock - item.quantity;
        await updateProductStock(item.id, newStock);
      }
    }
    
    // Limpar carrinho
    cart = [];
    updateCartDisplay();
    updateProductsDisplay(); // Atualizar produtos após venda
    
    alert(`✅ Retirada confirmada! Tempo estimado: ${leadTimeMinutes.toFixed(1)} minutos.`);
    
  } catch (error) {
    console.error('Erro ao registrar retirada:', error);
    alert('Erro ao processar retirada.');
  }
}

// ... (restante do código de relatórios permanece igual)
export function loadWithdrawalsFromFirebase() {
  try {
    const withdrawalsRef = ref(database, 'withdrawals');
    onValue(withdrawalsRef, (snapshot) => {
      if (snapshot.exists()) {
        const withdrawalsData = snapshot.val();
        withdrawals = Object.keys(withdrawalsData).map(key => ({
          id: key,
          ...withdrawalsData[key]
        }));
        renderWithdrawals();
        loadStatsFromFirebase();
      } else {
        withdrawals = [];
        renderWithdrawals();
      }
    });
  } catch (error) {
    console.error('Erro ao carregar retiradas:', error);
  }
}

// ... (outras funções de relatórios permanecem iguais)

export function getCart() {
  return cart;
}

export function setCart(newCart) {
  cart = newCart;
}