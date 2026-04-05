// Require Resend (primary email service)
const { Resend } = require('resend');

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

console.log("✅ Resend email service initialized");

// Email transporter configuration (Resend only)
const transporter = {
  sendMail: async (mailOptions) => {
    try {
      const result = await resend.emails.send({
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject,
        html: mailOptions.html,
      });
      return { messageId: result.id };
    } catch (error) {
      console.error("Resend API error:", error.message);
      throw error;
    }
  },
  verify: (callback) => {
    // Resend doesn't need verification like SMTP
    callback(null, true);
  }
};

// Email verification (Resend doesn't need traditional verification)
console.log("✅ Resend email service ready");

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

  // Check if email is disabled
  if (process.env.DISABLE_EMAIL === 'true') {
    console.log("📧 Email sending disabled. Logging email content instead:");
    console.log("📧 To:", to);
    console.log("📧 Subject:", subject);
    console.log("📧 Content preview:", html.substring(0, 200) + "...");
    return true;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const mailOptions = {
        from: process.env.RESEND_FROM_EMAIL || 'FeedbACTS <noreply@resend.dev>',
        to,
        subject,
        html,
      };

      console.log(`📧 Sending email via Resend (attempt ${attempt}/${retries})...`);
      const info = await transporter.sendMail(mailOptions);
      console.log("✅ Email sent successfully via Resend! Message ID:", info.messageId);
      return true;
    } catch (error) {
      console.error(`❌ Email send attempt ${attempt}/${retries} failed:`, error.message);

      // Check for fatal errors
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.error("❌ Authentication error - check your RESEND_API_KEY");
        break;
      }

      // Retry on other errors
      if (attempt < retries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff, max 5s
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  console.error("❌ All email send attempts failed");
  console.log("💡 Check your RESEND_API_KEY and internet connection");
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
    console.log("🧪 Testing Resend connection...");
    // Try to send a minimal test
    const testResult = await resend.domains.list();
    console.log("✅ Resend connection test successful");
    return true;
  } catch (error) {
    console.error("❌ Resend connection test failed:", error.message);
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
  resend,
  transporter,
  sendEmail,
  sendFeedbackInvitation,
  sendBulkFeedbackInvitations,
  sendBatchEmails,
  testEmailConnection,
  sendTestEmail,
};
