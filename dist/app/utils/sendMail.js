"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = __importDefault(require("../../config"));
const sendEmail = (to, resetLink, user) => __awaiter(void 0, void 0, void 0, function* () {
    const transporter = nodemailer_1.default.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: config_1.default.email_user,
            pass: config_1.default.email_app_password,
        },
    });
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject: "Password Reset - AntiCrime Reporting System",
        html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f0f4f8; color: #1a2b42;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 650px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);">
        <!-- Header with wave design -->
        <tr>
          <td>
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="background-color: #0073e6; padding: 48px 0 80px; text-align: center; position: relative;">
                  <!-- Logo and Title -->
                  <img src="https://i.ibb.co.com/FkRfmKX8/Untitled-design-5.png" alt="AntiCrime Logo" width="64" height="64" style="display: inline-block; border-radius: 12px; margin-bottom: 16px; border: 3px solid rgba(255, 255, 255, 0.2);">
                  <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">AntiCrime</h1>
                  
                  <!-- Wave shape -->
                  <div style="position: absolute; bottom: -2px; left: 0; width: 100%; height: 40px; background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTQ0MCIgaGVpZ2h0PSI3NCIgdmlld0JveD0iMCAwIDE0NDAgNzQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0wIDBDMjQwIDYwLjcgNDgwIDc0IDcyMCA2OUMxMDExLjMgNjIuNSAxMjAwIDM4LjUgMTQ0MCAwVjc0SDBWMFoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPg=='); background-size: cover;"></div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Content section with shadow element -->
        <tr>
          <td style="padding: 0 40px 40px;">
            <div style="position: relative; margin-top: -30px; background-color: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);">
              <!-- Security icon -->
              <div style="position: absolute; top: -24px; right: 40px; background-color: #e6f0ff; width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0, 115, 230, 0.2);">
                <img src=${user.profileImage || "https://i.ibb.co.com/FkRfmKX8/Untitled-design-5.png"} alt="Security Icon" width="24" style={{objectFit:"cover"}} height="24">
              </div>
            
              <h2 style="margin: 0 0 24px; font-size: 24px; font-weight: 700; color: #1a2b42; letter-spacing: -0.5px;">Reset Your Password</h2>
              
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4a5568;">Hello ${user.name},</p>
              
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #4a5568;">
                We received a request to reset your password for the <span style="font-weight: 600; color: #1a2b42;">AntiCrime Reporting System</span>. Please use the button below to create a new password. For security reasons, this link will expire in <span style="font-weight: 600; color: #0073e6;">30 minutes</span>.
              </p>
              
              <!-- Button with hover effect hint -->
              <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; background: linear-gradient(to right, #0073e6, #2389f7); padding: 2px; border-radius: 8px;">
                      <a href="${resetLink}" target="_blank" style="display: block; padding: 14px 32px; font-size: 16px; font-weight: 600; text-align: center; text-decoration: none; color: #ffffff; background-color: #0073e6; border-radius: 6px; transition: all 0.2s ease; min-width: 200px;">Reset Password</a>
                    </div>
                    <p style="margin: 12px 0 0; font-size: 13px; color: #6b7280; font-style: italic;">Secure link • Encrypted connection</p>
                  </td>
                </tr>
              </table>
              
              <!-- Alert box with modern design -->
              <div style="margin: 32px 0; padding: 20px; background-color: #f0f7ff; border-left: 4px solid #0073e6; border-radius: 8px;">
                <div style="display: flex; align-items: flex-start;">
                  <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEwLjI5IDMuODZMMTguNDYgMTIuMDJDMTguODUgMTIuNDEgMTguODUgMTMuMDQgMTguNDYgMTMuNDNMMTAuNDggMjEuNDFDMTAuMDkgMjEuOCA5LjQ2IDIxLjggOS4wNyAyMS40MUwzLjA0IDE1LjM5QzIuNjUgMTUgMi42NSAxNC4zNyAzLjA0IDEzLjk4TDkuMDcgNy45NkMxOS4yOCAtMi4yNSA3LjA5IDMuMzYgMTAuMjkgMy44NloiIGZpbGw9IiMwMDczRTYiIG9wYWNpdHk9IjAuMiIvPgo8cGF0aCBkPSJNMTUgOS4wMUwxMCAxNC4wMU01LjkzIDEyLjk0TDEyLjA3IDYuOEMxMy4xMyA1Ljc0IDE0Ljg3IDUuNzQgMTUuOTMgNi44QzE2Ljk5IDcuODYgMTYuOTkgOS42IDE1LjkzIDEwLjY2TDkuOCAxNi44QzguNzQgMTcuODYgNyAxNy44NiA1Ljk0IDE2LjhDNC44OCAxNS43NCA0Ljg4IDE0IDUuOTQgMTIuOTRaIiBzdHJva2U9IiMwMDczRTYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPg==" alt="Link Icon" width="20" height="20" style="margin-right: 12px; margin-top: 2px;">
                  <div>
                    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #2d3748; font-weight: 500;">
                      If the button doesn't work, copy and paste this URL into your browser:
                    </p>
                    <p style="margin: 8px 0 0; font-size: 14px; line-height: 1.6; word-break: break-all; color: #0056b3; background-color: rgba(255, 255, 255, 0.5); padding: 8px; border-radius: 4px; font-family: monospace;">
                      ${resetLink}
                    </p>
                  </div>
                </div>
              </div>
              
              <p style="margin: 24px 0 0; font-size: 16px; line-height: 1.6; color: #4a5568;">
                If you didn't request this password reset, please ignore this email or <a href="#" style="color: #0073e6; text-decoration: none; font-weight: 500; border-bottom: 1px solid #0073e670;">contact our support team</a> if you have concerns about your account security.
              </p>
              
              <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #4a5568;">
                  Thank you,<br>
                  <span style="font-weight: 600; color: #1a2b42;">The AntiCrime Reporting Team</span>
                </p>
              </div>
            </div>
          </td>
        </tr>

        <!-- Footer with geometric pattern -->
        <tr>
          <td>
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="background-color: #f0f7ff; background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xMDAgMTBMMTg0LjM4NSA1MEMxODcuNzkzIDUxLjczMjUgMTkwIDU1LjE0NiAxOTAgNTguOTQ0NVYxNDEuMDU1QzE5MCAxNDQuODU0IDE4Ny43OTMgMTQ4LjI2NyAxODQuMzg1IDE1MEwxMDAgMTkwQzk2LjU5MjcgMTkxLjczMiA5My4zODY1IDE5MS43MzIgOTAgMTkwTDUuNjE1MzkgMTUwQzIuMjA3NTQgMTQ4LjI2NyAwIDE0NC44NTQgMCAxNDEuMDU1VjU4Ljk0NDVDMCA1NS4xNDYgMi4yMDc1NCA1MS43MzI1IDUuNjE1MzkgNTBMOTAgMTBDOTMuMzg2NSA4LjI2NzUgOTYuNTkyNyA4LjI2NzUgMTAwIDEwWiIgZmlsbD0iIzA1NzNlNiIgZmlsbC1vcGFjaXR5PSIwLjAzIi8+CjxwYXRoIGQ9Ik0xMDAgMjBMMTY5LjkgNTFDMTcxLjkgNTIuMDU1NSAxNzMgNTQuMTMzNCAxNzMgNTYuMzc0MlYxMTguNjI2QzE3MyAxMjAuODY3IDE3MS45IDEyMi45NDQgMTY5LjkgMTI0TDEwMCAxNTVDOTguMDAwMSAxNTYuMDU2IDk1LjcgMTU2LjA1NiA5MyBMShCzMC4xIDEyNEMyOC4xIDEyMi45NDQgMjcgMTIwLjg2NyAyNyAxMTguNjI2VjU2LjM3NDJDMjcgNTQuMTMzNCAyOC4xIDUyLjA1NTUgMzAuMSA1MUwxMDAgMjBDMTAyIDIwLjk0NDUgOTguMDAwMSAxOC45NDQ1IDEwMCAyMFoiIGZpbGw9IiMwNTczZTYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPgo8L3N2Zz4='); background-size: 200px; padding: 32px; border-top: 1px solid #e1e8f7; text-align: center;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 400px; margin: 0 auto;">
                    <tr>
                      <td align="center">
                        <img src="https://i.ibb.co.com/FkRfmKX8/Untitled-design-5.png" alt="AntiCrime Logo" width="32" height="32" style="display: inline-block; border-radius: 6px; margin-bottom: 16px;">
                        <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #4a5568; font-weight: 500;">
                          Protecting communities through innovation and collaboration
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding: 0 0 24px;">
                        <div style="display: flex; justify-content: center; gap: 12px;">
                          <!-- Social media icons would go here -->
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td align="center">
                        <p style="margin: 0 0 8px; font-size: 13px; color: #718096;">
                          If you have any questions, please contact our support team at <a href="mailto:zubayer.munna.dev@gmail.com" style="color: #0073e6; text-decoration: none; font-weight: 500;">zubayer.munna.dev@gmail.com</a>
                        </p>
                        <p style="margin: 0 0 8px; font-size: 13px; color: #718096;">
                          © 2024 AntiCrime Reporting System. All rights reserved.
                        </p>
                        <p style="margin: 16px 0 0; font-size: 12px; color: #a0aec0;">
                          This is an automated email. Please do not reply to this message.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `,
    };
    yield transporter.sendMail(mailOptions);
});
exports.sendEmail = sendEmail;
