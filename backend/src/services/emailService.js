import axios from "axios";

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

export async function sendVerificationEmail({ name, email, token }) {
  const { BREVO_API_KEY, BREVO_SENDER_EMAIL, BREVO_SENDER_NAME, CLIENT_URL } = process.env;
  if (!BREVO_API_KEY || !BREVO_SENDER_EMAIL || !CLIENT_URL) {
    const error = new Error("Brevo is not configured. Add BREVO_API_KEY, BREVO_SENDER_EMAIL, and CLIENT_URL to backend/.env.");
    error.statusCode = 503;
    throw error;
  }

  const verificationUrl = `${CLIENT_URL.replace(/\/$/, "")}/verify-email?token=${encodeURIComponent(token)}`;
  try {
    await axios.post(BREVO_ENDPOINT, {
      sender: { name: BREVO_SENDER_NAME || "Campusly", email: BREVO_SENDER_EMAIL },
      to: [{ email, name }],
      subject: "Verify your Campusly email",
      htmlContent: `<!doctype html><html><body style="margin:0;background:#090909;color:#f5f5f5;font-family:Arial,sans-serif;padding:32px"><div style="max-width:560px;margin:auto;padding:32px;border:1px solid #353535;border-radius:18px;background:#141414"><h1 style="color:#facc15;margin-top:0">Welcome to Campusly</h1><p>Hi ${escapeHtml(name)},</p><p>Confirm your email address to complete email verification for your Campusly account.</p><p style="margin:28px 0"><a href="${verificationUrl}" style="display:inline-block;background:#facc15;color:#111;text-decoration:none;font-weight:bold;padding:13px 20px;border-radius:9px">Verify email address</a></p><p>If the button does not work, open this link:</p><p style="word-break:break-all"><a style="color:#facc15" href="${verificationUrl}">${verificationUrl}</a></p><p>This link expires in 24 hours. If you did not create a Campusly account, you can ignore this email.</p></div></body></html>`,
    }, {
      headers: {
        accept: "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
      },
      timeout: 15000,
    });
  } catch (requestError) {
    const details = requestError.response?.data;
    const error = new Error(details?.message || "Brevo could not send the verification email. Check your Brevo API key and verified sender.");
    error.statusCode = requestError.response?.status === 401 || requestError.response?.status === 403 ? 503 : 502;
    throw error;
  }
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}
