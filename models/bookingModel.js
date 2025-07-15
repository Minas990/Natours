const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    tour: 
    {
        type:mongoose.Schema.ObjectId,
        ref:'tour',
        required: [true,'must belong to tour']
    },
    user: {
        type:mongoose.Schema.ObjectId,
        ref:'user',
        required: [true,'must belong to user']
    },
    price: {
        type:Number,
        required: [true,'must have price']
    },
    createdAt: {
        type:Date,
        default: Date.now()
    },

    paid: {
        type:Boolean,
        default:true
    }
});

bookingSchema.pre(/^find/,function(next){
    this.populate('user').populate({
        path:'tour',
        select:'name'
    });
    next();
});

const Booking = mongoose.model('booking',bookingSchema);

module.exports = Booking;