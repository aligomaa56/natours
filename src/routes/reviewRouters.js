const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.setDummyUserIds,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getOneReview)
  .delete(authController.restrictTo('admin', 'user'), reviewController.deleteReview)
  .patch(authController.restrictTo('admin', 'user'), reviewController.updateReview);

module.exports = router;
