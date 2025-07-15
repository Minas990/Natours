const path = require('path');
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const rateLimit = require('express-rate-limit');
const helmet =require('helmet');
const sanitize = require('mongo-sanitize');
const sanitizeHtml = require('sanitize-html');
// const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const AppError = require('./utails/appError');
const globalErrorHandler = require('./controllers/errorController');

const userRouter = require('./routes/userRoutes');
const tourRouter = require('./routes/tourRoutes');
const reviewRouter = require('./routes/reviewsRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter =require('./routes/bookingRoutes');

const app = express();

//middlewares


//this app.set() because when parsing a url like duration[gte] doesnt covert to duration: { gte: {}} so we must use this
app.set('query parser', 'extended')
app.set('view engine','pug');
app.set('views',`${path.join(__dirname,'views')}`);
app.use(express.urlencoded({extended:true,limit:'10kb'}));//for forms submitting encode url 

app.use(compression());//only text

app.use(
  cors({
    origin: 'http://localhost:8000',
  })
);



app.use(express.static(`${path.join(__dirname,'public')}`));

// security: http header
app.use(helmet());

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'script-src': ["'self'", 'https://unpkg.com', "https://cdnjs.cloudflare.com"],
      'img-src': ["'self'", 'data:', 'https://*.tile.openstreetmap.org'],
      'connect-src': ["'self'", "http://127.0.0.1:8000", "https://checkout.stripe.com"],
    },
  })
);


//dev logging
if(process.env.NODE_ENV === 'development')
{
  app.use(morgan('dev'));
}

//limit req from same ip
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: `to many request from this app plz try again in an hour`,
});

app.use('/api',limiter);


//to req.json -> body parser
app.use(express.json({limit:'10kb'}));
app.use(cookieParser());
    

//sanitize against noSql query injection

app.use((req,res,next)=> {
    if(req.body)
    {
        req.body = sanitize(req.body);
    }
    if(req.query)
    {
        Object.keys(req.query).forEach(key => {
            req.query[key] = sanitize(req.query[key]);
        });
    }
    if (req.params) {
        Object.keys(req.params).forEach(key => {
            req.params[key] = sanitize(req.params[key]);
        });
    }
    next();
})

//aginst xss

app.use((req, res, next) => {

  if (req.body) {
    Object.entries(req.body).forEach(([key, value]) => {
      if (typeof value === 'string') {
        req.body[key] = sanitizeHtml(value);
      }
    });
  }
 
  if (req.query) {
    Object.entries(req.query).forEach(([key, value]) => {
      if (typeof value === 'string') {
        req.query[key] = sanitizeHtml(value);
      }
    });
  }
 
  if (req.params) {
    Object.entries(req.params).forEach(([key, value]) => {
      if (typeof value === 'string') {
        req.params[key] = sanitizeHtml(value);
      }
    });
  }
  next();
});


//date into req
app.use((req,res,next) => {
    req.reqeustTime = new Date().toISOString();
    next();
});



//pug
app.use('/',viewRouter);

app.use('/api/v1/tours',tourRouter);
app.use('/api/v1/users',userRouter);
app.use('/api/v1/reviews',reviewRouter);
app.use('/api/v1/bookings',bookingRouter);

//we can use app.use also 
app.all('/{*any}',(req,res,next) => {
    next(new AppError(`Cant Find ${req.originalUrl} on this Server!`,404)); //always the first parameter is error;
});

//error handling -> 4 params
app.use(globalErrorHandler);

module.exports = app;


