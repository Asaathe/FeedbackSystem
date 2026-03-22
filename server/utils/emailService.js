const nodemailer = require("nodemailer");

// Create transporter with Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER || "feedbacts@gmail.com",
    pass: process.env.SMTP_PASS || "",
  },
});

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.error("Email service error:", error);
  } else {
    console.log("Email service is ready");
  }
});

/**
 * Send an email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - Email body (HTML)
 * @returns {Promise<boolean>}
 */
const sendEmail = async (to, subject, html) => {
  console.log("=== sendEmail called ===");
  console.log("Recipient:", to);
  console.log("Subject:", subject);
  
  try {
    const mailOptions = {
      from: '"FeedbACTS System" <feedbacts@gmail.com>',
      to,
      subject,
      html,
    };

    console.log("Sending email via Gmail...");
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully! Message ID:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
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

module.exports = {
  transporter,
  sendEmail,
  sendFeedbackInvitation,
  sendBulkFeedbackInvitations,
  sendBatchEmails,
};
