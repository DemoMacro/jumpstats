import { Resend } from "resend";
import { env } from "std-env";

/**
 * Send email verification email using Resend
 */
export async function sendEmailVerification({
  user,
  url,
}: {
  user: { email: string; name?: string };
  url: string;
}) {
  try {
    const resend = new Resend(env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: env.RESEND_FROM_EMAIL || "JumpStats <noreply@js.gs>",
      to: user.email,
      subject: "Verify your JumpStats email address",
      text: `Please click the following link to verify your email address:\n\n${url}\n\nIf you did not register for a JumpStats account, please ignore this email.\nThis link will expire in 1 hour.`,
    });

    if (error) {
      console.error("Resend error:", error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Failed to send verification email:", error);
    throw error;
  }
}
