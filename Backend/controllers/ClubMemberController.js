const path = require('path');
const fs = require('fs');
const dns = require('dns');
const nodemailer = require('nodemailer');
const ClubMember = require('../models/ClubMember');
const UnderScreeningMember = require('../models/UnderScreeningMember');
const { generateIdCardPng } = require('../utils/generateIdCard');

async function callVercelRelay(type, member) {
  const relayUrl = process.env.EMAIL_RELAY_URL || 'https://techversectu.vercel.app/api/send-email';
  console.log(`📡 Attempting email dispatch via Vercel relay (${type}) to ${member?.email}...`);
  try {
    if (typeof fetch === 'function') {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      const res = await fetch(relayUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, member }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.ok) {
        const json = await res.json().catch(() => ({}));
        console.log(`✅ Email dispatched successfully via Vercel relay! Message ID:`, json.messageId || 'ok');
        return true;
      }
      const errTxt = await res.text().catch(() => '');
      console.warn(`⚠️ Vercel relay HTTP ${res.status}: ${errTxt}`);
      return false;
    }
  } catch (err) {
    console.warn(`⚠️ Vercel relay attempt error:`, err.message);
  }
  return false;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getTransporter() {
  const emailPass = process.env.EMAIL_PASS ? String(process.env.EMAIL_PASS).replace(/\s+/g, '').trim() : '';
  const emailUser = (process.env.EMAIL_USER ? String(process.env.EMAIL_USER).trim() : '') || 'techverse@ctuniversity.in';

  if (!emailPass) {
    return null;
  }

  return {
    transporter: nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      // Socket-level DNS resolver enforcing IPv4 resolution on Render cloud containers
      lookup: (hostname, options, callback) => {
        return dns.lookup(hostname, Object.assign({}, options, { family: 4 }), callback);
      },
      auth: {
        user: emailUser,
        pass: emailPass,
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
    }),
    emailUser,
    emailPass,
  };
}

/**
 * Stage 1: Send Screening Process Acknowledgment Email
 * Triggered automatically when student submits the New Member Application.
 */
