const express = require('express');

const router = express.Router({mergeParams:true});

const reviewController = require('../controllers/reviewController');
const authController =require('../controllers/authController');


router.use(authController.protect);

router.route('/writtenByMe').get(reviewController.writtienByMe);

router.route('/')
.get(reviewController.getAllReviews)
.post
(
    authController.restrictTo('user'),
    reviewController.setTourAndUserId,
    reviewController.checkUserBookedTheTour,
    reviewController.onlyReviewOnce,
    reviewController.createReview
);



router.route('/:id')
.get(reviewController.getReview)
.patch(authController.restrictTo('user','admin'),reviewController.checkIfAuthor  ,reviewController.updateReview)
.delete(authController.restrictTo('user','admin'),reviewController.checkIfAuthor, reviewController.deleteReview);


module.exports = router;