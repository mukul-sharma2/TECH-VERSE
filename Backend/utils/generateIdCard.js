const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { defaultFontBuffers } = require('./fontsData');

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getMimeType(buf) {
  if (!buf || buf.length < 4) return 'image/png';
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return 'image/gif';
  if (buf[0] === 0x3c) return 'image/svg+xml';
  return 'image/png';
}

function getBase64Image(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const buf = fs.readFileSync(filePath);
      const mime = getMimeType(buf);
      return `data:${mime};base64,${buf.toString('base64')}`;
    }
  } catch (e) {
    console.error('Error reading file:', filePath, e.message);
  }
  return '';
}

function ensureFontFilesSync() {
  const possibleDirs = [
    path.join(__dirname, '../assets/fonts'),
    path.join(__dirname, '../../Frontend/api/fonts'),
    path.join(process.cwd(), 'Backend/assets/fonts'),
    path.join(process.cwd(), 'Frontend/api/fonts'),
    path.join(process.cwd(), 'api/fonts'),
  ];

  const boldCandidates = possibleDirs.map(d => path.join(d, 'Roboto-Bold.ttf'));
  const regCandidates = possibleDirs.map(d => path.join(d, 'Roboto-Regular.ttf'));

  const foundBold = boldCandidates.find(p => { try { return fs.existsSync(p); } catch { return false; } });
  const foundReg = regCandidates.find(p => { try { return fs.existsSync(p); } catch { return false; } });

  const fontFiles = [];
  if (foundBold) fontFiles.push(foundBold);
  if (foundReg) fontFiles.push(foundReg);

  if (fontFiles.length < 2) {
    try {
      const tmpDir = os.tmpdir();
      const tmpReg = path.join(tmpDir, 'techverse-Roboto-Regular.ttf');
      const tmpBold = path.join(tmpDir, 'techverse-Roboto-Bold.ttf');
      if (defaultFontBuffers && defaultFontBuffers[0] && (!fs.existsSync(tmpReg) || fs.statSync(tmpReg).size === 0)) {
        fs.writeFileSync(tmpReg, defaultFontBuffers[0]);
      }
      if (defaultFontBuffers && defaultFontBuffers[1] && (!fs.existsSync(tmpBold) || fs.statSync(tmpBold).size === 0)) {
        fs.writeFileSync(tmpBold, defaultFontBuffers[1]);
      }
      if (fs.existsSync(tmpReg) && !fontFiles.includes(tmpReg)) fontFiles.push(tmpReg);
      if (fs.existsSync(tmpBold) && !fontFiles.includes(tmpBold)) fontFiles.push(tmpBold);
    } catch (e) {
      console.warn('Could not write font buffers to tmpdir:', e.message);
    }
  }

  if (process.platform === 'win32' && fontFiles.length < 2) {
    if (fs.existsSync('C:/Windows/Fonts/segoeuib.ttf')) fontFiles.push('C:/Windows/Fonts/segoeuib.ttf');
    if (fs.existsSync('C:/Windows/Fonts/segoeui.ttf')) fontFiles.push('C:/Windows/Fonts/segoeui.ttf');
  }

  return fontFiles;
}

function getFontBuffersSync() {
  const possibleDirs = [
    path.join(__dirname, '../assets/fonts'),
    path.join(__dirname, '../../Frontend/api/fonts'),
    path.join(process.cwd(), 'Backend/assets/fonts'),
    path.join(process.cwd(), 'Frontend/api/fonts'),
    path.join(process.cwd(), 'api/fonts'),
  ];
  let boldBuf = null;
  let regBuf = null;
  for (const dir of possibleDirs) {
    try {
      const boldP = path.join(dir, 'Roboto-Bold.ttf');
      const regP = path.join(dir, 'Roboto-Regular.ttf');
      if (!boldBuf && fs.existsSync(boldP)) boldBuf = fs.readFileSync(boldP);
      if (!regBuf && fs.existsSync(regP)) regBuf = fs.readFileSync(regP);
    } catch (_) {}
  }
  if (process.platform === 'win32') {
    try {
      if (!boldBuf && fs.existsSync('C:/Windows/Fonts/segoeuib.ttf')) boldBuf = fs.readFileSync('C:/Windows/Fonts/segoeuib.ttf');
      if (!regBuf && fs.existsSync('C:/Windows/Fonts/segoeui.ttf')) regBuf = fs.readFileSync('C:/Windows/Fonts/segoeui.ttf');
    } catch (_) {}
  }
  const bufs = [];
  if (boldBuf) bufs.push(boldBuf);
  if (regBuf) bufs.push(regBuf);
  return bufs;
}

