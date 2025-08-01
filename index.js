const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Shopify Admin API Base
const SHOPIFY_API_BASE = `https://${process.env.SHOPIFY_STORE}/admin/api/${process.env.SHOPIFY_API_VERSION}`;
const ADMIN_API_TOKEN = process.env.SHOPIFY_API_TOKEN;

// Root endpoint (optional test)
app.get('/', (req, res) => {
  res.send('Vault Checkout App is running ✅');
});

// Create Draft Order Endpoint
app.post('/create-draft-order', async (req, res) => {
  try {
    const { customerEmail, items, note } = req.body;

    // Basic validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Missing items' });
    }

    // Build line items array
    const line_items = items.map(item => ({
      title: item.title || 'Vault Offer Item',
      quantity: item.quantity || 1,
      price: parseFloat(item.price || 0).toFixed(2)
    }));

    // Build payload for Shopify API
    const draftOrderPayload = {
      draft_order: {
        email: customerEmail || undefined,
        line_items,
        note: note || 'Vault offer applied',
        use_customer_default_address: true
      }
    };

    // Call Shopify Admin API
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

    return res.status(200).json({ success: true, checkout_url: invoiceUrl });

  } catch (err) {
    console.error('❌ Error creating draft order:', err.response?.data || err.message);
    return res.status(500).json({ success: false, error: 'Failed to create draft order' });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Vault Checkout server running at http://localhost:${PORT}`);
});
