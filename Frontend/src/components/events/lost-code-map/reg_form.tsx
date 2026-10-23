import React, { useState, ChangeEvent, FormEvent, CSSProperties } from 'react';
import { Link, useHref } from 'react-router-dom';
import { 
  Compass, 
  Users, 
  Shield, 
  Anchor, 
  Crown, 
  Scroll, 
  Sparkles, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Dices
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { registerLostCodeTeam } from '@/services/api';
import lostCodeMapBg from './img/lost-code-map.jpeg';

// --- TypeScript Interfaces ---
export interface TeamMember {
  regNo: string;
  name: string;
  course: string;
  year: string;
  phone: string;
  email: string;
}

export interface FormData {
  teamName?: string;
  teamSize: '3' | '4';
  members: TeamMember[];
}

const emptyMember = (): TeamMember => ({
  regNo: '',
  name: '',
  course: '',
  year: '',
  phone: '',
  email: '',
});

const MEMBER_ROLES = [
  { role: 'Captain / Team Lead', icon: Crown, badge: 'LEADER' },
  { role: 'First Mate / Navigator', icon: Compass, badge: 'NAVIGATOR' },
  { role: 'Code Chronicler', icon: Scroll, badge: 'CHRONICLER' },
  { role: 'Cipher Master', icon: Shield, badge: 'CIPHER' },
];

export const LostCodeRegistration: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    teamSize: '3',
    members: [emptyMember(), emptyMember(), emptyMember()],
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // --- Handlers ---
  const handleTeamSizeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newSize = e.target.value as '3' | '4';
    const targetCount = parseInt(newSize, 10);

    setFormData((prev) => {
      let updatedMembers = [...prev.members];
      if (updatedMembers.length < targetCount) {
        while (updatedMembers.length < targetCount) {
          updatedMembers.push(emptyMember());
        }
      } else if (updatedMembers.length > targetCount) {
        updatedMembers = updatedMembers.slice(0, targetCount);
      }
      return {
        ...prev,
        teamSize: newSize,
        members: updatedMembers,
      };
    });
  };

  const handleMemberChange = (
    index: number,
    field: keyof TeamMember,
    value: string
  ) => {
    setFormData((prev) => {
      const updatedMembers = [...prev.members];
      updatedMembers[index] = {
        ...updatedMembers[index],
        [field]: value,
      };
      return { ...prev, members: updatedMembers };
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      
      const leadName = formData.members[0]?.name?.trim() || 'Explorer';
      const cleanLead = leadName.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '') || 'Crew';
      const randomId = Math.floor(1000 + Math.random() * 9000);
      const allocatedPlaceholder = `LostCode-${cleanLead}-${randomId}`;

      const payload = {
        teamName: allocatedPlaceholder,
        teamSize: parseInt(formData.teamSize, 10),
        members: formData.members.map((m, idx) => ({
          name: m.name.trim(),
          regNo: m.regNo.trim(),
          course: m.course.trim(),
          year: m.year.trim(),
          phone: m.phone.trim(),
          email: m.email.trim(),
          role: idx === 0 ? 'Captain' : idx === 1 ? 'Navigator' : idx === 2 ? 'Chronicler' : 'Cipher Master',
        })),
      };

      await registerLostCodeTeam(payload);

      
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#D4AF37', '#FFD700', '#8B1E13', '#EED2A4', '#5C3217'],
        });
      } catch (err) {
        // Ignore confetti failure if canvas isn't supported
      }

      setSubmitted(true);
    } catch (error: unknown) {
      console.error('Registration failed:', error);
      const err = error as {
        response?: {
          data?: {
            message?: string;
            errors?: Array<{ message: string }>;
          };
        };
        message?: string;
      };

      const backendErrors = err?.response?.data?.errors;
      const detailedMessage =
        Array.isArray(backendErrors) && backendErrors.length > 0
          ? backendErrors.map((e) => e.message).join(', ')
          : err?.response?.data?.message ||
            err?.message ||
            'The expedition log could not record your crew. Please check all details and try again.';

      setErrorMessage(detailedMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      teamSize: '3',
      members: [emptyMember(), emptyMember(), emptyMember()],
    });
    setSubmitted(false);
    setErrorMessage(null);
  };

  // --- Aesthetic Pirate Parchment Styles ---
  const styles: Record<string, CSSProperties> = {
    viewport: {
      position: 'relative',
      minHeight: '100vh',
      width: '100%',
      backgroundColor: '#0c0704',
      color: '#2a1408',
      fontFamily: "'Cinzel', 'Georgia', 'Times New Roman', serif",
      overflowX: 'hidden',
    },
    backgroundBackdrop: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: `url(${lostCodeMapBg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center top',
      backgroundRepeat: 'no-repeat',
      zIndex: 0,
    },
    overlayVignette: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background:
        'radial-gradient(circle at 50% 20%, rgba(12, 6, 3, 0.25) 0%, rgba(10, 5, 2, 0.65) 65%, rgba(6, 3, 1, 0.92) 100%)',
      pointerEvents: 'none',
      zIndex: 1,
    },
    contentWrapper: {
      position: 'relative',
      zIndex: 2,
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '24px 20px 80px 20px',
      boxSizing: 'border-box',
    },
    topBar: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
    },
    backButton: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 16px',
      backgroundColor: 'rgba(36, 18, 8, 0.85)',
      border: '1px solid #D4AF37',
      borderRadius: '20px',
      color: '#EED2A4',
      fontSize: '0.85rem',
      fontWeight: 700,
      textDecoration: 'none',
      letterSpacing: '1px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
      backdropFilter: 'blur(4px)',
      transition: 'all 0.2s ease',
    },
    topEmblemSpace: {
      minHeight: '140px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      alignItems: 'center',
      marginBottom: '15px',
      textAlign: 'center',
    },
    subtitleBanner: {
      display: 'inline-block',
      backgroundColor: 'rgba(42, 20, 8, 0.82)',
      border: '1px solid rgba(212, 175, 55, 0.7)',
      borderRadius: '30px',
      padding: '6px 20px',
      color: '#D4AF37',
      fontSize: '0.8rem',
      fontWeight: 800,
      letterSpacing: '2px',
      textTransform: 'uppercase',
      boxShadow: '0 4px 15px rgba(0,0,0,0.6)',
      backdropFilter: 'blur(6px)',
      marginBottom: '12px',
    },
    headerTitle: {
      fontFamily: "'Pirata One', 'Cinzel Decorative', cursive, serif",
      fontSize: 'clamp(2.2rem, 5vw, 3.4rem)',
      fontWeight: 400,
      textAlign: 'center',
      color: '#FFF2D6',
      textTransform: 'uppercase',
      letterSpacing: '3px',
      margin: '0 0 8px 0',
      textShadow:
        '0 2px 4px #000, 0 4px 12px rgba(0,0,0,0.9), 0 0 20px rgba(212, 175, 55, 0.4)',
    },
    headerSubtitle: {
      textAlign: 'center',
      fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
      fontWeight: 600,
      color: '#EED2A4',
      maxWidth: '680px',
      margin: '0 auto 28px auto',
      lineHeight: '1.6',
      textShadow: '0 2px 6px rgba(0,0,0,0.85)',
    },
    dividerRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      color: '#D4AF37',
      fontSize: '1.1rem',
      margin: '0 auto 30px auto',
      opacity: 0.9,
    },
    dividerLine: {
      width: '60px',
      height: '1px',
      background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)',
    },
    card: {
      backgroundColor: 'rgba(247, 233, 207, 0.94)',
      border: '2px solid #5C3217',
      borderRadius: '12px',
      padding: '22px 20px',
      boxShadow:
        '0 12px 30px rgba(0,0,0,0.6), inset 0 0 40px rgba(110, 55, 18, 0.16)',
      marginBottom: '26px',
      position: 'relative',
      backdropFilter: 'blur(3px)',
      boxSizing: 'border-box',
    },
    sectionTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontSize: '1.25rem',
      fontWeight: 800,
      color: '#3B1206',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      marginTop: 0,
      marginBottom: '10px',
    },
    fieldGroup: {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      minWidth: 0,
      boxSizing: 'border-box',
    },
    label: {
      fontSize: '0.78rem',
      fontWeight: 800,
      color: '#4A2610',
      textTransform: 'uppercase',
      marginBottom: '6px',
      letterSpacing: '0.8px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      whiteSpace: 'nowrap',
    },
    input: {
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box',
      padding: '10px 12px',
      backgroundColor: 'rgba(255, 248, 235, 0.95)',
      border: '1.5px solid #8C5228',
      borderRadius: '6px',
      color: '#2A1408',
      fontWeight: 700,
      fontSize: '0.92rem',
      outline: 'none',
      boxShadow: 'inset 0 1px 3px rgba(74, 38, 16, 0.1)',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      fontFamily: "'Georgia', 'Times New Roman', serif",
    },
    select: {
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box',
      padding: '10px 10px',
      backgroundColor: 'rgba(255, 248, 235, 0.95)',
      border: '1.5px solid #8C5228',
      borderRadius: '6px',
      color: '#2A1408',
      fontWeight: 800,
      fontSize: '0.88rem',
      outline: 'none',
      cursor: 'pointer',
      boxShadow: 'inset 0 1px 3px rgba(74, 38, 16, 0.1)',
      fontFamily: "'Cinzel', serif",
    },
    gridMembers: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '20px',
      marginBottom: '30px',
      boxSizing: 'border-box',
    },
    memberCard: {
      backgroundColor: 'rgba(247, 233, 207, 0.93)',
      border: '2px solid #5C3217',
      borderRadius: '10px',
      padding: '18px 16px',
      boxShadow:
        '0 8px 24px rgba(0,0,0,0.5), inset 0 0 35px rgba(110, 55, 18, 0.14)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      position: 'relative',
      boxSizing: 'border-box',
      overflow: 'hidden',
      width: '100%',
    },
    memberHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1.5px solid rgba(140, 82, 40, 0.3)',
      paddingBottom: '10px',
      marginBottom: '4px',
    },
    memberTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontWeight: 900,
      fontSize: '0.92rem',
      color: '#3B1206',
      letterSpacing: '0.5px',
      textTransform: 'uppercase',
    },
    leaderBadge: {
      backgroundColor: '#8B1E13',
      color: '#FFE8BD',
      border: '1px solid #D4AF37',
      fontSize: '0.65rem',
      padding: '3px 8px',
      borderRadius: '4px',
      textTransform: 'uppercase',
      fontWeight: 900,
      letterSpacing: '1px',
      boxShadow: '0 2px 6px rgba(139, 30, 19, 0.4)',
    },
    crewBadge: {
      backgroundColor: '#4A2610',
      color: '#EED2A4',
      fontSize: '0.65rem',
      padding: '3px 8px',
      borderRadius: '4px',
      textTransform: 'uppercase',
      fontWeight: 800,
      letterSpacing: '1px',
    },
    submitContainer: {
      textAlign: 'center',
      marginTop: '10px',
    },
    submitBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      padding: '16px 48px',
      fontSize: '1.25rem',
      fontWeight: 900,
      color: '#FFDE8A',
      textTransform: 'uppercase',
      letterSpacing: '2.5px',
      fontFamily: "'Pirata One', 'Cinzel', cursive, serif",
      background: 'linear-gradient(180deg, #5C2B0C 0%, #351505 50%, #200A02 100%)',
      border: '2.5px solid #D4AF37',
      borderRadius: '40px',
      boxShadow:
        '0 10px 25px rgba(0,0,0,0.7), 0 0 20px rgba(212, 175, 55, 0.35)',
      cursor: 'pointer',
      transition: 'all 0.25s ease',
    },
    errorBox: {
      backgroundColor: 'rgba(139, 30, 19, 0.92)',
      border: '2px solid #FFD700',
      color: '#FFF2D6',
      padding: '14px 20px',
      borderRadius: '8px',
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontSize: '0.95rem',
      fontWeight: 700,
      boxShadow: '0 6px 18px rgba(0,0,0,0.6)',
    },
    successCard: {
      backgroundColor: 'rgba(247, 233, 207, 0.96)',
      border: '3px solid #D4AF37',
      borderRadius: '16px',
      maxWidth: '680px',
      margin: '20px auto',
      padding: '40px 30px',
      textAlign: 'center',
      boxShadow:
        '0 20px 50px rgba(0,0,0,0.8), inset 0 0 60px rgba(110, 55, 18, 0.2)',
      position: 'relative',
    },
  };

  return (
    <div style={styles.viewport}>
      {/* 1. Linked Background Image (Vintage Lost Code Map) */}
      <div style={styles.backgroundBackdrop} aria-hidden="true" />

      {/* 2. Atmospheric Ambient Lighting & Vignette Overlay */}
      <div style={styles.overlayVignette} aria-hidden="true" />

      {/* 3. Main Content Scroll Layer */}
      <div style={styles.contentWrapper}>
        {/* Navigation Bar */}
        <div style={styles.topBar}>
          <Link to="/events" style={styles.backButton}>
            <ArrowLeft size={16} />
            <span>RETURN TO EVENTS</span>
          </Link>
          <div
            style={{
              color: '#D4AF37',
              fontSize: '0.8rem',
              fontWeight: 800,
              letterSpacing: '1px',
              textShadow: '0 2px 4px #000',
            }}
          >
            CT UNIVERSITY • TECHVERSE
          </div>
        </div>

        {/* Space revealing the top "LOST CODE" logo from the map */}
        <div style={styles.topEmblemSpace}>
          <div style={styles.subtitleBanner}>
            ⚓ OFFICIAL EXPEDITION ROSTER ⚓
          </div>
          <h1 style={styles.headerTitle}>CHALLENGE REGISTRATION</h1>
          <p style={styles.headerSubtitle}>
            Assemble your fearless crew of code navigators. Decipher the ancient
            algorithms, follow the dotted trails, and claim the TechVerse treasure.
          </p>
          <div style={styles.dividerRow}>
            <div style={styles.dividerLine} />
            <Compass size={18} />
            <span>✦</span>
            <span>☠️</span>
            <span>✦</span>
            <Anchor size={18} />
            <div style={styles.dividerLine} />
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div style={styles.errorBox}>
            <AlertCircle size={24} style={{ flexShrink: 0, color: '#FFD700' }} />
            <div>
              <div style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Expedition Log Entry Rejected
              </div>
              <div style={{ fontSize: '0.88rem', opacity: 0.95 }}>{errorMessage}</div>
            </div>
          </div>
        )}

        {submitted ? (
          /* Success Parchment Proclamation Screen */
          <div style={styles.successCard}>
            <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>🏴‍☠️</div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: '#8B1E13',
                fontWeight: 900,
                fontSize: '0.9rem',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                marginBottom: '8px',
              }}
            >
              <CheckCircle2 size={20} />
              CHARTER OFFICIALLY RECORDED
            </div>
            <h2
              style={{
                fontFamily: "'Pirata One', 'Cinzel Decorative', cursive, serif",
                fontSize: '2.5rem',
                color: '#3B1206',
                margin: '0 0 16px 0',
                letterSpacing: '2px',
              }}
            >
              WELCOME ABOARD, CREW!
            </h2>
            <p
              style={{
                color: '#5A2E13',
                fontSize: '1.15rem',
                fontWeight: 600,
                lineHeight: '1.6',
                marginBottom: '20px',
              }}
            >
              Your crew manifest has been logged into the treasure logs! Your official
              team name and mission battle station will be <strong>randomly allocated at the venue check-in desk</strong> upon arrival.
            </p>

            {/* Crew summary breakdown */}
            <div
              style={{
                backgroundColor: 'rgba(234, 212, 179, 0.7)',
                border: '1.5px solid #8C5228',
                borderRadius: '8px',
                padding: '16px',
                textAlign: 'left',
                marginBottom: '28px',
              }}
            >
              <div
                style={{
                  fontWeight: 900,
                  fontSize: '0.85rem',
                  color: '#3B1206',
                  textTransform: 'uppercase',
                  marginBottom: '10px',
                  letterSpacing: '1px',
                }}
              >
                Registered Crew Manifest:
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#4A2610', fontWeight: 700 }}>
                {formData.members.map((m, idx) => (
                  <li key={idx} style={{ marginBottom: '6px' }}>
                    <strong>{m.name || `Explorer ${idx + 1}`}</strong> — {m.course} ({m.year}) • {m.regNo}
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                style={styles.submitBtn}
                onClick={resetForm}
              >
                <Sparkles size={20} />
                REGISTER ANOTHER CREW
              </button>
              

               <button
  type="button"
  style={styles.submitBtn}
  onClick={() =>
    window.open(
      'https://chat.whatsapp.com/BUGqwklPNKD5CK3skqPGnn',
      '_blank',
      'noopener,noreferrer'
    )
  }
>

  <img src="\img\whatsapp.png" alt="WhatsApp" style={{ width: '20px', height: '20px' }} />
  JOIN OUR WHATSAPP GROUP
</button>
              <Link
                to="/events"
                style={{
                  ...styles.submitBtn,
                  background: 'linear-gradient(180deg, #3B1206 0%, #1A0903 100%)',
                  textDecoration: 'none',
                }}
              >
                RETURN TO EVENTS
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* 1. Expedition Setup (Crew Size & Random Venue Allocation Notice) */}
            <div style={styles.card}>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                <div style={{ flex: '1 1 300px' }}>
                  <h2 style={styles.sectionTitle}>
                    <Dices size={22} style={{ color: '#8B1E13' }} />
                    <span>1. Expedition Setup & Venue Allocation</span>
                  </h2>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.9rem',
                      color: '#5A2E13',
                      fontWeight: 700,
                      lineHeight: '1.5',
                    }}
                  >
                    🎲 <strong>Random Team Allocation:</strong> Team names and mystery callsigns
                    are automatically assigned at the venue 
                  </p>
                </div>

                <div style={{ minWidth: '200px', flex: '0 1 240px' }}>
                  <label style={styles.label}>
                    <Users size={14} />
                    <span>Crew Size *</span>
                  </label>
                  <select
                    value={formData.teamSize}
                    onChange={handleTeamSizeChange}
                    style={styles.select}
                  >
                    <option value="3">3 Code Explorers</option>
                    <option value="4">4 Code Explorers</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Crew Member Profiles */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                margin: '20px 4px 14px 4px',
              }}
            >
              <h2
                style={{
                  fontFamily: "'Pirata One', 'Cinzel', serif",
                  fontSize: '1.7rem',
                  letterSpacing: '1.5px',
                  color: '#FFF2D6',
                  textTransform: 'uppercase',
                  margin: 0,
                  textShadow: '0 2px 6px rgba(0,0,0,0.85)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <span>🏴‍☠️ 2. Crew Member Profiles</span>
              </h2>
              <span
                style={{
                  color: '#D4AF37',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  letterSpacing: '1px',
                }}
              >
                {formData.members.length} EXPLORERS REQUIRED
              </span>
            </div>

            <div style={styles.gridMembers}>
              {formData.members.map((member, index) => {
                const roleConfig = MEMBER_ROLES[index] || MEMBER_ROLES[1];
                const RoleIcon = roleConfig.icon;
                const isLeader = index === 0;

                return (
                  <div key={index} style={styles.memberCard}>
                    {/* Header */}
                    <div style={styles.memberHeader}>
                      <span style={styles.memberTitle}>
                        <RoleIcon size={16} style={{ color: isLeader ? '#8B1E13' : '#5C3217' }} />
                        <span>{roleConfig.role}</span>
                      </span>
                      <span style={isLeader ? styles.leaderBadge : styles.crewBadge}>
                        {roleConfig.badge}
                      </span>
                    </div>

                    {/* Member Inputs */}
                    <div style={styles.fieldGroup}>
                      <label style={styles.label}>Registration No. *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 20241092"
                        value={member.regNo}
                        onChange={(e) =>
                          handleMemberChange(index, 'regNo', e.target.value)
                        }
                        style={styles.input}
                      />
                    </div>

                    <div style={styles.fieldGroup}>
                      <label style={styles.label}>Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="Full Explorer Name"
                        value={member.name}
                        onChange={(e) =>
                          handleMemberChange(index, 'name', e.target.value)
                        }
                        style={styles.input}
                      />
                    </div>

                    {/* Course & Year arranged in 50/50 CSS Grid to ensure Year never overflows */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '10px',
                        width: '100%',
                        boxSizing: 'border-box',
                      }}
                    >
                      <div style={styles.fieldGroup}>
                        <label style={styles.label}>Course *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. B.Tech"
                          value={member.course}
                          onChange={(e) =>
                            handleMemberChange(index, 'course', e.target.value)
                          }
                          style={styles.input}
                        />
                      </div>
                      <div style={styles.fieldGroup}>
                        <label style={styles.label}>Year *</label>
                        <select
                          required
                          value={member.year}
                          onChange={(e) =>
                            handleMemberChange(index, 'year', e.target.value)
                          }
                          style={styles.select}
                        >
                          <option value="">Select</option>
                          <option value="2nd Year">1st Year</option>
                          <option value="2nd Year">2nd Year</option>
                          <option value="3rd Year">3rd Year</option>
                          <option value="4th Year">4th Year</option>
                        </select>
                      </div>
                    </div>

                    <div style={styles.fieldGroup}>
                      <label style={styles.label}>Phone / WhatsApp *</label>
                      <input
                        type="tel"
                        required
                        placeholder="10-digit Phone"
                        value={member.phone}
                        onChange={(e) =>
                          handleMemberChange(index, 'phone', e.target.value)
                        }
                        style={styles.input}
                      />
                    </div>

                    <div style={styles.fieldGroup}>
                      <label style={styles.label}>University Email *</label>
                      <input
                        type="email"
                        required
                        placeholder="explorer@ctuniversity.in"
                        value={member.email}
                        onChange={(e) =>
                          handleMemberChange(index, 'email', e.target.value)
                        }
                        style={styles.input}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Submit Expedition Roster */}
            <div style={styles.submitContainer}>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  ...styles.submitBtn,
                  opacity: isSubmitting ? 0.75 : 1,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={24} className="animate-spin" />
                    <span>CHARTERING YOUR CREW...</span>
                  </>
                ) : (
                  <>
                    <span>SUBMIT YOUR CREW ROSTER</span>
                    <span style={{ fontSize: '1.4rem' }}>☠️</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default LostCodeRegistration;