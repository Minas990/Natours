class APIFeatures
{
    constructor(query,queryString) 
    {
        this.query = query;
        this.queryString = queryString; //this is req.body the name might be confusing but its not string its json
    }

    filter()
    {
        //filtering 
        //1) we need to exclude this type of queires as its special 
        // note that if u misspeale any. something undefined will happend
        const qureyObj = {...this.queryString};//destruct as we need a hard copy not shallow 
        const excludedFields = ['page','sort','limit','fields']; // the excluded props
        excludedFields.forEach(el => delete qureyObj[el]);

        //advanced filltering this bcs moongose understand P[$gt] not p[gt]
        let queryStr = JSON.stringify(qureyObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
        this.query = this.query.find(JSON.parse(queryStr));
        return this;
    }

    sort()
    {
        if(this.queryString.sort)
        {
         
            const sortBy =  this._formatQuery(this.queryString.sort);
            this.query = this.query.sort(sortBy);
            //sort('price ratingsAverage');
        } 
        //by defualt
        else 
        {
            this.query.sort('-createdAt _id');
        }
        return this;
    }
    
    _formatQuery(query)  
    {
        if (Array.isArray(query)) {
            query = query.join(' ');
        }
        return query.replaceAll(',', ' ');
    }

    limitFields()
    {
        //field limit
        if(this.queryString.fields)
        {
            const fields = this._formatQuery(this.queryString.fields);
            this.query = this.query.select(fields); //this for choose certain props
        }
        else 
        {
            this.query = this.query.select('-__v');
        }
        return this;
    }

    pagination() 
    {
        //pagination
        const page = +this.queryString.page || 1;
        const limit = +this.queryString.limit || 100;
        const skip = (page-1)*limit;
        this.query = this.query.skip(skip).limit(limit);//skip skips  some amount of records and limit explaint itslef
        return this;
    }
};

module.exports = APIFeatures;