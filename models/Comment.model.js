// models/User.model.js
const { Schema, model } = require('mongoose');

const commentSchema = new Schema(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true
		},
		cryptoId: {
			type: String,
			required: true
		},
		cryptoName: {
			type: String,
			required: true
		},
		cryptoSymbol: {
			type: String,
			required: true
		},
		text: {
			type: String,
			required: true
		}
	},
	{
		timestamps: true
	}
);

module.exports = model('Comment', commentSchema);
