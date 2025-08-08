const multer = require('multer');
const path = require('path');
const fs = require('fs');

// For serverless environments
// In a serverless environment, we'll need to use memory storage instead of disk storage
const isServerless = process.env.NODE_ENV === 'production';

// Configure multer based on environment
const storage = isServerless 
  ? multer.memoryStorage() // For serverless environments
  : multer.diskStorage({  // For local development
      destination: (req, file, cb) => {
          const uploadDir = path.join(process.cwd(), 'uploads/receipts/');
          if (!fs.existsSync(uploadDir)) {
              fs.mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          cb(null, 'receipt-' + uniqueSuffix + path.extname(file.originalname));
      }
    });

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only JPEG, PNG, and PDF files are allowed'));
    }
};

// Create upload middleware
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter
});

/**
 * For serverless environments, this handles files in memory
 * In a production environment, you would use a service like:
 * - AWS S3
 * - Vercel Blob
 * - Cloudinary
 * - Firebase Storage
 * 
 * For now, this implementation saves the file temporarily and returns a path
 * that can be stored in the database.
 * 
 * In a real serverless implementation, replace this with actual cloud storage upload code.
 */
const handleFileInServerless = (file) => {
    if (!file) return null;
    
    try {
        // Generate a unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = 'receipt-' + uniqueSuffix + path.extname(file.originalname);
        
        // In serverless, we'd do something like:
        // 1. Upload to S3/Cloudinary/etc.
        // const result = await uploadToS3(file.buffer, filename);
        // return result.url;
        
        // 2. For Vercel Blob Store:
        // const { url } = await put(filename, file.buffer, { access: 'public' });
        // return url;
        
        // Temporary solution for demo purposes:
        // In a real serverless environment, use the /tmp directory
        const tmpDir = isServerless ? '/tmp/receipts/' : path.join(process.cwd(), 'uploads/receipts/');
        
        // Ensure directory exists
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }
        
        // Write file to temporary storage
        const filePath = path.join(tmpDir, filename);
        fs.writeFileSync(filePath, file.buffer);
        
        // Return the filename that can be referenced in the database
        return filename;
    } catch (error) {
        console.error('Error handling file in serverless environment:', error);
        return null;
    }
};

/**
 * Helper function to process file upload in both environments
 * This makes it easier to adapt routes without major changes
 */
const processUpload = (req) => {
    if (!req.file) return null;
    
    if (isServerless) {
        // In serverless, process the in-memory file
        return handleFileInServerless(req.file);
    } else {
        // In development, just return the filename (multer already saved it)
        return req.file.filename;
    }
};

module.exports = {
    upload,
    handleFileInServerless,
    processUpload,
    isServerless
};
