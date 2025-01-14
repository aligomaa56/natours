const Dummy = require('../models/dummyModel');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Booking = require('../models/bookingModel');

exports.getOverview = catchAsync(async (req, res, next) => {
  const dummies = await Dummy.find();

  res.status(200).render('overview', {
    title: 'All Tours',
    dummies
  });
});

exports.getTour = catchAsync(async (req, res, next) => {

  const dummy = await Dummy.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user'
  })

  if (!dummy) {
    return next(new AppError('There is no tour with that name.', 404));
  }

  res.status(200).render('tour', {
    title: 'The Forest Hiker',
    dummy
  });
});

exports.getLoginForm = catchAsync(async (req, res, next) => {
  res.status(200).render('login', {
    title: 'Log into your account'
  });
})

exports.getAccount = catchAsync(async (req, res, next) => {
  res.status(200).render('account', {
    title: 'Your account'
  });
});

exports.getMyTours = catchAsync(async (req, res, next) => {
  // 1) Find all bookings
  const bookings = await Booking.find({ user: req.user.id });

  // 2) Find tours with the returned IDs
  const dummyIDs = bookings.map(el => el.dummy);
  const dummies = await Dummy.find({ _id: { $in: dummyIDs } });

  res.status(200).render('overview', {
    title: 'My Tours',
    dummies
  });
})