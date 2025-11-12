const nodemailer = require("nodemailer");
const crypto = require("crypto");

// Create transporter
const createTransporter = () => {
  console.log("Creating email transporter with config:", {
    service: "gmail",
    user: process.env.EMAIL_USER,
    passExists: !!process.env.EMAIL_PASS,
    passLength: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0,
  });

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
    debug: true, // Enable debug mode
    logger: true, // Enable logging
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
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verify Your Account - Oxytoxin",
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
    console.log("=== EMAIL SENDING DEBUG ===");
    console.log("Attempting to send verification code to:", email);
    console.log("Verification code:", code);
    console.log("User name:", name);
    console.log("Email config check:", {
      EMAIL_USER: process.env.EMAIL_USER,
      EMAIL_PASS: process.env.EMAIL_PASS
        ? `${process.env.EMAIL_PASS.substring(0, 4)}...`
        : "missing",
      EMAIL_PASS_LENGTH: process.env.EMAIL_PASS
        ? process.env.EMAIL_PASS.length
        : 0,
    });

    const transporter = createTransporter();

    // Test the connection first
    console.log("Testing email connection...");
    try {
      await transporter.verify();
      console.log("Email connection verified successfully!");
    } catch (verifyError) {
      console.error("Email connection verification failed:", {
        message: verifyError.message,
        code: verifyError.code,
        command: verifyError.command,
        response: verifyError.response,
        responseCode: verifyError.responseCode,
      });
      throw verifyError;
    }

    const mailOptions = {
      from: `Oxytoxin <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Welcome to Oxytoxin - Verify Your Email",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email - Oxytoxin</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            
            <!-- Header with Brand -->
            <div style="background: linear-gradient(135deg, #000000 0%, #333333 100%); padding: 40px 30px; text-align: center; position: relative; overflow: hidden;">
              <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(45deg, rgba(255,255,255,0.02) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.02) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.02) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.02) 75%); background-size: 20px 20px; background-position: 0 0, 0 10px, 10px -10px, -10px 0px; opacity: 0.1;"></div>
              <h1 style="margin: 0; color: #ffffff; font-size: 42px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase; position: relative; z-index: 1;">
                OXYTOXIN
              </h1>
              <p style="margin: 10px 0 0 0; color: #cccccc; font-size: 16px; font-weight: 300; letter-spacing: 1px; position: relative; z-index: 1;">
                Premium Fashion & Lifestyle
              </p>
            </div>

            <!-- Main Content -->
            <div style="padding: 50px 40px; background-color: #ffffff;">
              <div style="text-align: center; margin-bottom: 40px;">
                <h2 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 28px; font-weight: 700;">
                  Welcome, ${name}!
                </h2>
                <p style="margin: 0; color: #7f8c8d; font-size: 18px; font-weight: 400;">
                  You're almost ready to explore our exclusive collection
                </p>
              </div>

              <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 20px; padding: 30px; margin: 40px 0; text-align: center; border: 2px solid #e9ecef;">
                <p style="margin: 0 0 25px 0; color: #495057; font-size: 16px; line-height: 1.6;">
                  To complete your registration and unlock access to premium fashion, please enter this verification code:
                </p>
                
                <!-- Verification Code -->
                <div style="display: inline-block; background: linear-gradient(135deg, #000000 0%, #434343 100%); border-radius: 16px; padding: 20px; margin: 20px 0; box-shadow: 0 8px 32px rgba(0,0,0,0.3); position: relative; overflow: hidden; max-width: 100%;">
                  <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px); background-size: 10px 10px; opacity: 0.3;"></div>
                  <div style="position: relative; z-index: 1; color: #ffffff; font-size: 28px; font-weight: 900; letter-spacing: 6px; font-family: 'Courier New', monospace; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); word-break: keep-all; white-space: nowrap;">
                    ${code}
                  </div>
                </div>

                <p style="margin: 25px 0 0 0; color: #6c757d; font-size: 14px; font-style: italic;">
                  This code expires in <strong>10 minutes</strong>
                </p>
              </div>

              <div style="background-color: #f8f9fa; border-left: 4px solid #000000; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.6;">
                  <strong>Next steps:</strong> Enter this code on the verification page to activate your account and start exploring our curated collection of premium fashion pieces.
                </p>
              </div>

              <div style="text-align: center; margin-top: 40px;">
                <p style="margin: 0; color: #6c757d; font-size: 13px; line-height: 1.5;">
                  If you didn't create an account with Oxytoxin, you can safely ignore this email.<br>
                  For any assistance, feel free to contact our support team.
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div style="background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%); padding: 30px; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #ecf0f1; font-size: 14px; font-weight: 600;">
                OXYTOXIN
              </p>
              <p style="margin: 0; color: #95a5a6; font-size: 12px;">
                © 2024 Oxytoxin. All rights reserved. | Premium Fashion & Lifestyle
              </p>
              <div style="margin-top: 15px;">
                <span style="color: #7f8c8d; font-size: 11px;">
                  Sent from: ${process.env.EMAIL_USER}
                </span>
              </div>
            </div>

          </div>
        </body>
        </html>
      `,
    };

    console.log("Sending email with options:", {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
    });

    const result = await transporter.sendMail(mailOptions);
    console.log("Verification code email sent successfully!");
    console.log("Message ID:", result.messageId);
    console.log("Response:", result.response);
    console.log("=== EMAIL SENDING SUCCESS ===");
    return true;
  } catch (error) {
    console.error("=== EMAIL SENDING ERROR ===");
    console.error("Error sending verification code email:", error.message);
    console.error("Error type:", error.constructor.name);
    console.error("Full error details:", {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
      errno: error.errno,
      syscall: error.syscall,
      hostname: error.hostname,
      port: error.port,
    });

    // Common Gmail errors and solutions
    if (error.code === "EAUTH") {
      console.error("AUTHENTICATION ERROR: Check your Gmail app password");
      console.error(
        "Make sure you're using an app password, not your regular Gmail password"
      );
      console.error(
        "Enable 2FA and generate an app password at: https://myaccount.google.com/apppasswords"
      );
    } else if (error.code === "ENOTFOUND") {
      console.error("DNS ERROR: Cannot resolve Gmail SMTP server");
    } else if (error.code === "ECONNECTION") {
      console.error("CONNECTION ERROR: Cannot connect to Gmail SMTP server");
    }

    console.error("=== END EMAIL ERROR ===");
    return false;
  }
};

