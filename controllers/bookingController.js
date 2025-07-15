const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const Booking = require('../models/bookingModel');
const Tour = require('../models/tourModel');
const catchAsync = require('../utails/catchAsync');

// const AppError = require('../utails/appError');
const factory = require('./handlerFactory');

exports.getCheckoutSession =catchAsync ( async (req,res,next) => 
{
    const tour = await Tour.findById(req.params.tourID);
    const session = await stripe.checkout.sessions.create({
        payment_method_types :['card'],
        //not secure yet
        success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourID}&user=${req.user.id}&price=${tour.price}`,
        cancel_url:  `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email: `${req.user.email}`,
        client_reference_id: req.params.tourID,
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    unit_amount: tour.price * 100, 
                    product_data: {
                        name: `${tour.name} Tour`,
                        description: `${tour.summary}`,
                        images: ['https://alterno.net/wp-content/uploads/2025/02/reasons-to-protect-the-environment.jpg']
                    }
                },
                quantity: 1
            }
        ],
            mode: 'payment'
    });
    res.status(200).json({
        status:'success',
        url:session.url
    });
});

exports.createBookingCheckout =catchAsync( async(req,res,next) => 
{
    //temp , not secure at all
    const {tour,user,price} = req.query;
    if(!tour||!user||!price)
        return next();
    await Booking.create({tour,user,price});
    res.redirect(req.originalUrl.split('?')[0]);
});

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBooking = factory.getAll(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
exports.updateBooking = factory.updateOne(Booking);
