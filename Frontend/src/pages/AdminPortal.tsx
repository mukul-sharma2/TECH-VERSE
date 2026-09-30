import React, { useState, useEffect, useMemo } from "react";
import { 
  Users, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  Trophy, 
  ShieldCheck, 
  Save, 
  RefreshCw, 
  Eye, 
  Phone, 
  Mail, 
  GraduationCap, 
  Building2, 
  Home as HomeIcon, 
  Sparkles, 
  Layers, 
  Calendar,
  ExternalLink,
  ChevronRight,
  UserCheck,
  AlertCircle,
  Lock,
  LogOut,
  KeyRound,
  ShieldAlert,
  Trash2,
  Edit3,
  Crown,
  Award,
  UserMinus,
  UserX,
  AlertTriangle,
  Ban,
  FileText,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  getClubMembers, 
  getScreeningMembers,
  updateClubMemberRole, 
  promoteClubMember,
  acceptMemberResignation,
  terminateClubMember,
  getEnquiries, 
  getContacts, 
  getEngineersDayStats,
  adminLogin,
  verifyAdminToken,
  deleteClubMember,
  deleteScreeningMember,
  sendEmailDirect,
  deleteEnquiry,
  deleteContact
} from "@/services/api";

export interface ClubMemberItem {
  _id: string;
  serialNumber?: number;
  memberId?: string;
  name: string;
  regNumber: string;
  contact: string;
  email: string;
  department: string;
  specialization?: string;
  batch: string;
  residenceType?: string;
  photo?: string;
  interests?: string[];
  otherInterest?: string;
  designation?: string;
  roleAssignee?: string;
  role?: string;
  status?: string;
  cardSent?: boolean;
  screeningEmailSent?: boolean;
  cardSentAt?: string;
  resignedAt?: string;
  resignationRemarks?: string;
  terminatedAt?: string;
  terminationReason?: string;
  terminationRemarks?: string;
  fineAmount?: number;
  createdAt?: string;
}

export interface EnquiryItem {
  _id: string;
  name: string;
  email: string;
  contact?: string;
  department?: string;
  batch?: string;
  interests?: string[];
  otherInterest?: string;
  createdAt?: string;
}

export interface ContactItem {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message?: string;
  createdAt?: string;
}

