// models/User.model.js
const { Schema, model } = require('mongoose');

const userSchema = new Schema({
	username: {
		type: String,
		trim: true,
		required: [ true, 'Username is required.' ],
		unique: true
	},
	email: {
		type: String,
		required: [ true, 'Email is required.' ],
		// this match will disqualify all the emails with accidental empty spaces, missing dots in front of (.)com and the ones with no domain at all
		match: [ /^\S+@\S+\.\S+$/, 'Please use a valid email address.' ],
		unique: true,
		lowercase: true,
		trim: true
	},
	passwordHash: {
		type: String,
		required: [ true, 'Password is required.' ]
	},
	cryptocurrency: {
		type: [ Schema.Types.ObjectId ],
		ref: 'Cryptocurrency'
	},
	comments: {
		type: [ Schema.Types.ObjectId ],
		ref: 'Comment'
	},
	favorites: [{
		apiID: String,
		name: String,
		symbol: String,
		price_usd: String,
		percent_change_24h: String,
		percent_change_1h: String,
		percent_change_7d: String,
		csupply: String,
		market_cap_usd: String
	}]
}, {
	timestamps: true
});

module.exports = model('User', userSchema);
