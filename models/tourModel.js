const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel');
// const validator = require('validator');

//descripe the schma and the validation , schema : blueprint
const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true,'A tour must have a name'],
        unique: true,
        trim: true,
        maxLength: [40,'A tour name must have less or equal than 40 chars'],
        minLength:[10,'A tour name must have more than  or equal than 10 chars'],
    
    },  
    slug:String,
    duration: {
        type:Number,
        required: [true,'A tour must have a duration'],
    },

    maxGroupSize: {
        type: Number ,
        required: [true,'A tour must have a group size'],
    },

    difficulty: {
        type: String ,
        required: [true,'A tour must have a difficulty'],
        enum:{
            values:['easy','medium','difficult'],
            message: 'difficulty is either easy , medium , difficult'
        } ,

    },

    ratingsAverage: {
        type : Number,
        default: 4.5,
        min: [1,'rating must be above 1.0'],
        max: [5,'rating must be under 5.0'],
        set: val => Math.round(val*10)/10 //4.666 to 47 then over 10 to be only 4.7
    },

    
    ratingsQuantity: {
        type : Number,
        defulat: 0
    },

    price: {
        type:Number,
        required: [true,'A tour must have a price']
    },

    priceDiscount: {
        type:Number,
        validate: {
            validator: function(val){
                //not working with update only with new docs bcs of {this} keyword
                return val < this.price;
            },
            message: 'Discount Price ({VALUE}) should be less than regular price'
        } 
        
    } 
    ,
    summary: {
        type: String,
        trim: true,
        required: true
    },

    description: {
        type: String,
        trim: true
    },

    imageCover: {
        type: String,
        required: [true,'A tour must have a cover image']
    },

    images: [String],

    createdAt: {
        type: Date,
        default: Date.now(),
        select: false
    },

    startDates: [Date],
    secretTour: {
        type:Boolean,
        defualt: false
    },

    startLocation: {
        //geoJson
        type:{
            type:String,
            default:'Point',
            enum: ['Point']
        },
        coordinates:[Number], //long first then lat,
        address:String,
        description: String
    },
    locations: [
        {
            type:{
                type:String,
                default:"Point",
                enum: ['Point']
            },
            coordinates:[Number],
            address:String,
            description: String,
            day:Number,
        }
    ],
    guides: 
    [
        {
            type: mongoose.Schema.ObjectId,//refrence 
            ref:'user' //name must be the name of the model be aware of the lowercase
        }
    ],
},{
    toJSON:{virtuals:true},
    toObject:{virtuals:true},
});

// tourSchema.index({price:1});
tourSchema.index({price:1,ratingsAverage:-1});
tourSchema.index({slug:1});

tourSchema.index({startLocation: '2dsphere'}); 
//virtual populate
tourSchema.virtual('reviews',{
    ref: 'review',
    foreignField:'tour',
    localField:'_id'
});

//we need the this keyword as we didnt use arrow function 
//virtual will not sotred in database
//we cannot used it in query
tourSchema.virtual('durationWeeks').get(function() {
    if(this.duration)
        return this.duration/7;
});





//middleware before -> doc middleware before save and create not insertMany
tourSchema.pre('save',function(next){
    this.slug = slugify(this.name,{lower:true});
    next();
});

//embedding
// tourSchema.pre('save',async function(next) {
//     const guidesPromises =  this.guides.map( async id => await User.findById(id));
//     this.guides = await Promise.all(guidesPromises);
//     next();
// });


//query middleware
//for find and findone
tourSchema.pre(/^find/,function(next){
    //this is query method // we test like this instead of find({secretTour:flase}) as some data we insert was not having this prop so it is undefined
    this.find({secretTour: {$ne:true}});
    this.start = Date.now();
    next();
});

tourSchema.pre(/^find/,function(next){
    this.populate({
        path:'guides',
        select:'-__v -passwordChangedAt'
    });
    next();
});

tourSchema.post(/^find/,function(doc,next){
    console.log(`Query took ${Date.now()-this.start} ms`);
    next();
});


//agg middleware
// tourSchema.pre('aggregate',function(next) {
//     this.pipeline().unshift({$match: {secretTour:{$ne:true}}});//push to the first 
//     next();
// });



//create it Note: the name Tour will be lowercased and it will be pluralized in mongoDB
const Tour = mongoose.model('tour',tourSchema);

module.exports = Tour;

