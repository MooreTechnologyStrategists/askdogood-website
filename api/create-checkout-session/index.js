// Azure Functions v4 (Node 18+)
const Stripe = require('stripe');

module.exports = async function (context, req) {
  try {
    // NEVER commit your secret key. Set in Azure config (see step 4).
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Map frontend product keys -> Stripe Price IDs (from your message)
    const prices = {
      superfood:   'price_1S4ru8KIgUcEXwKX35gxCLHz',
      autoimmune:  'price_1S4rsoKIgUcEXwKXbkXl6bwi',  // note spelling
      thyroid:     'price_1S4rruKIgUcEXwKXS57j0Kdh',
      ibs:         'price_1S4rqkKIgUcEXwKXWtreVQLL',
      weightloss:  'price_1S4nZjKIgUcEXwKXDUnju9JB'
    };

    const productKey = (req.body && req.body.product || '').toLowerCase();
    const priceId = prices[productKey];

    if (!priceId) {
      context.log('Bad product key:', productKey);
      context.res = { status: 400, body: { error: 'Invalid product key' } };
      return;
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: 'https://askdogood.com/success',
      cancel_url:  'https://askdogood.com/cancel',
      // Optional: collect email & address
      customer_creation: 'if_required',
      automatic_tax: { enabled: false }
    });

    context.res = {
      status: 200,
      body: {
        id: session.id,
        pk: process.env.STRIPE_PUBLISHABLE_KEY // returned for frontend Stripe(...)
      }
    };
  } catch (err) {
    context.log('Stripe error:', err);
    context.res = { status: 500, body: { error: 'Stripe init/checkout failed' } };
  }
};
