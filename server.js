const mongoose = require('mongoose');

const dotenv = require('dotenv');


//for unhandled errors thrown in global code 
process.on('uncaughtException',err=> {
    console.log(`Unhadled error shutting down...`);
    console.log(err.stack);
    console.log(err.name,err.message);
    process.exit(1);
});

dotenv.config({path:'./config.env'});

const app = require('./app');

const DB = process.env.DATABASE.replace('<PASSWORD>',process.env.DATABASE_PASSWORD)

mongoose.connect(DB)
.then(() => {console.log('Dp connetion successful');})

const port = process.env.PORT || 8000;
const server = app.listen(port,() => {
    console.log(`App Running in port: ${port}....`);
});



process.on('unhandledRejection',err => {
    console.log(`full error:`, err);
    console.log(err.name,err.message);
    console.log(`Unhadled rejection shutting down...`);
    server.close(() => {
        process.exit(1);
    });
});


