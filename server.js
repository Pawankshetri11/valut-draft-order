app.get('/create-draft-order', async (req, res) => {
  try {
    const { email, note } = req.query;
    const variant_ids = req.query['variant_id[]'];
    const prices = req.query['price[]'];
    const quantities = req.query['quantity[]'];

    // Ensure all necessary query params are present
    if (!variant_ids || !prices || !quantities) {
      return res.status(400).send('Missing item data');
    }

    // Normalize all query values into arrays
    const variantArray = [].concat(variant_ids);
    const priceArray = [].concat(prices);
    const quantityArray = [].concat(quantities);

    // Build line_items array
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

    // Build draft order payload
    const draftOrderPayload = {
      draft_order: {
        email: email || undefined,
        line_items,
        note: note || 'Vault GET checkout',
        use_customer_default_address: true
      }
    };

    // Send request to Shopify API
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
    console.log('✅ Draft Order Created (GET):', invoiceUrl);

    // Redirect customer to invoice URL
    return res.redirect(invoiceUrl);

  } catch (err) {
    console.error('❌ GET Error:', err.response?.data || err.message);
    return res.status(500).send('Failed to create draft order');
  }
});
