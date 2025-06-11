import multer from "multer";
import path from "path";
import fs from "fs";

// Create uploads directory if it doesn't exist
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir)
}

const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, uploadDir)
  },
  filename: function (req, file, callback) {
    const ext = path.extname(file.originalname)
    callback(null, Date.now() + ext)
  }
})

const upload = multer({ storage })

export default upload
