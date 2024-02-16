const express = require('express');
const fs = require('fs').promises;

const app = express();
const port = 8080;

app.use(express.json());

const productsRouter = express.Router();

async function loadProducts() {
  try {
    const data = await fs.readFile('productos.json', 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function saveProducts(products) {
  await fs.writeFile('productos.json', JSON.stringify(products, null, 2));
}

productsRouter.get('/', async (req, res) => {
  const products = await loadProducts();
  const limit = req.query.limit || products.length;
  res.json(products.slice(0, limit));
});

productsRouter.get('/:pid', async (req, res) => {
  const products = await loadProducts();
  const productId = req.params.pid;
  const product = products.find(item => item.id == productId);
  res.json(product);
});

productsRouter.post('/', async (req, res) => {
  const products = await loadProducts();
  const newProduct = {
    id: generateUniqueId(),
    title: req.body.title,
    description: req.body.description,
    code: req.body.code,
    price: req.body.price,
    status: true,
    stock: req.body.stock,
    category: req.body.category,
    thumbnails: req.body.thumbnails || []
  };

  products.push(newProduct);
  await saveProducts(products);
  res.status(201).json(newProduct);
});

productsRouter.put('/:pid', async (req, res) => {
  const products = await loadProducts();
  const productId = req.params.pid;
  const productIndex = products.findIndex(item => item.id == productId);

  if (productIndex !== -1) {
    products[productIndex] = { ...products[productIndex], ...req.body };
    await saveProducts(products);
    res.json(products[productIndex]);
  } else {
    res.status(404).json({ error: 'Producto no encontrado' });
  }
});

productsRouter.delete('/:pid', async (req, res) => {
  const products = await loadProducts();
  const productId = req.params.pid;
  const updatedProducts = products.filter(item => item.id != productId);
  await saveProducts(updatedProducts);
  res.json({ message: 'Producto eliminado correctamente' });
});

const cartsRouter = express.Router();

async function loadCarts() {
  try {
    const data = await fs.readFile('carrito.json', 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function saveCarts(carts) {
  await fs.writeFile('carrito.json', JSON.stringify(carts, null, 2));
}

cartsRouter.post('/', async (req, res) => {
  const carts = await loadCarts();
  const newCart = {
    id: generateUniqueId(),
    products: []
  };

  carts.push(newCart);
  await saveCarts(carts);
  res.status(201).json(newCart);
});

cartsRouter.get('/:cid', async (req, res) => {
  const carts = await loadCarts();
  const cartId = req.params.cid;
  const cart = carts.find(item => item.id == cartId);
  res.json(cart ? cart.products : []);
});

cartsRouter.post('/:cid/product/:pid', async (req, res) => {
  const carts = await loadCarts();
  const products = await loadProducts();
  const cartId = req.params.cid;
  const productId = req.params.pid;
  const quantity = req.body.quantity || 1;

  const cartIndex = carts.findIndex(item => item.id == cartId);
  const productIndex = products.findIndex(item => item.id == productId);

  if (cartIndex !== -1 && productIndex !== -1) {
    const existingProduct = carts[cartIndex].products.find(item => item.product == productId);

    if (existingProduct) {
      existingProduct.quantity += quantity;
    } else {
      carts[cartIndex].products.push({ product: productId, quantity });
    }

    await saveCarts(carts);
    res.json(carts[cartIndex]);
  } else {
    res.status(404).json({ error: 'Carrito o producto no encontrado' });
  }
});

app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);

app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});

function generateUniqueId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
