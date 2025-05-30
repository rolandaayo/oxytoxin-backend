const express = require('express');
const cors = require('cors');   
const connectDB = require('./lib/connect');
require("dotenv").config();
// Importing the admin routes
const adminRoutes = require('./routes/admin'); // Uncomment this line when you have the admin routes defined

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {

    res.send(
        `message: "Welcome to the dashboard"`
    );
});

// Importing the admin routes
app.use('/api/admin', adminRoutes); // Use the admin routes under the /admin path




connectDB()
app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});