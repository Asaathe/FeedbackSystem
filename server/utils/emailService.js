const nodemailer = require("nodemailer");

// Check SMTP configuration
if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.warn("⚠️  WARNING: SMTP credentials not configured!");
  console.warn("⚠️  Set SMTP_USER and SMTP_PASS environment variables");
  console.warn("⚠️  Using fallback Gmail credentials - may not work in production");
}

// Create transporter with Gmail - fallback to console logging for Railway
// Gmail SMTP often fails in Railway due to network restrictions
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || "feedbacts@gmail.com",
    pass: process.env.SMTP_PASS || "",
  },
  requireTLS: true,
  connectionTimeout: 10000, // Reduced timeout
  greetingTimeout: 5000,
  socketTimeout: 10000,
  // Minimal TLS settings
  tls: {
    rejectUnauthorized: false
  }
});

// Alternative: Use Railway's built-in SMTP if available
// Uncomment below if you want to try Railway SMTP
/*
const transporter = nodemailer.createTransport({
  host: process.env.RAILWAY_SMTP_HOST || 'smtp.mailgun.org',
  port: process.env.RAILWAY_SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.RAILWAY_SMTP_USER,
    pass: process.env.RAILWAY_SMTP_PASS,
  },
  requireTLS: true,
});
*/

