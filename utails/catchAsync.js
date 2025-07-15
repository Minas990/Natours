//instead of writing multiple catches just use closuers this will return a callback
module.exports =fn => {
    return (req,res,next) => 
    {
        fn(req,res,next)
        .catch(next);
    }
};