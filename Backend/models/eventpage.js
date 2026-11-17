
const mongoose = require('mongoose');

const EventPageSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date
    },
    time: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    image: {
        type: String,
        default: ""
    },

    category: {
        type: String,
        default: "General"
    },
    organizer: {
        type: String,
        default: ""
    },

    status: {
        type: String,
        enum: ["upcoming", "ongoing", "ended"],
        default: "upcoming"
    },

    noofregistrations: {
        type: Number,
        default: 0,
        min: 0
    },
    maxParticipants: {
        type: Number,
        default: 0
    },
    registrationDeadline: {
        type: Date
    },
    registrationPath: {
        type: String,
        default: ""
    },

    price: {
        type: Number,
        default: 0
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    tags: [{
        type: String
    }],

    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model(
    'EventPage',
    EventPageSchema
);
