'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CabSchema = new Schema({
    name: String, //cabName
    driver: {
        name: String,
        phoneNumber: String,
        emailId: String
    }, // driver details
    cabMates: [{
        id: String,
        name: String,
        emailId: String,
        image: String,
        location: Object,
        presence: { type: Boolean, default: true },
        phoneNumber: String
    }], // cab mates details
    arrivalTime: String // arrival time of cab
});

var Cab = mongoose.model('Cab', CabSchema);
exports.default = Cab;