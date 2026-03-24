const mongoose = require('mongoose');
const Product = require('./models/Product');

const normalizeCategory = (category) => (
  typeof category === 'string' ? category.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : category
);

async function migrateCategories() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce');

    const products = await Product.find({});
    let updatedCount = 0;

    for (const product of products) {
      const normalized = normalizeCategory(product.category);
      if (product.category !== normalized) {
        product.category = normalized;
        await product.save();
        updatedCount++;
      }
    }

    console.log(`Migration completed. Updated ${updatedCount} products.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateCategories();