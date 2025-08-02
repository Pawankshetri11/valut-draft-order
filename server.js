const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Allow requests only from your Shopify store
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








// Root endpoint (test)
app.get('/', (req, res) => {
  res.send('✅ Vault Checkout App is running');
});

// Create Draft Order Endpoint
app.post('/create-draft-order', async (req, res) => {
  try {
    const { customer_email, line_items, note } = req.body;

    if (!line_items || !Array.isArray(line_items) || line_items.length === 0) {
      return res.status(400).json({ success: false, error: 'Missing line_items' });
    }

    // Build line_items for Shopify Draft Order API
    const draftLineItems = line_items.map(item => {
      const line = {
        variant_id: item.variant_id,
        quantity: item.quantity || 1
      };

      // If custom price is included, use it
      if (item.custom_price) {
        line.price = parseFloat(item.custom_price).toFixed(2);
      }

      return line;
    });

    console.log('🛒 Draft Line Items:', draftLineItems);

    const draftOrderPayload = {
      draft_order: {
        email: customer_email || undefined,
        line_items: draftLineItems,
        note: note || 'Vault offer checkout',
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

    return res.status(200).json({ success: true, url: invoiceUrl });

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