async function sendScreeningEmail(member) {
  // First attempt: Vercel serverless relay over HTTPS (works without SMTP port block)
  try {
    const relayOk = await callVercelRelay('screening', member);
    if (relayOk) return true;
  } catch (relayErr) {
    console.warn('Screening relay attempt failed:', relayErr.message);
  }

  const transportConfig = getTransporter();
  if (!transportConfig) {
    console.log(`ℹ️ EMAIL_PASS not set. Screening email queued for ${member.email}`);
    return false;
  }

  const { transporter, emailUser, emailPass } = transportConfig;
  const recipientEmail = String(member.email).trim().toLowerCase();

  const departmentDisplay = member.department === 'btech'
    ? 'B.Tech (School of Engineering & Technology)'
    : (member.department === 'bca'
       ? 'BCA (School of Engineering & Technology)'
       : (member.department === 'mca'
          ? 'MCA (School of Engineering & Technology)'
          : (member.department === 'mtech'
             ? 'M.Tech (School of Engineering & Technology)'
             : String(member.department || '').toUpperCase())));
  const interestsList = Array.isArray(member.interests) ? member.interests.join(', ') : (member.interests || 'Technology & Innovation');

  // Prepare attachments for the 3 logos
  const attachments = [];
  const assetsDir = path.join(__dirname, '../assets');
  const univLogoPath = path.join(assetsDir, 'univeee-logo.png');
  const techverseLogoPath = path.join(assetsDir, 'techverse-logo.jpg');
  const soetLogoPath = path.join(assetsDir, 'soet-logo.png');

  if (fs.existsSync(univLogoPath)) attachments.push({ filename: 'univeee-logo.png', path: univLogoPath, cid: 'univLogo' });
  if (fs.existsSync(techverseLogoPath)) attachments.push({ filename: 'techverse-logo.jpg', path: techverseLogoPath, cid: 'techverseLogo' });
  if (fs.existsSync(soetLogoPath)) attachments.push({ filename: 'soet-logo.png', path: soetLogoPath, cid: 'soetLogo' });

  const techverseLogoUrl = 'https://techversectu.vercel.app/techverse-logo.jpg';
  const submittedDate = member.createdAt ? new Date(member.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>TechVerse Club Membership Application Acknowledgment</title>
</head>
<body style="margin: 0; padding: 36px 16px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased;">
  <div style="max-width: 650px; margin: 0 auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; box-shadow: 0 4px 16px rgba(15,23,42,0.06); overflow: hidden;">
    
    <!-- INSTITUTIONAL LETTERHEAD -->
    <div style="padding: 24px 28px 20px 28px; border-bottom: 2px solid #0f172a; background: #ffffff;">
      <table width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td width="70%" style="vertical-align: middle;">
            <div style="font-size: 16px; font-weight: 800; color: #0f172a; letter-spacing: -0.2px; text-transform: uppercase;">TechVerse Club</div>
            <div style="font-size: 13px; font-weight: 600; color: #334155; margin-top: 2px;">School of Engineering &amp; Technology</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 2px;">CT University, Ferozepur Road, Ludhiana, Punjab</div>
          </td>
          <td width="30%" align="right" style="vertical-align: middle;">
            <div style="display: inline-block; background: #f8fafc; border: 1px solid #cbd5e1; padding: 6px 12px; border-radius: 6px; text-align: center;">
              <div style="font-size: 10px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.8px;">Application Ref</div>
              <div style="font-size: 13px; font-weight: 800; color: #0f172a; font-family: monospace;">Ref #${member.serialNumber || '1'}</div>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- OFFICIAL NOTICE HEADER -->
    <div style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 14px 28px;">
      <div style="font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 1px;">Official Memorandum • Application Status</div>
      <div style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 4px;">Acknowledgment of Club Membership Application</div>
    </div>

    <!-- FORMAL LETTER BODY -->
    <div style="padding: 28px 28px 32px 28px; font-size: 14px; line-height: 1.7; color: #334155;">
      <p style="margin: 0 0 16px 0; font-size: 15px; color: #0f172a;">
        Dear <strong>${escapeHtml(member.name)}</strong>,
      </p>

      <p style="margin: 0 0 16px 0;">
        Thank you for your interest in joining <strong>TechVerse Club</strong> at the School of Engineering &amp; Technology, CT University. This official memorandum confirms that your application for membership has been successfully registered and placed under active screening.
      </p>

      <!-- APPLICATION RECORD TABLE -->
      <div style="margin: 22px 0; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden;">
        <div style="background: #f8fafc; padding: 10px 16px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 0.8px;">
          Registered Application Particulars
        </div>
        <table width="100%" cellspacing="0" cellpadding="8" border="0" style="font-size: 13px; background: #ffffff;">
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td width="36%" style="color: #64748b; font-weight: 600; padding: 10px 16px;">Applicant Name:</td>
            <td style="color: #0f172a; font-weight: 700; padding: 10px 16px;">${escapeHtml(member.name)}</td>
          </tr>
          <tr style="background: #fafafa; border-bottom: 1px solid #f1f5f9;">
            <td style="color: #64748b; font-weight: 600; padding: 10px 16px;">Registration Number:</td>
            <td style="color: #0f172a; font-weight: 700; font-family: monospace; padding: 10px 16px;">${escapeHtml(member.regNumber || 'N/A')}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="color: #64748b; font-weight: 600; padding: 10px 16px;">Academic Program:</td>
            <td style="color: #0f172a; padding: 10px 16px;">${escapeHtml(departmentDisplay)}</td>
          </tr>
          <tr style="background: #fafafa; border-bottom: 1px solid #f1f5f9;">
            <td style="color: #64748b; font-weight: 600; padding: 10px 16px;">Academic Batch:</td>
            <td style="color: #0f172a; padding: 10px 16px;">${escapeHtml(member.batch || '2024-2028')}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="color: #64748b; font-weight: 600; padding: 10px 16px;">Technical Interests:</td>
            <td style="color: #0f172a; padding: 10px 16px;">${escapeHtml(interestsList)}</td>
          </tr>
          <tr style="background: #fafafa; border-bottom: 1px solid #f1f5f9;">
            <td style="color: #64748b; font-weight: 600; padding: 10px 16px;">Submission Date:</td>
            <td style="color: #0f172a; padding: 10px 16px;">${submittedDate}</td>
          </tr>
          <tr style="background: #ffffff;">
            <td style="color: #64748b; font-weight: 600; padding: 10px 16px;">Current Status:</td>
            <td style="color: #0284c7; font-weight: 700; padding: 10px 16px;">Received &bull; Under Screening Review</td>
          </tr>
        </table>
      </div>

      <!-- FORMAL CLARIFICATION NOTICE -->
      <div style="background: #f8fafc; border-left: 4px solid #0f172a; padding: 14px 18px; border-radius: 0 6px 6px 0; margin: 20px 0; font-size: 12.5px; color: #475569; line-height: 1.6;">
        <strong style="color: #0f172a;">Institutional Notice:</strong> This communication is an official acknowledgment of application receipt only. It is not an ID card or formal club appointment. Official membership credentials and verified digital ID cards are issued separately following evaluation and designation confirmation.
      </div>

      <p style="margin: 18px 0 16px 0;">
        Your application is currently being evaluated by the <strong>President and Committee Members of the Club</strong>. Candidates whose profiles align with club requirements will be contacted regarding role assignments and onboarding formalities.
      </p>

      <p style="margin: 0 0 24px 0;">
        If you have any questions or require any changes to your submission details, please write to us at <a href="mailto:techverse@ctuniversity.in" style="color: #0284c7; text-decoration: none; font-weight: 600;">techverse@ctuniversity.in</a>.
      </p>

      <!-- OFFICIAL COMMUNITY CHANNELS -->
      <div style="margin: 26px 0 22px 0; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 18px; padding: 22px 18px; border: 1.5px solid #334155; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.25);">
        <span style="display: inline-block; background: rgba(56,189,248,0.15); border: 1px solid #38bdf8; color: #38bdf8; font-size: 10px; font-weight: 800; padding: 3px 12px; border-radius: 12px; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">
          Official Club Communities
        </span>
        <h3 style="margin: 4px 0 6px 0; font-size: 16px; font-weight: 800; color: #ffffff;">
          Join Our Official Channels to Stay Updated
        </h3>
        <p style="margin: 0 auto 18px auto; font-size: 12px; color: #94a3b8; line-height: 1.5; max-width: 440px;">
          Never miss any updates, hackathons, workshops, or club announcements. Connect with us across WhatsApp, Instagram, and LinkedIn!
        </p>

        <!-- STACKED ACTION BUTTONS (MOBILE OPTIMIZED) -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto; width: 100%; max-width: 380px;">
          <tr>
            <td align="center" style="padding: 5px 0;">
              <a href="https://chat.whatsapp.com/IiClyLPXlooJZWlJ66CnlN?mode=wwt" target="_blank" rel="noopener noreferrer" style="display: block; width: 100%; box-sizing: border-box; background: #25D366; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 13px; padding: 11px 16px; border-radius: 10px; box-shadow: 0 4px 12px rgba(37,211,102,0.3); text-align: center;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                  <tr>
                    <td style="vertical-align: middle; padding-right: 8px;">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle; display: block;">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.888 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.004c6.554 0 11.89-5.336 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" fill="#ffffff"/>
                      </svg>
                    </td>
                    <td style="vertical-align: middle; color: #ffffff; font-weight: 700; font-size: 13px;">
                      WhatsApp Community
                    </td>
                  </tr>
                </table>
              </a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 5px 0;">
              <a href="https://www.instagram.com/tech.versectu/" target="_blank" rel="noopener noreferrer" style="display: block; width: 100%; box-sizing: border-box; background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); color: #ffffff; text-decoration: none; font-weight: 700; font-size: 13px; padding: 11px 16px; border-radius: 10px; box-shadow: 0 4px 12px rgba(220,39,67,0.3); text-align: center;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                  <tr>
                    <td style="vertical-align: middle; padding-right: 8px;">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle; display: block;">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" fill="#ffffff"/>
                      </svg>
                    </td>
                    <td style="vertical-align: middle; color: #ffffff; font-weight: 700; font-size: 13px;">
                      Instagram Page
                    </td>
                  </tr>
                </table>
              </a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 5px 0;">
              <a href="https://www.linkedin.com/company/techverse-club-ct-university/" target="_blank" rel="noopener noreferrer" style="display: block; width: 100%; box-sizing: border-box; background: #0A66C2; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 13px; padding: 11px 16px; border-radius: 10px; box-shadow: 0 4px 12px rgba(10,102,194,0.3); text-align: center;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                  <tr>
                    <td style="vertical-align: middle; padding-right: 8px;">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle; display: block;">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451c.979 0 1.778-.773 1.778-1.729V1.73C24 .774 23.205 0 22.222 0h.003z" fill="#ffffff"/>
                      </svg>
                    </td>
                    <td style="vertical-align: middle; color: #ffffff; font-weight: 700; font-size: 13px;">
                      Connect on LinkedIn
                    </td>
                  </tr>
                </table>
              </a>
            </td>
          </tr>
        </table>
      </div>

      <!-- FORMAL SIGN-OFF -->
      <table width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <tr>
          <td style="vertical-align: middle; font-size: 13px; color: #475569; line-height: 1.6;">
            Sincerely,<br/>
            <strong style="color: #0f172a; font-size: 14px;">President and Committee Members of the Club</strong><br/>
            TechVerse Club • School of Engineering &amp; Technology<br/>
            CT University, Ludhiana, Punjab
          </td>
          <td align="right" style="vertical-align: middle; width: 72px;">
            <img src="${techverseLogoUrl}" alt="TechVerse Club Logo" width="58" height="58" style="display: block; width: 58px; height: 58px; border-radius: 12px; border: 1.5px solid #cbd5e1; object-fit: cover; box-shadow: 0 2px 6px rgba(15,23,42,0.08);" />
          </td>
        </tr>
      </table>
    </div>

    <!-- FOOTER -->
    <div style="background: #f8fafc; padding: 14px 28px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.6;">
      <img src="${techverseLogoUrl}" alt="TechVerse" width="18" height="18" style="vertical-align: -4px; border-radius: 50%; border: 1px solid #cbd5e1; margin-right: 6px; display: inline-block;" />
      Official Communication • TechVerse Club, SOET, CT University • Inquiries: <a href="mailto:techverse@ctuniversity.in" style="color: #0284c7; text-decoration: none;">techverse@ctuniversity.in</a>
    </div>
  </div>
</body>
</html>
  `;

  const mailOptions = {
    from: `"TechVerse Club • CT University" <${emailUser}>`,
    to: recipientEmail,
    replyTo: emailUser,
    subject: `TechVerse Club Membership Application Received - Ref #${member.serialNumber || '1'} (${member.name})`,
    html: htmlContent,
    attachments,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Screening acknowledgment email dispatched to ${recipientEmail}`);
    return true;
  } catch (err) {
    console.error('Primary transporter error (port 465):', err.message);
    // Fallback to Port 587 IPv4
    try {
      console.log('🔄 Attempting fallback transporter via service: gmail...');
      const fallbackTransporter = nodemailer.createTransport({
        service: 'gmail',
        lookup: (hostname, options, callback) => {
          return dns.lookup(hostname, Object.assign({}, options, { family: 4 }), callback);
        },
        auth: { user: emailUser, pass: emailPass },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
      });
      await fallbackTransporter.sendMail(mailOptions);
      console.log(`✅ Screening email dispatched via port 587 fallback to ${recipientEmail}`);
      return true;
    } catch (fallbackErr) {
      console.error('❌ Fallback transporter also failed:', fallbackErr.message);
      throw fallbackErr;
    }
  }
}

/**
 * Stage 2: Send Official Verified Membership Card Email
 * Triggered ONLY when Admin/President/VP sets the designation from the /admin portal.
 */
async function sendMembershipCardEmail(member) {
  // First attempt: Vercel serverless relay over HTTPS (works without SMTP port block)
  try {
    const relayOk = await callVercelRelay('card', member);
    if (relayOk) return true;
  } catch (relayErr) {
    console.warn('Membership card relay attempt failed:', relayErr.message);
  }

  const transportConfig = getTransporter();
  if (!transportConfig) {
    console.log(`ℹ️ EMAIL_PASS not set. Membership Card email queued for ${member.email}`);
    return false;
  }

  const { transporter, emailUser, emailPass } = transportConfig;
  const recipientEmail = String(member.email).trim().toLowerCase();

  const departmentDisplay = member.department === 'btech'
    ? 'B.Tech (School of Engineering & Technology)'
    : (member.department === 'bca'
       ? 'BCA (School of Engineering & Technology)'
       : (member.department === 'mca'
          ? 'MCA (School of Engineering & Technology)'
          : (member.department === 'mtech'
             ? 'M.Tech (School of Engineering & Technology)'
             : String(member.department || '').toUpperCase())));
  const interestsList = Array.isArray(member.interests) ? member.interests.join(', ') : (member.interests || 'Technology & Innovation');

  const isPromotion = Boolean(member.isPromotion);
  const cleanReg = String(member.regNumber || member.memberId || 'Member').replace(/[^a-zA-Z0-9_-]/g, '');
  const cardFilename = `TechVerse-Official-ID-Card-${cleanReg}.png`;

  let cardPngBuffer = null;
  try {
    cardPngBuffer = generateIdCardPng(member, { isPromotion });
  } catch (cardErr) {
    console.warn('Backend generateIdCardPng fallback error:', cardErr.message);
  }

  const attachments = [];
  if (cardPngBuffer) {
    // Inline image for the dedicated card frame
    attachments.push({
      filename: cardFilename,
      content: cardPngBuffer,
      cid: 'idCardInline',
      contentType: 'image/png',
    });
    // Explicit attachment for download
    attachments.push({
      filename: cardFilename,
      content: cardPngBuffer,
      contentType: 'image/png',
      contentDisposition: 'attachment',
    });
  }

  const heroBannerHtml = isPromotion ? `
  <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 45%, #1e3a8a 100%); padding: 28px 24px; text-align: center; color: #ffffff;">
    <span style="display: inline-block; background: rgba(250,204,21,0.25); border: 1px solid #facc15; color: #fef08a; font-size: 11px; font-weight: bold; padding: 4px 14px; border-radius: 12px; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">Official Leadership Promotion • Career Elevation</span>
    <h1 style="margin: 6px 0; font-size: 24px; font-weight: 800; color: #ffffff;">Congratulations ${escapeHtml(member.name)}, You Have Been Promoted</h1>
    <p style="margin: 4px 0 0 0; font-size: 13px; color: #e0e7ff; line-height: 1.5;">
      In recognition of your outstanding leadership and contributions to TechVerse, you have officially been elevated to <strong>${escapeHtml(member.designation || 'Club Leader')}</strong> (${escapeHtml(member.roleAssignee || 'President and Committee Members of the Club')}).
    </p>
  </div>
  ` : `
  <div style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); padding: 28px 24px; text-align: center; color: #ffffff;">
    <span style="display: inline-block; background: rgba(56,189,248,0.2); border: 1px solid #38bdf8; color: #38bdf8; font-size: 11px; font-weight: bold; padding: 4px 14px; border-radius: 12px; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">Official Selection Confirmed • Screening Approved</span>
    <h1 style="margin: 6px 0; font-size: 24px; font-weight: 800; color: #ffffff;">Congratulations ${escapeHtml(member.name)}, Your Appointment is Confirmed</h1>
    <p style="margin: 4px 0 0 0; font-size: 13px; color: #cbd5e1;">Your screening is complete. The President and Club Committee Members have confirmed your official designation as <strong>${escapeHtml(member.designation)}</strong> (${escapeHtml(member.roleAssignee || 'Core Team Member')}). Welcome to the TechVerse family.</p>
  </div>
  `;

  const letterBodyHtml = isPromotion ? `
  <div style="background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%); border-left: 4px solid #eab308; border-radius: 0 12px 12px 0; padding: 18px; margin: 0 0 24px 0;">
    <h4 style="margin: 0 0 8px 0; font-size: 13px; color: #854d0e; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">
      Executive Leadership Citation &amp; Promotion Announcement
    </h4>
    <p style="margin: 0 0 12px 0; font-size: 13px; color: #713f12; line-height: 1.6;">
      Dear <strong>${escapeHtml(member.name)}</strong>, on behalf of the President and Committee Members of the Club (<strong>TechVerse Club • School of Engineering &amp; Technology, CT University</strong>), we proudly commend your exemplary dedication and technical excellence.
    </p>
    <div style="background: #ffffff; border-radius: 8px; padding: 10px 14px; border: 1px solid #fde047; font-size: 12px; color: #713f12;">
      <span style="color: #64748b;">Previous Designation:</span> <strong style="text-decoration: line-through; color: #64748b;">${escapeHtml(member.previousDesignation || 'Member')}</strong> &nbsp;&nbsp;➔&nbsp;&nbsp; 
      <span style="color: #b45309; font-weight: bold;">New Elevated Designation:</span> <span style="background: #fef08a; color: #854d0e; font-weight: 800; padding: 2px 8px; border-radius: 4px;">${escapeHtml(member.designation)}</span>
    </div>
    <p style="margin: 12px 0 0 0; font-size: 12px; color: #854d0e; line-height: 1.5;">
      Your official <strong>TechVerse Leadership &amp; Membership Card</strong> has been generated below as a standalone printable badge. A high-resolution PNG file (<code style="color: #854d0e;">${cardFilename}</code>) is also attached to this email.
    </p>
  </div>
  ` : `
  <div style="background: #eff6ff; border-left: 4px solid #2563eb; border-radius: 0 12px 12px 0; padding: 18px; margin: 0 0 24px 0;">
    <h4 style="margin: 0 0 8px 0; font-size: 13px; color: #1e40af; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">
      Welcome to TechVerse Club, CT University
    </h4>
    <p style="margin: 0 0 10px 0; font-size: 13px; color: #1e3a8a; line-height: 1.6;">
      Dear <strong>${escapeHtml(member.name)}</strong>, the screening committee has approved your application. You have officially been appointed as <strong>${escapeHtml(member.designation || 'Active Member')}</strong> (${escapeHtml(member.roleAssignee || 'Core Team')}).
    </p>
    <p style="margin: 0; font-size: 12px; color: #1e40af; line-height: 1.5;">
      Your verified <strong>Digital Club Membership Card</strong> has been generated below. A high-resolution copy (<code style="color: #1e40af;">${cardFilename}</code>) is attached below for your records.
    </p>
  </div>
  `;

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${isPromotion ? 'Official Leadership Promotion - TechVerse Club' : 'Official TechVerse Club Membership Card'}</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #0b1120; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <div style="max-width: 660px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 12px 45px rgba(0,0,0,0.45); border: 2px solid ${isPromotion ? '#f59e0b' : '#3b82f6'};">
    
    ${heroBannerHtml}

    <div style="padding: 26px 22px;">
      ${letterBodyHtml}

      <!-- SEPARATE STANDALONE ID CARD SECTION DIVIDER -->
      <div style="text-align: center; margin: 30px 0 16px 0;">
        <span style="display: inline-block; background: ${isPromotion ? 'rgba(245,158,11,0.12)' : 'rgba(37,99,235,0.1)'}; border: 1.5px solid ${isPromotion ? '#f59e0b' : '#2563eb'}; color: ${isPromotion ? '#92400e' : '#1e40af'}; font-size: 11px; font-weight: 800; padding: 6px 18px; border-radius: 24px; text-transform: uppercase; letter-spacing: 2px;">
          OFFICIAL DIGITAL IDENTITY CARD (STANDALONE BADGE)
        </span>
        <p style="margin: 8px 0 0 0; font-size: 12px; color: #64748b;">
          Standard CR80 / Lanyard Badge Specification • Valid University-Wide
        </p>
      </div>

      <!-- STANDALONE ID CARD CONTAINER -->
      <div style="background: #090d16; border-radius: 28px; padding: 24px 16px; margin: 12px auto; max-width: 480px; text-align: center; box-shadow: inset 0 2px 10px rgba(255,255,255,0.05), 0 20px 40px rgba(0,0,0,0.5); border: 1px solid #1e293b;">
        <!-- Lanyard Slot Graphical Indicator -->
        <div style="width: 70px; height: 12px; background: #1e293b; border-radius: 6px; margin: 0 auto 16px auto; border: 2px solid #334155;"></div>

        <!-- The Separate Standalone ID Card Image -->
        ${cardPngBuffer ? `
          <img src="cid:idCardInline" alt="TechVerse Official ID Card" style="width: 100%; max-width: 440px; height: auto; display: block; margin: 0 auto; border-radius: 22px; box-shadow: 0 12px 30px rgba(0,0,0,0.8); border: 2px solid ${isPromotion ? '#f59e0b' : '#38bdf8'};" />
        ` : `
          <p style="color: #94a3b8; font-size: 13px;">[ID Card Graphic Generated in Attached File]</p>
        `}

      </div>

      <!-- OFFICIAL COMMUNITY CHANNELS -->
      <div style="margin: 26px 0 16px 0; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 18px; padding: 22px 18px; border: 1.5px solid #334155; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.25);">
        <span style="display: inline-block; background: rgba(56,189,248,0.15); border: 1px solid #38bdf8; color: #38bdf8; font-size: 10px; font-weight: 800; padding: 3px 12px; border-radius: 12px; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">
          Official Club Communities
        </span>
        <h3 style="margin: 4px 0 6px 0; font-size: 16px; font-weight: 800; color: #ffffff;">
          Join Our Official Channels to Stay Updated
        </h3>
        <p style="margin: 0 0 18px 0; font-size: 12px; color: #94a3b8; line-height: 1.5; max-width: 480px; margin-left: auto; margin-right: auto;">
          Never miss any updates, hackathons, workshops, or club announcements. Connect with us across WhatsApp, Instagram, and LinkedIn!
        </p>

        <!-- STACKED ACTION BUTTONS (MOBILE OPTIMIZED) -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto; width: 100%; max-width: 380px;">
          <tr>
            <td align="center" style="padding: 5px 0;">
              <a href="https://chat.whatsapp.com/IiClyLPXlooJZWlJ66CnlN?mode=wwt" target="_blank" rel="noopener noreferrer" style="display: block; width: 100%; box-sizing: border-box; background: #25D366; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 13px; padding: 11px 16px; border-radius: 10px; box-shadow: 0 4px 12px rgba(37,211,102,0.3); text-align: center;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                  <tr>
                    <td style="vertical-align: middle; padding-right: 8px;">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle; display: block;">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.888 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.004c6.554 0 11.89-5.336 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" fill="#ffffff"/>
                      </svg>
                    </td>
                    <td style="vertical-align: middle; color: #ffffff; font-weight: 700; font-size: 13px;">
                      WhatsApp Community
                    </td>
                  </tr>
                </table>
              </a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 5px 0;">
              <a href="https://www.instagram.com/tech.versectu/" target="_blank" rel="noopener noreferrer" style="display: block; width: 100%; box-sizing: border-box; background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); color: #ffffff; text-decoration: none; font-weight: 700; font-size: 13px; padding: 11px 16px; border-radius: 10px; box-shadow: 0 4px 12px rgba(220,39,67,0.3); text-align: center;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                  <tr>
                    <td style="vertical-align: middle; padding-right: 8px;">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle; display: block;">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" fill="#ffffff"/>
                      </svg>
                    </td>
                    <td style="vertical-align: middle; color: #ffffff; font-weight: 700; font-size: 13px;">
                      Instagram Page
                    </td>
                  </tr>
                </table>
              </a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 5px 0;">
              <a href="https://www.linkedin.com/company/techverse-club-ct-university/" target="_blank" rel="noopener noreferrer" style="display: block; width: 100%; box-sizing: border-box; background: #0A66C2; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 13px; padding: 11px 16px; border-radius: 10px; box-shadow: 0 4px 12px rgba(10,102,194,0.3); text-align: center;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                  <tr>
                    <td style="vertical-align: middle; padding-right: 8px;">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle; display: block;">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451c.979 0 1.778-.773 1.778-1.729V1.73C24 .774 23.205 0 22.222 0h.003z" fill="#ffffff"/>
                      </svg>
                    </td>
                    <td style="vertical-align: middle; color: #ffffff; font-weight: 700; font-size: 13px;">
                      Connect on LinkedIn
                    </td>
                  </tr>
                </table>
              </a>
            </td>
          </tr>
        </table>
      </div>

      <div style="margin-top: 24px; padding: 14px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; font-size: 11px; color: #64748b; line-height: 1.5; text-align: center;">
        <strong>University Protocol:</strong> This credential certifies active club membership &amp; leadership in the School of Engineering &amp; Technology, CT University. For inquiries or replacement, email <a href="mailto:techverse@ctuniversity.in" style="color: #2563eb; text-decoration: none;">techverse@ctuniversity.in</a>.
      </div>
    </div>

    <!-- FOOTER -->
    <div style="background: #f1f5f9; padding: 16px 24px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #64748b; line-height: 1.6;">
      <div style="margin-bottom: 6px;">
        <img src="${techverseLogoUrl}" alt="TechVerse" width="22" height="22" style="vertical-align: middle; border-radius: 50%; border: 1px solid #cbd5e1; display: inline-block;" />
      </div>
      <p style="margin: 0 0 4px 0; font-weight: 700; color: #334155;">TechVerse Club • School of Engineering &amp; Technology</p>
      <p style="margin: 0; font-size: 10px;">CT University, Ferozepur Road, Ludhiana, Punjab - 142024</p>
      <p style="margin: 6px 0 0 0; font-size: 10px; color: #94a3b8;">Email: <a href="mailto:techverse@ctuniversity.in" style="color: #2563eb; text-decoration: none;">techverse@ctuniversity.in</a> • Official Membership Credential</p>
    </div>
  </div>
</body>
</html>
  `;

  const subjectTitle = isPromotion
    ? `Official Promotion Announced - Congratulations ${member.name} on Becoming ${member.designation || 'Club Leader'} | TechVerse Club`
    : `Official TechVerse Club Membership Credential Issued - ${member.name} (${member.designation || 'Active Member'})`;

  const mailOptions = {
    from: `"TechVerse Club • CT University" <${emailUser}>`,
    to: recipientEmail,
    replyTo: emailUser,
    subject: subjectTitle,
    html: emailHtml,
    attachments,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Official Membership Card email dispatched successfully to ${recipientEmail}`);
    return true;
  } catch (err) {
    console.error('Primary card sendMail error (port 465):', err.message);
    try {
      console.log('🔄 Attempting fallback card email transporter via service: gmail...');
      const fallbackTransporter = nodemailer.createTransport({
        service: 'gmail',
        lookup: (hostname, options, callback) => {
          return dns.lookup(hostname, Object.assign({}, options, { family: 4 }), callback);
        },
        auth: { user: emailUser, pass: emailPass },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
      });
      await fallbackTransporter.sendMail(mailOptions);
      console.log(`✅ Official Membership Card dispatched via port 587 fallback to ${recipientEmail}`);
      return true;
    } catch (fallbackErr) {
      console.error('❌ Fallback card transporter failed:', fallbackErr.message);
      throw fallbackErr;
    }
  }
}

/**
 * Stage 3: Send Curated Leadership Promotion Email
 * Triggered when Admin promotes an official club member to an elevated role/designation.
 */
async function sendPromotionEmail(member, previousDesignation) {
  const memberData = member.toObject ? member.toObject() : Object.assign({}, member);
  memberData.previousDesignation = previousDesignation || 'Active Member';

  // First attempt: Vercel serverless relay over HTTPS
  try {
    const relayOk = await callVercelRelay('promotion', memberData);
    if (relayOk) return true;
  } catch (relayErr) {
    console.warn('Promotion relay attempt failed:', relayErr.message);
  }

  // Fallback: sendMembershipCardEmail with updated data
  return await sendMembershipCardEmail(memberData);
}

// Auto-migration helper to separate legacy records into 2 collections in MongoDB Atlas
let hasMigrated = false;
async function autoMigrateCollections() {
  if (hasMigrated) return;
  try {
    const unassignedInClub = await ClubMember.find({
      $or: [
        { status: 'Under Screening' },
        { designation: { $in: ['', null] } },
      ]
    });

    if (unassignedInClub.length > 0) {
      console.log(`🔄 Migrating ${unassignedInClub.length} unassigned members from 'clubmembers' to 'underscreeningmembers'...`);
      for (const item of unassignedInClub) {
        const plain = item.toObject();
        delete plain._id;
        const exists = await UnderScreeningMember.findOne({
          $or: [{ email: plain.email }, { contact: plain.contact }]
        });
        if (!exists) {
          plain.status = 'Under Screening';
          await new UnderScreeningMember(plain).save();
        }
        await ClubMember.findByIdAndDelete(item._id);
      }
      console.log(`✅ Migration complete: screening members shifted to 'underscreeningmembers' collection.`);
    }
    hasMigrated = true;
  } catch (err) {
    console.error('Migration error in ClubMemberController:', err.message);
  }
}

// GET all screening applicants from 'underscreeningmembers' collection
const getScreeningMembers = async (req, res) => {
  try {
    await autoMigrateCollections();
    const screeningMembers = await UnderScreeningMember.find().sort({ serialNumber: -1, createdAt: -1 });
    res.json(screeningMembers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET all official confirmed club members from 'clubmembers' collection
const getClubMembers = async (req, res) => {
  try {
    await autoMigrateCollections();
    const members = await ClubMember.find().sort({ serialNumber: -1, createdAt: -1 });
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST submit new member application -> saves into 'underscreeningmembers' collection
const submitClubMember = async (req, res) => {
  try {
    const data = req.body;

    if (!data.name || !data.regNumber || !data.contact || !data.email || !data.department || !data.batch) {
      return res.status(400).json({ message: 'All required fields must be filled.' });
    }

    const cleanEmail = String(data.email || '').trim().toLowerCase();
    const cleanContact = String(data.contact || '').trim().replace(/\D/g, '');

    // Whitelist test accounts to allow repeated testing
    const isTestWhitelisted =
      cleanEmail === 'rajdeepkumar200@gmail.com' ||
      cleanEmail === 'rajdeepsinghrs200@gmail.com' ||
      cleanEmail.startsWith('rajdeep') ||
      cleanEmail === 'techverse@ctuniversity.in';

    if (!isTestWhitelisted) {
      // Check duplicate email or phone number in both collections
      const existingScreening = await UnderScreeningMember.findOne({
        $or: [{ email: cleanEmail }, { contact: cleanContact }]
      });
      const existingOfficial = await ClubMember.findOne({
        $or: [{ email: cleanEmail }, { contact: cleanContact }]
      });

      if (existingScreening || existingOfficial) {
        const existing = existingScreening || existingOfficial;
        const isEmailMatch = existing.email === cleanEmail;
        return res.status(409).json({
          success: false,
          message: isEmailMatch
            ? `An application with this email (${cleanEmail}) has already been registered with TechVerse Club.`
            : `An application with this phone number (${cleanContact}) has already been registered with TechVerse Club.`
        });
      }
    }

    data.designation = '';
    data.roleAssignee = '';
    data.status = 'Under Screening';
    if (!data.residenceType) data.residenceType = 'Day Scholar';
    if (!data.photo) data.photo = '';

    // Calculate sequential serialNumber and format memberId
    let nextSerial = 1;
    const highestScreening = await UnderScreeningMember.findOne({ serialNumber: { $exists: true, $ne: null } }).sort({ serialNumber: -1 });
    const highestOfficial = await ClubMember.findOne({ serialNumber: { $exists: true, $ne: null } }).sort({ serialNumber: -1 });

    const maxSerial = Math.max(
      (highestScreening && typeof highestScreening.serialNumber === 'number') ? highestScreening.serialNumber : 0,
      (highestOfficial && typeof highestOfficial.serialNumber === 'number') ? highestOfficial.serialNumber : 0
    );

    if (maxSerial > 0) {
      nextSerial = maxSerial + 1;
    } else {
      const count = (await UnderScreeningMember.countDocuments()) + (await ClubMember.countDocuments());
      nextSerial = count + 1;
    }

    data.serialNumber = nextSerial;
    const serialStr = String(nextSerial).padStart(4, '0');
    data.memberId = `TV-${new Date().getFullYear()}-${serialStr}`;
    data.email = cleanEmail;

    // Save exclusively into MongoDB 'underscreeningmembers' collection
    const newScreeningMember = new UnderScreeningMember(data);
    await newScreeningMember.save();

    // Send Stage 1 Screening Process Email (non-blocking)
    let screeningEmailSent = false;
    let emailError = null;

    try {
      screeningEmailSent = await sendScreeningEmail(newScreeningMember);
      if (screeningEmailSent) {
        newScreeningMember.screeningEmailSent = true;
        await newScreeningMember.save();
      }
    } catch (emailErr) {
      emailError = emailErr.message;
      console.error('Screening Email Dispatch Warning (non-blocking):', emailErr.message);
    }

    res.status(201).json({
      success: true,
      screeningEmailSent,
      emailError,
      message: 'Thank you for showing interest in TechVerse Club! Your application is now under screening. The President and Club Committee Members will review and assign your club designation soon.',
      member: newScreeningMember,
    });
  } catch (err) {
    console.error('Club Member Registration Error:', err);
    res.status(500).json({ success: false, message: 'Server error registering club member' });
  }
};

// PUT / PATCH update role or designation (Stage 2: Assign Designation -> Move from underscreeningmembers to clubmembers -> Send Official Card)
const updateMemberRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { designation, roleAssignee, role, status } = req.body;

    if (!designation || !designation.trim()) {
      return res.status(400).json({ success: false, message: 'Club Designation is required before assigning official membership.' });
    }

    // 1. Look for applicant in UnderScreeningMember first
    let screeningDoc = await UnderScreeningMember.findById(id);
    let officialMember = null;

    if (screeningDoc) {
      const plain = screeningDoc.toObject();
      delete plain._id;

      plain.designation = designation.trim();
      plain.roleAssignee = (roleAssignee || '').trim();
      plain.role = role || 'Member';
      plain.status = 'Official Member';
      plain.joinedAt = new Date();

      if (!plain.serialNumber) {
        const highest = await ClubMember.findOne({ serialNumber: { $exists: true, $ne: null } }).sort({ serialNumber: -1 });
        plain.serialNumber = (highest && typeof highest.serialNumber === 'number') ? highest.serialNumber + 1 : 1;
        plain.memberId = `TV-${new Date().getFullYear()}-${String(plain.serialNumber).padStart(4, '0')}`;
      }

      // Save into 'clubmembers' collection
      officialMember = new ClubMember(plain);
      await officialMember.save();

      // Delete from 'underscreeningmembers' collection (shifts applicant out of screening folder!)
      await UnderScreeningMember.findByIdAndDelete(id);
    } else {
      // 2. If not in UnderScreeningMember, check ClubMember (editing an already official member)
      officialMember = await ClubMember.findById(id);
      if (!officialMember) {
        return res.status(404).json({ success: false, message: 'Member not found in screening or official members list.' });
      }

      if (designation !== undefined) officialMember.designation = designation.trim();
      if (roleAssignee !== undefined) officialMember.roleAssignee = (roleAssignee || '').trim();
      if (role !== undefined) officialMember.role = role;
      officialMember.status = 'Official Member';
      await officialMember.save();
    }

    // Dispatch Stage 2 Official Membership Card Email!
    let cardEmailSent = false;
    let cardEmailError = null;

    try {
      cardEmailSent = await sendMembershipCardEmail(officialMember);
      if (cardEmailSent) {
        officialMember.cardSent = true;
        officialMember.cardSentAt = new Date();
        await officialMember.save();
      }
    } catch (err) {
      cardEmailError = err.message;
      console.error('Membership Card Email Dispatch Warning (non-blocking):', err.message);
    }

    res.json({
      success: true,
      cardEmailSent,
      cardEmailError,
      message: cardEmailSent
        ? `Designation assigned to ${officialMember.name}! Official Club Membership Card dispatched to ${officialMember.email}, and shifted to Official Club Members folder in MongoDB Atlas.`
        : `Member details updated and saved in Official Club Members folder in MongoDB Atlas.`,
      member: officialMember,
    });
  } catch (err) {
    console.error('updateMemberRole error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE screening member application from 'underscreeningmembers'
const deleteScreeningMember = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await UnderScreeningMember.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Screening applicant not found' });
    }
    return res.status(200).json({ success: true, message: 'Screening application deleted successfully', id });
  } catch (err) {
    console.error('Delete screening member error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete screening member' });
  }
};

// DELETE club member from 'clubmembers' (or fallback underscreeningmembers)
const deleteClubMember = async (req, res) => {
  try {
    const { id } = req.params;
    let deleted = await ClubMember.findByIdAndDelete(id);
    if (!deleted) {
      deleted = await UnderScreeningMember.findByIdAndDelete(id);
    }
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }
    return res.status(200).json({ success: true, message: 'Member deleted successfully from MongoDB Atlas', id });
  } catch (err) {
    console.error('Delete member error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete member' });
  }
};

// POST / PATCH promote club member to a higher designation & dispatch promotion email
const promoteMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { designation, roleAssignee, role } = req.body;

    if (!designation || !designation.trim()) {
      return res.status(400).json({ success: false, message: 'New Club Designation is required for promotion.' });
    }

    let member = await ClubMember.findById(id);
    if (!member) {
      member = await UnderScreeningMember.findById(id);
      if (!member) {
        return res.status(404).json({ success: false, message: 'Official member not found.' });
      }
    }

    const previousDesignation = member.designation || 'Active Member';
    member.designation = designation.trim();
    if (roleAssignee !== undefined) member.roleAssignee = (roleAssignee || '').trim();
    if (role !== undefined) member.role = role;
    member.status = 'Official Member';
    member.promotedAt = new Date();
    await member.save();

    let promoEmailSent = false;
    let promoEmailError = null;

    try {
      promoEmailSent = await sendPromotionEmail(member, previousDesignation);
      if (promoEmailSent) {
        member.cardSent = true;
        member.cardSentAt = new Date();
        await member.save();
      }
    } catch (err) {
      promoEmailError = err.message;
      console.error('Promotion Email Dispatch Warning:', err.message);
    }

    res.json({
      success: true,
      cardEmailSent: promoEmailSent,
      promoEmailSent,
      promoEmailError,
      previousDesignation,
      newDesignation: member.designation,
      message: promoEmailSent
        ? `🎉 ${member.name} promoted to ${member.designation}! Updated Leadership ID Card sent to ${member.email}.`
        : `Member promoted to ${member.designation} in MongoDB Atlas.`,
      member,
    });
  } catch (err) {
    console.error('promoteMember error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Dispatch Resignation Acceptance Email (Curated, Warm & Soft-Toned)
 */
async function sendResignationEmail(member, remarks) {
  try {
    const payload = member.toObject ? member.toObject() : { ...member };
    payload.resignationRemarks = remarks || 'Duty completed with excellence. Relieved in good standing to pursue career growth and higher professional aspirations.';
    const relayOk = await callVercelRelay('resignation', payload);
    if (relayOk) return true;
  } catch (relayErr) {
    console.warn('Resignation relay attempt failed:', relayErr.message);
  }

  const transportConfig = getTransporter();
  if (!transportConfig) return false;
  const { transporter, emailUser } = transportConfig;

  const univLogoUrl = 'https://techversectu.vercel.app/univeee-logo.png';
  const techverseLogoUrl = 'https://techversectu.vercel.app/techverse-logo.jpg';
  const soetLogoUrl = 'https://techversectu.vercel.app/soet-logo.png';
  const desig = member.designation || 'Club Member';
  const roleAssignee = member.roleAssignee || 'Core Team';
  const exitRemarks = remarks || member.resignationRemarks || 'Duty completed with excellence. Relieved in good standing to pursue career growth and higher professional aspirations.';

  const resignationHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Honorable Relieving &amp; Best Wishes for Your Future Career Growth - TechVerse Club</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 32px 12px;">
    <tr>
      <td align="center">
        <table width="640" border="0" cellspacing="0" cellpadding="0" style="max-width: 640px; width: 100%; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 12px 32px rgba(15,23,42,0.08); border: 1px solid #e2e8f0;">
          <tr>
            <td style="background: linear-gradient(135deg, #064e3b 0%, #0f172a 55%, #1e3a8a 100%); padding: 30px 24px; text-align: center; color: #ffffff;">
              <span style="display: inline-block; background: rgba(52,211,153,0.18); border: 1px solid rgba(52,211,153,0.4); color: #a7f3d0; font-size: 11px; font-weight: 800; padding: 5px 16px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 10px;">Exemplary Service Recognition • Future Career Best Wishes</span>
              <h1 style="margin: 4px 0 8px 0; font-size: 23px; font-weight: 800; color: #ffffff; letter-spacing: -0.3px;">Thank You for Your Outstanding Service &amp; Dedication</h1>
              <p style="margin: 0; font-size: 13px; color: #cbd5e1;">School of Engineering &amp; Technology • CT University</p>
            </td>
          </tr>
          <tr>
            <td style="background: #ffffff; padding: 14px 24px; border-bottom: 1px solid #f1f5f9;">
              <table width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" width="30%" style="vertical-align: middle;">
                    <img src="${univLogoUrl}" alt="CT University" style="max-height: 46px; max-width: 85px; object-fit: contain;" />
                  </td>
                  <td align="center" width="40%" style="vertical-align: middle;">
                    <img src="${techverseLogoUrl}" alt="TechVerse Club" style="max-height: 52px; max-width: 52px; border-radius: 50%; border: 2px solid #10b981; object-fit: cover;" />
                  </td>
                  <td align="center" width="30%" style="vertical-align: middle;">
                    <img src="${soetLogoUrl}" alt="SOET" style="max-height: 46px; max-width: 85px; object-fit: contain;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 28px; color: #334155; font-size: 14px; line-height: 1.7;">
              <p style="margin: 0 0 16px 0; font-size: 15px; color: #0f172a;">
                Dear <strong>${escapeHtml(member.name)}</strong> (Reg No: <strong>${escapeHtml(member.regNumber)}</strong>),
              </p>
              <p style="margin: 0 0 16px 0;">
                On behalf of the <strong>President and Committee Members of the Club (TechVerse Club, SOET, CT University)</strong>, we are writing to warmly acknowledge and confirm that your official resignation from your active post as <strong>${escapeHtml(desig)}</strong> (${escapeHtml(roleAssignee)}) has been accepted on a truly commendable note.
              </p>
              <p style="margin: 0 0 18px 0;">
                Throughout your tenure, you performed your duties with exceptional dedication, technical excellence, and sincere commitment. As you conclude your active service with the club to focus on your graduation and embark on your <strong>future career growth, higher professional opportunities, and personal milestones</strong>, the club leadership proudly celebrates the impactful work and positive spirit you brought to our community.
              </p>
              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-left: 5px solid #22c55e; padding: 18px 20px; border-radius: 0 14px 14px 0; margin: 22px 0;">
                <h4 style="margin: 0 0 6px 0; font-size: 14px; color: #15803d; font-weight: 800;">
                  Commendation for Duty Completed with Excellence
                </h4>
                <p style="margin: 0; color: #166534; font-size: 13.5px; line-height: 1.6;">
                  Thank you sincerely for the passion, creative leadership, and craftsmanship you dedicated to TechVerse Club. You fulfilled your responsibilities with utmost sincerity, inspiring fellow peers and elevating our club events, technical workshops, and initiatives. In honor of your stellar service, your official registry record has been proudly archived as <strong>Relieved with Honors &amp; Full Clearance (Alumnus in Good Standing)</strong>.
                </p>
              </div>
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #f59e0b; padding: 14px 18px; border-radius: 0 12px 12px 0; margin: 20px 0; font-size: 13px;">
                <span style="display: block; color: #92400e; font-weight: 800; text-transform: uppercase; font-size: 11px; letter-spacing: 1px; margin-bottom: 4px;">Club Committee Note &amp; Remarks</span>
                <span style="color: #475569; font-style: italic;">"${escapeHtml(exitRemarks)}"</span>
              </div>
              <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 16px 18px; border-radius: 12px; margin: 20px 0; font-size: 13px; color: #1e40af;">
                <p style="margin: 0 0 6px 0; font-weight: 800;">Advancing Towards Future Career Milestones</p>
                <p style="margin: 0; line-height: 1.6;">
                  Moving onward to conquer new professional horizons is a proud milestone. The skills honed, projects delivered, and teamwork fostered during your journey here will serve as strong foundations for your career ahead. You will always remain an esteemed alumnus of the TechVerse family—our doors are permanently open to welcome you back as a guest mentor, speaker, or collaborator.
                </p>
              </div>
              <p style="margin: 20px 0 0 0; color: #334155; line-height: 1.6;">
                We wish you boundless success, rapid career advancement, and excellence in all your future professional endeavors. Keep innovating, building with ambition, and shining bright!
              </p>
              <table width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                <tr>
                  <td style="vertical-align: middle; font-size: 13px; color: #64748b; line-height: 1.6;">
                    Warmest regards and highest recommendations,<br/>
                    <strong style="color: #0f172a;">President and Committee Members of the Club</strong><br/>
                    TechVerse Club • School of Engineering &amp; Technology<br/>
                    CT University, Ludhiana, Punjab
                  </td>
                  <td align="right" style="vertical-align: middle; width: 72px;">
                    <img src="${techverseLogoUrl}" alt="TechVerse Club Logo" width="58" height="58" style="display: block; width: 58px; height: 58px; border-radius: 12px; border: 1.5px solid #cbd5e1; object-fit: cover; box-shadow: 0 2px 6px rgba(15,23,42,0.08);" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background: #f8fafc; padding: 16px 24px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.6;">
              <p style="margin: 0 0 4px 0;">
                <img src="${techverseLogoUrl}" alt="TechVerse" width="18" height="18" style="vertical-align: -4px; border-radius: 50%; border: 1px solid #cbd5e1; margin-right: 6px; display: inline-block;" />
                Official Administrative Communication • TechVerse Club
              </p>
              <p style="margin: 0;">Inquiries: <a href="mailto:techverse@ctuniversity.in" style="color: #2563eb; text-decoration: none;">techverse@ctuniversity.in</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    await transporter.sendMail({
      from: `"TechVerse Club • CT University" <${emailUser}>`,
      to: member.email,
      replyTo: emailUser,
      subject: `With Sincere Appreciation & Best Wishes for Your Future Career Growth • TechVerse Club, CT University`,
      html: resignationHtml,
    });
    return true;
  } catch (err) {
    console.error('Local resignation email fallback error:', err.message);
    return false;
  }
}

/**
 * Dispatch Membership Conclusion Notice Email (Curated, Dignified & Soft-Toned)
 */
async function sendTerminationEmail(member, reason, remarks, fineAmount) {
  try {
    const payload = member.toObject ? member.toObject() : { ...member };
    payload.terminationReason = reason;
    payload.terminationRemarks = remarks;
    payload.fineAmount = fineAmount || 1000;
    const relayOk = await callVercelRelay('termination', payload);
    if (relayOk) return true;
  } catch (relayErr) {
    console.warn('Termination relay attempt failed:', relayErr.message);
  }

  const transportConfig = getTransporter();
  if (!transportConfig) return false;
  const { transporter, emailUser } = transportConfig;

  const univLogoUrl = 'https://techversectu.vercel.app/univeee-logo.png';
  const techverseLogoUrl = 'https://techversectu.vercel.app/techverse-logo.jpg';
  const soetLogoUrl = 'https://techversectu.vercel.app/soet-logo.png';
  const desig = member.designation || 'Club Member';
  const roleAssignee = member.roleAssignee || 'Core Team';
  const termReason = reason || member.terminationReason || 'Non-alignment with Club Code of Conduct & commitments';
  const termRemarks = remarks || member.terminationRemarks || 'Administrative review conducted by the Club Executive Committee.';
  const fine = fineAmount || member.fineAmount || 1000;

  const terminationHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Important Notice Regarding Club Membership - TechVerse Club</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 32px 12px;">
    <tr>
      <td align="center">
        <table width="640" border="0" cellspacing="0" cellpadding="0" style="max-width: 640px; width: 100%; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 12px 32px rgba(15,23,42,0.08); border: 1px solid #e2e8f0;">
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%); padding: 30px 24px; text-align: center; color: #ffffff;">
              <span style="display: inline-block; background: rgba(199,210,254,0.18); border: 1px solid rgba(199,210,254,0.35); color: #e0e7ff; font-size: 11px; font-weight: 800; padding: 5px 16px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 10px;">Membership Status Update</span>
              <h1 style="margin: 4px 0 8px 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.3px;">Important Update Regarding Your TechVerse Membership</h1>
              <p style="margin: 0; font-size: 13px; color: #cbd5e1;">School of Engineering &amp; Technology • CT University</p>
            </td>
          </tr>
          <tr>
            <td style="background: #ffffff; padding: 14px 24px; border-bottom: 1px solid #f1f5f9;">
              <table width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" width="30%" style="vertical-align: middle;">
                    <img src="${univLogoUrl}" alt="CT University" style="max-height: 46px; max-width: 85px; object-fit: contain;" />
                  </td>
                  <td align="center" width="40%" style="vertical-align: middle;">
                    <img src="${techverseLogoUrl}" alt="TechVerse Club" style="max-height: 52px; max-width: 52px; border-radius: 50%; border: 2px solid #6366f1; object-fit: cover;" />
                  </td>
                  <td align="center" width="30%" style="vertical-align: middle;">
                    <img src="${soetLogoUrl}" alt="SOET" style="max-height: 46px; max-width: 85px; object-fit: contain;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 28px; color: #334155; font-size: 14px; line-height: 1.7;">
              <p style="margin: 0 0 16px 0; font-size: 15px; color: #0f172a;">
                Dear <strong>${escapeHtml(member.name)}</strong> (Reg No: <strong>${escapeHtml(member.regNumber)}</strong>),
              </p>
              <p style="margin: 0 0 16px 0;">
                We hope this message finds you well with your academic studies. We are writing to share an important administrative update regarding your official role as <strong>${escapeHtml(desig)}</strong> (${escapeHtml(roleAssignee)}) in <strong>TechVerse Club</strong>.
              </p>
              <p style="margin: 0 0 18px 0;">
                TechVerse was created to foster an environment where all members actively support one another, deliver on shared commitments, and adhere to community guidelines. During recent reviews by the President and Committee Members of the Club, it was noted that certain core expectations could unfortunately not be maintained.
              </p>
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-left: 5px solid #6366f1; padding: 18px 20px; border-radius: 0 14px 14px 0; margin: 22px 0;">
                <h4 style="margin: 0 0 12px 0; color: #1e1b4b; font-size: 13.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px;">
                  Review Summary &amp; Details
                </h4>
                <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 13px; color: #334155;">
                  <tr>
                    <td width="35%" style="font-weight: 700; color: #475569; vertical-align: top;">Observed Reason:</td>
                    <td style="color: #1e293b; font-weight: 600;">${escapeHtml(termReason)}</td>
                  </tr>
                  <tr>
                    <td style="font-weight: 700; color: #475569; vertical-align: top;">Committee Remarks:</td>
                    <td style="color: #475569;">${escapeHtml(termRemarks)}</td>
                  </tr>
                  <tr>
                    <td style="font-weight: 700; color: #475569; vertical-align: top;">Administrative Clearance:</td>
                    <td style="color: #b45309; font-weight: 700;">
                      ₹${fine} (per agreed onboarding guidelines to conclude exit documentation)
                    </td>
                  </tr>
                </table>
              </div>
              <p style="margin: 0 0 16px 0;">
                We genuinely understand that balancing college courses, exam preparations, and various personal responsibilities can be challenging. However, to remain fair to all peers who are actively executing upcoming initiatives, the President and Committee Members of the Club have concluded your official active appointment with TechVerse Club, effective today.
              </p>
              <div style="background: #f1f5f9; border: 1px solid #cbd5e1; padding: 16px 18px; border-radius: 12px; margin: 20px 0; font-size: 13px; color: #334155;">
                <p style="margin: 0 0 6px 0; font-weight: 800; color: #1e293b;">Membership Records &amp; Clearance Information</p>
                <p style="margin: 0; line-height: 1.6;">
                  In line with this update, your active club digital ID card and official portal access have been deactivated in the club registry. Should you wish to discuss this update, request clarification, or complete the clearance formalities (₹${fine}), you are warmly welcome to visit the SOET Department Office during academic working hours—our club committee leads will be pleased to assist you.
                </p>
              </div>
              <p style="margin: 18px 0 0 0; color: #334155; line-height: 1.7;">
                Every phase of university life offers an opportunity for self-reflection, learning, and growth. We sincerely thank you for the time you spent with us and wish you the very best in your academic studies, personal development, and future endeavors.
              </p>
              <table width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                <tr>
                  <td style="vertical-align: middle; font-size: 13px; color: #64748b; line-height: 1.6;">
                    With sincere regards and best wishes,<br/>
                    <strong style="color: #0f172a;">President and Committee Members of the Club</strong><br/>
                    TechVerse Club • School of Engineering &amp; Technology<br/>
                    CT University, Ludhiana, Punjab
                  </td>
                  <td align="right" style="vertical-align: middle; width: 72px;">
                    <img src="${techverseLogoUrl}" alt="TechVerse Club Logo" width="58" height="58" style="display: block; width: 58px; height: 58px; border-radius: 12px; border: 1.5px solid #cbd5e1; object-fit: cover; box-shadow: 0 2px 6px rgba(15,23,42,0.08);" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background: #f8fafc; padding: 16px 24px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.6;">
              <p style="margin: 0 0 4px 0;">
                <img src="${techverseLogoUrl}" alt="TechVerse" width="18" height="18" style="vertical-align: -4px; border-radius: 50%; border: 1px solid #cbd5e1; margin-right: 6px; display: inline-block;" />
                Official Administrative Communication • TechVerse Club
              </p>
              <p style="margin: 0;">Department Contact: <a href="mailto:techverse@ctuniversity.in" style="color: #6366f1; text-decoration: none;">techverse@ctuniversity.in</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    await transporter.sendMail({
      from: `"TechVerse Club • CT University" <${emailUser}>`,
      to: member.email,
      replyTo: emailUser,
      subject: `Important Update Regarding Your TechVerse Club Membership • CT University`,
      html: terminationHtml,
    });
    return true;
  } catch (err) {
    console.error('Local termination email fallback error:', err.message);
    return false;
  }
}

// PATCH / POST accept resignation
const acceptResignation = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks, sendEmail = true } = req.body || {};

    let member = await ClubMember.findById(id);
    if (!member) {
      member = await UnderScreeningMember.findById(id);
      if (!member) {
        return res.status(404).json({ success: false, message: 'Official member not found.' });
      }
    }

    member.status = 'Resigned';
    member.resignedAt = new Date();
    member.resignationRemarks = (remarks || '').trim() || 'Duty completed with excellence. Relieved in good standing to pursue career growth and higher professional aspirations.';
    await member.save();

    let emailSent = false;
    if (sendEmail) {
      try {
        emailSent = await sendResignationEmail(member, member.resignationRemarks);
      } catch (emailErr) {
        console.warn('Resignation email warning:', emailErr.message);
      }
    }

    res.json({
      success: true,
      emailSent,
      message: `Formal resignation accepted for ${member.name}. Status updated to Resigned.`,
      member,
    });
  } catch (err) {
    console.error('acceptResignation error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// PATCH / POST terminate member on disciplinary grounds
const terminateMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, remarks, fineAmount = 1000, sendEmail = true } = req.body || {};

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Disciplinary termination reason is required.' });
    }

    let member = await ClubMember.findById(id);
    if (!member) {
      member = await UnderScreeningMember.findById(id);
      if (!member) {
        return res.status(404).json({ success: false, message: 'Official member not found.' });
      }
    }

    member.status = 'Terminated';
    member.terminatedAt = new Date();
    member.terminationReason = reason.trim();
    member.terminationRemarks = (remarks || '').trim() || 'Disciplinary action confirmed by the Club Committee.';
    member.fineAmount = Number(fineAmount) || 1000;
    await member.save();

    let emailSent = false;
    if (sendEmail) {
      try {
        emailSent = await sendTerminationEmail(member, member.terminationReason, member.terminationRemarks, member.fineAmount);
      } catch (emailErr) {
        console.warn('Termination email warning:', emailErr.message);
      }
    }

    res.json({
      success: true,
      emailSent,
      message: `Member ${member.name} has been terminated on disciplinary grounds. ID credentials revoked.`,
      member,
    });
  } catch (err) {
    console.error('terminateMember error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  getClubMembers,
  getScreeningMembers,
  submitClubMember,
  updateMemberRole,
  promoteMember,
  acceptResignation,
  terminateMember,
  deleteClubMember,
  deleteScreeningMember,
};


