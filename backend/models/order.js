const mongoose = require("mongoose");


const orderSchema = new mongoose.Schema(

    {





        pickup: {

            address: {
                type: String,
                required: true
            },

            lat: {
                type: Number,
                required: true
            },

            lng: {
                type: Number,
                required: true
            }

        },






        delivery: {

            address: {
                type: String,
                required: true
            },

            lat: {
                type: Number,
                required: true
            },

            lng: {
                type: Number,
                required: true
            }

        },






        pickupSource: {

            type: String,

            enum: [
                "WAREHOUSE",
                "STORE",
                "MARKETPLACE",
                "OTHER"
            ],

            default: "WAREHOUSE"

        },






        weight: {

            type: Number,

            required: true

        },






        priority: {

            type: String,

            enum: [
                "LOW",
                "MEDIUM",
                "HIGH"
            ],

            default: "MEDIUM"

        },






        status: {

            type: String,

            enum: [
                "UNASSIGNED",
                "ASSIGNED",
                "IN_TRANSIT",
                "DELIVERED",
                "FAILED"
            ],

            default: "UNASSIGNED"

        },






        riderId: {

            type:
                mongoose.Schema.Types.ObjectId,

            ref: "Rider",

            default: null

        }

    },

    {
        timestamps: true
    }

);


const Order =
    mongoose.model(
        "Order",
        orderSchema
    );


module.exports = Order;