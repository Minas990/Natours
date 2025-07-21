const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
//name , meail , photo ,password,passConfirm;

const userShcema =new mongoose.Schema({

    name: {
        type: String,
        required: [true,'plz tell us your name'],
    },
    email: {
        type:String,
        required: [true,'plz tell us ur email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail,'plz provide a valid email']
    },
    photo: {
        type: String,
        default: 'default.jpg'
    },
    role: {
        type:String,
        default:'user',
        enum: ['user','guide','lead-guid','admin']
    },
    password: {
        type: String,
        required: [true,'plz provide ur password'],
        minLength: [8,'Password must be bigger than 8 chars'],
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true,'plz confirm ur password'],
        //be aware that work only in save not update
        validate: {
            validator: function(val) {
                return this.password ===  val;
            },
            message: `password confirmation error`
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpired: Date,
    active: {
        type:Boolean,
        default:true,
        select: false,
        
    }
});

userShcema.pre('save',function(next) {
    if(!this.isModified('password') || this.isNew)//new doc considered modified
    {
        return next();
    }
    this.passwordChangedAt =  Date.now() - 1000;
    next();
});

userShcema.pre('save',async function(next) {
    
    if(!this.isModified('password'))
        return next();
    this.password =await bcrypt.hash(this.password,12);//password should not be stored as plain/text
    this.passwordConfirm = undefined;
    next();
});



userShcema.pre(/^find/,function(next) {
    //this Points to the current query
    this.find({active:{$ne:false}});
    next();
});


//instanceMethod 
userShcema.methods.correctPassword =async function(candidatePassword,userPassword) {
    //candidate is not hashed the other yes 
    return await bcrypt.compare(candidatePassword,userPassword);
}

//be aware this function return true  if the password changed not the opposite so u seek for false 
//to continue ur validation journey
userShcema.methods.changePasswordAfter = function(JWTTimestamp) 
{
    if(this.passwordChangedAt)
    {
        const changedTimestamp =parseInt(this.passwordChangedAt.getTime()/1000,10);
        return JWTTimestamp < changedTimestamp;
    }
    //false means not changed 
    return false;
}


userShcema.methods.createPasswordResetToken = function()
{
    const resetToken = crypto.randomBytes(32).toString('hex');//generate token

    //encrypt it 
    this.passwordResetToken =  crypto.createHash('sha256').update(resetToken).digest('hex');
    //the period which the token will be available
    this.passwordResetExpired = Date.now() + 10 * 60 * 1000;

    return resetToken;
}
const User = mongoose.model('user',userShcema);

module.exports = User;
