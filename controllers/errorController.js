const AppError = require("../utails/appError");

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message,400);
}

const handleJWTError = () => {
    return new AppError(`Invalid token.plz login again`,401);
}

const handleJWTExpired = () => new AppError(`your token has expired login again.`,401);


const handleDuplicateFieldsDB = err => {
    // const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const value = err.keyValue.name;//i prefer this
    const message = `Duplicate field Value:${value} .Plz use another value`;
    return new AppError(message,400);
}

const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message).join('. ');
    const message = `Invalid input Data. ${errors}`;
    return new AppError(message,400);
}


const sendErrorForDev = (err,req,res) => {
    //api
    if(req.originalUrl.startsWith('/api'))
    {   
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
            error:err,
            stack:err.stack,
        });
    }
    //rendering
    else 
    {
        res.status(err.statusCode).render('error',{
            title:'Something went wrong!',
            msg:err.message
        });
    }

}

const sendErrorProd = (err,req,res) => 
{
    //does the code from us ?or from other pakcage
    if(req.originalUrl.startsWith('/api'))
    {
        if(err.isOperational)
        {
            res.status(err.statusCode).json({
                message: err.message,
                status:err.status,
            });
        }
        else
        {
            console.log(err);
            res.status(500).json({
                status:'error',
                message: 'something went wrong'
            });
        }
        return;
    }

    if(err.isOperational)
    {
        res.status(err.statusCode).render('error',{
            title: 'Something is wrong',
            msg: err.message
        });
    }
    else
    {
        console.log(err);
        res.status(500).render('error',{
            title: 'Something is wrong',
            msg: `plz try again later`
        });
    }
    

}

module.exports = (err,req,res,next) => {
    err.statusCode = err.statusCode || 500;//internal server error
    err.status = err.status||'error';
    if(process.env.NODE_ENV === 'development')
    {
        return sendErrorForDev(err,req,res);
    }
    
    let error = {...err};//this will lose the prototype chain and we will lose .name prop but we dont care as we check the original err.name not error.name you can use create if u want to serve 
    error.message = err.message;
    if(err.name === 'CastError') 
        error = handleCastErrorDB(error);
    if(err.code === 11000)
        error = handleDuplicateFieldsDB(error);
    if(err.name === 'ValidationError') 
        error = handleValidationErrorDB(error);
    if(err.name === 'JsonWebTokenError') 
        error = handleJWTError();
    if(err.name === 'TokenExpiredError')
        error = handleJWTExpired();
    sendErrorProd(error,req,res);
    
}
