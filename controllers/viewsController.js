const Tour = require('../models/tourModel');
const Review = require('../models/reviewModel');
const catchAsync = require('../utails/catchAsync');
const AppError = require('../utails/appError');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');


exports.getOverview =catchAsync( async (req,res,next) => {

    //get tours data from collection
    const tours = await Tour.find();
    //build template    

    //render template
    res.status(200).render('overview',{
        title: 'All Tours',
        tours
    });
});

exports.getTour = catchAsync( async (req,res,next) => {

    //get the tour
    const {slug} = req.params;
    const tour = await Tour.findOne({slug}).populate({
        path:'reviews',
        fields: 'review rating user'
    });
    if(!tour)
        return next(new AppError(`No Such Tour`,404));

    //build template    
    
    //render template
    res.status(200).render('tour',{
        title:tour.name ,
        tour
    });
});

exports.getLoginForm =   (req,res) => {
    res.status(200).render('login',{
        title: 'LOGIN INTO YOUR ACC'
    });
}

exports.getAccount = (req,res) => 
{
    res.status(200).render('account',{
        title: 'your acc',
        user:req.user
    });
}

exports.getMyTours = catchAsync( async(req,res,next) =>
{
    const bookings = await Booking.find({user:req.user.id});
    const tourIds = bookings.map(el => el.tour);
    const tours = await Tour.find({_id:{$in: tourIds}  });
    res.status(200).render('overview',{
        titel:'My Tours',
        tours
    });
});

exports.updateUserData =catchAsync( async (req,res,next) => {
    const user = await User.findByIdAndUpdate(req.user.id,{
        name:req.body.name,
        email: req.body.email
    },{runValidators:true,new:true});
    res.status(200).render('account',{
        title: 'your acc',
        user
    });
});


exports.getMyRevies = catchAsync( async (req,res,next)=> {
    const reviews = await Review.find({user:req.user.id}).populate({path:'tour',select:'name'});
    res.status(200).render('myReviews',{
        title:'your reviews',
        reviews
    });
});

exports.getSingupForm= catchAsync( async(req,res,next)=> {
    res.status(200).render('signup',{
        title: 'JOIN US'
    });
});