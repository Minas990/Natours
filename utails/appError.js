class AppError extends Error
{
    constructor(message,statusCode)
    {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail':'success';
        this.isOperational = true;
        Error.captureStackTrace(this,this.constructor); //stop the trace. dont understand ? search about it
    }

};  

module.exports = AppError;