// Verify connection with retry logic
const verifyEmailConnection = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const success = await new Promise((resolve, reject) => {
        transporter.verify((error, success) => {
          if (error) reject(error);
          else resolve(success);
        });
      });
      console.log("✅ Email service is ready and connected");
      return true;
    } catch (error) {
      console.error(`❌ Email service verification attempt ${i + 1}/${retries} failed:`, error.message);
      if (i < retries - 1) {
        console.log(`⏳ Retrying email verification in 5 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
  console.error("❌ Email service verification failed after all retries");
  return false;
};

// Start verification (don't crash server if it fails)
if (process.env.DISABLE_EMAIL !== 'true') {
  verifyEmailConnection().catch(err => {
    console.warn("⚠️ Email verification failed, but server will continue:", err.message);
  });
} else {
  console.log("📧 Email sending disabled (DISABLE_EMAIL=true)");
}

/**
 * Send an email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - Email body (HTML)
 * @returns {Promise<boolean>}
 */
const sendEmail = async (to, subject, html, retries = 3) => {
  console.log("=== sendEmail called ===");
  console.log("Recipient:", to);
  console.log("Subject:", subject);

  // Check if email is disabled (for Railway deployment)
  if (process.env.DISABLE_EMAIL === 'true') {
    console.log("📧 Email sending disabled. Logging email content instead:");
    console.log("📧 To:", to);
    console.log("📧 Subject:", subject);
    console.log("📧 Content preview:", html.substring(0, 200) + "...");
    return true; // Return success to not break the app
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const mailOptions = {
        from: process.env.SMTP_USER ? `"FeedbACTS System" <${process.env.SMTP_USER}>` : '"FeedbACTS System" <feedbacts@gmail.com>',
        to,
        subject,
        html,
      };

      console.log(`📧 Attempting to send email (${attempt}/${retries}) via Gmail...`);
      const info = await transporter.sendMail(mailOptions);
      console.log("✅ Email sent successfully! Message ID:", info.messageId);
      return true;
    } catch (error) {
      console.error(`❌ Email send attempt ${attempt}/${retries} failed:`, error.message);

      // Don't retry on certain errors
      if (error.code === 'EAUTH' || error.code === 'EENVELOPE') {
        console.error("❌ Fatal email error - not retrying:", error.code);
        break;
      }

      // Retry on connection/timeout errors
      if (attempt < retries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff, max 10s
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  console.error("❌ All email send attempts failed");
  console.log("💡 Consider setting DISABLE_EMAIL=true to log emails instead of sending");
  return false;
};

/**
 * Send feedback form invitation to employer/supervisor
 * @param {string} to - Supervisor email
 * @param {string} supervisorName - Supervisor name
 * @param {string} companyName - Company name
 * @param {string} alumnusName - Name of alumnus who referred
 * @param {string} formTitle - Feedback form title
 * @param {string} feedbackLink - Link to feedback form
 * @returns {Promise<boolean>}
 */
const sendFeedbackInvitation = async (
  to,
  supervisorName,
  companyName,
  alumnusName,
  formTitle,
  feedbackLink
) => {
  console.log("=== sendFeedbackInvitation called ===");
  console.log("To:", to);
  console.log("Supervisor:", supervisorName);
  console.log("Company:", companyName);
  console.log("Alumnus:", alumnusName);
  console.log("Form:", formTitle);
  console.log("Link:", feedbackLink);
  
  const subject = `Feedback Request for ${alumnusName} - ${formTitle}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #49d182;">Feedback Request</h2>
      <p>Dear ${supervisorName},</p>
      <p>Good day.</p>
      <p>We hope this message finds you well.</p>
      <p>We are reaching out from the <strong>ACTS Computer College</strong>, in relation to our graduate, <strong>${alumnusName}</strong>, who is currently employed at your organization. As part of our continuous effort to improve the quality of education and ensure alignment with industry standards, we are conducting a feedback initiative involving the employers of our alumni.</p>
      <p>This initiative aims to gather valuable insights regarding our graduates' performance, skills, and overall preparedness in the workplace. Your feedback will greatly contribute to enhancing our academic programs and better preparing future graduates for professional success.</p>
      <p>In the coming days, you may receive a short evaluation form from our system. We kindly ask for a few minutes of your time to complete it. Rest assured that all responses will be treated with strict confidentiality and will be used solely for academic and institutional improvement purposes.</p>
      <p>Should you have any questions or require further information, please feel free to contact us at feedbacts@gmail.com.</p>
      <p>Thank you very much for your time and support.</p>
      <div style="margin: 30px 0;">
        <a href="${feedbackLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Provide Feedback
        </a>
      </div>
      <p>Or copy this link: ${feedbackLink}</p>
      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        This is an automated message from FeedbACTS System.<br>
        ACTS Computer College<br>
        Please do not reply to this email.
      </p>
    </div>
  `;

  return sendEmail(to, subject, html);
};

/**
 * Send feedback request to multiple supervisors (batch - simultaneous)
 * @param {Array} recipients - Array of {email, name, company, alumnusName, formTitle, link}
 * @returns {Promise<Object>} - Results summary
 */
const sendBulkFeedbackInvitations = async (recipients) => {
  const results = {
    success: 0,
    failed: 0,
    errors: [],
  };

  if (!recipients || recipients.length === 0) {
    return results;
  }

  // Send all emails simultaneously using Promise.all
  const emailPromises = recipients.map(async (recipient) => {
    try {
      const success = await sendFeedbackInvitation(
        recipient.email,
        recipient.name,
        recipient.company,
        recipient.alumnusName,
        recipient.formTitle,
        recipient.link
      );
      return { email: recipient.email, success };
    } catch (error) {
      console.error(`Error sending email to ${recipient.email}:`, error);
      return { email: recipient.email, success: false };
    }
  });

  // Wait for all emails to be sent simultaneously
  const emailResults = await Promise.all(emailPromises);

  // Count successes and failures
  emailResults.forEach((result) => {
    if (result.success) {
      results.success++;
    } else {
      results.failed++;
      results.errors.push(result.email);
    }
  });

  return results;
};

/**
 * Send batch emails simultaneously
 * @param {Array} emails - Array of {to, subject, html}
 * @returns {Promise<Object>} - Results summary
 */
const sendBatchEmails = async (emails) => {
  const results = {
    success: 0,
    failed: 0,
    errors: [],
  };

  if (!emails || emails.length === 0) {
    return results;
  }

  // Send all emails simultaneously using Promise.all
  const emailPromises = emails.map(async (email) => {
    try {
      const success = await sendEmail(email.to, email.subject, email.html);
      return { to: email.to, success };
    } catch (error) {
      console.error(`Error sending email to ${email.to}:`, error);
      return { to: email.to, success: false };
    }
  });

  // Wait for all emails to be sent simultaneously
  const emailResults = await Promise.all(emailPromises);

  // Count successes and failures
  emailResults.forEach((result) => {
    if (result.success) {
      results.success++;
    } else {
      results.failed++;
      results.errors.push(result.to);
    }
  });

  console.log(`Batch email sending complete: ${results.success} succeeded, ${results.failed} failed`);
  return results;
};

/**
 * Test email connectivity
 * @returns {Promise<boolean>}
 */
const testEmailConnection = async () => {
  try {
    console.log("🧪 Testing email connection...");
    const success = await verifyEmailConnection(1); // Quick test with 1 retry
    if (success) {
      console.log("✅ Email connection test successful");
      return true;
    } else {
      console.error("❌ Email connection test failed");
      return false;
    }
  } catch (error) {
    console.error("❌ Email connection test error:", error.message);
    return false;
  }
};

/**
 * Send a test email to verify configuration
 * @param {string} testEmail - Email address to send test to
 * @returns {Promise<boolean>}
 */
const sendTestEmail = async (testEmail) => {
  const subject = "FeedbACTS Email Test";
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>✅ Email Test Successful!</h2>
      <p>This is a test email from your FeedbACTS system.</p>
      <p>If you received this, your email configuration is working correctly.</p>
      <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
      <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
    </div>
  `;

  return sendEmail(testEmail, subject, html, 1); // Single attempt for testing
};

module.exports = {
  transporter,
  sendEmail,
  sendFeedbackInvitation,
  sendBulkFeedbackInvitations,
  sendBatchEmails,
  testEmailConnection,
  verifyEmailConnection,
  sendTestEmail,
};
