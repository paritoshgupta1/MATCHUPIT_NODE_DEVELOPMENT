const mongoose = require("mongoose");

const { Schema, model } = mongoose;

const corporatetagsSchema = new Schema({
    individualId: {
        type: String,
        required: true,
    },
    corporateId: {
        type: String
    },
    masterId: {
        type: String
    },
    comments: [
        {
            comment: {
                type: String
            },
            createdOn: {
                type: Date
            }
        },
    ],
    createdOn: {
        type: Date
    },
    shortlisted: {
        type: Boolean,
        default: false
    },
    favourite: {
        type: Boolean,
        default: false
    },
}, { versionKey: false });

module.exports = model("corporatetags", corporatetagsSchema);
