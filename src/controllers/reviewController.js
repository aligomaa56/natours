const Review = require('../models/reviewModel');
const factory = require('./handlerFactory');

// Middleware for setting dummy and user ids
exports.setDummyUserIds = (req, res, next) => {
  // Allow nested routes
  if (!req.body.dummy) req.body.dummy = req.params.dummyId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.getAllReviews = factory.getAll(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.getOneReview = factory.getOne(Review);