export default function AdminPortal() {
  // Admin Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [loginEmail, setLoginEmail] = useState<string>("techverse@ctuniversity.in");
  const [loginPassword, setLoginPassword] = useState<string>("");
  const [loginError, setLoginError] = useState<string>("");
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<"screening" | "official-members" | "queries" | "arenas">("screening");
  const [editingOfficialId, setEditingOfficialId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteEnquiryId, setConfirmDeleteEnquiryId] = useState<string | null>(null);
  const [confirmDeleteContactId, setConfirmDeleteContactId] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Promotion Modal State
  const [promotingMember, setPromotingMember] = useState<ClubMemberItem | null>(null);
  const [promoDesignation, setPromoDesignation] = useState<string>("");
  const [promoRoleAssignee, setPromoRoleAssignee] = useState<string>("");
  const [isPromoting, setIsPromoting] = useState<boolean>(false);

  // Resignation Modal State
  const [resigningMember, setResigningMember] = useState<ClubMemberItem | null>(null);
  const [resignationRemarks, setResignationRemarks] = useState<string>("Duty completed with excellence. Relieved in good standing for future career growth.");
  const [sendResignationEmail, setSendResignationEmail] = useState<boolean>(true);
  const [isSubmittingResignation, setIsSubmittingResignation] = useState<boolean>(false);

  // Disciplinary Termination Modal State
  const [terminatingMember, setTerminatingMember] = useState<ClubMemberItem | null>(null);
  const [terminationReason, setTerminationReason] = useState<string>("Sharing club IDs for bunking classes (Strict Disciplinary Violation)");
  const [customTerminationReason, setCustomTerminationReason] = useState<string>("");
  const [fineAmount, setFineAmount] = useState<string>("1000");
  const [terminationRemarks, setTerminationRemarks] = useState<string>("");
  const [sendTerminationEmail, setSendTerminationEmail] = useState<boolean>(true);
  const [isSubmittingTermination, setIsSubmittingTermination] = useState<boolean>(false);

  // Status Filter in Official Members Tab
  const [officialStatusFilter, setOfficialStatusFilter] = useState<"all" | "active" | "resigned" | "terminated">("active");

  // Data states
  const [screeningList, setScreeningList] = useState<ClubMemberItem[]>([]);
  const [officialList, setOfficialList] = useState<ClubMemberItem[]>([]);
  const members = useMemo(() => [...screeningList, ...officialList], [screeningList, officialList]);
  const [enquiries, setEnquiries] = useState<EnquiryItem[]>([]);
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [eventStats, setEventStats] = useState<any>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Local editable draft state for role/designation
  const [editDrafts, setEditDrafts] = useState<{ [id: string]: { designation: string; roleAssignee: string } }>({});

  const loadData = async () => {
    setLoading(true);
    try {
      const [screeningData, officialData, enquiriesData, contactsData, statsData] = await Promise.allSettled([
        getScreeningMembers(),
        getClubMembers(),
        getEnquiries(),
        getContacts(),
        getEngineersDayStats(),
      ]);

      let loadedScreening: ClubMemberItem[] = [];
      let loadedOfficial: ClubMemberItem[] = [];

      if (screeningData.status === "fulfilled" && Array.isArray(screeningData.value)) {
        loadedScreening = screeningData.value;
      }
      if (officialData.status === "fulfilled" && Array.isArray(officialData.value)) {
        loadedOfficial = officialData.value;
      }

      setScreeningList(loadedScreening);
      setOfficialList(loadedOfficial);

      // Initialize editable drafts for both lists
      const initialDrafts: any = {};
      [...loadedScreening, ...loadedOfficial].forEach((m: ClubMemberItem) => {
        initialDrafts[m._id] = {
          designation: m.designation || "",
          roleAssignee: m.roleAssignee || "",
        };
      });
      setEditDrafts(initialDrafts);

      if (enquiriesData.status === "fulfilled" && Array.isArray(enquiriesData.value)) {
        setEnquiries(enquiriesData.value);
      }

      if (contactsData.status === "fulfilled" && Array.isArray(contactsData.value)) {
        setContacts(contactsData.value);
      }

      if (statsData.status === "fulfilled" && statsData.value?.breakdown) {
        setEventStats(statsData.value);
      }
    } catch (err) {
      console.error("Error loading admin data:", err);
      toast.error("Failed to load some admin data from backend.");
    } finally {
      setLoading(false);
    }
  };

  // Check admin session on mount
  useEffect(() => {
    const token = localStorage.getItem("techverse_admin_token");
    if (!token) {
      setIsAuthenticated(false);
      setAuthChecking(false);
      return;
    }

    verifyAdminToken(token)
      .then((res) => {
        if (res && res.valid) {
          setIsAuthenticated(true);
          loadData();
        } else {
          localStorage.removeItem("techverse_admin_token");
          setIsAuthenticated(false);
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
      })
      .finally(() => {
        setAuthChecking(false);
      });
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    const cleanEmail = loginEmail.trim().toLowerCase();
    if (cleanEmail !== "techverse@ctuniversity.in") {
      setLoginError("Unauthorized: Only techverse@ctuniversity.in is authorized to access the Admin Portal.");
      toast.error("Access Denied: Only techverse@ctuniversity.in is authorized.");
      return;
    }

    if (!loginPassword) {
      setLoginError("Please enter the administrator password.");
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await adminLogin({ email: cleanEmail, password: loginPassword });
      if (res && res.token) {
        localStorage.setItem("techverse_admin_token", res.token);
        localStorage.setItem("techverse_admin_email", cleanEmail);
        setIsAuthenticated(true);
        toast.success("Welcome back, TechVerse Administrator!");
        loadData();
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Invalid administrative credentials.";
      setLoginError(msg);
      toast.error(msg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("techverse_admin_token");
    localStorage.removeItem("techverse_admin_email");
    setIsAuthenticated(false);
    toast.info("Logged out of TechVerse Admin Portal.");
  };

  const handleDraftChange = (id: string, field: "designation" | "roleAssignee", value: string) => {
    setEditDrafts((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleSaveRole = async (id: string) => {
    const draft = editDrafts[id];
    if (!draft) return;

    if (!draft.designation.trim()) {
      toast.error("Please specify a Club Designation before issuing the ID card.");
      return;
    }

    setSavingId(id);
    try {
      const targetMember = members.find((m) => m._id === id);
      const res = await updateClubMemberRole(id, {
        designation: draft.designation.trim(),
        roleAssignee: draft.roleAssignee.trim(),
        status: "Official Member",
      });

      let cardEmailed = Boolean(res?.cardEmailSent);

      // Client-side instant email dispatch backup if backend was unable to reach email relay
      if (!cardEmailed && targetMember) {
        try {
          const directRes = await sendEmailDirect({
            type: "card",
            member: {
              ...targetMember,
              designation: draft.designation.trim(),
              roleAssignee: draft.roleAssignee.trim(),
              status: "Official Member",
              memberId: res?.member?.memberId || targetMember.memberId,
              serialNumber: res?.member?.serialNumber || targetMember.serialNumber,
            },
          });
          if (directRes && directRes.success) {
            cardEmailed = true;
          }
        } catch (e) {
          console.warn("Direct client email dispatch note:", e);
        }
      }

      const updatedMember: ClubMemberItem = {
        ...(res?.member || targetMember),
        designation: draft.designation.trim(),
        roleAssignee: draft.roleAssignee.trim(),
        status: "Official Member",
        cardSent: cardEmailed || true,
      };

      // Shift member from screening collection to official club members collection!
      setScreeningList((prev) => prev.filter((m) => m._id !== id));
      setOfficialList((prev) => {
        const filtered = prev.filter((m) => m._id !== id);
        return [updatedMember, ...filtered];
      });

      const memberName = targetMember?.name || "Member";

      if (cardEmailed) {
        toast.success(`🎉 ${memberName} appointed as ${draft.designation.trim()}! Official Membership Card emailed & shifted to Official Club Members folder!`);
      } else {
        toast.success(`🎉 ${memberName} appointed as ${draft.designation.trim()}! Saved to Official Club Members folder in MongoDB Atlas!`);
      }

      setEditingOfficialId(null);
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(error?.message || "Failed to update member role");
    } finally {
      setSavingId(null);
    }
  };

  const openPromotionModal = (member: ClubMemberItem) => {
    setPromotingMember(member);
    setPromoDesignation(member.designation || "");
    setPromoRoleAssignee(member.roleAssignee || "President and Committee Members of the Club");
  };

  const handleConfirmPromotion = async () => {
    if (!promotingMember) return;
    if (!promoDesignation.trim()) {
      toast.error("Please enter an elevated Club Designation.");
      return;
    }

    setIsPromoting(true);
    try {
      const prevDesig = promotingMember.designation || "Member";
      const res = await promoteClubMember(promotingMember._id, {
        designation: promoDesignation.trim(),
        roleAssignee: promoRoleAssignee.trim(),
        previousDesignation: prevDesig,
      });

      let cardEmailed = Boolean(res?.cardEmailSent || res?.promoEmailSent);

      // Client-side fallback if backend relay couldn't reach
      if (!cardEmailed) {
        try {
          const directRes = await sendEmailDirect({
            type: "promotion",
            member: {
              ...promotingMember,
              designation: promoDesignation.trim(),
              roleAssignee: promoRoleAssignee.trim(),
              previousDesignation: prevDesig,
            },
          });
          if (directRes && directRes.success) {
            cardEmailed = true;
          }
        } catch (e) {
          console.warn("Direct promotion email dispatch note:", e);
        }
      }

      // Update local officialList in real time
      const updatedMember: ClubMemberItem = {
        ...promotingMember,
        designation: promoDesignation.trim(),
        roleAssignee: promoRoleAssignee.trim(),
        cardSent: cardEmailed || true,
      };

      setOfficialList((prev) =>
        prev.map((m) => (m._id === promotingMember._id ? updatedMember : m))
      );

      // Also update editable draft
      setEditDrafts((prev) => ({
        ...prev,
        [promotingMember._id]: {
          designation: promoDesignation.trim(),
          roleAssignee: promoRoleAssignee.trim(),
        },
      }));

      if (cardEmailed) {
        toast.success(`🎖️ ${promotingMember.name} officially promoted to ${promoDesignation.trim()}! Curated promotion citation & updated Leadership ID Card sent to ${promotingMember.email}!`);
      } else {
        toast.success(`🎖️ ${promotingMember.name} officially promoted to ${promoDesignation.trim()}! Saved to MongoDB Atlas!`);
      }

      setPromotingMember(null);
    } catch (error: any) {
      console.error("Promotion error:", error);
      toast.error(error?.message || "Failed to promote member");
    } finally {
      setIsPromoting(false);
    }
  };

  const openResignationModal = (member: ClubMemberItem) => {
    setResigningMember(member);
    setResignationRemarks(member.resignationRemarks || "Duty completed with excellence. Relieved in good standing for future career growth.");
    setSendResignationEmail(true);
  };

  const handleConfirmResignation = async () => {
    if (!resigningMember) return;
    setIsSubmittingResignation(true);
    try {
      const res = await acceptMemberResignation(resigningMember._id, {
        remarks: resignationRemarks.trim(),
        sendEmail: sendResignationEmail,
      });

      let emailSent = Boolean(res?.emailSent);
      if (sendResignationEmail && !emailSent) {
        try {
          const directRes = await sendEmailDirect({
            type: "resignation",
            member: {
              ...resigningMember,
              resignationRemarks: resignationRemarks.trim(),
              status: "Resigned",
            },
          });
          if (directRes && directRes.success) emailSent = true;
        } catch (e) {
          console.warn("Direct resignation email note:", e);
        }
      }

      const updatedMember: ClubMemberItem = {
        ...resigningMember,
        status: "Resigned",
        resignedAt: new Date().toISOString(),
        resignationRemarks: resignationRemarks.trim(),
      };

      setOfficialList((prev) =>
        prev.map((m) => (m._id === resigningMember._id ? updatedMember : m))
      );

      if (emailSent) {
        toast.success(`Formal resignation accepted for ${resigningMember.name}! Acknowledgment email sent to ${resigningMember.email}.`);
      } else {
        toast.success(`Formal resignation accepted for ${resigningMember.name}! Status updated in MongoDB Atlas.`);
      }

      setResigningMember(null);
    } catch (err: any) {
      console.error("Resignation error:", err);
      toast.error(err?.message || "Failed to accept member resignation");
    } finally {
      setIsSubmittingResignation(false);
    }
  };

  const openTerminateModal = (member: ClubMemberItem) => {
    setTerminatingMember(member);
    setTerminationReason(member.terminationReason || "Sharing club IDs for bunking classes (Strict Disciplinary Violation)");
    setCustomTerminationReason("");
    setFineAmount(String(member.fineAmount || 1000));
    setTerminationRemarks(member.terminationRemarks || "");
    setSendTerminationEmail(true);
  };

  const handleConfirmTermination = async () => {
    if (!terminatingMember) return;
    const finalReason = terminationReason === "Other"
      ? (customTerminationReason.trim() || "Violation of Club Code of Conduct & Rules")
      : terminationReason;

    setIsSubmittingTermination(true);
    try {
      const finalFine = Number(fineAmount) || 1000;
      const res = await terminateClubMember(terminatingMember._id, {
        reason: finalReason,
        remarks: terminationRemarks.trim(),
        fineAmount: finalFine,
        sendEmail: sendTerminationEmail,
      });

      let emailSent = Boolean(res?.emailSent);
      if (sendTerminationEmail && !emailSent) {
        try {
          const directRes = await sendEmailDirect({
            type: "termination",
            member: {
              ...terminatingMember,
              status: "Terminated",
              terminationReason: finalReason,
              terminationRemarks: terminationRemarks.trim(),
              fineAmount: finalFine,
            },
          });
          if (directRes && directRes.success) emailSent = true;
        } catch (e) {
          console.warn("Direct termination email note:", e);
        }
      }

      const updatedMember: ClubMemberItem = {
        ...terminatingMember,
        status: "Terminated",
        terminatedAt: new Date().toISOString(),
        terminationReason: finalReason,
        terminationRemarks: terminationRemarks.trim(),
        fineAmount: finalFine,
      };

      setOfficialList((prev) =>
        prev.map((m) => (m._id === terminatingMember._id ? updatedMember : m))
      );

      if (emailSent) {
        toast.error(`Member ${terminatingMember.name} has been TERMINATED. Formal disciplinary notice emailed to ${terminatingMember.email}.`);
      } else {
        toast.error(`Member ${terminatingMember.name} has been TERMINATED. Status recorded in MongoDB Atlas.`);
      }

      setTerminatingMember(null);
    } catch (err: any) {
      console.error("Termination error:", err);
      toast.error(err?.message || "Failed to terminate club member");
    } finally {
      setIsSubmittingTermination(false);
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    setIsDeletingId(id);
    try {
      const isScreening = screeningList.some((m) => m._id === id);
      if (isScreening) {
        await deleteScreeningMember(id);
        setScreeningList((prev) => prev.filter((m) => m._id !== id));
      } else {
        await deleteClubMember(id);
        setOfficialList((prev) => prev.filter((m) => m._id !== id));
      }
      setConfirmDeleteId(null);
      toast.success(`Application for "${name}" deleted from MongoDB Atlas.`);
    } catch (err: any) {
      console.error("Delete error:", err);
      toast.error(err?.message || "Failed to delete member application");
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleDeleteEnquiry = async (id: string, name: string) => {
    try {
      await deleteEnquiry(id);
      setEnquiries((prev) => prev.filter((e) => e._id !== id));
      setConfirmDeleteEnquiryId(null);
      toast.success(`Enquiry from "${name}" deleted successfully.`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete enquiry");
    }
  };

  const handleDeleteContact = async (id: string, name: string) => {
    try {
      await deleteContact(id);
      setContacts((prev) => prev.filter((c) => c._id !== id));
      setConfirmDeleteContactId(null);
      toast.success(`Contact message from "${name}" deleted successfully.`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete contact message");
    }
  };

  // Roster Segmentation: Official Members vs Screening Applicants
  const officialMembers = useMemo(
    () => officialList.filter((m) => Boolean(m.designation?.trim())),
    [officialList]
  );
  const screeningMembers = useMemo(
    () => screeningList,
    [screeningList]
  );

  // Statistics
  const totalMembers = members.length;
  const assignedCount = officialMembers.length;
  const pendingCount = screeningMembers.length;
  const totalQueries = enquiries.length + contacts.length;

  // Filtered Screening Applications
  const filteredScreeningMembers = useMemo(() => {
    return screeningMembers.filter((m) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        m.name?.toLowerCase().includes(q) ||
        m.regNumber?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.memberId?.toLowerCase().includes(q) ||
        String(m.serialNumber || "").includes(q);

      const matchesDept = deptFilter === "all" || m.department?.toLowerCase() === deptFilter.toLowerCase();
      return matchesSearch && matchesDept;
    });
  }, [screeningMembers, searchQuery, deptFilter]);

  // Official Status Counts
  const activeOfficialCount = useMemo(
    () => officialMembers.filter((m) => m.status !== "Resigned" && m.status !== "Terminated").length,
    [officialMembers]
  );
  const resignedOfficialCount = useMemo(
    () => officialMembers.filter((m) => m.status === "Resigned").length,
    [officialMembers]
  );
  const terminatedOfficialCount = useMemo(
    () => officialMembers.filter((m) => m.status === "Terminated").length,
    [officialMembers]
  );

  // Filtered Official Club Members
  const filteredOfficialMembers = useMemo(() => {
    return officialMembers.filter((m) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        m.name?.toLowerCase().includes(q) ||
        m.regNumber?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.memberId?.toLowerCase().includes(q) ||
        m.designation?.toLowerCase().includes(q) ||
        m.roleAssignee?.toLowerCase().includes(q) ||
        String(m.serialNumber || "").includes(q);

      const matchesDept = deptFilter === "all" || m.department?.toLowerCase() === deptFilter.toLowerCase();

      let matchesStatus = true;
      if (officialStatusFilter === "active") {
        matchesStatus = m.status !== "Resigned" && m.status !== "Terminated";
      } else if (officialStatusFilter === "resigned") {
        matchesStatus = m.status === "Resigned";
      } else if (officialStatusFilter === "terminated") {
        matchesStatus = m.status === "Terminated";
      }

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [officialMembers, searchQuery, deptFilter, officialStatusFilter]);

  // 1. Loading State while checking authentication token
  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#060a17] text-slate-100 flex items-center justify-center pt-20 px-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin shadow-lg shadow-cyan-500/20" />
          <div>
            <h3 className="text-base font-bold text-white font-space">Verifying Administrator Access</h3>
            <p className="text-xs text-slate-400 mt-1 font-mono">Securing connection to TechVerse SuperAdmin Gateway...</p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Strict Email Login Wall (techverse@ctuniversity.in only)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#060a17] text-slate-100 pt-28 pb-20 px-4 flex items-center justify-center relative overflow-hidden">
        {/* Futuristic Ambience */}
        <div className="fixed inset-0 pointer-events-none -z-10">
          <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px]" />
          <div className="absolute bottom-1/4 right-1/3 w-[450px] h-[450px] bg-cyan-500/10 rounded-full blur-[140px]" />
        </div>

        <div className="w-full max-w-md animate-fade-in space-y-6">
          {/* Card Container */}
          <div className="relative rounded-3xl bg-[#090e21]/95 border border-white/10 p-7 sm:p-9 shadow-2xl backdrop-blur-2xl overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600" />

            <div className="text-center space-y-3 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600/20 to-cyan-500/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/10">
                <ShieldCheck className="w-8 h-8 text-cyan-400" />
              </div>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-[10px] font-mono tracking-widest text-blue-300 uppercase">
                  <Lock className="w-3 h-3 text-blue-400" />
                  Guarded Admin Gateway
                </div>
                <h2 className="text-2xl font-black font-space text-white tracking-tight">
                  Admin Sign In
                </h2>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Strictly restricted to official TechVerse administration credentials.
                </p>
              </div>
            </div>

            {/* Guard Notice Callout */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200/90 text-xs flex items-start gap-2.5 mb-6">
              <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <strong>Strict Access Policy:</strong> Only the official club admin email (<code className="text-cyan-300 font-mono font-bold">techverse@ctuniversity.in</code>) is authorized to log into this portal.
              </div>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 font-bold mb-1.5 uppercase tracking-wider">
                  Admin Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="admin-email-input"
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="techverse@ctuniversity.in"
                    className="pl-10 bg-white/5 border-white/10 text-white text-xs rounded-xl focus:border-cyan-400"
                  />
                </div>
                {loginEmail.trim().toLowerCase() !== "techverse@ctuniversity.in" && loginEmail.length > 0 && (
                  <p className="text-[11px] text-red-400 mt-1.5 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    Access restricted: Only techverse@ctuniversity.in can log in.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 font-bold mb-1.5 uppercase tracking-wider">
                  Admin Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="admin-password-input"
                    type={showPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter Admin Password..."
                    className="pl-10 pr-14 bg-white/5 border-white/10 text-white text-xs rounded-xl focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-mono"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <Button
                id="admin-login-btn"
                type="submit"
                disabled={isLoggingIn || loginEmail.trim().toLowerCase() !== "techverse@ctuniversity.in"}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/25 transition-all text-xs font-mono tracking-wider uppercase flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Verifying Credentials...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Authorize Admin Access
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-5 border-t border-white/10 text-center">
              <a
                href="/"
                className="text-xs text-slate-400 hover:text-cyan-400 transition-colors inline-flex items-center gap-1 font-mono"
              >
                ← Return to TechVerse Public Portal
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060a17] text-slate-100 pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* TOP HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-[11px] font-mono tracking-widest uppercase">
                TechVerse Club Administration
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black font-space tracking-tight text-white flex items-center gap-3">
              Admin Portal <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8 text-cyan-400" />
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Assign club roles &amp; designations, manage student enquiries, and track university registrations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-slate-300 text-[11px] truncate max-w-[170px] sm:max-w-none">techverse@ctuniversity.in</span>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[9px] font-mono">
                SuperAdmin
              </Badge>
            </div>
            <Button
              id="refresh-admin-data-btn"
              type="button"
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={loading}
              className="bg-white/5 hover:bg-white/10 text-slate-200 border-white/10 text-xs font-semibold rounded-xl flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden xs:inline sm:inline">Refresh</span>
            </Button>
            <Button
              id="logout-admin-btn"
              type="button"
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-300 border-red-500/30 text-xs font-semibold rounded-xl flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </Button>
          </div>
        </div>

        {/* METRICS OVERVIEW CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <div 
            onClick={() => setActiveTab("official-members")}
            className="p-3.5 sm:p-5 rounded-2xl bg-[#0b1126]/80 border border-white/10 shadow-lg backdrop-blur-xl cursor-pointer hover:border-blue-500/40 transition-all group"
            title="Click to view all registered members"
          >
            <div className="flex items-center justify-between text-[11px] sm:text-xs font-mono text-slate-400 mb-1.5 sm:mb-2">
              <span className="truncate">TOTAL MEMBERS</span>
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400 group-hover:scale-110 transition-transform shrink-0" />
            </div>
            <div className="text-2xl sm:text-3xl font-black font-space text-white">{totalMembers}</div>
            <span className="text-[10px] sm:text-[11px] text-blue-400 font-medium mt-1 block truncate">Registered in MongoDB</span>
          </div>

          <div 
            onClick={() => setActiveTab("official-members")}
            className={`p-3.5 sm:p-5 rounded-2xl bg-[#0b1126]/80 border shadow-lg backdrop-blur-xl cursor-pointer transition-all group ${
              activeTab === "official-members" ? "border-emerald-500/60 ring-1 ring-emerald-500/40" : "border-white/10 hover:border-emerald-500/40"
            }`}
            title="Click to view Official Club Members"
          >
            <div className="flex items-center justify-between text-[11px] sm:text-xs font-mono text-slate-400 mb-1.5 sm:mb-2">
              <span className="truncate">OFFICIAL MEMBERS</span>
              <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
            </div>
            <div className="text-2xl sm:text-3xl font-black font-space text-emerald-400">{assignedCount}</div>
            <span className="text-[10px] sm:text-[11px] text-emerald-400/80 mt-1 block truncate">Designation &amp; Card Active</span>
          </div>

          <div 
            onClick={() => setActiveTab("screening")}
            className={`p-3.5 sm:p-5 rounded-2xl bg-[#0b1126]/80 border shadow-lg backdrop-blur-xl cursor-pointer transition-all group ${
              activeTab === "screening" ? "border-amber-500/60 ring-1 ring-amber-500/40" : "border-white/10 hover:border-amber-500/40"
            }`}
            title="Click to view Applications Under Screening"
          >
            <div className="flex items-center justify-between text-[11px] sm:text-xs font-mono text-slate-400 mb-1.5 sm:mb-2">
              <span className="truncate">UNDER SCREENING</span>
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
            </div>
            <div className="text-2xl sm:text-3xl font-black font-space text-amber-400">{pendingCount}</div>
            <span className="text-[10px] sm:text-[11px] text-amber-400/80 mt-1 block truncate">Awaiting Role &amp; ID Card</span>
          </div>

          <div 
            onClick={() => setActiveTab("queries")}
            className={`p-3.5 sm:p-5 rounded-2xl bg-[#0b1126]/80 border shadow-lg backdrop-blur-xl cursor-pointer transition-all group ${
              activeTab === "queries" ? "border-purple-500/60 ring-1 ring-purple-500/40" : "border-white/10 hover:border-purple-500/40"
            }`}
            title="Click to view Student Queries"
          >
            <div className="flex items-center justify-between text-[11px] sm:text-xs font-mono text-slate-400 mb-1.5 sm:mb-2">
              <span className="truncate">TOTAL QUERIES</span>
              <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 group-hover:scale-110 transition-transform shrink-0" />
            </div>
            <div className="text-2xl sm:text-3xl font-black font-space text-purple-400">{totalQueries}</div>
            <span className="text-[10px] sm:text-[11px] text-slate-400 mt-1 block truncate">Enquiries &amp; Messages</span>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0">
          <button
            id="tab-screening-btn"
            type="button"
            onClick={() => setActiveTab("screening")}
            className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ${
              activeTab === "screening"
                ? "bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-lg shadow-amber-500/25"
                : "bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
            }`}
          >
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Screening Applications</span>
            <span className="ml-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-black/40 text-[10px] font-mono text-amber-200">
              {pendingCount}
            </span>
          </button>

          <button
            id="tab-official-members-btn"
            type="button"
            onClick={() => setActiveTab("official-members")}
            className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ${
              activeTab === "official-members"
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25"
                : "bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Official Members</span>
            <span className="ml-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-black/40 text-[10px] font-mono text-emerald-200">
              {assignedCount}
            </span>
          </button>

          <button
            id="tab-queries-btn"
            type="button"
            onClick={() => setActiveTab("queries")}
            className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ${
              activeTab === "queries"
                ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/25"
                : "bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Queries &amp; Enquiries</span>
            <span className="ml-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-black/40 text-[10px] font-mono">
              {totalQueries}
            </span>
          </button>

          <button
            id="tab-arenas-btn"
            type="button"
            onClick={() => setActiveTab("arenas")}
            className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ${
              activeTab === "arenas"
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25"
                : "bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
            }`}
          >
            <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Engineers' Day Arenas</span>
            <span className="ml-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-black/40 text-[10px] font-mono">
              {eventStats?.totalRegistrations ?? 13}
            </span>
          </button>
        </div>

        {/* ================================================================= */}
        {/* TAB 1: SCREENING APPLICATIONS (PENDING REVIEW)                    */}
        {/* ================================================================= */}
        {activeTab === "screening" && (
          <div className="space-y-6">
            {/* Header Callout */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                  <h2 className="text-lg sm:text-xl font-black font-space text-white flex items-center gap-2">
                    New Member Applications Under Screening
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Review applicant details, assign their official Designation &amp; Role Assignee, then click <strong>"Assign &amp; Send ID Card"</strong> to officially admit them to the club roster and shift them to the Official Members list.
                </p>
              </div>
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs font-mono px-3 py-1 flex-shrink-0">
                {filteredScreeningMembers.length} Applications Waiting
              </Badge>
            </div>

            {/* Search & Filter Bar */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0b1126]/80 border border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  id="admin-screening-search-input"
                  type="text"
                  placeholder="Search applicants by Name, Reg No, or Email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white text-xs rounded-xl focus:border-amber-400 w-full"
                />
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="bg-white/5 border border-white/10 text-slate-300 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-amber-400 w-full sm:w-auto"
                >
                  <option value="all" className="bg-[#0b1126] text-white">All Departments</option>
                  <option value="btech" className="bg-[#0b1126] text-white">B.Tech</option>
                  <option value="bca" className="bg-[#0b1126] text-white">BCA</option>
                  <option value="mca" className="bg-[#0b1126] text-white">MCA</option>
                  <option value="mtech" className="bg-[#0b1126] text-white">M.Tech</option>
                </select>
              </div>
            </div>

            {/* Screening Cards */}
            {filteredScreeningMembers.length === 0 ? (
              <div className="text-center py-16 p-8 rounded-3xl bg-white/[0.02] border border-white/10 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-white">No Applications Awaiting Screening</h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  {searchQuery || deptFilter !== "all"
                    ? "No applicants match your current search filters."
                    : "All submitted applications have been screened and assigned official club designations!"}
                </p>
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("official-members")}
                    className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs font-bold rounded-xl"
                  >
                    View Official Club Members ({assignedCount}) →
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredScreeningMembers.map((member) => {
                  const draft = editDrafts[member._id] || {
                    designation: member.designation || "",
                    roleAssignee: member.roleAssignee || "",
                  };
                  const isSaving = savingId === member._id;

                  return (
                    <div
                      key={member._id}
                      className="p-4 sm:p-6 rounded-2xl bg-[#090e21]/90 border border-amber-500/20 hover:border-amber-500/40 transition-all shadow-xl space-y-4"
                    >
                      {/* Top: Avatar + Candidate Info */}
                      <div className="flex flex-row items-start gap-3 sm:gap-4">
                        {member.photo ? (
                          <img
                            src={member.photo}
                            alt={member.name}
                            className="w-16 h-20 sm:w-20 sm:h-24 rounded-xl object-cover border border-amber-400/40 shadow flex-shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-20 sm:w-20 sm:h-24 rounded-xl bg-amber-900/20 border border-amber-500/30 flex items-center justify-center text-amber-300 text-xl sm:text-2xl font-bold flex-shrink-0">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                        )}

                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base sm:text-lg font-bold text-white font-space truncate">
                              {member.name}
                            </h3>
                            <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/30 text-[10px] font-mono uppercase">
                              ⏳ Under Screening
                            </Badge>
                            {member.serialNumber && (
                              <span className="font-mono text-amber-300 font-black bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30 text-[11px]">
                                #{member.serialNumber}
                              </span>
                            )}
                            {member.memberId && (
                              <span className="font-mono text-blue-300 font-semibold bg-blue-500/10 px-1.5 py-0.5 rounded text-[11px]">
                                {member.memberId}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-400">
                            <span className="font-mono text-cyan-300 font-semibold">{member.regNumber}</span>
                            <span>•</span>
                            <span className="capitalize">
                              {member.department === "mtech" ? "M.Tech" : member.department === "btech" ? "B.Tech" : member.department.toUpperCase()} ({member.batch})
                            </span>
                            {member.specialization && (
                              <>
                                <span>•</span>
                                <span className="text-amber-300 font-mono text-[11px] bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                                  🎯 {member.specialization}
                                </span>
                              </>
                            )}
                            <span>•</span>
                            <span className="text-slate-300">{member.residenceType || "Day Scholar"}</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 pt-0.5">
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-500" /> {member.contact}
                            </span>
                            <span className="flex items-center gap-1 break-all">
                              <Mail className="w-3 h-3 text-slate-500" /> {member.email}
                            </span>
                          </div>

                          {member.interests && member.interests.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {member.interests.map((interest, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-slate-300 border border-white/10"
                                >
                                  {interest}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bottom: Dedicated Role & Designation Inputs + Action Buttons */}
                      <div className="pt-3 border-t border-white/10 flex flex-col xl:flex-row items-stretch xl:items-end justify-between gap-4 bg-white/[0.02] p-4 rounded-xl border border-amber-500/15">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 min-w-0">
                          <div>
                            <label className="block text-[11px] font-mono uppercase tracking-wider text-amber-300 font-bold mb-1.5 flex items-center gap-1.5">
                              <Sparkles className="w-3 h-3 text-amber-400" /> Club Designation
                            </label>
                            <Input
                              placeholder="e.g. Technical Lead, Web Dev Head..."
                              value={draft.designation}
                              onChange={(e) => handleDraftChange(member._id, "designation", e.target.value)}
                              className="bg-black/40 border-white/15 text-white text-xs h-9 rounded-lg focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-mono uppercase tracking-wider text-blue-300 font-bold mb-1.5 flex items-center gap-1.5">
                              <UserCheck className="w-3 h-3 text-blue-400" /> Role Assignee
                            </label>
                            <Input
                              placeholder="e.g. Core Team, Associate, Volunteer..."
                              value={draft.roleAssignee}
                              onChange={(e) => handleDraftChange(member._id, "roleAssignee", e.target.value)}
                              className="bg-black/40 border-white/15 text-white text-xs h-9 rounded-lg focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30"
                            />
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                          <Button
                            id={`assign-role-btn-${member._id}`}
                            type="button"
                            onClick={() => handleSaveRole(member._id)}
                            disabled={isSaving}
                            size="sm"
                            className="w-full sm:w-auto text-white text-xs font-bold rounded-xl px-4 py-2 h-9 flex items-center justify-center gap-1.5 shadow-md bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/20 active:scale-[0.98] transition-all"
                            title="Save designation, send official membership card email, and shift to Official Members"
                          >
                            {isSaving ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Issuing Card...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Assign &amp; Send ID Card 🪪
                              </>
                            )}
                          </Button>

                          {confirmDeleteId === member._id ? (
                            <div className="flex items-center gap-1.5 w-full sm:w-auto animate-fade-in">
                              <Button
                                id={`confirm-delete-btn-${member._id}`}
                                type="button"
                                size="sm"
                                disabled={isDeletingId === member._id}
                                onClick={() => handleDeleteMember(member._id, member.name)}
                                className="flex-1 sm:flex-initial bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl px-3 py-1.5 h-9 flex items-center justify-center gap-1 shadow-lg shadow-red-500/30"
                                title="Click again to permanently delete from MongoDB"
                              >
                                {isDeletingId === member._id ? (
                                  <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Deleting...
                                  </>
                                ) : (
                                  <>
                                    <Trash2 className="w-3.5 h-3.5" /> Confirm Delete
                                  </>
                                )}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={isDeletingId === member._id}
                                onClick={() => setConfirmDeleteId(null)}
                                className="text-slate-400 hover:text-white text-xs py-1.5 px-2 h-9"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              id={`delete-screening-member-btn-${member._id}`}
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setConfirmDeleteId(member._id)}
                              className="w-full sm:w-auto bg-red-500/10 hover:bg-red-500/20 text-red-300 border-red-500/30 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 py-1.5 px-3 h-9 transition-colors"
                              title="Delete this candidate application from MongoDB Atlas"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                              <span>Reject / Delete</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: OFFICIAL CLUB MEMBERS (VERIFIED ROSTER)                    */}
        {/* ================================================================= */}
        {activeTab === "official-members" && (
          <div className="space-y-6">
            {/* Header Callout */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <h2 className="text-lg sm:text-xl font-black font-space text-white flex items-center gap-2">
                    Official TechVerse Club Members <Sparkles className="w-5 h-5 text-amber-300" />
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Verified roster of students who have completed screening, been appointed a club designation, and received their official digital membership ID card.
                </p>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs font-mono px-3 py-1 flex-shrink-0">
                {filteredOfficialMembers.length} Appointed Members
              </Badge>
            </div>

            {/* Search & Filter Bar */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0b1126]/80 border border-white/10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  id="admin-official-search-input"
                  type="text"
                  placeholder="Search members by Name, Designation, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white text-xs rounded-xl focus:border-emerald-400 w-full"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
                {/* Status Filter Buttons */}
                <div className="flex items-center justify-between sm:justify-start p-1 bg-white/5 border border-white/10 rounded-xl overflow-x-auto no-scrollbar">
                  <button
                    id="filter-active-members-btn"
                    type="button"
                    onClick={() => setOfficialStatusFilter("active")}
                    className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all text-center whitespace-nowrap ${
                      officialStatusFilter === "active"
                        ? "bg-emerald-600 text-white shadow"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Active ({activeOfficialCount})
                  </button>
                  <button
                    id="filter-resigned-members-btn"
                    type="button"
                    onClick={() => setOfficialStatusFilter("resigned")}
                    className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all text-center whitespace-nowrap ${
                      officialStatusFilter === "resigned"
                        ? "bg-amber-600 text-white shadow"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Resigned ({resignedOfficialCount})
                  </button>
                  <button
                    id="filter-terminated-members-btn"
                    type="button"
                    onClick={() => setOfficialStatusFilter("terminated")}
                    className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all text-center whitespace-nowrap ${
                      officialStatusFilter === "terminated"
                        ? "bg-red-600 text-white shadow"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Terminated ({terminatedOfficialCount})
                  </button>
                  <button
                    id="filter-all-members-btn"
                    type="button"
                    onClick={() => setOfficialStatusFilter("all")}
                    className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all text-center whitespace-nowrap ${
                      officialStatusFilter === "all"
                        ? "bg-blue-600 text-white shadow"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    All ({officialMembers.length})
                  </button>
                </div>

                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="bg-white/5 border border-white/10 text-slate-300 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-emerald-400 w-full sm:w-auto"
                >
                  <option value="all" className="bg-[#0b1126] text-white">All Departments</option>
                  <option value="btech" className="bg-[#0b1126] text-white">B.Tech</option>
                  <option value="bca" className="bg-[#0b1126] text-white">BCA</option>
                  <option value="mca" className="bg-[#0b1126] text-white">MCA</option>
                  <option value="mtech" className="bg-[#0b1126] text-white">M.Tech</option>
                </select>
              </div>
            </div>

            {/* Official Members Cards */}
            {filteredOfficialMembers.length === 0 ? (
              <div className="text-center py-16 p-8 rounded-3xl bg-white/[0.02] border border-white/10 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
                  <Users className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-white">No Official Members Found</h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  {searchQuery || deptFilter !== "all"
                    ? "No members match your search criteria."
                    : "No official club members assigned yet. Go to Screening Applications to assign roles and issue ID cards."}
                </p>
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("screening")}
                    className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs font-bold rounded-xl"
                  >
                    Go to Screening Applications ({pendingCount}) →
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredOfficialMembers.map((member) => {
                  const draft = editDrafts[member._id] || {
                    designation: member.designation || "",
                    roleAssignee: member.roleAssignee || "",
                  };
                  const isEditing = editingOfficialId === member._id;
                  const isSaving = savingId === member._id;

                  return (
                    <div
                      key={member._id}
                      className="p-4 sm:p-6 rounded-2xl bg-[#090e21]/90 border border-emerald-500/25 hover:border-emerald-500/45 transition-all shadow-xl space-y-4"
                    >
                      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-6">
                        {/* Left: Avatar + Details */}
                        <div className="flex flex-row items-start gap-3.5 sm:gap-4 flex-1 min-w-0">
                          {member.photo ? (
                            <img
                              src={member.photo}
                              alt={member.name}
                              className="w-16 h-20 sm:w-20 sm:h-24 rounded-xl object-cover border-2 border-emerald-400/50 shadow-lg flex-shrink-0"
                            />
                          ) : (
                            <div className="w-16 h-20 sm:w-20 sm:h-24 rounded-xl bg-gradient-to-br from-emerald-900/40 to-teal-900/40 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-300 text-xl font-bold flex-shrink-0">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                          )}

                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base sm:text-lg font-bold text-white font-space truncate">
                                {member.name}
                              </h3>
                              {member.status === "Resigned" ? (
                                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px] font-mono">
                                  ⚠️ Resigned
                                </Badge>
                              ) : member.status === "Terminated" ? (
                                <Badge className="bg-red-500/25 text-red-300 border-red-500/50 text-[10px] font-mono font-bold">
                                  🚫 Terminated • Fine: ₹{member.fineAmount || 1000}
                                </Badge>
                              ) : (
                                <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/40 text-[10px] font-mono">
                                  ✓ Official Member
                                </Badge>
                              )}
                              {member.cardSent && member.status !== "Terminated" && (
                                <Badge className="bg-blue-500/15 text-blue-300 border-blue-500/40 text-[10px] font-mono">
                                  🪪 ID Card Sent
                                </Badge>
                              )}
                            </div>

                            {/* PROMINENT DESIGNATION & ROLE ASSIGNEE BADGES */}
                            <div className="flex flex-wrap items-center gap-2 pt-0.5">
                              <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/40 font-bold text-xs px-2.5 py-1 rounded-lg shadow-sm">
                                🌟 {member.designation}
                              </span>
                              <span className="inline-flex items-center gap-1 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold text-xs px-2.5 py-1 rounded-lg shadow-sm">
                                ⚡ {member.roleAssignee || "Core Team"}
                              </span>
                            </div>

                            {/* Status Remarks Banners */}
                            {member.status === "Resigned" && member.resignationRemarks && (
                              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs">
                                <strong>Resignation Note:</strong> {member.resignationRemarks} {member.resignedAt ? `• Accepted on ${new Date(member.resignedAt).toLocaleDateString()}` : ""}
                              </div>
                            )}

                            {member.status === "Terminated" && member.terminationReason && (
                              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-200 text-xs">
                                <strong className="text-red-400">Violation:</strong> {member.terminationReason} {member.fineAmount ? `• Imposed Fine: ₹${member.fineAmount}` : ""} {member.terminatedAt ? `• Terminated on ${new Date(member.terminatedAt).toLocaleDateString()}` : ""}
                              </div>
                            )}

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 pt-1">
                              {member.serialNumber && (
                                <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 text-[11px]">
                                  #{member.serialNumber}
                                </span>
                              )}
                              {member.memberId && (
                                <span className="font-mono text-blue-300 font-bold bg-blue-500/10 px-2 py-0.5 rounded text-[11px]">
                                  {member.memberId}
                                </span>
                              )}
                              <span className="font-mono text-cyan-300 font-semibold">{member.regNumber}</span>
                              <span>•</span>
                              <span className="capitalize">
                                {member.department === "mtech" ? "M.Tech" : member.department === "btech" ? "B.Tech" : member.department.toUpperCase()} ({member.batch})
                              </span>
                              {member.specialization && (
                                <>
                                  <span>•</span>
                                  <span className="text-emerald-300 font-mono text-[11px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                    🎯 {member.specialization}
                                  </span>
                                </>
                              )}
                              <span>•</span>
                              <span className="text-slate-300">{member.residenceType || "Day Scholar"}</span>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 pt-0.5">
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-500" /> {member.contact}
                              </span>
                              <span className="flex items-center gap-1 break-all">
                                <Mail className="w-3 h-3 text-slate-500" /> {member.email}
                              </span>
                            </div>

                            {member.interests && member.interests.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {member.interests.map((interest, idx) => (
                                  <span
                                    key={idx}
                                    className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-slate-300 border border-white/10"
                                  >
                                    {interest}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2 w-full lg:w-auto justify-end pt-3 lg:pt-0 border-t border-white/10 lg:border-t-0 shrink-0">
                          {/* Active Member Action Set */}
                          {member.status !== "Resigned" && member.status !== "Terminated" ? (
                            <>
                              {/* 1. DEDICATED PROMOTION BUTTON */}
                              <Button
                                id={`promote-member-btn-${member._id}`}
                                type="button"
                                size="sm"
                                onClick={() => openPromotionModal(member)}
                                className="w-full sm:flex-1 lg:w-48 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 py-2 px-3.5 shadow-md shadow-amber-500/25 border border-amber-300/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                title="Promote this member to an elevated designation and dispatch an official leadership promotion email with updated ID card"
                              >
                                <Crown className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
                                <span>Promote / Role 🎖️</span>
                              </Button>

                              {/* 2. ACCEPT RESIGNATION BUTTON */}
                              <Button
                                id={`accept-resignation-btn-${member._id}`}
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => openResignationModal(member)}
                                className="w-full sm:flex-1 lg:w-48 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 py-2 px-3 transition-colors"
                                title="Accept formal resignation from this member and dispatch official confirmation"
                              >
                                <UserMinus className="w-3.5 h-3.5 text-amber-400" />
                                <span>Resignation</span>
                              </Button>

                              {/* 3. TERMINATE BUTTON */}
                              <Button
                                id={`terminate-member-btn-${member._id}`}
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => openTerminateModal(member)}
                                className="w-full sm:flex-1 lg:w-48 bg-red-600/15 hover:bg-red-600/25 text-red-300 border-red-500/40 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 py-2 px-3 transition-colors shadow-sm"
                                title="Disciplinary termination and membership revocation"
                              >
                                <UserX className="w-3.5 h-3.5 text-red-400" />
                                <span>Terminate</span>
                              </Button>

                              {/* 4. QUICK EDIT DESIGNATION */}
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingOfficialId(isEditing ? null : member._id)}
                                className="w-full sm:flex-1 lg:w-48 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 py-2 px-3"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                                <span>{isEditing ? "Close Editor" : "Quick Edit"}</span>
                              </Button>
                            </>
                          ) : (
                            <div className="w-full sm:w-auto text-center">
                              {member.status === "Resigned" ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/30">
                                  ⚠️ Resigned Member
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-red-400 bg-red-500/10 px-3 py-1.5 rounded-xl border border-red-500/30 font-bold">
                                  🚫 Terminated (Fine ₹{member.fineAmount || 1000})
                                </span>
                              )}
                            </div>
                          )}

                          {/* 5. REJECT / DELETE BUTTON */}
                          {confirmDeleteId === member._id ? (
                            <div className="flex items-center gap-1.5 w-full sm:flex-1 lg:w-48 animate-fade-in">
                              <Button
                                id={`confirm-delete-btn-${member._id}`}
                                type="button"
                                size="sm"
                                disabled={isDeletingId === member._id}
                                onClick={() => handleDeleteMember(member._id, member.name)}
                                className="flex-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl px-3 py-2 flex items-center justify-center gap-1 shadow-lg shadow-red-500/30"
                                title="Permanently delete this member from MongoDB"
                              >
                                {isDeletingId === member._id ? (
                                  <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Deleting...
                                  </>
                                ) : (
                                  <>
                                    <Trash2 className="w-3.5 h-3.5" /> Confirm Delete
                                  </>
                                )}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={isDeletingId === member._id}
                                onClick={() => setConfirmDeleteId(null)}
                                className="text-slate-400 hover:text-white text-xs py-2 px-2"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              id={`delete-official-member-btn-${member._id}`}
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setConfirmDeleteId(member._id)}
                              className="w-full sm:flex-1 lg:w-48 bg-red-500/10 hover:bg-red-500/20 text-red-300 border-red-500/30 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 py-2 px-3 transition-colors"
                              title="Delete this member record from MongoDB Atlas"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                              <span>Reject / Delete</span>
                            </Button>
                          )}

                          <span className="text-[10px] font-mono text-slate-500 block text-center w-full">
                            ID: {member.memberId || "TV-2026"}
                          </span>
                        </div>
                      </div>

                      {/* Inline Expansion Editor for Official Member */}
                      {isEditing && (
                        <div className="p-4 rounded-xl bg-white/[0.03] border border-blue-500/20 space-y-3 animate-fade-in">
                          <div className="text-xs font-mono font-bold text-blue-300 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-400" />
                            Update Official Designation &amp; Re-dispatch ID Card
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-mono uppercase tracking-wider text-amber-300 font-bold mb-1">
                                Club Designation
                              </label>
                              <Input
                                placeholder="e.g. Technical Lead, President..."
                                value={draft.designation}
                                onChange={(e) => handleDraftChange(member._id, "designation", e.target.value)}
                                className="bg-white/5 border-white/10 text-white text-xs rounded-lg focus:border-amber-400"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-mono uppercase tracking-wider text-blue-300 font-bold mb-1">
                                Role Assignee
                              </label>
                              <Input
                                placeholder="e.g. Core Team, Coordinator..."
                                value={draft.roleAssignee}
                                onChange={(e) => handleDraftChange(member._id, "roleAssignee", e.target.value)}
                                className="bg-white/5 border-white/10 text-white text-xs rounded-lg focus:border-blue-400"
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-end gap-2 pt-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingOfficialId(null)}
                              className="text-xs text-slate-400 hover:text-white"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              disabled={isSaving}
                              onClick={() => handleSaveRole(member._id)}
                              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl px-4 py-1.5 flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                            >
                              {isSaving ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Updating &amp; Sending...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Save &amp; Re-send ID Card 🪪
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: QUERIES & ENQUIRIES                                       */}
        {/* ================================================================= */}
        {activeTab === "queries" && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-[#0b1126]/80 border border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Student Inquiries & Contact Queries</h3>
                <p className="text-xs text-slate-400">Incoming messages from student contact submissions.</p>
              </div>
              <Badge className="bg-purple-500/10 text-purple-300 border-purple-500/30 text-xs font-mono">
                {totalQueries} Total Queries
              </Badge>
            </div>

            {/* Enquiries List */}
            {enquiries.length === 0 && contacts.length === 0 ? (
              <div className="text-center py-16 p-8 rounded-3xl bg-white/[0.02] border border-white/10">
                <MessageSquare className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white">No Queries Found</h3>
                <p className="text-sm text-slate-400 mt-1">Student submissions will appear here automatically.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {enquiries.map((enq) => (
                  <div
                    key={enq._id}
                    className="p-5 rounded-2xl bg-[#090e21]/90 border border-white/10 shadow-lg space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <span className="text-xs font-mono font-bold text-cyan-300">Club Enquiry</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-500">
                          {enq.createdAt ? new Date(enq.createdAt).toLocaleDateString() : "Recent"}
                        </span>
                        {confirmDeleteEnquiryId === enq._id ? (
                          <div className="flex items-center gap-1 animate-fade-in">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleDeleteEnquiry(enq._id, enq.name)}
                              className="h-6 px-2 text-[10px] bg-red-600 hover:bg-red-500 text-white rounded font-bold"
                              title="Confirm delete"
                            >
                              Delete?
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setConfirmDeleteEnquiryId(null)}
                              className="h-6 px-1.5 text-[10px] text-slate-400 hover:text-white"
                            >
                              ✕
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmDeleteEnquiryId(enq._id)}
                            className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-md"
                            title="Delete enquiry from MongoDB"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-white">{enq.name}</h4>
                      <p className="text-xs text-slate-400">{enq.email} • {enq.contact || "No Contact"}</p>
                    </div>

                    {enq.otherInterest && (
                      <p className="text-xs text-slate-300 bg-white/5 p-2.5 rounded-xl border border-white/5 leading-relaxed">
                        {enq.otherInterest}
                      </p>
                    )}

                    {enq.interests && enq.interests.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {enq.interests.map((int, idx) => (
                          <span key={idx} className="text-[10px] bg-cyan-500/10 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/20">
                            {int}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {contacts.map((c) => (
                  <div
                    key={c._id}
                    className="p-5 rounded-2xl bg-[#090e21]/90 border border-white/10 shadow-lg space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <span className="text-xs font-mono font-bold text-purple-300">Contact Message</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-500">
                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "Recent"}
                        </span>
                        {confirmDeleteContactId === c._id ? (
                          <div className="flex items-center gap-1 animate-fade-in">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleDeleteContact(c._id, c.name)}
                              className="h-6 px-2 text-[10px] bg-red-600 hover:bg-red-500 text-white rounded font-bold"
                              title="Confirm delete"
                            >
                              Delete?
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setConfirmDeleteContactId(null)}
                              className="h-6 px-1.5 text-[10px] text-slate-400 hover:text-white"
                            >
                              ✕
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmDeleteContactId(c._id)}
                            className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-md"
                            title="Delete contact message from MongoDB"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-white">{c.name}</h4>
                      <p className="text-xs text-slate-400">{c.email} • {c.phone || "No Phone"}</p>
                    </div>

                    {c.subject && (
                      <span className="text-xs font-semibold text-amber-300 block">{c.subject}</span>
                    )}

                    {c.message && (
                      <p className="text-xs text-slate-300 bg-white/5 p-2.5 rounded-xl border border-white/5 leading-relaxed">
                        {c.message}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: ENGINEERS' DAY ARENAS OVERVIEW                              */}
        {/* ================================================================= */}
        {activeTab === "arenas" && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-[#0b1126]/80 border border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Engineers' Day Live Competitions</h3>
                <p className="text-xs text-slate-400">Total registrations across all 13 arenas.</p>
              </div>
              <Badge className="bg-cyan-500/10 text-cyan-300 border-cyan-500/30 text-xs font-mono">
                {eventStats?.totalRegistrations ?? 0} Total Registrations
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {eventStats?.breakdown?.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-[#090e21]/90 border border-white/10 shadow-lg flex items-center justify-between"
                >
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                      Arena #{idx + 1}
                    </span>
                    <h4 className="text-sm font-bold text-white capitalize">
                      {item.eventSlug.replace(/-/g, " ")}
                    </h4>
                    <span className="text-[11px] font-mono text-cyan-400/80">
                      Collection: {item.collectionName}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-2xl font-black font-space text-white">{item.count}</span>
                    <span className="text-[10px] text-slate-400 block">entries</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* PROMOTION MODAL: REASSIGN ROLE & DISPATCH CURATED PROMOTION ID CARD */}
        {/* ================================================================= */}
        {promotingMember && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
            <div className="bg-[#090e21] border border-amber-500/40 rounded-2xl sm:rounded-3xl p-5 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-5 relative my-auto">
              {/* Gold Top Accent Line */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />

              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono tracking-wider text-amber-300 uppercase">
                    <Crown className="w-3 h-3 text-amber-400 fill-amber-400" />
                    Leadership Elevation Portal
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black font-space text-white tracking-tight">
                    Promote Club Member
                  </h3>
                  <p className="text-xs text-slate-400">
                    Reassign designation and automatically dispatch an official curated promotion congratulations email with their updated Digital Leadership ID Card.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPromotingMember(null)}
                  disabled={isPromoting}
                  className="text-slate-400 hover:text-white p-2 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Member Overview Card */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-4">
                {promotingMember.photo ? (
                  <img
                    src={promotingMember.photo}
                    alt={promotingMember.name}
                    className="w-14 h-16 rounded-xl object-cover border-2 border-amber-400/50 shadow-md flex-shrink-0"
                  />
                ) : (
                  <div className="w-14 h-16 rounded-xl bg-amber-500/20 border-2 border-amber-500/40 text-amber-300 font-bold text-lg flex items-center justify-center flex-shrink-0">
                    {promotingMember.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="space-y-1 min-w-0">
                  <h4 className="text-base font-bold text-white truncate font-space">
                    {promotingMember.name}
                  </h4>
                  <p className="text-xs text-slate-400 font-mono">
                    Reg: {promotingMember.regNumber} • {promotingMember.department.toUpperCase()} ({promotingMember.batch})
                  </p>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-400 text-[11px]">Current Designation:</span>
                    <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30 text-[10px] font-mono">
                      {promotingMember.designation || "Member"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Promotion Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-amber-300 font-bold mb-1.5">
                    Elevated Club Designation <span className="text-red-400">*</span>
                  </label>
                  <Input
                    id="promote-designation-input"
                    placeholder="e.g. Lead Technical Architect, Event Head, Technical Coordinator..."
                    value={promoDesignation}
                    onChange={(e) => setPromoDesignation(e.target.value)}
                    className="bg-white/5 border-white/15 text-white text-sm rounded-xl focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-blue-300 font-bold mb-1.5">
                    Role Assignee / Division
                  </label>
                  <Input
                    id="promote-role-assignee-input"
                    placeholder="e.g. President and Committee Members of the Club, Core Committee..."
                    value={promoRoleAssignee}
                    onChange={(e) => setPromoRoleAssignee(e.target.value)}
                    className="bg-white/5 border-white/15 text-white text-sm rounded-xl focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                  />
                </div>

                {/* Role Progression Preview Pill */}
                {promoDesignation.trim() && (
                  <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-transparent border border-amber-500/20 text-xs flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <div className="text-[11px] text-slate-300">
                      Progression: <span className="line-through text-slate-500">{promotingMember.designation || "Member"}</span> &nbsp;➔&nbsp; <strong className="text-amber-300 font-bold">{promoDesignation.trim()}</strong>
                    </div>
                  </div>
                )}

                {/* Delivery Notice Callout */}
                <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-200/90 text-xs flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-relaxed">
                    <strong>Automatic Dispatch:</strong> Upon confirmation, a curated <strong>Leadership Promotion Announcement</strong> and an updated <strong>TechVerse Digital ID Card</strong> will be instantly delivered to <code className="text-cyan-300 font-mono break-all">{promotingMember.email}</code>.
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setPromotingMember(null)}
                  disabled={isPromoting}
                  className="text-slate-400 hover:text-white text-xs font-semibold rounded-xl w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  id="confirm-promotion-btn"
                  type="button"
                  onClick={handleConfirmPromotion}
                  disabled={isPromoting || !promoDesignation.trim()}
                  className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-black rounded-xl px-5 py-2.5 shadow-lg shadow-amber-500/25 border border-amber-300/40 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto"
                >
                  {isPromoting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Promoting &amp; Dispatching ID Card...</span>
                    </>
                  ) : (
                    <>
                      <Crown className="w-4 h-4 text-slate-950 fill-slate-950" />
                      <span>Confirm Promotion &amp; Send ID Card 🪪</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* RESIGNATION ACCEPTANCE MODAL */}
        {resigningMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <div className="relative w-full max-w-lg rounded-3xl bg-[#0b1126] border border-amber-500/30 p-5 sm:p-7 max-h-[90vh] overflow-y-auto shadow-2xl space-y-4 sm:space-y-5 my-auto">
              <button
                type="button"
                onClick={() => setResigningMember(null)}
                className="absolute top-4 right-4 sm:top-5 sm:right-5 p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center flex-shrink-0">
                  <UserMinus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-space">
                    Accept Formal Resignation
                  </h3>
                  <p className="text-xs text-slate-400">
                    Offboard member gracefully and archive records
                  </p>
                </div>
              </div>

              {/* Member Summary */}
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {resigningMember.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-white truncate">{resigningMember.name}</h4>
                  <p className="text-xs text-slate-400 font-mono truncate">
                    {resigningMember.designation} • Reg: {resigningMember.regNumber}
                  </p>
                </div>
              </div>

              {/* Remarks Field */}
              <div className="space-y-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-amber-300 font-bold">
                  Resignation Remarks / Reason
                </label>
                <Input
                  id="resignation-remarks-input"
                  placeholder="e.g. Duty completed with excellence. Relieved in good standing for future career growth."
                  value={resignationRemarks}
                  onChange={(e) => setResignationRemarks(e.target.value)}
                  className="bg-white/5 border-white/15 text-white text-xs rounded-xl focus:border-amber-400"
                />
              </div>

              {/* Email Toggle */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="send-resignation-email-check"
                  checked={sendResignationEmail}
                  onChange={(e) => setSendResignationEmail(e.target.checked)}
                  className="mt-0.5 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="send-resignation-email-check" className="text-xs text-amber-200 cursor-pointer">
                  <strong>Dispatch Curated Career-Growth Resignation Email:</strong> Sends a warm commendation &amp; farewell letter on behalf of President and Committee Members of the Club thanking the member for outstanding duty completion and wishing them exponential career growth.
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setResigningMember(null)}
                  disabled={isSubmittingResignation}
                  className="text-slate-400 hover:text-white text-xs font-semibold rounded-xl w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  id="confirm-resignation-btn"
                  type="button"
                  onClick={handleConfirmResignation}
                  disabled={isSubmittingResignation}
                  className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 text-xs font-bold rounded-xl px-5 py-2.5 shadow-md flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  {isSubmittingResignation ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Processing Resignation...</span>
                    </>
                  ) : (
                    <>
                      <UserMinus className="w-3.5 h-3.5" />
                      <span>Accept Resignation</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* DISCIPLINARY TERMINATION MODAL */}
        {terminatingMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <div className="relative w-full max-w-lg rounded-3xl bg-[#0e0a14] border-2 border-red-500/50 p-5 sm:p-7 max-h-[90vh] overflow-y-auto shadow-2xl space-y-4 sm:space-y-5 my-auto">
              <button
                type="button"
                onClick={() => setTerminatingMember(null)}
                className="absolute top-4 right-4 sm:top-5 sm:right-5 p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/40 text-red-400 flex items-center justify-center flex-shrink-0">
                  <UserX className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-space">
                    Conclude Membership &amp; Revoke Credentials
                  </h3>
                  <p className="text-xs text-red-300">
                    Polite notification &amp; deactivation of official club privileges
                  </p>
                </div>
              </div>

              {/* Member Summary */}
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-600/30 text-red-200 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {terminatingMember.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-white truncate">{terminatingMember.name}</h4>
                  <p className="text-xs text-slate-400 font-mono truncate">
                    {terminatingMember.designation} • Reg: {terminatingMember.regNumber}
                  </p>
                </div>
              </div>

              {/* Punishable Offense Reason Select */}
              <div className="space-y-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-red-300 font-bold">
                  Reason for Membership Conclusion <span className="text-red-400">*</span>
                </label>
                <select
                  id="termination-reason-select"
                  value={terminationReason}
                  onChange={(e) => setTerminationReason(e.target.value)}
                  className="w-full bg-white/5 border border-red-500/30 text-white text-xs px-3 py-2.5 rounded-xl focus:outline-none focus:border-red-400"
                >
                  <option value="Sharing club IDs for bunking classes (Strict Disciplinary Violation)" className="bg-[#0b1126] text-white">
                    Sharing club IDs for bunking classes (Strict Disciplinary Violation)
                  </option>
                  <option value="Casual approach towards assigned tasks & deliverables" className="bg-[#0b1126] text-white">
                    Casual approach towards assigned tasks &amp; deliverables
                  </option>
                  <option value="Prolonged inactivity in community & unexcused meeting absence" className="bg-[#0b1126] text-white">
                    Prolonged inactivity in community &amp; unexcused meeting absence
                  </option>
                  <option value="Non-alignment with Club Code of Conduct & guidelines" className="bg-[#0b1126] text-white">
                    Non-alignment with Club Code of Conduct &amp; guidelines
                  </option>
                  <option value="Other" className="bg-[#0b1126] text-white">
                    Other Reason (Specify below)
                  </option>
                </select>

                {terminationReason === "Other" && (
                  <Input
                    placeholder="Specify exact disciplinary reason..."
                    value={customTerminationReason}
                    onChange={(e) => setCustomTerminationReason(e.target.value)}
                    className="mt-2 bg-white/5 border-red-500/30 text-white text-xs rounded-xl focus:border-red-400"
                  />
                )}
              </div>

              {/* Fine Amount & Remarks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-red-300 font-bold mb-1">
                    Administrative Clearance Fine (₹)
                  </label>
                  <Input
                    id="termination-fine-input"
                    type="number"
                    placeholder="1000"
                    value={fineAmount}
                    onChange={(e) => setFineAmount(e.target.value)}
                    className="bg-white/5 border-red-500/30 text-white text-xs rounded-xl focus:border-red-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 font-bold mb-1">
                    Disciplinary Remarks
                  </label>
                  <Input
                    id="termination-remarks-input"
                    placeholder="e.g. Fine to be cleared at SOET office"
                    value={terminationRemarks}
                    onChange={(e) => setTerminationRemarks(e.target.value)}
                    className="bg-white/5 border-white/10 text-white text-xs rounded-xl focus:border-red-400"
                  />
                </div>
              </div>

              {/* Email Notice Toggle */}
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="send-termination-email-check"
                  checked={sendTerminationEmail}
                  onChange={(e) => setSendTerminationEmail(e.target.checked)}
                  className="mt-0.5 rounded border-red-400 text-red-600 focus:ring-red-500"
                />
                <label htmlFor="send-termination-email-check" className="text-xs text-red-200 cursor-pointer">
                  <strong>Dispatch Curated Soft-Toned Notice Email:</strong> Sends a polite, respectful message to <code className="text-red-300 font-mono break-all">{terminatingMember.email}</code> gently explaining the status update, referencing clearance formalities (₹{fineAmount || 1000}), and wishing them well academically.
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setTerminatingMember(null)}
                  disabled={isSubmittingTermination}
                  className="text-slate-400 hover:text-white text-xs font-semibold rounded-xl w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  id="confirm-termination-btn"
                  type="button"
                  onClick={handleConfirmTermination}
                  disabled={isSubmittingTermination}
                  className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold rounded-xl px-5 py-2.5 shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  {isSubmittingTermination ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Concluding Membership...</span>
                    </>
                  ) : (
                    <>
                      <UserX className="w-3.5 h-3.5" />
                      <span>Conclude Membership &amp; Notify</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
