const express = require('express');
const app = express();
const axios = require('axios');
require('dotenv').config();

app.use(express.json());

app.post('/create-draft-order', async (req, res) => {
  try {
    const { line_items, customer_email, note } = req.body;

    const draftOrderData = {
      draft_order: {
        line_items: line_items.map(item => ({
          variant_id: item.variant_id,
          quantity: item.quantity,
          properties: item.custom_price
            ? { "Custom Price": item.custom_price }
            : undefined,
          price: item.custom_price || undefined
        })),
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
      return res.status(500).json({ error: 'No invoice URL received.' });
    }

    res.json({ url: invoice_url });
  } catch (error) {
    console.error('❌ Error creating draft order:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to create draft order' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
