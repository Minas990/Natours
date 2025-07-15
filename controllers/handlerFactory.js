const APIFeatures = require("../utails/apiFeatures");
const AppError = require("../utails/appError");
const catchAsync = require("../utails/catchAsync");


exports.deleteOne = Model => catchAsync( async (req,res,next) =>
{
    const doc = await Model.findByIdAndDelete(req.params.id);
    if(!doc)
    {
        return next(new AppError(`No Tour found with this id`,404));
    }
    res.status(204).json({
        status:'success',
        data: null,
    });
});


exports.updateOne = Model => catchAsync( async (req,res,next) =>
{
    const doc = await Model.findByIdAndUpdate(req.params.id,req.body,{
        new: true, 
        runValidators: true
    });
    if(!doc)
    {
        return next(new AppError(`No document found with this id`,404));
    }
    res.status(200).json({
        status:'success',
        data: {
            data:doc
        }
    });
    
});

exports.createOne = Model =>  catchAsync(async (req,res,next) =>
{
    // const newTour = new Tour({});
    // newTour.save();
    const doc = await Model.create(req.body);
    res.status(201).json
    (
        {
            status: 'success',
            data: 
            {
                data: doc
            }
        }
    )
});

exports.getOne = (Model,popOptions) => catchAsync(async (req,res,next) => 
{
    let query = Model.findById(req.params.id);
    if(popOptions)
        query = query.populate(popOptions);
    const doc = await query;
    // doc.findOne({_id:req.params.id,})//the same as the above
    //if not doc found
    if(!doc)
        return next(new AppError(`No doc found with this id`,404));

    res.status(200).json
    (
        {
            status: 'succes',
            data:{data: doc}
        }
    );
});


exports.getAll = Model => catchAsync( async (req,res,next) => 
{
    //to allow for nested getReviews on tour
    let filter = {};
    if(req.params.tourId) filter = {tour:req.params.tourId};
    const features = new APIFeatures(Model.find(filter),req.query)
    .filter()
    .sort()
    .limitFields()
    .pagination();
    // const doc = await features.query.explain();
    const doc = await features.query;
    res.status(200).json
    (
        {
            status: 'success',
            results: doc.length ,
            data: {data: doc }
        }
    );
});
