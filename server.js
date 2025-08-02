app.get('/create-draft-order', async (req, res) => {
  try {
    const { email, note } = req.query;
    const variant_ids = req.query['variant_id[]'];
    const prices = req.query['price[]'];
    const quantities = req.query['quantity[]'];

    if (!variant_ids || !prices || !quantities) {
      return res.status(400).send('Missing item data');
    }
const draftLineItems = line_items.map((item) => {
  if (!item.variant_id || !item.price) {
    throw new Error('Missing variant_id or price');
  }
  return {
    variant_id: item.variant_id,
    quantity: item.quantity || 1,
    price: parseFloat(item.price).toFixed(2),
  };
});

    const line_items = [].concat(variant_ids).map((variantId, index) => ({
      variant_id: parseInt(variantId),
      quantity: parseInt([].concat(quantities)[index]) || 1,
      price: parseFloat([].concat(prices)[index]).toFixed(2)
    }));

    const draftOrderPayload = {
      draft_order: {
        email: email || undefined,
        line_items,
        note: note || 'Vault GET checkout',
        use_customer_default_address: true
      }
    };

    const response = await axios.post(`${SHOPIFY_API_BASE}/draft_orders.json`, draftOrderPayload, {
      headers: {
        'X-Shopify-Access-Token': ADMIN_API_TOKEN,
        'Content-Type': 'application/json'
      }
    });

    const invoiceUrl = response.data.draft_order.invoice_url;
    console.log('✅ Draft Order Created (GET):', invoiceUrl);

    return res.redirect(invoiceUrl); // Redirect to checkout

  } catch (err) {
    console.error('❌ GET Error:', err.response?.data || err.message);
    return res.status(500).send('Failed to create draft order');
  }
});
