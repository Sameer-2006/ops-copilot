const mongoose = require("mongoose");

const riderSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    capacity: {
        type: Number,
        required: true
    },

    currentLoad: {
        type: Number,
        default: 0
    },

    status: {
        type: String,
        enum: ["ACTIVE", "BROKEN", "OFFLINE"],
        default: "ACTIVE"
    },

    location: {
        lat: {
            type: Number,
            required: true
        },

        lng: {
            type: Number,
            required: true
        }
    }
});

const Rider = mongoose.model("Rider", riderSchema);

module.exports = Rider;