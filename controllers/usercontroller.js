const multer = require('multer'); 
const sharp = require('sharp');
const fs = require('fs');

const User = require("../models/userModel");
const AppError = require("../utails/appError");
const catchAsync = require("../utails/catchAsync");
const factory = require('./handlerFactory');

// const multerStorage = multer.diskStorage({
//     destination: (req,file,cb) => {
//         cb(null,'public/img/users')
//     },
//     filename: (req,file,cb) => {
//         //user -23432432-32424.jpeg
//         const extention = file.mimetype.split('/')[1];
//         cb(null,`user-${req.user.id}-${Date.now()}.${extention}`);
//     }
// });



const deleteOldPhoto = photo => {
    if (photo.startsWith('default')) return;
    const path = `${__dirname}/../public/img/users/${photo}`;
    fs.unlink(path, err => {
        if (err) return console.log(err);
        console.log('Previous photo has been deleted');
    });
};


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


exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync( async (req,res,next)=> {
    if(!req.file) return next();
    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;//must define that
    await sharp(req.file.buffer).resize(500,500).toFormat('jpeg').jpeg({quality:90})
    .toFile(`public/img/users/${req.file.filename}`);
    next();
});

const filterObj = (obj , ...allowedFilters) =>
{
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if(allowedFilters.includes(el))
            newObj[el] = obj[el];
    });
    return newObj;
}

exports.getMe= (req,res,next) => {
    req.params.id = req.user.id;
    next();
}


exports.updateMe = catchAsync(async (req,res,next) => {
    
    //create error if the data posted is passwrd
    if(req.body.password || req.body.passwordConfirm) 
    {
        return next(new AppError('this route is not for password updates plz use /updatemypassword',400));
    }
    //update the doc
    // body.role = 'admin'; this is not allow so we will not pass the req.body
    //so we will filter out prop the are not allowed to be updated
    const filteredBody = filterObj(req.body,'name','email'); 
    if(req.file)
    {
        filteredBody.photo = req.file.filename;
        deleteOldPhoto(req.user.photo);
    }
    const updatedUser = await User.findByIdAndUpdate(req.user.id,filteredBody, {new:true,runValidators:true});
    res.status(200).json({
        status:'success',
        date: {
            user: updatedUser
        }
    })
});

exports.deleteMe = catchAsync (async (req,res,next) =>
{
    await User.findByIdAndUpdate(req.user.id,{active: false});
    res.status(204).json({
        status: 'success',
        data:null
    })
}) 

exports.createUser = (req,res) =>
{
    res.status(500).json({
        status:'error',
        message : 'this route isnt yet defined! plz use signup instead'
    });
}


exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
//do not update pass with this
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);

