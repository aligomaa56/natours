const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Dummy = require('../models/dummyModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  const dummy = await Dummy.findById(req.params.tourId);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    success_url: `${req.protocol}://${req.get('host')}/my-tours?alert=booking`,
    cancel_url: `${req.protocol}://${req.get('host')}/tours/${dummy.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${dummy.name} Tour`,
            images: [`${req.protocol}://${req.get('host')}/img/dummies/${dummy.imageCover}`],
          },
          unit_amount: dummy.price * 100,
        },
        quantity: 1,
      },
    ],
  });

  res.status(200).json({
    status: 'success',
    session,
  });
});

const createBookingCheckout = async session => {
  try {
    // console.log('Creating booking checkout for session:', session);
    
    const dummy = session.client_reference_id;
    const user = (await User.findOne({ email: session.customer_details.email })).id;
    const price = session.amount_total / 100;
    
    await Booking.create({ dummy, user, price });
    // console.log('Booking created successfully:', booking);
    
  } catch (error) {
    // console.error('Error creating booking:', error);
    throw error; // Re-throw to handle it in the webhook handler
  }
};

exports.webhookCheckout = async (req, res, next) => {
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    // console.error('Webhook signature verification failed:', err);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    try {
      await createBookingCheckout(event.data.object);
      res.status(200).json({ received: true });
    } catch (error) {
      // console.error('Error processing checkout session:', error);
      res.status(500).json({ error: 'Failed to process checkout session' });
    }
  } else {
    res.status(200).json({ received: true });
  }
};


exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);