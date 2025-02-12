import dotenv from "dotenv";
dotenv.config();

export default {
  port: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL,
  NODE_ENV: process.env.NODE_ENV,
  cloudinary_cloud_name: process.env.cloudinary_cloud_name,
  cloudinary_api_key: process.env.cloudinary_api_key,
  cloudinary_api_secret: process.env.cloudinary_api_secret,
  bcrypt_slat_rounds: process.env.BCRYPT_SLAT_ROUNDS,
  jwt_access_secret: process.env.JWT_ACCESS_SECRET,
  jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN,
  jwt_refresh_secret: process.env.JWT_ACCESS_SECRET,
  jwt_refresh_expires_in: process.env.JWT_ACCESS_EXPIRES_IN,
};
