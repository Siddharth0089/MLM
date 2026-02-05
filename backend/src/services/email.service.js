import { Resend } from "resend";
import Meeting from "../models/Meeting.js";
import Note from "../models/Note.js";
import NoteTranslation from "../models/NoteTranslation.js";
import User from "../models/User.js";

// Initialize Resend only if API key is provided (optional for development)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

class EmailService {
  /**
   * Send meeting minutes to all participants
   * @param {string} meetingId - Meeting ID
   */
  async sendMeetingMinutes(meetingId) {
    try {
      const meeting = await Meeting.findById(meetingId)
        .populate("hostUserId")
        .populate("participants.userId");

      if (!meeting) {
        throw new Error("Meeting not found");
      }

      const note = await Note.findOne({ meetingId });
      if (!note) {
        console.log("No notes to send for meeting:", meetingId);
        return;
      }

      // Get all participants including host
      const allParticipants = [
        meeting.hostUserId,
        ...meeting.participants.map((p) => p.userId),
      ];

      // Send email to each participant in their language
      for (const participant of allParticipants) {
        if (!participant || !participant.email) continue;

        const userLanguage = participant.preferredLanguage || "en";
        let noteContent = note.contentPlainText;

        // Get translated version if available
        if (userLanguage !== note.canonicalLanguage) {
          const translation = await NoteTranslation.findOne({
            noteId: note._id,
            targetLanguage: userLanguage,
          });

          if (translation) {
            noteContent = translation.translatedPlainText;
          }
        }

        const emailSubject = this.getLocalizedSubject(userLanguage, meeting.title);
        const emailBody = this.getLocalizedEmailBody(
          userLanguage,
          participant.name,
          meeting.title,
          noteContent,
          meeting.createdAt,
          meeting.endedAt
        );

        await this.sendEmail(participant.email, emailSubject, emailBody);
      }

      console.log(`Meeting minutes sent for meeting: ${meetingId}`);
    } catch (error) {
      console.error("Error sending meeting minutes:", error);
      throw error;
    }
  }

  /**
   * Send individual email using Resend
   */
  async sendEmail(to, subject, html) {
    try {
      if (!resend) {
        console.warn("⚠️  Resend API key not configured. Email not sent.");
        console.log(`📧 Would have sent email to: ${to}`);
        console.log(`📧 Subject: ${subject}`);
        return { id: "skipped", message: "Resend not configured" };
      }

      const { data, error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "Meeting Platform <onboarding@resend.dev>",
        to: [to],
        subject,
        html,
      });

      if (error) {
        console.error("Resend API error:", error);
        throw error;
      }

      console.log("Email sent via Resend:", data.id);
      return data;
    } catch (error) {
      console.error("Email sending error:", error);
      throw error;
    }
  }

  /**
   * Get localized email subject
   */
  getLocalizedSubject(language, meetingTitle) {
    const subjects = {
      "en": `Meeting Minutes: ${meetingTitle}`,
      "hi": `बैठक कार्यवृत्त: ${meetingTitle}`,
      "fr": `Compte-rendu de réunion : ${meetingTitle}`,
      "es": `Acta de reunión: ${meetingTitle}`,
    };

    return subjects[language] || subjects["en"];
  }

  /**
   * Get localized email body HTML
   */
  getLocalizedEmailBody(language, userName, meetingTitle, noteContent, startTime, endTime) {
    const templates = {
      "en": `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4F46E5; border-bottom: 2px solid #4F46E5; padding-bottom: 10px;">Meeting Minutes</h2>
          <p>Hi <strong>${userName}</strong>,</p>
          <p>Here are the notes from the meeting: <strong>${meetingTitle}</strong></p>
          <p style="color: #666; font-size: 14px;">
            <em>Started: ${new Date(startTime).toLocaleString("en-US")}</em><br>
            <em>Ended: ${new Date(endTime).toLocaleString("en-US")}</em>
          </p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; white-space: pre-wrap;">
            ${noteContent}
          </div>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            This email was automatically generated by the Meeting Platform.
          </p>
        </body>
        </html>
      `,
      "hi": `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4F46E5; border-bottom: 2px solid #4F46E5; padding-bottom: 10px;">बैठक कार्यवृत्त</h2>
          <p>नमस्ते <strong>${userName}</strong>,</p>
          <p>यहाँ बैठक के नोट्स हैं: <strong>${meetingTitle}</strong></p>
          <p style="color: #666; font-size: 14px;">
            <em>शुरू: ${new Date(startTime).toLocaleString("hi-IN")}</em><br>
            <em>समाप्त: ${new Date(endTime).toLocaleString("hi-IN")}</em>
          </p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; white-space: pre-wrap;">
            ${noteContent}
          </div>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            यह ईमेल मीटिंग प्लेटफ़ॉर्म द्वारा स्वचालित रूप से उत्पन्न किया गया था।
          </p>
        </body>
        </html>
      `,
      "fr": `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4F46E5; border-bottom: 2px solid #4F46E5; padding-bottom: 10px;">Compte-rendu de réunion</h2>
          <p>Bonjour <strong>${userName}</strong>,</p>
          <p>Voici les notes de la réunion : <strong>${meetingTitle}</strong></p>
          <p style="color: #666; font-size: 14px;">
            <em>Début : ${new Date(startTime).toLocaleString("fr-FR")}</em><br>
            <em>Fin : ${new Date(endTime).toLocaleString("fr-FR")}</em>
          </p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; white-space: pre-wrap;">
            ${noteContent}
          </div>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            Cet e-mail a été généré automatiquement par la plateforme de réunion.
          </p>
        </body>
        </html>
      `,
      "es": `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4F46E5; border-bottom: 2px solid #4F46E5; padding-bottom: 10px;">Acta de reunión</h2>
          <p>Hola <strong>${userName}</strong>,</p>
          <p>Aquí están las notas de la reunión: <strong>${meetingTitle}</strong></p>
          <p style="color: #666; font-size: 14px;">
            <em>Inicio: ${new Date(startTime).toLocaleString("es-ES")}</em><br>
            <em>Fin: ${new Date(endTime).toLocaleString("es-ES")}</em>
          </p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; white-space: pre-wrap;">
            ${noteContent}
          </div>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            Este correo electrónico fue generado automáticamente por la plataforma de reuniones.
          </p>
        </body>
        </html>
      `,
    };

    return templates[language] || templates["en"];
  }
}

export default new EmailService();
