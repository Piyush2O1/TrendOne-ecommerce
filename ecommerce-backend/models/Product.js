const mongoose = require('mongoose');

const normalizeCategory = (category) => (
  typeof category === 'string' ? category.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : category
);

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    required: true,
    set: normalizeCategory,
  },
  stock: {
    type: Number,
    default: 0,
  },
  imageUrl: {
    type: String,
  },
  seller: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required() {
      return this.isNew;
    },
    index: true,
  },
  ratingsAverage: {
    type: Number,
    default: 4.5,
    min: [1, 'Rating must be above 1.0'],
    max: [5, 'Rating must be below 5.0'],
    set: val => Math.round(val * 10) / 10, // Round to 1 decimal place
  },
  ratingsQuantity: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

productSchema.pre('save', function(next) {
  if (this.category) {
    this.category = normalizeCategory(this.category);
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
