const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();

app.use(cors()); // Enable CORS for frontend access
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.send('✅ Vault Checkout API is running');
});

// Draft order creation endpoint
app.post('/create-draft-order', async (req, res) => {
  try {
    const { line_items, customer_email, note } = req.body;

    const draftOrderData = {
      draft_order: {
        line_items: line_items.map(item => {
          const lineItem = {
            variant_id: item.variant_id,
            quantity: item.quantity
          };

          if (item.custom_price) {
            lineItem.properties = { "Custom Price": item.custom_price };
            lineItem.price = item.custom_price;
          }

          return lineItem;
        }),
        note: note || 'Vault checkout',
        email: customer_email || undefined,
        use_customer_default_address: true
      }
    };

    const shop = process.env.SHOPIFY_STORE;
    const token = process.env.SHOPIFY_API_TOKEN;
    const version = process.env.SHOPIFY_API_VERSION;

    const response = await axios.post(
      `https://${shop}/admin/api/${version}/draft_orders.json`,
      draftOrderData,
      {
        headers: {
          'X-Shopify-Access-Token': token,
          'Content-Type': 'application/json'
        }
      }
    );

    const invoice_url = response.data.draft_order?.invoice_url;
    if (!invoice_url) {
      return res.status(500).json({ error: 'No invoice URL received from Shopify' });
    }

    res.json({ url: invoice_url });
  } catch (error) {
    console.error('❌ Error creating draft order:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to create draft order' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