// Send password reset code email
const sendPasswordResetCode = async (email, code, name) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `Oxytoxin <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset - Oxytoxin",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset - Oxytoxin</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            
            <!-- Header with Brand -->
            <div style="background: linear-gradient(135deg, #000000 0%, #333333 100%); padding: 40px 30px; text-align: center; position: relative; overflow: hidden;">
              <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(45deg, rgba(255,255,255,0.02) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.02) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.02) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.02) 75%); background-size: 20px 20px; background-position: 0 0, 0 10px, 10px -10px, -10px 0px; opacity: 0.1;"></div>
              <h1 style="margin: 0; color: #ffffff; font-size: 42px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase; position: relative; z-index: 1;">
                OXYTOXIN
              </h1>
              <p style="margin: 10px 0 0 0; color: #cccccc; font-size: 16px; font-weight: 300; letter-spacing: 1px; position: relative; z-index: 1;">
                Premium Fashion & Lifestyle
              </p>
            </div>

            <!-- Main Content -->
            <div style="padding: 50px 40px; background-color: #ffffff;">
              <div style="text-align: center; margin-bottom: 40px;">
                <h2 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 28px; font-weight: 700;">
                  Password Reset Request
                </h2>
                <p style="margin: 0; color: #7f8c8d; font-size: 18px; font-weight: 400;">
                  Hello ${name}, let's get you back to shopping
                </p>
              </div>

              <div style="background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%); border-radius: 20px; padding: 30px; margin: 40px 0; text-align: center; border: 2px solid #fed7d7;">
                <p style="margin: 0 0 25px 0; color: #495057; font-size: 16px; line-height: 1.6;">
                  We received a request to reset your password. Enter this verification code to create a new password:
                </p>
                
                <!-- Verification Code -->
                <div style="display: inline-block; background: linear-gradient(135deg, #000000 0%, #434343 100%); border-radius: 16px; padding: 20px; margin: 20px 0; box-shadow: 0 8px 32px rgba(0,0,0,0.3); position: relative; overflow: hidden; max-width: 100%;">
                  <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px); background-size: 10px 10px; opacity: 0.3;"></div>
                  <div style="position: relative; z-index: 1; color: #ffffff; font-size: 28px; font-weight: 900; letter-spacing: 6px; font-family: 'Courier New', monospace; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); word-break: keep-all; white-space: nowrap;">
                    ${code}
                  </div>
                </div>

                <p style="margin: 25px 0 0 0; color: #6c757d; font-size: 14px; font-style: italic;">
                  This code expires in <strong>10 minutes</strong>
                </p>
              </div>

              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
                  <strong>Security reminder:</strong> If you didn't request this password reset, please ignore this email or contact our support team. Your account remains secure.
                </p>
              </div>

              <div style="text-align: center; margin-top: 40px;">
                <p style="margin: 0; color: #6c757d; font-size: 13px; line-height: 1.5;">
                  Need help? Contact our support team at any time.<br>
                  We're here to assist you with your Oxytoxin experience.
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div style="background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%); padding: 30px; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #ecf0f1; font-size: 14px; font-weight: 600;">
                OXYTOXIN
              </p>
              <p style="margin: 0; color: #95a5a6; font-size: 12px;">
                © 2024 Oxytoxin. All rights reserved. | Premium Fashion & Lifestyle
              </p>
              <div style="margin-top: 15px;">
                <span style="color: #7f8c8d; font-size: 11px;">
                  Sent from: ${process.env.EMAIL_USER}
                </span>
              </div>
            </div>

          </div>
        </body>
        </html>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(
      "Password reset code email sent successfully:",
      result.messageId
    );
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

// Send payment confirmation email to user
const sendPaymentConfirmationToUser = async (
  email,
  name,
  orderDetails,
  paymentRef
) => {
  try {
    const transporter = createTransporter();

    // Format order items for email
    const orderItemsHtml = orderDetails.items
      .map(
        (item) => `
      <tr>
        <td style="padding: 15px; border-bottom: 1px solid #e9ecef;">
          <div style="display: flex; align-items: center;">
            ${
              item.image
                ? `<img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; margin-right: 15px;" />`
                : ""
            }
            <div>
              <p style="margin: 0; color: #2c3e50; font-weight: 600; font-size: 14px;">${
                item.name
              }</p>
              <p style="margin: 5px 0 0 0; color: #7f8c8d; font-size: 13px;">Qty: ${
                item.quantity
              }</p>
            </div>
          </div>
        </td>
        <td style="padding: 15px; border-bottom: 1px solid #e9ecef; text-align: right; color: #2c3e50; font-weight: 600;">
          $${(item.price * item.quantity).toFixed(2)}
        </td>
      </tr>
    `
      )
      .join("");

    const mailOptions = {
      from: `Oxytoxin <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Thank You for Your Purchase - Oxytoxin",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Confirmation - Oxytoxin</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            
            <!-- Header with Brand -->
            <div style="background: linear-gradient(135deg, #000000 0%, #333333 100%); padding: 40px 30px; text-align: center; position: relative; overflow: hidden;">
              <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(45deg, rgba(255,255,255,0.02) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.02) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.02) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.02) 75%); background-size: 20px 20px; background-position: 0 0, 0 10px, 10px -10px, -10px 0px; opacity: 0.1;"></div>
              <h1 style="margin: 0; color: #ffffff; font-size: 42px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase; position: relative; z-index: 1;">
                OXYTOXIN
              </h1>
              <p style="margin: 10px 0 0 0; color: #cccccc; font-size: 16px; font-weight: 300; letter-spacing: 1px; position: relative; z-index: 1;">
                Premium Fashion & Lifestyle
              </p>
            </div>

            <!-- Main Content -->
            <div style="padding: 50px 40px; background-color: #ffffff;">
              <div style="text-align: center; margin-bottom: 40px;">
                <div style="display: inline-block; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); border-radius: 50%; width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                  <span style="color: white; font-size: 40px;">✓</span>
                </div>
                <h2 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 28px; font-weight: 700;">
                  Thank You for Your Purchase!
                </h2>
                <p style="margin: 0; color: #7f8c8d; font-size: 18px; font-weight: 400;">
                  Hi ${name}, your payment was successful
                </p>
              </div>

              <!-- Order Summary -->
              <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 20px; padding: 30px; margin: 40px 0; border: 2px solid #e9ecef;">
                <h3 style="margin: 0 0 20px 0; color: #2c3e50; font-size: 20px; font-weight: 700; text-align: center;">
                  Order Summary
                </h3>
                
                <div style="background-color: #ffffff; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <tbody>
                      ${orderItemsHtml}
                    </tbody>
                  </table>
                </div>

                <div style="background-color: #ffffff; border-radius: 12px; padding: 20px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span style="color: #6c757d; font-size: 14px;">Order ID:</span>
                    <span style="color: #2c3e50; font-weight: 600; font-size: 14px;">${
                      orderDetails._id
                    }</span>
                  </div>
                  ${
                    paymentRef
                      ? `
                  <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span style="color: #6c757d; font-size: 14px;">Payment Reference:</span>
                    <span style="color: #2c3e50; font-weight: 600; font-size: 14px;">${paymentRef}</span>
                  </div>
                  `
                      : ""
                  }
                  <div style="display: flex; justify-content: space-between; padding-top: 15px; border-top: 2px solid #e9ecef; margin-top: 15px;">
                    <span style="color: #2c3e50; font-size: 18px; font-weight: 700;">Total Amount:</span>
                    <span style="color: #000000; font-size: 20px; font-weight: 900;">$${orderDetails.totalAmount.toFixed(
                      2
                    )}</span>
                  </div>
                </div>
              </div>

              ${
                orderDetails.deliveryInfo
                  ? `
              <!-- Delivery Information -->
              <div style="background-color: #f8f9fa; border-left: 4px solid #000000; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
                <h4 style="margin: 0 0 15px 0; color: #2c3e50; font-size: 16px; font-weight: 700;">
                  Delivery Information
                </h4>
                <p style="margin: 5px 0; color: #495057; font-size: 14px; line-height: 1.6;">
                  <strong>Name:</strong> ${
                    orderDetails.deliveryInfo.fullName
                  }<br>
                  <strong>Phone:</strong> ${
                    orderDetails.deliveryInfo.phoneNumber
                  }<br>
                  <strong>Address:</strong> ${
                    orderDetails.deliveryInfo.address
                  }, ${orderDetails.deliveryInfo.city}, ${
                      orderDetails.deliveryInfo.state
                    } ${orderDetails.deliveryInfo.postalCode}
                  ${
                    orderDetails.deliveryInfo.landmark
                      ? `<br><strong>Landmark:</strong> ${orderDetails.deliveryInfo.landmark}`
                      : ""
                  }
                </p>
              </div>
              `
                  : ""
              }

              <div style="background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%); border-left: 4px solid #28a745; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #155724; font-size: 14px; line-height: 1.6;">
                  <strong>What's next?</strong> We're processing your order and will send you a shipping confirmation once your items are on their way. You can track your order status in your account dashboard.
                </p>
              </div>

              <div style="text-align: center; margin-top: 40px;">
                <p style="margin: 0 0 20px 0; color: #6c757d; font-size: 13px; line-height: 1.5;">
                  Thank you for choosing Oxytoxin. We appreciate your business!<br>
                  If you have any questions, feel free to contact our support team.
                </p>
                <a href="${
                  process.env.FRONTEND_URL || "http://localhost:3000"
                }/profile" 
                   style="background-color: #000; color: white; padding: 12px 30px; 
                          text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
                  View Order Status
                </a>
              </div>
            </div>

            <!-- Footer -->
            <div style="background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%); padding: 30px; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #ecf0f1; font-size: 14px; font-weight: 600;">
                OXYTOXIN
              </p>
              <p style="margin: 0; color: #95a5a6; font-size: 12px;">
                © 2024 Oxytoxin. All rights reserved. | Premium Fashion & Lifestyle
              </p>
              <div style="margin-top: 15px;">
                <span style="color: #7f8c8d; font-size: 11px;">
                  Sent from: ${process.env.EMAIL_USER}
                </span>
              </div>
            </div>

          </div>
        </body>
        </html>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(
      "Payment confirmation email sent to user successfully:",
      result.messageId
    );
    return true;
  } catch (error) {
    console.error("Error sending payment confirmation email to user:", error);
    return false;
  }
};

