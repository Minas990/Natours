const Review = require('../models/reviewModel');
const Booking = require('../models/bookingModel');
const AppError = require('../utails/appError');
const catchAsync = require('../utails/catchAsync');
const factory = require('./handlerFactory');
// const catchAsync = require('../utails/catchAsync');

//middleware for create new user 
module.exports.setTourAndUserId = (req,res,next) =>
{
    //nested route
    if(!req.body.tour)
        req.body.tour = req.params.tourId;
    req.body.user = req.user.id;//this is the name in the review shcema user
    next();
}


//middleware to let not anyone update the content of review of other users except the author

module.exports.checkIfAuthor =catchAsync(
    async (req,res,next) => 
    {
        if(!req.user.role==='admin')  next();
        const review = await Review.findById(req.params.id);
        if(!review)
            return next(new AppError('no such review',400));
        if(review.user.id !== req.user.id)
            return next(new AppError(`U cannot access other users reviews`,403));
        next();
    }
) ;

module.exports.checkUserBookedTheTour = catchAsync( async(req,res,next)=>
{
    //user must have booked the tour
    const booking =await Booking.find({
        user:req.body.user,
        tour:req.body.tour
    });
    if(!booking.length)
    {
        return next(new AppError('if u want to review tour book it first!'));
    }
    next();
}
);

module.exports.onlyReviewOnce = catchAsync(async(req,res,next) => {
    const review = await Review.findOne({user:req.body.user,tour:req.body.tour});
    if(review)
        return next(new AppError('u have only one review'));
    next();
});

module.exports.getAllReviews = factory.getAll(Review);
module.exports.createReview = factory.createOne(Review);
module.exports.getReview = factory.getOne(Review);
module.exports.updateReview = factory.updateOne(Review);
module.exports.deleteReview = factory.deleteOne(Review);

module.exports.writtienByMe = catchAsync(
    async (req,res,next) => 
    {
        const reviews = await Review.find({user : req.user.id});
        res.status(200).json({
            status:'success',
            data: {reviews}
        })
    }
);