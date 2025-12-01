// products.js
import { database, ref, onValue, set, get } from './firebase.js';

let products = [];
let resetInterval;

export function loadProducts(callback) {
  const productsRef = ref(database, 'products');
  
  onValue(productsRef, (snapshot) => {
    if (snapshot.exists()) {
      products = snapshot.val();
      callback(products);
    } else {
      createSampleProducts().then(() => {
        loadProducts(callback);
      });
    }
  });

  // Iniciar reset automático do estoque
  startAutoReset();
}

export function getProducts() {
  return products;
}

async function createSampleProducts() {
  const essentialProducts = [
    { id: 1, name: "Coca-Cola", type: "Lata 350ml", stock: 100, price: 0, icon: "fas fa-wine-bottle" },
    { id: 2, name: "Guaraná Antarctica", type: "Lata 350ml", stock: 100, price: 0, icon: "fas fa-wine-bottle" },
    { id: 3, name: "Fanta Laranja", type: "Lata 350ml", stock: 100, price: 0, icon: "fas fa-wine-bottle" },
    { id: 4, name: "Sprite", type: "Lata 350ml", stock: 100, price: 0, icon: "fas fa-wine-bottle" },
    { id: 5, name: "Pepsi", type: "Lata 350ml", stock: 100, price: 0, icon: "fas fa-wine-bottle" }
  ];

  try {
    const productsRef = ref(database, 'products');
    await set(productsRef, essentialProducts);
    products = essentialProducts;
    
    // Salvar timestamp do último reset
    const resetRef = ref(database, 'lastReset');
    await set(resetRef, new Date().toISOString());
    
  } catch (error) {
    console.error('Erro ao criar produtos:', error);
  }
}

export async function updateProductStock(productId, newStock) {
  try {
    const productsRef = ref(database, 'products');
    const updatedProducts = products.map(product => 
      product.id === productId ? { ...product, stock: newStock } : product
    );
    
    await set(productsRef, updatedProducts);
    products = updatedProducts;
    return true;
  } catch (error) {
    console.error('Erro ao atualizar estoque:', error);
    return false;
  }
}

// Função para resetar estoque para 100
export async function resetStockTo100() {
  try {
    const productsRef = ref(database, 'products');
    const resetProducts = products.map(product => ({
      ...product,
      stock: 100
    }));
    
    await set(productsRef, resetProducts);
    products = resetProducts;
    
    // Atualizar timestamp do último reset
    const resetRef = ref(database, 'lastReset');
    await set(resetRef, new Date().toISOString());
    
    console.log('✅ Estoque resetado para 100');
    
    // Recarregar a interface
    if (window.displayProducts) {
      window.displayProducts(products);
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao resetar estoque:', error);
    return false;
  }
}

// Verificar e aplicar reset se necessário
async function checkAndResetStock() {
  try {
    const resetRef = ref(database, 'lastReset');
    const snapshot = await get(resetRef);
    
    if (snapshot.exists()) {
      const lastReset = new Date(snapshot.val());
      const now = new Date();
      const diffMinutes = (now - lastReset) / (1000 * 60);
      
      // Se passaram mais de 30 minutos, resetar estoque
      if (diffMinutes >= 30) {
        console.log(`⏰ Reset automático: ${diffMinutes.toFixed(1)} minutos desde o último reset`);
        await resetStockTo100();
      } else {
        console.log(`⏰ Próximo reset em: ${(30 - diffMinutes).toFixed(1)} minutos`);
      }
    } else {
      // Primeira execução, criar timestamp
      await set(resetRef, new Date().toISOString());
    }
  } catch (error) {
    console.error('Erro ao verificar reset:', error);
  }
}

// Iniciar reset automático a cada 30 minutos
function startAutoReset() {
  // Verificar imediatamente
  checkAndResetStock();
  
  // Configurar intervalo para verificar a cada minuto
  if (resetInterval) {
    clearInterval(resetInterval);
  }
  
  resetInterval = setInterval(() => {
    checkAndResetStock();
  }, 60000); // Verificar a cada minuto
  
  console.log('🔄 Sistema de reset automático iniciado (30 minutos)');
}

// Função para reset manual (para testes)
export function manualResetStock() {
  resetStockTo100();
  alert('Estoque resetado manualmente para 100!');
}

// Parar o reset automático (se necessário)
export function stopAutoReset() {
  if (resetInterval) {
    clearInterval(resetInterval);
    console.log('⏹️ Reset automático parado');
  }
}