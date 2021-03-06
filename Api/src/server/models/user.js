'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var UserSchema = new Schema({
    name: String, //UserName
    email: {type: String, lowercase: true}, //UserEmail
    provider: String, //google
    googleId: String,
    pushToken: String,
    location: Object,
    cabId:String,
    image: String,
    phoneNumber: String,
});

const User = mongoose.model('User', UserSchema);
export default User;
