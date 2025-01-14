const express = require('express');
const dummyController = require('../controllers/dummyController');
const { aliasTop5Cheap } = require('../middlewares/dummyMiddleware');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRouters');

const router = express.Router();

router.use('/:dummyId/reviews', reviewRouter);

router.route('/top-5-cheap').get(aliasTop5Cheap, dummyController.getAllDummies);
router.route('/dummy-stats').get(dummyController.getDummyStats);

router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'user'),
    dummyController.getMonthlyPlan
  );

router
  .route('/dummy-within/:distance/center/:latlng/unit/:unit')
  .get(dummyController.getDummiesWithin);

router.route('/distances/:latlng/unit/:unit').get(dummyController.getDistances);

router
  .route('/')
  .get(dummyController.getAllDummies)
  .post(
    authController.protect,
    authController.restrictTo('admin'),
    dummyController.createDummy
  );

router
  .route('/:id')
  .get(dummyController.getOneDummy)
  .patch(
    authController.protect,
    authController.restrictTo('admin'),
    dummyController.uploadDummyImages,
    dummyController.resizeDummyImages,
    dummyController.updateDummy
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin'),
    dummyController.deleteDummy
  );

module.exports = router;
