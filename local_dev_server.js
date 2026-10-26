const http = require('http');
const fs = require('fs');
const path = require('path');

// Load products data
const productsFilePath = path.join(__dirname, 'products.json');
let productsData = [];
try {
  const rawData = fs.readFileSync(productsFilePath, 'utf8');
  productsData = JSON.parse(rawData).products;
} catch (e) {
  console.error('Error loading products.json:', e);
}

// Pricing database (matching sample data from the IBM lab)
const priceDatabase = {
  Headphones: {
    Binglee: '$30',
    'DXC Electronics': '$20',
    Bobay: '$20',
  },
  Laptop: {
    'GH Computers': '$800',
    'Tech city': '$750',
    'Ez PC': '$780',
  },
  Mouse: {
    'DXC Electronics': '$15',
    'Tech City': '$18',
  },
  Printer: {
    Binglee: '$120',
    'DXC Electronics': '$110',
    Bobay: '$115',
    'GH Computers': '$125',
  },
};

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// 1. Python Backend Microservice Mock (Port 5000)
const pythonBackendServer = http.createServer((req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = decodeURIComponent(req.url);

  if (url === '/products') {
    const productNames = productsData.map((p) => p.product);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ products: productNames }));
    return;
  }

  if (url.startsWith('/getdealers/')) {
    const productName = url.replace('/getdealers/', '').trim();
    const productObj = productsData.find(
      (p) => p.product.toLowerCase() === productName.toLowerCase()
    );
    const dealers = productObj ? productObj.Dealers : [];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ dealers }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

pythonBackendServer.listen(5000, () => {
  console.log('✅ Microservice 1 (Python Backend Mock) running on http://localhost:5000');
});

// 2. Node.js Backend Microservice Mock (Port 8080)
const nodeBackendServer = http.createServer((req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = decodeURIComponent(req.url);

  // /price/:dealer/:product
  if (url.startsWith('/price/')) {
    const parts = url.split('/').filter(Boolean); // ['price', dealer, product]
    if (parts.length >= 3) {
      const dealer = parts[1];
      const product = parts[2];
      const prodPrices = priceDatabase[product] || {};
      const price = prodPrices[dealer] || '$25';
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: price }));
      return;
    }
  }

  // /allprice/:product
  if (url.startsWith('/allprice/')) {
    const product = url.replace('/allprice/', '').trim();
    const prodPrices = priceDatabase[product] || {};
    const prices = Object.entries(prodPrices).map(([key, value]) => ({
      key,
      value,
    }));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ prices }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

nodeBackendServer.listen(8080, () => {
  console.log('✅ Microservice 2 (Node.js Backend Mock) running on http://localhost:8080');
});

// 3. Frontend Microservice (Port 5001)
const frontendServer = http.createServer((req, res) => {
  const filePath = path.join(__dirname, 'html', 'index.html');
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error loading index.html');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(data);
  });
});

frontendServer.listen(5001, () => {
  console.log('✅ Frontend Microservice running on http://localhost:5001');
  console.log('👉 Open your browser to: http://localhost:5001');
});
