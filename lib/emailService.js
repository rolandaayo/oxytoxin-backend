const nodemailer = require("nodemailer");
const crypto = require("crypto");

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER || "oxytoxinapparel@gmail.com",
      pass: process.env.EMAIL_PASSWORD || "your-app-password-here", // Use App Password from Gmail
    },
  });
};

// Generate random token
const generateToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// Generate 6-digit code
const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send verification email
const sendVerificationEmail = async (email, token, name) => {
  try {
    const transporter = createTransporter();
    const verificationUrl = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/verify-email?token=${token}`;

    const mailOptions = {
      from: process.env.EMAIL_USER || "oxytoxinapparel@gmail.com",
      to: email,
      subject: "Verify Your Email - Oxytoxin",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #000; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Oxytoxin</h1>
          </div>
          <div style="padding: 30px; background-color: #f9f9f9;">
            <h2 style="color: #333;">Hello ${name}!</h2>
            <p style="color: #666; line-height: 1.6;">
              Thank you for signing up with Oxytoxin! To complete your registration, 
              please verify your email address by clicking the button below.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #000; color: white; padding: 12px 30px; 
                        text-decoration: none; border-radius: 5px; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              If the button doesn't work, you can copy and paste this link into your browser:
            </p>
            <p style="color: #999; font-size: 12px; word-break: break-all;">
              ${verificationUrl}
            </p>
            <p style="color: #666; font-size: 14px;">
              This link will expire in 24 hours. If you didn't create an account, 
              you can safely ignore this email.
            </p>
          </div>
          <div style="background-color: #f0f0f0; padding: 20px; text-align: center; color: #666;">
            <p style="margin: 0; font-size: 12px;">
              © 2024 Oxytoxin. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Verification email sent successfully:", result.messageId);
    return true;
  } catch (error) {
    console.error("Error sending verification email:", error);
    return false;
  }
};

// Send verification code email
const sendVerificationCode = async (email, code, name) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER || "oxytoxinapparel@gmail.com",
      to: email,
      subject: "Verify Your Email - Oxytoxin",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #000; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Oxytoxin</h1>
          </div>
          <div style="padding: 30px; background-color: #f9f9f9;">
            <h2 style="color: #333;">Hello ${name}!</h2>
            <p style="color: #666; line-height: 1.6;">
              Thank you for signing up with Oxytoxin! To complete your registration, 
              please enter the verification code below.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #000; color: white; padding: 20px; border-radius: 10px; display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 8px;">
                ${code}
              </div>
            </div>
            <p style="color: #666; font-size: 14px;">
              Enter this 6-digit code on the verification page to complete your registration.
            </p>
            <p style="color: #666; font-size: 14px;">
              This code will expire in 10 minutes. If you didn't create an account, 
              you can safely ignore this email.
            </p>
          </div>
          <div style="background-color: #f0f0f0; padding: 20px; text-align: center; color: #666;">
            <p style="margin: 0; font-size: 12px;">
              © 2024 Oxytoxin. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Verification code email sent successfully:", result.messageId);
    return true;
  } catch (error) {
    console.error("Error sending verification code email:", error);
    return false;
  }
};

// Send password reset code email
const sendPasswordResetCode = async (email, code, name) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER || "oxytoxinapparel@gmail.com",
      to: email,
      subject: "Reset Your Password - Oxytoxin",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #000; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Oxytoxin</h1>
          </div>
          <div style="padding: 30px; background-color: #f9f9f9;">
            <h2 style="color: #333;">Hello ${name}!</h2>
            <p style="color: #666; line-height: 1.6;">
              We received a request to reset your password. Enter the verification code below 
              to create a new password for your account.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #000; color: white; padding: 20px; border-radius: 10px; display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 8px;">
                ${code}
              </div>
            </div>
            <p style="color: #666; font-size: 14px;">
              Enter this 6-digit code on the password reset page to continue.
            </p>
            <p style="color: #666; font-size: 14px;">
              This code will expire in 10 minutes. If you didn't request a password reset, 
              you can safely ignore this email.
            </p>
          </div>
          <div style="background-color: #f0f0f0; padding: 20px; text-align: center; color: #666;">
            <p style="margin: 0; font-size: 12px;">
              © 2024 Oxytoxin. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Password reset code email sent successfully:", result.messageId);
    return true;
  } catch (error) {
    console.error("Error sending password reset code email:", error);
    return false;
  }
};

// Send password reset email (legacy - keeping for backward compatibility)
const sendPasswordResetEmail = async (email, token, name) => {
  try {
    const transporter = createTransporter();
    const resetUrl = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/reset-password?token=${token}`;

    const mailOptions = {
      from: process.env.EMAIL_USER || "oxytoxinapparel@gmail.com",
      to: email,
      subject: "Reset Your Password - Oxytoxin",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #000; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Oxytoxin</h1>
          </div>
          <div style="padding: 30px; background-color: #f9f9f9;">
            <h2 style="color: #333;">Hello ${name}!</h2>
            <p style="color: #666; line-height: 1.6;">
              We received a request to reset your password. Click the button below 
              to create a new password for your account.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #000; color: white; padding: 12px 30px; 
                        text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              If the button doesn't work, you can copy and paste this link into your browser:
            </p>
            <p style="color: #999; font-size: 12px; word-break: break-all;">
              ${resetUrl}
            </p>
            <p style="color: #666; font-size: 14px;">
              This link will expire in 1 hour. If you didn't request a password reset, 
              you can safely ignore this email.
            </p>
          </div>
          <div style="background-color: #f0f0f0; padding: 20px; text-align: center; color: #666;">
            <p style="margin: 0; font-size: 12px;">
              © 2024 Oxytoxin. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Password reset email sent successfully:", result.messageId);
    return true;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    return false;
  }
};

module.exports = {
  generateToken,
  generateCode,
  sendVerificationEmail,
  sendVerificationCode,
  sendPasswordResetEmail,
  sendPasswordResetCode,
};
