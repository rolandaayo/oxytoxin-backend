const cloudinary = require('cloudinary').v2;


const convertImageUrl = async (imageUrls) => {
     cloudinary.config({
        cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY ,
        api_secret:process.env.CLOUDINARY_SECRET_API_KEY
    })
        const urls = []

        let uploadResult = undefined 
        for(let image of imageUrls){
            if(image.path) {
                  uploadResult = await cloudinary.uploader.upload(image.path,{
                resource_type:"image",
                transformation:[
                 { width: 270, height: 250, crop: "fill" }, // Resize and crop the image
                 { quality: "auto" }, // Automatically adjust quality
                 { fetch_format: "auto" } // Automatically select format
                ]
            })
       .catch((error) => {
           console.log(error);
       });
        }
    
        urls.push(uploadResult.public_id); 
        }

        return urls;
  
}

module.exports = convertImageUrl; // Export the function for use in other modules