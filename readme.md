# 🛡️ AntiCrime Backend API

A robust and secure backend API for crime reporting and management system built with TypeScript, Express.js, and MongoDB.

## 🌟 Features

- **🔐 Authentication & Authorization**

  - JWT-based authentication
  - Role-based access control (Admin/User)
  - Password encryption with bcrypt
  - Password reset functionality
  - Email verification

- **💾 Data Management**

  - MongoDB with Mongoose ODM
  - Advanced query builder with filtering, sorting, and pagination
  - Redis caching for improved performance
  - File uploads with Cloudinary

- **🛠️ Error Handling**

  - Global error handling
  - Validation using Zod
  - Custom error classes
  - Detailed error responses

- **🔍 Security Features**
  - CORS protection
  - Rate limiting
  - Input validation
  - Secure HTTP headers

## 🚀 Tech Stack

- Node.js & Express.js
- TypeScript
- MongoDB & Mongoose
- Redis
- JWT
- Zod
- Cloudinary
- Morgan
- Nodemailer

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB
- Redis
- npm or yarn or bun

## ⚙️ Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/AntiCrimeBackend.git
cd AntiCrimeBackend
```

2. Install dependencies:

```bash
npm install
# or
yarn install
# or
bun install
```

3. Create a `.env` file in the root directory:

```env
NODE_ENV=development
PORT=8000
DATABASE_URL=mongodb://localhost:27017/antiCrime
BCRYPT_SALT_ROUNDS=12
JWT_ACCESS_SECRET=your_jwt_secret
JWT_ACCESS_EXPIRES_IN=1d
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d
RESET_LINK_URL=http://localhost:3000/reset-password
```

4. Start the development server:

```bash
npm run dev
# or
yarn dev
# or
bun dev
```

## 🔄 API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/reset-link` - Request password reset
- `POST /api/v1/auth/forgot-password` - Reset password
- `POST /api/v1/auth/change-password` - Change password

### Crime Reports

- `POST /api/v1/reports` - Create a new report
- `GET /api/v1/reports` - Get all reports
- `GET /api/v1/reports/:id` - Get specific report
- `PATCH /api/v1/reports/:id` - Update report
- `DELETE /api/v1/reports/:id` - Delete report

### Comments

- `POST /api/v1/reports/:reportId/comments` - Add comment
- `PATCH /api/v1/comments/:commentId` - Update comment
- `DELETE /api/v1/comments/:commentId` - Delete comment

## 🛠️ Scripts

- `npm run build` - Build the project
- `npm run start:prod` - Start production server
- `npm run dev` - Start development server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run prettier` - Run Prettier
- `npm run prettier:fix` - Fix Prettier issues

## 🔒 Security Features

- Password hashing using bcrypt
- JWT-based authentication
- Input validation using Zod
- Rate limiting for API endpoints
- CORS protection
- Secure HTTP headers

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👥 Authors

- Abu Talha Md Jobayer

## 🙏 Acknowledgments

- Express.js team
- MongoDB team
- TypeScript team
- All other open-source contributors
