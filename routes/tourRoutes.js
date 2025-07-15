const express = require('express');

const tourController = require('../controllers/tourcontroller');
const authController = require('../controllers/authController');

const reviewRouter = require('./reviewsRoutes');

const router = express.Router();

// router.param('id',tourController.checkId);


router.use('/:tourId/reviews',reviewRouter);

//this routes a shortcut for a query grap the 5 chepeast tours 
router
.route('/top-5-cheap')
.get(tourController.aliasTopTours,tourController.getAllTours)



router
.route('/tour-stats')
.get(tourController.getTourStats);

router
.route('/monthly-plan/:year')
.get
(
    authController.protect,
    authController.restrictTo('admin','lead-guide','guide'),
    tourController.getMonthlyPlan
);


//we could do it like that ?distance=?&center=? and so on
router.route('/tours-within/:distance/center/:latlng/unit/:unit')
.get(tourController.getToursWithIn);

router.route('/distances/:latlng/unit/:unit')
.get(tourController.getDistances);


router
.route('/')
.get(tourController.getAllTours)
.post
(
    authController.protect,
    authController.restrictTo('admin','lead-guide'),
    tourController.createTour
);


router
.route('/:id')
.get(tourController.getTour)
.patch
(
    authController.protect,
    authController.restrictTo('admin','lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
)
.delete
(
    authController.protect,
    authController.restrictTo('admin','lead-guide'),
    tourController.deleteTour
);




module.exports = router;

