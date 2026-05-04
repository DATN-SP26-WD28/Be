import { v2 as cloudinary } from 'cloudinary';
import handleAsync from '../../shared/utils/handleAsync.js';
import createResponse from '../../shared/utils/createResponse.js';

const uploadToCloudinary = (buffer) => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'datn', resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};

export const uploadImage = handleAsync(async (req, res) => {
  if (!req.file) {
    const err = new Error('Vui lòng chọn file ảnh');
    err.statusCode = 400;
    throw err;
  }

  const result = await uploadToCloudinary(req.file.buffer);
  return createResponse(res, 200, 'Upload ảnh thành công', { url: result.secure_url });
});
