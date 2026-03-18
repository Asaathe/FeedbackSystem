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
      <h2 style="color: #2563eb;">Feedback Request</h2>
      <p>Dear ${supervisorName},</p>
      <p>${alumnusName} has indicated that you are their current supervisor at <strong>${companyName}</strong>.</p>
      <p>We would greatly appreciate if you could take a few minutes to provide feedback about ${alumnusName}'s performance and professionalism.</p>
      <div style="margin: 30px 0;">
        <a href="${feedbackLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Provide Feedback
        </a>
      </div>
      <p>Or copy this link: ${feedbackLink}</p>
      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        This is an automated message from FeedbACTS System.<br>
        Please do not reply to this email.
      </p>
    </div>
  `;

  return sendEmail(to, subject, html);
};

/**
 * Send feedback request to multiple supervisors
 * @param {Array} recipients - Array of {email, name, company, alumnusName, formTitle, link}
 * @returns {Promise<Object>} - Results summary
 */
const sendBulkFeedbackInvitations = async (recipients) => {
  const results = {
    success: 0,
    failed: 0,
    errors: [],
  };

  for (const recipient of recipients) {
    const success = await sendFeedbackInvitation(
      recipient.email,
      recipient.name,
      recipient.company,
      recipient.alumnusName,
      recipient.formTitle,
      recipient.link
    );

    if (success) {
      results.success++;
    } else {
      results.failed++;
      results.errors.push(recipient.email);
    }
  }

  return results;
};

module.exports = {
  transporter,
  sendEmail,
  sendFeedbackInvitation,
  sendBulkFeedbackInvitations,
};
