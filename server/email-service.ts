import sgMail from '@sendgrid/mail';
import type { Report } from '@shared/schema';

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY not found. Email notifications will be disabled.");
} else {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.log("Email sending skipped - no API key configured");
    return false;
  }

  try {
    await sgMail.send(params);
    console.log(`Email sent successfully to ${params.to}`);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export async function sendReportNotification(report: Report): Promise<boolean> {
  const reportTypeLabels = {
    inappropriate: 'Inappropriate Content',
    bug: 'Bug Report',
    feature_request: 'Feature Request',
    technical_issue: 'Technical Issue',
    content: 'Content Issue'
  };

  const priorityEmoji = {
    low: '🟢',
    medium: '🟡',
    high: '🟠',
    urgent: '🔴'
  };

  const reportTypeLabel = reportTypeLabels[report.reportType as keyof typeof reportTypeLabels] || report.reportType;
  const priority = report.priority || 'medium';

  const subject = `[${reportTypeLabel}] ${report.title} - ${priorityEmoji[priority as keyof typeof priorityEmoji]} ${priority.toUpperCase()}`;
  
  const deviceInfo = report.deviceInfo ? JSON.parse(report.deviceInfo) : null;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">New Report Submitted</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Diagnostic Assessment Application</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 20px; border: 1px solid #dee2e6; border-top: none; border-radius: 0 0 8px 8px;">
        <div style="background: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
          <h2 style="margin: 0 0 15px 0; color: #343a40;">${reportTypeLabel}</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
            <div>
              <strong style="color: #6c757d;">Priority:</strong><br>
              <span style="background: ${priority === 'urgent' ? '#dc3545' : priority === 'high' ? '#fd7e14' : priority === 'medium' ? '#ffc107' : '#28a745'}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; text-transform: uppercase;">${priority}</span>
            </div>
            <div>
              <strong style="color: #6c757d;">Category:</strong><br>
              ${report.category || 'Not specified'}
            </div>
          </div>
          
          <div style="margin-bottom: 20px;">
            <strong style="color: #6c757d;">Title:</strong><br>
            <span style="font-size: 18px; color: #343a40;">${report.title}</span>
          </div>
          
          <div style="margin-bottom: 20px;">
            <strong style="color: #6c757d;">Description:</strong><br>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 4px; margin-top: 8px; white-space: pre-wrap;">${report.description}</div>
          </div>
        </div>

        <div style="background: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 15px 0; color: #343a40;">User Information</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <strong style="color: #6c757d;">User ID:</strong><br>
              ${report.userId}
            </div>
            <div>
              <strong style="color: #6c757d;">Email:</strong><br>
              ${report.userEmail || 'Not provided'}
            </div>
          </div>
          ${report.relatedItemId ? `
          <div style="margin-top: 15px;">
            <strong style="color: #6c757d;">Related Item:</strong><br>
            ${report.relatedItemId}
          </div>
          ` : ''}
        </div>

        ${deviceInfo ? `
        <div style="background: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 15px 0; color: #343a40;">Technical Information</h3>
          <div style="font-size: 12px; color: #6c757d; background: #f8f9fa; padding: 10px; border-radius: 4px;">
            <strong>User Agent:</strong> ${deviceInfo.userAgent || 'Unknown'}<br>
            <strong>Referrer:</strong> ${deviceInfo.referer || 'None'}<br>
            <strong>Timestamp:</strong> ${deviceInfo.timestamp || report.createdAt}
          </div>
        </div>
        ` : ''}

        <div style="background: white; padding: 20px; border-radius: 6px;">
          <h3 style="margin: 0 0 15px 0; color: #343a40;">Report Details</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 14px;">
            <div>
              <strong style="color: #6c757d;">Report ID:</strong><br>
              #${report.id}
            </div>
            <div>
              <strong style="color: #6c757d;">Submitted:</strong><br>
              ${new Date(report.createdAt!).toLocaleString()}
            </div>
          </div>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: #e9ecef; border-radius: 6px; text-align: center;">
          <p style="margin: 0; color: #6c757d; font-size: 12px;">
            This report was automatically generated by the Diagnostic Assessment Application
          </p>
        </div>
      </div>
    </div>
  `;

  const text = `
New Report Submitted: ${reportTypeLabel}

Title: ${report.title}
Priority: ${priority.toUpperCase()}
Category: ${report.category || 'Not specified'}

Description:
${report.description}

User Information:
- User ID: ${report.userId}
- Email: ${report.userEmail || 'Not provided'}
${report.relatedItemId ? `- Related Item: ${report.relatedItemId}` : ''}

Report ID: #${report.id}
Submitted: ${new Date(report.createdAt!).toLocaleString()}

${deviceInfo ? `
Technical Details:
- User Agent: ${deviceInfo.userAgent || 'Unknown'}
- Referrer: ${deviceInfo.referer || 'None'}
` : ''}

---
This report was automatically generated by the Diagnostic Assessment Application
  `;

  return await sendEmail({
    to: 'tim426285@gmail.com',
    from: 'tim426285@gmail.com', // Using verified email address
    subject,
    text,
    html
  });
}