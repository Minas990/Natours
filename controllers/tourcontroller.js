
const multer = require('multer');
const sharp = require('sharp');

const Tour = require('../models/tourModel');
const catchAsync = require('../utails/catchAsync');
const AppError = require('../utails/appError');
const factory = require('./handlerFactory');

/*
// const tours = JSON.parse ( fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`) );

//to validate but for only the file now we have mongoose
// exports.checkBody = (req,res,next) =>
// {
//     console.log();
//     const val = req.body;
//     if(!val.name || !val.price)
//     {
//         return res.status(404).json({
//         status:'fail',
//         message: 'missing name or price'
//     });
//     }
//     next();
// }

//route handlers
// exports.aliasTopTours = (req,res,next) =>
// {
//     req.query.limit = '5';
//     req.query.sort = '-ratingsAverage,price';
//     req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
//     console.log('this is',req.query);
//     next();
// }

*/


//this for the cheapest 5 tours 
//note that its differ from the video bcs it wasnt working : dont know why 
//in the video was req.sort = ? ; req.price = ? and so on




const multerStorage = multer.memoryStorage(); // as a buffer
const multerFilter = (req,file,cb) => {
    if(file.mimetype.startsWith('image'))
    {
        cb(null,true);
    }
    else
    {
        cb(new AppError('not an image. plz upload only images',400),false);
    }
}

const upload = multer({
    storage:multerStorage,
    fileFilter: multerFilter
});



exports.uploadTourImages = upload.fields([
    {name: 'imageCover',maxCount:1},
    {
        name:'images',
        maxCount:3
    }
]);


exports.resizeTourImages =catchAsync( async(req,res,next) => 
{
    if(!req.files || !req.files.imageCover || !req.files.images) return next();

    //cover image
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
    await sharp(req.files.imageCover[0].buffer)
    .resize(2000,1333)
    .toFormat('jpeg').
    jpeg({quality:90})
    .toFile(`public/img/tours/${ req.body.imageCover}`);
    //others
    req.body.images=[];
    await Promise.all(
    req.files.images.map(async (file,i) => {
        const filename = `tour-${req.params.id}-${Date.now()}-${i+1}.jpeg`
        await sharp(file.buffer)
        .resize(2000,1333)
        .toFormat('jpeg')
        .jpeg({quality:90})
        .toFile(`public/img/tours/${ filename }`);
        req.body.images.push(filename);
    }));
    
    next();
});


exports.aliasTopTours = (req,res,next) =>
{
    req.url =
    "/?sort=-ratingsAverage,price&fields=ratingsAverage,price,name,difficulty,summary&limit=5";
    next();
}

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour,{path:'reviews'});
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);


exports.getTourStats = catchAsync( async (req,res,next) =>
{
    const stats =await Tour.aggregate([
        {
            // { methodName: {propName: {aggFunc} } }
            $match: {ratingsAverage: {$gte:4.5}},
            
        }
        ,
        {
            $group: {
                _id: { $toUpper : '$difficulty'},//group by
                numTours: {$sum: 1},
                numRatings: {$sum: '$ratingsQuantity'},
                avgRating: {$avg: '$ratingsAverage'},
                avgPrice: {$avg: '$price'},
                minPrice: {$min: '$price'},
                maxPrice: {$max: '$price'}
            }
        }
        ,
        {
            $sort: { avgPrice: 1 }
        }
        ,
        // {
        //     $match: { _id: {$ne: 'EASY'}}
        // }
    ]);
    res.status(200).json({
        status:'success',
        data: {stats},
    });
});


exports.getMonthlyPlan =catchAsync( async (req,res,next) => 
{

    const year = +req.params.year;
    const plan = await Tour.aggregate([
        {
            //simply foreach element in this array we will make a document quite memory fk
            $unwind: '$startDates'
        }
        ,
        {
            $match: {
                startDates: { 
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`),
                }
            }
        }
        ,
        {
            $group: {
                _id: {$month:'$startDates'},
                numToursStarts: {$sum: 1},
                tours: { $push: '$name' }
            }
        }
        ,
        {
            $addFields:{
                month: '$_id'
            }
        }
        ,
        {
            //no loner shows up in the result if its 0 else is 1
            $project: {
                _id: 0
            }
        }
        ,
        {
            $sort: {numToursStarts:-1}//desc
        }
        ,
        {
            $limit: 12 //limit the result 
        }
        ,
    ]);
    res.status(200).json({
        status:'success',
        data: {plan},
    });
});


//distance,latlng,unit
exports.getToursWithIn = catchAsync (async(req,res,next) => 
{
    const {distance,latlng , unit} = req.params; 
    const [lat,lng] =latlng.split(',');
    if(!lat||!lng)
        return next(new AppError(`plz provide latlng int the format lat,lng`,400));
    
    const radius = unit === 'mi' ? distance/3963.2: distance/6378.1 ;

    const tours =await Tour.find(
        {
            startLocation:{
                $geoWithin: {
                    $centerSphere: [[lng,lat], radius ]
                }
            }
        });

    res.status(200).json({
        status:'success',
        results:tours.length,
        data:{
            data:tours
        }
    });
});


exports.getDistances = catchAsync( async (req,res,next) => {

    const {latlng , unit} = req.params; 

    const [lat,lng] =latlng.split(',');

    const multplayer = unit === 'mi' ? 0.00062137: 0.001;
    if(!lat||!lng)
        return next(new AppError(`plz provide latlng in the format lat,lng`,400));
    
    const distances = await Tour.aggregate([
        {
            //always the first stage in aggreage and one of out feild must be geospecial index
            $geoNear: {
                near: {
                    type:'Point',
                    coordinates: [+lng,+lat]
                },
                distanceField: 'distance',
                distanceMultiplier: multplayer
            }
        },
        {
            $project: {
                distance: 1,
                name:1
            }
        }
    ]);

    res.status(200).json({
        status:'success',
        data:{
            data:distances
        }
    });
});