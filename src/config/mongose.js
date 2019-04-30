const mongoose = require('mongoose')

const localhost = 'mongodb://127.0.0.1:27017/jc8ReactMongoose'

mongoose.connect('mongodb+srv://aldyazarya:azarya1612@cluster0-ju1s3.mongodb.net/ReactMongoose?retryWrites=true', { // Generate connection to database
    useNewUrlParser: true, // Parsing URL to the form mongodb needs
    useCreateIndex: true, // Auto generate Indexes from mongodb, to get access to the data
    useFindAndModify: false //  deprecated
})