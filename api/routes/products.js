import express from 'express';
import Product from '../models/Product.js';

const router = express.Router();

// Create Product
router.post('/', async (req, res) => {
    const newProduct = new Product(req.body);
    try {
        const savedProduct = await newProduct.save();
        res.status(200).json({ ...savedProduct._doc, id: savedProduct._id });
    } catch (err) {
        res.status(500).json(err);
    }
});

// Get All Products
router.get('/', async (req, res) => {
    const qNew = req.query.new;
    const qCategory = req.query.category;
    try {
        let products;
        if (qNew) {
            products = await Product.find().sort({ createdAt: -1 }).limit(5).select('-images');
        } else if (qCategory) {
            products = await Product.find({
                category: { $in: [qCategory] },
            }).select('-images');
        } else {
            products = await Product.find().sort({ createdAt: -1 }).select('-images');
        }
        const formatted = products.map(p => ({ ...p._doc, id: p._id }));
        res.status(200).json(formatted);
    } catch (err) {
        res.status(500).json(err);
    }
});

// Get Product by ID
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json("Not found");
        res.status(200).json({ ...product._doc, id: product._id });
    } catch (err) {
        res.status(500).json(err);
    }
});

// Update Product
router.put('/:id', async (req, res) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        res.status(200).json(updatedProduct ? { ...updatedProduct._doc, id: updatedProduct._id } : null);
    } catch (err) {
        res.status(500).json(err);
    }
});

// Delete Product
router.delete('/:id', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.status(200).json("Product has been deleted...");
    } catch (err) {
        res.status(500).json(err);
    }
});

export default router;
