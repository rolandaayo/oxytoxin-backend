const mongoose = require('mongoose');
const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    stock: {
        type: Number,
        min: 0
    },
    instock:{
        type: Boolean,
        default: true
    },
    colors:{
        type: [String],
        default: []
    },
    rating:{
        type:[Number],
        default: []
    },
    reviews:{
        type:Number,
        default: 0
    },
    features:{
        type: [String],
        default: []
    },
    image:{
        type: [String],
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

const Product = mongoose.model('products', productSchema);
module.exports = Product;