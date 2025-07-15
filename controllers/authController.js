const crypto = require('crypto');
const {promisify} = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utails/catchAsync');
const AppError = require('../utails/appError');
const Email = require('../utails/email');

//this generate a secret key
//node -e "console.log(require('crypto').randomBytes(64).toString('hex'));" 


const signToken = id => {
    return jwt.sign({id},process.env.JWT_SECRET,{
        expiresIn:process.env.JWT_EXPIRES_IN
    });
}
const createAndSendToken =(user,statusCode,res) => 
{   
    const token = signToken(user._id);
    const cookieOption = {
        expires:new Date(Date.now()+process.env.JWT_COOKIE_EXPIRES_IN *24*60*60*1000),
        httpOnly: true
    }
    if(process.env.NODE_ENV === 'production')
        cookieOption.secure = true;
    res.cookie('jwt',token,cookieOption);
    user.password = undefined;
    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
}

exports.signup =catchAsync(  async (req,res,next) => {
    //why bother making this object -> user can change the role to admin and bypass the system
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
    });
    const url = `${req.protocol}://${req.get('host')}/me`;
    await new Email(newUser,url).sendWelcome()
    createAndSendToken(newUser,201,res);
});

exports.login =catchAsync( async (req,res,next) => {
    const {email,password} = req.body;
    //iff email and password exist //not in database but in the request
    if(!email || !password)
    {
        return next(new AppError('can u plz provide the email and the password',400));
    }
    //if user exist && pass is correct
    //+bcs we make password in user schema not selectable
    const user =await User.findOne({email}).select('+password')
    if(!user || !(await user.correctPassword(password,user.password)))
    {
        return next(new AppError('incorrect email or passwrd',401));
    }
    //all ok send token
    createAndSendToken(user,200,res);
});

exports.protect = catchAsync(async (req,res,next) => {
    //getting token and check if it exist
    let token ='';
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer') )
    {
        token = req.headers.authorization.split(' ')[1];
    }
    else if(req.cookies.jwt)
    {
        token = req.cookies.jwt;
    }

    if(!token)
    {
        return next(new AppError('You r not logged in! plz log in to get access',401));
    }
    //verfication the token
    const decoded = await promisify( jwt.verify)(token,process.env.JWT_SECRET);
    //user still exist ?
    const currentUser = await User.findById(decoded.id);
    if(!currentUser)
        return next(new AppError('The user belonging to this token does no longer exist',401));
    //user changed password after token issued ?
    if(currentUser.changePasswordAfter(decoded.iat))
        return next(new AppError(`User recently changed pass! plz login again`,401));
    //grant access to protected route
    req.user = currentUser;//will be useful wait
    res.locals.user = currentUser
    next();
});

//for render pages,no errors
exports.islogedin = catchAsync(async (req,res,next) => {
    //getting token and check if it exist
    if(req.cookies.jwt)
    {
        //verfication the token
        const decoded = await promisify( jwt.verify)(req.cookies.jwt,process.env.JWT_SECRET);
        //user still exist ?
        const currentUser = await User.findById(decoded.id);
        if(!currentUser)
            return next();
        //user changed password after token issued ?
        if(currentUser.changePasswordAfter(decoded.iat))
            return next();
        res.locals.user = currentUser;
    }
    next();
});


exports.logout = (req, res) => {
    res.clearCookie('jwt');
    res.status(200).json({ status: 'success' });
};

//appeal to authority not any one can do anything
exports.restrictTo = (...roles) => {
    return (req,res,next) => {
        //roles is an array
        if(!roles.includes(req.user.role)) 
        {
            return next(new AppError(`You do not have permisson for this only ${roles}` ,403));
        }
        next();
    }
}

exports.forgotPassword =catchAsync( async (req,res,next) => 
{
    //get user based on email
    const user = await  User.findOne({email:req.body.email});
    if(!user)
    {
        return next(new AppError('no user with this email',404));
    }
    //generate random token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateModifiedOnly: true });//validate modified only. actually we only modified the doc not save it so we must save it and be careful i said modified not updated
    //send it back as email
    try
    {
        const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
        // await sendEmail({
            //     email: user.email,
            //     subject: `Your pass reset token valid for 10 minutes`,
            //     message:message,
            // });
        await new Email(user,resetURL).sendPasswordReset();
        res.status(200).json({
        status:'success',
        message:'token sent to email!'
        });
    }
    catch(err)
    {
        user.passwordResetToken = undefined;
        user.passwordResetExpired = undefined;
        await user.save({ validateModifiedOnly: true });
        return next(new AppError('Error sending email try again later',500));
    }

});

exports.resetPassword =catchAsync( async (req,res,next ) => 
{
    //get user based on the token
    const hashedToken =  crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user =await User.findOne // such req is valid iff the user exist and the token and the expired time is on
    (
        {
            passwordResetToken:hashedToken,
            passwordResetExpired: {$gt: Date.now()}
        }
    );
    //set new pass if token has not expired else throw err
    if(!user)
    {
        return next(new AppError(`Token is invalid or expired`,400));
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpired = undefined;
    await user.save();
    //update changed password for the user
    //log the user in
    createAndSendToken(user,200,res);
});

exports.updatePassword =catchAsync( async (req,res,next) => 
{
    //Get user from the db
    const user =await User.findById(req.user.id).select('+password');
    //check if the pass is correct
    if(!(await user.correctPassword(req.body.passwordCurrent,user.password)))
    {
        return next(new AppError(`CURRENT PASSWORD IS WRONG`,400));
    }
    //if so ? -> update it
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    //log in, send  jwt
    await user.save({ validateModifiedOnly: true });
    createAndSendToken(user,200,res);
});

