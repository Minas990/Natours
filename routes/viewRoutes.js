const express =require('express');

const router = express.Router();
const viewController = require('../controllers/viewsController');
const authcontroller = require('../controllers/authController');
const bookingController =require('../controllers/bookingController');


router.get('/', bookingController.createBookingCheckout ,authcontroller.islogedin ,viewController.getOverview);
router.get('/tour/:slug',authcontroller.islogedin ,viewController.getTour);

router.get('/login',authcontroller.islogedin ,viewController.getLoginForm);
router.get('/signup',viewController.getSingupForm);


router.get('/me',authcontroller.protect,  viewController.getAccount);
router.get('/my-tours',authcontroller.protect,viewController.getMyTours);
router.get('/my-reviews',authcontroller.protect,viewController.getMyRevies);


router.post('/submit-user-data',authcontroller.protect ,viewController.updateUserData)


module.exports = router;