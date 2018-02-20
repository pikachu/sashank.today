var mongoose = require("mongoose");

var feelingSchema = new mongoose.Schema({
	timestamp: {
		type: "Date",
		default: Date.now
	},
	feeling: {
		type: "String",
		required: true
	}
}, { 
	timestamps: 
	{ createdAt: 'created_at' } 
});

var Feeling = mongoose.model("Feeling", feelingSchema);
module.exports = Feeling;
