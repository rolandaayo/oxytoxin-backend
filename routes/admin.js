const express = require('express');
const router = express.Router();
const Product = require('../model/product'); // Assuming you have a Product model defined
const upload = require('../lib/imageUploader'); // Assuming you have an image uploader defined
convertImageUrl = require('../lib/imageUrlConvert'); // Assuming you have a function to convert image URLs

router.get('/', async(req, res) => {
    try {
        // Logic to fetch admin dashboard data
        const products = await Product.find(); // Example: Fetch all products
        res.status(200).send({
            message: 'Admin dashboard data fetched successfully',
            data: products,
            status: 'success'
        });
    } catch (error) {
        res.status(500).send({
            message: 'Server error',
            error: error.message,
            status: 'error'
        });
    }
});

// Route to handle file uploads
router.post('/upload', upload.array('images', 4), async(req, res) => {
    // Logic to handle file uploads
    if (!req.files || req.files.length === 0) {
        return res.status(400).send({
            message: 'No files uploaded',
            status: 'error'
        });
    }

    if (req.files.length > 4) {
        return res.status(400).send({
            message: 'You can only upload a maximum of 4 files',
            status: 'error'
        });
    }
    try {
        await convertImageUrl(req.files)
        
            return res.status(200).send({
                message: 'Files uploaded successfully',
                // data: urls,
                status: 'success'
            });

    } catch (error) {
        
        return res.status(500).send({
            message: 'Server error',
            error: error.message,
            status: 'error'
        });
    }



    // const filePaths = req.files.map(file => file.path);
    // res.status(200).send({
    //     message: 'Files uploaded successfully',
    //     data: filePaths,
    //     status: 'success'
    // });
});

router.post('/create',async (req, res) => {
    // Logic to create a new admin user
    const {name,price,description,category,stock,colors,image,features,} = req.body; 
    if(!name || !price || !description || !category || !stock || !colors || !image || !features) {
        return res.status(400).send({
            message: 'All fields are required',
            status: 'error'
        });}

        try {
            const product = await Product.create({
                name,
                price,
                description,
                category,
                colors,
                image,
                features,
                stock
            })
        } catch (error) {
            res.status(500).send({
            message: 'Server error',
            error: error.message,
            status: 'error'
        });
        }
    
});
router.put('/update/:id', (req, res) => {
    // Logic to update an admin user by ID
    const { id } = req.params;
    res.send(`Admin user with ID ${id} updated`);
});
router.delete('/delete/:id', (req, res) => {
    // Logic to delete an admin user by ID
    const { id } = req.params;
    res.send(`Admin user with ID ${id} deleted`);
});

// Export the router to be used in the main server file
module.exports = router;
// This code defines a simple Express router for admin-related routes.
// It includes routes for getting the admin dashboard, creating, updating, and deleting admin users.
// The router is then exported to be used in the main server file, allowing for modular route management.