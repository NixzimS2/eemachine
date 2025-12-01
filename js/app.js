// app.js
import { loadProducts, getProducts, manualResetStock } from './products.js';
import { 
  sellProduct, 
  updateCartDisplay, 
  checkout, 
  loadWithdrawalsFromFirebase,
  updateProductsDisplay,
  getCart,
  setCart
} from './sales.js';
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from './firebase.js';

let currentUser = null;
let isMachineActive = false;

// Inicialização da página
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
  setupEventListeners();
  checkMachineStatus();
});

async function initializeApp() {
  try {
    // Carregar produtos e configurar callback global
    loadProducts((products) => {
      window.displayProducts(products);
    });
    
    checkAuthState();
    
    setTimeout(() => {
      loadWithdrawalsFromFirebase();
    }, 1000);
    
    addAdminButtons();
    
  } catch (error) {
    console.error('Erro na inicialização:', error);
  }
}

// Função global para display de produtos
window.displayProducts = function(products) {
  const productsGrid = document.getElementById('products-grid');
  if (!productsGrid) return;
  
  productsGrid.innerHTML = '';
  
  products.forEach(product => {
    const productCard = document.createElement('div');
    productCard.className = 'product-card';
    
    // Cor do estoque
    const stockColor = product.stock > 20 ? '#00ff88' : 
                      product.stock > 5 ? '#ffa500' : '#ff4444';
    
    productCard.innerHTML = `
      <div class="product-image">
        <i class="${product.icon}"></i>
      </div>
      <div class="product-name">${product.name}</div>
      <div class="product-details">${product.type}</div>
      <div class="product-stock" style="color: ${stockColor}">
        Estoque: ${product.stock}
      </div>
      <button class="add-to-cart" data-id="${product.id}" 
              ${product.stock === 0 ? 'disabled' : ''}>
        <i class="fas fa-cart-plus"></i> 
        ${product.stock === 0 ? 'Sem Estoque' : 'Adicionar'}
      </button>
    `;
    productsGrid.appendChild(productCard);
  });

  // Atualizar event listeners
  document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', function() {
      const productId = parseInt(this.getAttribute('data-id'));
      sellProduct(productId);
    });
  });
};

// ... (restante do app.js permanece igual)

function addAdminButtons() {
  const adminSection = document.querySelector('.admin-section');
  if (adminSection) {
    // Botão de exportar dados
    const exportBtn = document.createElement('button');
    exportBtn.className = 'btn btn-primary';
    exportBtn.innerHTML = '<i class="fas fa-download"></i> Exportar Dados';
    exportBtn.onclick = exportDatabase;
    exportBtn.style.marginRight = '10px';
    adminSection.appendChild(exportBtn);
    
    // Botão de reset manual (para testes)
    const resetBtn = document.createElement('button');
    resetBtn.className = 'btn btn-secondary';
    resetBtn.innerHTML = '<i class="fas fa-sync"></i> Resetar Estoque';
    resetBtn.onclick = manualResetStock;
    resetBtn.style.marginRight = '10px';
    adminSection.appendChild(resetBtn);
  }
}

async function exportDatabase() {
  // Implementar exportação
  alert('Funcionalidade de exportação em desenvolvimento');
}

// ... (restante do código permanece igual)

// Tornar funções globais
window.switchTab = switchTab;
window.sellProduct = sellProduct;
window.checkout = checkout;
window.manualResetStock = manualResetStock; // Para testes