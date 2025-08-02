const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();

// CORS setup for Shopify frontend
const allowedOrigins = [
  'https://essence-essential-oils1.myshopify.com',
  'https://checkout.shopify.com'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.use(express.json());

const SHOPIFY_API_BASE = `https://${process.env.SHOPIFY_STORE}/admin/api/${process.env.SHOPIFY_API_VERSION}`;
const ADMIN_API_TOKEN = process.env.SHOPIFY_API_TOKEN;

// 🔹 Root endpoint for sanity check
app.get('/', (req, res) => {
  res.send('✅ Vault Checkout Server is Running');
});

// 🔹 Draft Order GET Route (for query-based checkout)
app.get('/create-draft-order', async (req, res) => {
  try {
    const { email, note } = req.query;
    const variant_ids = req.query['variant_id[]'];
    const prices = req.query['price[]'];
    const quantities = req.query['quantity[]'];

    if (!variant_ids || !prices || !quantities) {
      return res.status(400).send('Missing item data');
    }

    const variantArray = [].concat(variant_ids);
    const priceArray = [].concat(prices);
    const quantityArray = [].concat(quantities);

    const line_items = variantArray.map((variantId, index) => {
      const variant_id = parseInt(variantId);
      const price = parseFloat(priceArray[index]);
      const quantity = parseInt(quantityArray[index]) || 1;

      if (!variant_id || isNaN(price)) {
        throw new Error(`Missing or invalid variant_id or price at index ${index}`);
      }

      return {
        variant_id,
        quantity,
        price: price.toFixed(2)
      };
    });

    const draftOrderPayload = {
      draft_order: {
        email: email || undefined,
        line_items,
        note: note || 'Vault checkout via GET',
        use_customer_default_address: true
      }
    };

    const response = await axios.post(
      `${SHOPIFY_API_BASE}/draft_orders.json`,
      draftOrderPayload,
      {
        headers: {
          'X-Shopify-Access-Token': ADMIN_API_TOKEN,
          'Content-Type': 'application/json'
        }
      }
    );

    const invoiceUrl = response.data.draft_order.invoice_url;
    console.log('✅ Draft Order Created:', invoiceUrl);
    return res.redirect(invoiceUrl); // ⬅️ Send user to draft order checkout

  } catch (err) {
    console.error('❌ Draft Order Creation Failed:', err.response?.data || err.message);
    return res.status(500).send('Failed to create draft order');
  }
});

// 🔹 Start Express Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Vault Checkout server running at http://localhost:${PORT}`);
});
