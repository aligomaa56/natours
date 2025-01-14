const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Dummy = require('../models/dummyModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  const dummy = await Dummy.findById(req.params.tourId);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    success_url: `${req.protocol}://${req.get('host')}/?dummy=${
      req.params.tourId
    }&user=${req.user.id}&price=${dummy.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tours/${dummy.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${dummy.name} Tour`,
            // images: [`https://www.natours.dev/img/tours/${dummy.imageCover}`],
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


exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  // This is only TEMPORARY, because it's UNSECURE: everyone can make bookings without paying
  const { dummy, user, price } = req.query;

  if (!dummy && !user && !price) return next();
  await Booking.create({ dummy, user, price });

  res.redirect(req.originalUrl.split('?')[0]);
});

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);