// Send payment notification email to owner
const sendPaymentNotificationToOwner = async (orderDetails, paymentRef) => {
  try {
    const transporter = createTransporter();
    const ownerEmail = process.env.EMAIL_USER; // Owner receives at the same email

    // Format order items for email
    const orderItemsHtml = orderDetails.items
      .map(
        (item) => `
      <tr>
        <td style="padding: 15px; border-bottom: 1px solid #e9ecef;">
          <div style="display: flex; align-items: center;">
            ${
              item.image
                ? `<img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; margin-right: 15px;" />`
                : ""
            }
            <div>
              <p style="margin: 0; color: #2c3e50; font-weight: 600; font-size: 14px;">${
                item.name
              }</p>
              <p style="margin: 5px 0 0 0; color: #7f8c8d; font-size: 13px;">Qty: ${
                item.quantity
              } × $${item.price.toFixed(2)}</p>
            </div>
          </div>
        </td>
        <td style="padding: 15px; border-bottom: 1px solid #e9ecef; text-align: right; color: #2c3e50; font-weight: 600;">
          $${(item.price * item.quantity).toFixed(2)}
        </td>
      </tr>
    `
      )
      .join("");

    const mailOptions = {
      from: `Oxytoxin <${process.env.EMAIL_USER}>`,
      to: ownerEmail,
      subject: `New Order Received - $${orderDetails.totalAmount.toFixed(2)}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Order Notification - Oxytoxin</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            
            <!-- Header with Brand -->
            <div style="background: linear-gradient(135deg, #000000 0%, #333333 100%); padding: 40px 30px; text-align: center; position: relative; overflow: hidden;">
              <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(45deg, rgba(255,255,255,0.02) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.02) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.02) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.02) 75%); background-size: 20px 20px; background-position: 0 0, 0 10px, 10px -10px, -10px 0px; opacity: 0.1;"></div>
              <h1 style="margin: 0; color: #ffffff; font-size: 42px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase; position: relative; z-index: 1;">
                OXYTOXIN
              </h1>
              <p style="margin: 10px 0 0 0; color: #cccccc; font-size: 16px; font-weight: 300; letter-spacing: 1px; position: relative; z-index: 1;">
                Admin Notification
              </p>
            </div>

            <!-- Main Content -->
            <div style="padding: 50px 40px; background-color: #ffffff;">
              <div style="text-align: center; margin-bottom: 40px;">
                <div style="display: inline-block; background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); border-radius: 50%; width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                  <span style="color: white; font-size: 40px;">🛍️</span>
                </div>
                <h2 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 28px; font-weight: 700;">
                  New Order Received!
                </h2>
                <p style="margin: 0; color: #7f8c8d; font-size: 18px; font-weight: 400;">
                  Payment confirmed - Action required
                </p>
              </div>

              <!-- Customer Information -->
              <div style="background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%); border-left: 4px solid #ffc107; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
                <h4 style="margin: 0 0 15px 0; color: #856404; font-size: 16px; font-weight: 700;">
                  Customer Information
                </h4>
                <p style="margin: 5px 0; color: #856404; font-size: 14px; line-height: 1.6;">
                  <strong>Email:</strong> ${orderDetails.userEmail}<br>
                  <strong>Order Date:</strong> ${new Date(
                    orderDetails.createdAt
                  ).toLocaleString()}
                </p>
              </div>

              <!-- Order Summary -->
              <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 20px; padding: 30px; margin: 40px 0; border: 2px solid #e9ecef;">
                <h3 style="margin: 0 0 20px 0; color: #2c3e50; font-size: 20px; font-weight: 700; text-align: center;">
                  Order Details
                </h3>
                
                <div style="background-color: #ffffff; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <tbody>
                      ${orderItemsHtml}
                    </tbody>
                  </table>
                </div>

                <div style="background-color: #ffffff; border-radius: 12px; padding: 20px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span style="color: #6c757d; font-size: 14px;">Order ID:</span>
                    <span style="color: #2c3e50; font-weight: 600; font-size: 14px;">${
                      orderDetails._id
                    }</span>
                  </div>
                  ${
                    paymentRef
                      ? `
                  <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span style="color: #6c757d; font-size: 14px;">Payment Reference:</span>
                    <span style="color: #2c3e50; font-weight: 600; font-size: 14px;">${paymentRef}</span>
                  </div>
                  `
                      : ""
                  }
                  <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span style="color: #6c757d; font-size: 14px;">Status:</span>
                    <span style="color: #28a745; font-weight: 600; font-size: 14px; text-transform: uppercase;">${
                      orderDetails.status
                    }</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; padding-top: 15px; border-top: 2px solid #e9ecef; margin-top: 15px;">
                    <span style="color: #2c3e50; font-size: 18px; font-weight: 700;">Total Amount:</span>
                    <span style="color: #000000; font-size: 20px; font-weight: 900;">$${orderDetails.totalAmount.toFixed(
                      2
                    )}</span>
                  </div>
                </div>
              </div>

              ${
                orderDetails.deliveryInfo
                  ? `
              <!-- Delivery Information -->
              <div style="background-color: #f8f9fa; border-left: 4px solid #000000; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
                <h4 style="margin: 0 0 15px 0; color: #2c3e50; font-size: 16px; font-weight: 700;">
                  Shipping Address
                </h4>
                <p style="margin: 5px 0; color: #495057; font-size: 14px; line-height: 1.6;">
                  <strong>Name:</strong> ${
                    orderDetails.deliveryInfo.fullName
                  }<br>
                  <strong>Phone:</strong> ${
                    orderDetails.deliveryInfo.phoneNumber
                  }<br>
                  <strong>Address:</strong> ${
                    orderDetails.deliveryInfo.address
                  }<br>
                  <strong>City:</strong> ${orderDetails.deliveryInfo.city}<br>
                  <strong>State:</strong> ${orderDetails.deliveryInfo.state}<br>
                  <strong>Postal Code:</strong> ${
                    orderDetails.deliveryInfo.postalCode
                  }
                  ${
                    orderDetails.deliveryInfo.landmark
                      ? `<br><strong>Landmark:</strong> ${orderDetails.deliveryInfo.landmark}`
                      : ""
                  }
                </p>
              </div>
              `
                  : ""
              }

              <div style="background: linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%); border-left: 4px solid #17a2b8; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #0c5460; font-size: 14px; line-height: 1.6;">
                  <strong>Action Required:</strong> Please process this order and update the shipping status in the admin dashboard. The customer is waiting for their items!
                </p>
              </div>

              <div style="text-align: center; margin-top: 40px;">
                <a href="${
                  process.env.FRONTEND_URL || "http://localhost:3000"
                }/admin/orders" 
                   style="background-color: #000; color: white; padding: 12px 30px; 
                          text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
                  View in Admin Dashboard
                </a>
              </div>
            </div>

            <!-- Footer -->
            <div style="background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%); padding: 30px; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #ecf0f1; font-size: 14px; font-weight: 600;">
                OXYTOXIN
              </p>
              <p style="margin: 0; color: #95a5a6; font-size: 12px;">
                © 2024 Oxytoxin. All rights reserved. | Admin Notification System
              </p>
            </div>

          </div>
        </body>
        </html>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(
      "Payment notification email sent to owner successfully:",
      result.messageId
    );
    return true;
  } catch (error) {
    console.error("Error sending payment notification email to owner:", error);
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
  sendPaymentConfirmationToUser,
  sendPaymentNotificationToOwner,
};
