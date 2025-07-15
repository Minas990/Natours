const mongoose =require('mongoose');

const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema({
    review: {
        type:String,
        required:[true,'cannot be empty: REVIEW']
    },

    rating: {
        type:Number,
        required:[true,'cannot be emlty: rating'],
        min:1.0,
        max:5.0
    },

    createdAt: {
        type:Date,
        defualt: Date.now(),
        select: false
    },

    user: {
        type: mongoose.Schema.ObjectId,
        ref:'user',
        required:[true,'must belong to a user: REVIEW']
    },

    tour: {
        type:mongoose.Schema.ObjectId,
        ref:'tour',
        required:[true,'must belong to a tour: REVIEW']
    }

}, {
    toJSON:{virtuals:true},
    toObject:{virtuals:true},
});

// findByIdAndUpdate
// findByIdAndDelete


reviewSchema.pre(/^find/,function(next) {
    // this.populate({
    //     path:'user',
    //     select:'name email'
    // }).populate({
    //     path:'tour',
    //     select:'name photo'
    // });
    this.populate
    (
        {
            path:'user',
            select:'name photo'
        }
    );
    next();
});

reviewSchema.statics.calcAverageRatings = async function(tourId)
{
    const state = await this.aggregate([
        {
            $match: {tour:tourId }
        }
        ,
        {
            $group: {
                _id:'$tour',
                nRatings:{ $sum : 1},
                avgRatings: {$avg: '$rating'}
            }
        }
    ]);
    if(state.length>0)
    {
        await Tour.findByIdAndUpdate(tourId,{
            ratingsAverage:state[0].avgRatings,
            ratingsQuantity:state[0].nRatings
        });
    }
    else 
    {
        await Tour.findByIdAndUpdate(tourId,{
            ratingsAverage:4.5,
            ratingsQuantity:0
        });
    }
}
//a review is only from one user and to one tour so we must make an index for that 
reviewSchema.index({tour:1,user:1},{unique:true});//we dont want the user to enter multiple reviews for one shcmea

reviewSchema.post('save', function(){
    this.constructor.calcAverageRatings(this.tour);
});


// reviewSchema.pre(/^findOneAnd/,async function(next)
// {
//      this.r = await this.model.findOne(this.getQuery());//like make antoher queu
//     next();
// });

// reviewSchema.post(/^findOneAnd/,async function(){
//     await this.r.constructor.calcAverageRatings(this.r.tour);
// });

//more modern way
reviewSchema.post(/^findOneAnd/,async function(doc){

    if(doc)
    {
        await this.model.calcAverageRatings(doc.tour);
    }
    else 
        console.log('no doc');
});

const Review = mongoose.model('review',reviewSchema);

module.exports = Review;

//we need to prevent the user from making 2 reviews in the same tour