function generateIdCardSvg(m, options = {}) {
  const isPromotion = Boolean(options.isPromotion);
  const univLogoBase64 = options.univLogoBase64 || getBase64Image(path.join(__dirname, '../../Frontend/public/univeee-logo.png'));
  const techverseLogoBase64 = options.techverseLogoBase64 || getBase64Image(path.join(__dirname, '../../Frontend/public/techverse-logo.jpg'));
  const soetLogoBase64 = options.soetLogoBase64 || getBase64Image(path.join(__dirname, '../../Frontend/public/soet-logo.png'));
  const photoBase64 = options.photoBase64 || (m.photo && m.photo.startsWith('data:') ? m.photo : null);

  const rawName = (m.name || 'Club Member').toUpperCase();
  const name = escapeXml(rawName);
  const regNumber = escapeXml(m.regNumber || 'N/A');
  const department = escapeXml(
    m.department === 'btech' ? 'B.Tech (SOET)' :
    (m.department === 'bca' ? 'BCA (SOET)' :
    (m.department === 'mca' ? 'MCA (SOET)' :
    (m.department === 'mtech' ? 'M.Tech (SOET)' : String(m.department || 'B.Tech').toUpperCase())))
  );
  const batch = escapeXml(m.batch || '2024-2028');
  const specialization = escapeXml(
    m.specialization || m.branch || (
      m.department === 'btech' ? 'Computer Science & Engg.' :
      (m.department === 'bca' ? 'Computer Applications' :
      (m.department === 'mca' ? 'Computer Applications & Dev' :
      (m.department === 'mtech' ? 'Advanced Engineering' : 'Engineering & Technology')))
    )
  );
  const designation = escapeXml((m.designation || (isPromotion ? 'Club Leader' : 'Active Member')).toUpperCase());
  const roleAssignee = escapeXml(m.roleAssignee || (isPromotion ? 'President and Committee Members of the Club' : 'Core Team Member'));
  const residence = escapeXml(m.residenceType || 'Day Scholar');
  const contact = escapeXml(m.contact || 'N/A');

  const borderColor = isPromotion ? '#f59e0b' : '#2563eb';
  const accentGradientStart = isPromotion ? '#1e1b4b' : '#0f172a';
  const accentGradientMid = isPromotion ? '#312e81' : '#1e3a8a';
  const accentGradientEnd = isPromotion ? '#1e3a8a' : '#0284c7';
  const badgeTitle = isPromotion ? 'EXECUTIVE LEADERSHIP CREDENTIAL' : 'OFFICIAL CLUB IDENTITY CARD';
  const fontFam = "Roboto, 'Segoe UI', Arial, sans-serif";

  // Dynamic font sizing for long values
  const desigFontSize = designation.length > 25 ? 18 : 21;
  const roleFontSize = roleAssignee.length > 35 ? 11 : 12;
  const nameFontSize = name.length > 20 ? 19 : 23;
  const specFontSize = specialization.length > 24 ? 10.5 : (specialization.length > 18 ? 11.5 : 12.5);

  let photoElement = '';
  if (photoBase64) {
    photoElement = `<image href="${photoBase64}" x="42" y="320" width="206" height="260" preserveAspectRatio="xMidYMid slice" clip-path="url(#photoClip)"/>`;
  } else {
    const initial = escapeXml(rawName.charAt(0) || 'M');
    photoElement = `
      <rect x="42" y="320" width="206" height="260" rx="18" fill="#1e293b" stroke="${borderColor}" stroke-width="2"/>
      <circle cx="145" cy="440" r="64" fill="${isPromotion ? '#312e81' : '#1e3a8a'}" opacity="0.6"/>
      <text x="145" y="470" font-family="${fontFam}" font-size="80" font-weight="900" fill="${borderColor}" text-anchor="middle">${initial}</text>
    `;
  }

  return `
<svg width="700" height="880" viewBox="0 0 700 880" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="70%" stop-color="#f8fafc" />
      <stop offset="100%" stop-color="#f1f5f9" />
    </linearGradient>
    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${accentGradientStart}" />
      <stop offset="50%" stop-color="${accentGradientMid}" />
      <stop offset="100%" stop-color="${accentGradientEnd}" />
    </linearGradient>
    <linearGradient id="goldRibbon" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f59e0b" />
      <stop offset="50%" stop-color="#fef08a" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
    <linearGradient id="desigGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${isPromotion ? '#fef3c7' : '#f0fdf4'}" />
      <stop offset="100%" stop-color="${isPromotion ? '#fde68a' : '#dcfce7'}" />
    </linearGradient>
    <clipPath id="cardClip">
      <rect x="0" y="0" width="700" height="880" rx="36" />
    </clipPath>
    <clipPath id="photoClip">
      <rect x="42" y="320" width="206" height="260" rx="18" />
    </clipPath>
    <clipPath id="techverseClip">
      <circle cx="350" cy="92" r="36" />
    </clipPath>
  </defs>

  <g clip-path="url(#cardClip)">
    <!-- Base Background -->
    <rect x="0" y="0" width="700" height="880" fill="url(#cardBg)"/>
    
    <!-- Outer Premium Border -->
    <rect x="3" y="3" width="694" height="874" rx="33" fill="none" stroke="${borderColor}" stroke-width="5"/>
    <rect x="7" y="7" width="686" height="866" rx="29" fill="none" stroke="${isPromotion ? '#fde047' : '#93c5fd'}" stroke-width="1.5" opacity="0.6"/>

    <!-- Lanyard Hole Slot Graphical Indicator -->
    <rect x="305" y="12" width="90" height="12" rx="6" fill="#0f172a"/>
    <rect x="306" y="13" width="88" height="10" rx="5" fill="#1e293b"/>

    <!-- HEADER BLOCK -->
    <rect x="0" y="32" width="700" height="145" fill="url(#headerGrad)"/>
    <line x1="0" y1="177" x2="700" y2="177" stroke="url(#goldRibbon)" stroke-width="3"/>

    <!-- University Logo -->
    <g transform="translate(42, 45)">
      ${univLogoBase64 ? `<image href="${univLogoBase64}" x="0" y="0" width="100" height="62" preserveAspectRatio="xMidYMid meet"/>` : ''}
    </g>

    <!-- Center TechVerse Emblem -->
    <circle cx="350" cy="92" r="38" fill="#ffffff" stroke="${borderColor}" stroke-width="3"/>
    ${techverseLogoBase64 ? `<image href="${techverseLogoBase64}" x="314" y="56" width="72" height="72" preserveAspectRatio="xMidYMid slice" clip-path="url(#techverseClip)"/>` : ''}

    <!-- SOET Logo -->
    <g transform="translate(558, 45)">
      ${soetLogoBase64 ? `<image href="${soetLogoBase64}" x="0" y="0" width="100" height="62" preserveAspectRatio="xMidYMid meet"/>` : ''}
    </g>

    <!-- Header Titles -->
    <text x="350" y="148" font-family="${fontFam}" font-size="18" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="3.5">CT UNIVERSITY</text>
    <text x="350" y="166" font-family="${fontFam}" font-size="10.5" font-weight="700" fill="#cbd5e1" text-anchor="middle" letter-spacing="1.5">SCHOOL OF ENGINEERING &amp; TECHNOLOGY • TECHVERSE CLUB</text>

    <!-- TOP CREDENTIAL BADGE PILL -->
    <rect x="42" y="190" width="616" height="26" rx="8" fill="${isPromotion ? '#fef3c7' : '#eff6ff'}" stroke="${borderColor}" stroke-width="1.2"/>
    <text x="350" y="208" font-family="${fontFam}" font-size="11" font-weight="900" fill="${isPromotion ? '#92400e' : '#1e40af'}" text-anchor="middle" letter-spacing="2">${badgeTitle}</text>

    <!-- PRIMARY HERO SECTION: DESIGNATION (BIGGER TEXT FIRST) & ROLE -->
    <g transform="translate(42, 226)">
      <rect x="0" y="0" width="616" height="76" rx="14" fill="url(#desigGrad)" stroke="${borderColor}" stroke-width="2"/>
      <text x="308" y="22" font-family="${fontFam}" font-size="10" font-weight="800" fill="${isPromotion ? '#b45309' : '#0369a1'}" text-anchor="middle" letter-spacing="2">OFFICIAL CLUB DESIGNATION</text>
      <text x="308" y="47" font-family="${fontFam}" font-size="${desigFontSize}" font-weight="900" fill="${isPromotion ? '#78350f' : '#15803d'}" text-anchor="middle" letter-spacing="1">${designation}</text>
      <text x="308" y="65" font-family="${fontFam}" font-size="${roleFontSize}" font-weight="700" fill="#334155" text-anchor="middle">Role: ${roleAssignee}</text>
    </g>

    <!-- PHOTO BOX -->
    <rect x="40" y="318" width="210" height="264" rx="20" fill="none" stroke="${borderColor}" stroke-width="3"/>
    ${photoElement}

    <!-- RIGHT SIDE MEMBER DETAILS -->
    <g transform="translate(272, 320)">
      <!-- FULL NAME -->
      <text x="0" y="14" font-family="${fontFam}" font-size="9.5" font-weight="800" fill="#64748b" letter-spacing="1.5">FULL NAME</text>
      <text x="0" y="38" font-family="${fontFam}" font-size="${nameFontSize}" font-weight="900" fill="#0f172a">${name}</text>
      <line x1="0" y1="48" x2="386" y2="48" stroke="#e2e8f0" stroke-width="1.5"/>

      <!-- ROW 1: REGISTRATION NO. & CONTACT NUMBER (Registration No. in standard contact-like styling) -->
      <g transform="translate(0, 58)">
        <text x="0" y="12" font-family="${fontFam}" font-size="9" font-weight="800" fill="#64748b" letter-spacing="1">REGISTRATION NO.</text>
        <text x="0" y="30" font-family="${fontFam}" font-size="13" font-weight="700" fill="#1e293b">${regNumber}</text>

        <text x="190" y="12" font-family="${fontFam}" font-size="9" font-weight="800" fill="#64748b" letter-spacing="1">CONTACT NUMBER</text>
        <text x="190" y="30" font-family="${fontFam}" font-size="13" font-weight="700" fill="#1e293b">${contact}</text>
      </g>

      <!-- ROW 2: DEPARTMENT & BATCH & BRANCH / SPECIALIZATION -->
      <g transform="translate(0, 102)">
        <text x="0" y="12" font-family="${fontFam}" font-size="9" font-weight="800" fill="#64748b" letter-spacing="1">DEPARTMENT &amp; BATCH</text>
        <text x="0" y="30" font-family="${fontFam}" font-size="12.5" font-weight="700" fill="#1e293b">${department} • ${batch}</text>

        <text x="190" y="12" font-family="${fontFam}" font-size="9" font-weight="800" fill="#64748b" letter-spacing="1">BRANCH / SPECIALIZATION</text>
        <text x="190" y="30" font-family="${fontFam}" font-size="${specFontSize}" font-weight="700" fill="#1e293b">${specialization}</text>
      </g>

      <!-- ROW 3: RESIDENCE TYPE & CAMPUS AFFILIATION -->
      <g transform="translate(0, 146)">
        <text x="0" y="12" font-family="${fontFam}" font-size="9" font-weight="800" fill="#64748b" letter-spacing="1">RESIDENCE TYPE</text>
        <text x="0" y="30" font-family="${fontFam}" font-size="13" font-weight="700" fill="#1e293b">${residence}</text>

        <text x="190" y="12" font-family="${fontFam}" font-size="9" font-weight="800" fill="#64748b" letter-spacing="1">CAMPUS AFFILIATION</text>
        <text x="190" y="30" font-family="${fontFam}" font-size="12.5" font-weight="700" fill="#1e293b">CT University • SOET</text>
      </g>

      <!-- OFFICIAL VERIFIED BADGE -->
      <g transform="translate(0, 196)">
        <rect x="0" y="0" width="386" height="34" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.2"/>
        <circle cx="18" cy="17" r="9" fill="${isPromotion ? '#fef3c7' : '#eff6ff'}" stroke="${borderColor}" stroke-width="1.5"/>
        <text x="18" y="21" font-family="${fontFam}" font-size="11" font-weight="900" fill="${borderColor}" text-anchor="middle">✓</text>
        <text x="36" y="21" font-family="${fontFam}" font-size="9.5" font-weight="800" fill="#0f172a" letter-spacing="0.5">AUTHENTICATED CREDENTIAL • SOET TECHVERSE</text>
      </g>
    </g>

    <!-- SIGNATORY & VALIDATION ROW -->
    <g transform="translate(42, 596)">
      <line x1="0" y1="0" x2="616" y2="0" stroke="#e2e8f0" stroke-width="1.5" stroke-dasharray="6,4"/>
      
      <g transform="translate(4, 12)">
        <text x="0" y="14" font-family="${fontFam}" font-size="9.5" font-weight="800" fill="#64748b" letter-spacing="1">MEMBERSHIP VALIDATION</text>
        <text x="0" y="32" font-family="${fontFam}" font-size="12" font-weight="800" fill="#059669">Officially Enrolled • Active Status</text>
        <text x="0" y="48" font-family="${fontFam}" font-size="10.5" font-weight="800" fill="#1e3a8a">Issued by President &amp; Committee Members of TechVerse</text>
        <text x="0" y="63" font-family="${fontFam}" font-size="9" font-weight="600" fill="#64748b">Authorized for University Symposia, Hackathons &amp; Activities</text>
      </g>

      <g transform="translate(436, 12)">
        <text x="85" y="24" font-family="${fontFam}" font-style="italic" font-weight="900" font-size="21" fill="#1e3a8a" text-anchor="middle">TechVerse CTU</text>
        <line x1="0" y1="34" x2="170" y2="34" stroke="#0f172a" stroke-width="1.5"/>
        <text x="85" y="47" font-family="${fontFam}" font-size="9" font-weight="800" fill="#475569" text-anchor="middle" letter-spacing="0.8">AUTHORIZED SIGNATORY</text>
        <text x="85" y="60" font-family="${fontFam}" font-size="8.5" font-weight="700" fill="#94a3b8" text-anchor="middle">CT UNIVERSITY • SOET</text>
      </g>
    </g>

    <!-- ELEGANT BOTTOM FOOTER -->
    <rect x="0" y="686" width="700" height="194" fill="#0f172a"/>
    <line x1="0" y1="686" x2="700" y2="686" stroke="${borderColor}" stroke-width="3"/>

    <text x="350" y="726" font-family="${fontFam}" font-size="12" font-weight="800" fill="#f8fafc" text-anchor="middle" letter-spacing="1.5">TECHVERSE CLUB • SCHOOL OF ENGINEERING &amp; TECHNOLOGY</text>
    <text x="350" y="748" font-family="${fontFam}" font-size="11" fill="#94a3b8" text-anchor="middle">CT University, Ferozepur Road, Ludhiana, Punjab - 142024</text>
    <text x="350" y="770" font-family="${fontFam}" font-size="10.5" font-weight="700" fill="#38bdf8" text-anchor="middle">Inquiries: techverse@ctuniversity.in • https://techverse.ctuniversity.in</text>
    <text x="350" y="800" font-family="${fontFam}" font-size="9.5" font-weight="800" fill="${borderColor}" text-anchor="middle" letter-spacing="1.5">OFFICIAL UNIVERSITY STUDENT ORGANIZATION CREDENTIAL • VALID ON-CAMPUS</text>
  </g>
</svg>
  `;
}

function generateIdCardPng(m, options = {}) {
  try {
    const svg = generateIdCardSvg(m, options);
    const fontFiles = ensureFontFilesSync();
    const resvgOpts = {
      fitTo: { mode: 'width', value: 1400 },
      shapeRendering: 2,
      textRendering: 2,
      imageRendering: 0,
      font: {
        loadSystemFonts: true,
        fontFiles: fontFiles.length > 0 ? fontFiles : undefined,
        defaultFontFamily: 'Roboto',
        sansSerifFamily: 'Roboto',
      },
    };
    const resvg = new Resvg(svg, resvgOpts);
    const pngData = resvg.render();
    return pngData.asPng();
  } catch (err) {
    console.error('generateIdCardPng error:', err);
    return null;
  }
}

module.exports = {
  generateIdCardSvg,
  generateIdCardPng,
};
