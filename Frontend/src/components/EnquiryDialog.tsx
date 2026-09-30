import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { submitClubMember } from "@/services/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Printer,
  ShieldCheck,
  Building2,
  Home as HomeIcon,
  RefreshCw,
  X,
  Phone,
  UserCheck,
  Sparkles,
  IdCard,
  UserCog,
  Clock,
  Mail,
  ShieldAlert,
  AlertTriangle,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
} from "lucide-react";

import UniversityLogo from "@/assets/univeee-logo.png";
import TechverseLogo from "@/assets/techverse-logo.jpg";
import SoetLogo from "@/assets/soet-logo.png";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  regNumber: z
    .string()
    .min(1, { message: "Registration number is required" })
    .regex(/^\d+$/, { message: "Registration number must contain only numbers (digits 0-9)" }),
  contact: z
    .string()
    .regex(/^\d{10}$/, { message: "Enter a valid 10-digit contact number" }),
  email: z.string().email({ message: "Enter a valid email address" }),
  department: z.enum(["btech", "bca", "mca", "mtech"], {
    required_error: "Please select a department",
  }),
  specialization: z.string().optional(),
  batch: z.string().min(1, { message: "Please select a batch" }),
  residenceType: z.enum(["Hosteller", "Day Scholar"], {
    required_error: "Please select if you are a Hosteller or Day Scholar",
  }),
  photo: z.string().optional(),
  interests: z
    .array(z.string())
    .min(1, { message: "Select at least one area of interest" }),
  otherInterest: z.string().optional(),
  clubConsent: z.boolean().refine((val) => val === true, {
    message: "You must read and agree to the club commitment and disciplinary terms before submitting.",
  }),
});

type FormData = z.infer<typeof formSchema>;

interface SubmittedMemberData extends FormData {
  specialization?: string;
  designation?: string;
  roleAssignee?: string;
  memberId?: string;
  serialNumber?: number;
  issuedAt?: string;
}

interface EnquiryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const areasOfInterest = [
  "Coding & App/Web Development",
  "AI/ML & Data Science",
  "Event Management & Leadership",
  "Cybersecurity & Forensics",
  "Designing (UI/UX, Posters, Branding)",
  "Content Creation & Social Media",
  "Social Media Reel Expert",
  "Other",
];

export function EnquiryDialog({ open, onOpenChange }: EnquiryDialogProps) {
  const [showOther, setShowOther] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submittedMember, setSubmittedMember] = useState<SubmittedMemberData | null>(null);
  const [isBatchCalendarOpen, setIsBatchCalendarOpen] = useState(false);
  const [calendarBaseYear, setCalendarBaseYear] = useState(2020);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      regNumber: "",
      contact: "",
      email: "",
      department: "btech",
      batch: "2024-2028",
      specialization: "",
      residenceType: "Hosteller",
      photo: "",
      interests: ["Coding & App/Web Development"],
      otherInterest: "",
      clubConsent: false,
    },
  });

  const department = form.watch("department");
  const interests = form.watch("interests");

  const getDepartmentDuration = (dept?: string) => {
    if (dept === "mca" || dept === "mtech") return 2;
    if (dept === "bca") return 3;
    return 4; // btech default
  };

  const getDepartmentLabel = (dept?: string) => {
    switch (dept) {
      case "mca":
        return "MCA (2-Year Session)";
      case "mtech":
        return "M.Tech (2-Year Session)";
      case "bca":
        return "BCA (3-Year Session)";
      default:
        return "B.Tech (4-Year Session)";
    }
  };

  const getProgramBadge = (dept?: string) => {
    if (dept === "mca" || dept === "mtech") return "2-Yr Program";
    if (dept === "bca") return "3-Yr Program";
    return "4-Yr Program";
  };

  const getDepartmentDisplayName = (dept?: string) => {
    switch (dept) {
      case "mtech":
        return "M.Tech";
      case "mca":
        return "MCA";
      case "bca":
        return "BCA";
      default:
        return "B.Tech";
    }
  };

  const getBatchOptions = () => {
    if (department === "mca" || department === "mtech")
      return ["2022-2024", "2023-2025", "2024-2026", "2025-2027", "2026-2028"];
    if (department === "bca")
      return ["2021-2024", "2022-2025", "2023-2026", "2024-2027", "2025-2028"];
    return ["2021-2025", "2022-2026", "2023-2027", "2024-2028", "2025-2029"];
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file is too large! Please upload a photo under 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Optimize to max 400px dimension and 0.75 quality for fast upload
        const maxDim = 400;
        let width = img.width;
        let height = img.height;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
          form.setValue("photo", dataUrl);
          setPhotoPreview(dataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    form.setValue("photo", "");
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onError = (errors: any) => {
    console.error("Form validation errors:", errors);
    const errorKeys = Object.keys(errors);
    if (errorKeys.length > 0) {
      const firstErr = errors[errorKeys[0]];
      toast.error(firstErr?.message || "Please fill in all required fields.");
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    const selectedInterest = data.interests?.[0] || "Coding & App/Web Development";
    const finalInterests = (selectedInterest === "Other" && data.otherInterest?.trim())
      ? [data.otherInterest.trim()]
      : [selectedInterest];

    data.interests = finalInterests;

    const tempMemberId = `TV-${new Date().getFullYear()}-0000`;
    const issuedAt = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const payload = {
      ...data,
      consentGiven: true,
      consentTimestamp: new Date().toISOString(),
      designation: "", // Assigned by President and Committee Members in /admin
      roleAssignee: "",
    };

    try {
      const res = await submitClubMember(payload);
      const savedMember = res?.member || {};
      const actualSerial = savedMember.serialNumber;
      const actualMemberId = savedMember.memberId || tempMemberId;

      toast.success("Application submitted! Screening acknowledgment emailed to your inbox.");
      setSubmittedMember({
        ...payload,
        serialNumber: actualSerial,
        memberId: actualMemberId,
        issuedAt,
      });
    } catch (err: any) {
      console.error("Club member registration error:", err);
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to submit application. Please check your details and try again.";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmittedMember(null);
    setPhotoPreview(null);
    setShowOther(false);
    form.reset();
    onOpenChange(false);
  };

  const handlePrintCard = () => {
    window.print();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleResetAndClose();
        } else {
          onOpenChange(true);
        }
      }}
    >
      <DialogContent className="w-[95%] sm:w-4/5 max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 bg-white rounded-2xl shadow-2xl border border-slate-200">
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #techverse-membership-card, #techverse-membership-card * {
              visibility: visible;
            }
            #techverse-membership-card {
              position: fixed;
              left: 0;
              top: 0;
              width: 100vw;
              margin: 0;
              padding: 24px;
              box-shadow: none !important;
              border: 1px solid #cbd5e1 !important;
              background: white !important;
            }
          }
        `}</style>

        {submittedMember ? (
          /* ======================================================================= */
          /* ✅ SCREENING CONFIRMATION VIEW (POST SUBMISSION)                        */
          /* ======================================================================= */
          <div className="space-y-6 py-4 px-2 sm:px-4 animate-fade-in text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 border-2 border-emerald-400 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-600" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-xs font-black uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
                Screening Process Underway
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-space tracking-tight">
                Application Submitted Successfully! 🎉
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
                Thank you, <strong className="text-slate-900 font-bold">{submittedMember.name}</strong>, for showing interest in <strong className="text-blue-700 font-bold">TechVerse Club</strong>. Your application has been registered and is now under official review.
              </p>
            </div>

            {/* CURATED SCREENING SUMMARY CARD */}
            <div className="bg-gradient-to-b from-slate-50 to-blue-50/50 border-2 border-blue-200 rounded-2xl p-5 sm:p-6 text-left max-w-lg mx-auto shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-blue-100 pb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold block">Application & Serial No.</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    {submittedMember.serialNumber && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-black font-mono text-xs border border-blue-300">
                        #{submittedMember.serialNumber}
                      </span>
                    )}
                    <span className="text-sm font-black font-mono text-blue-800">{submittedMember.memberId}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold block">Submission Date</span>
                  <span className="text-xs font-semibold text-slate-700">{submittedMember.issuedAt}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Registration No.</span>
                  <span className="font-bold text-slate-800 font-mono">{submittedMember.regNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Program &amp; Batch</span>
                  <span className="font-bold text-slate-800">
                    {getDepartmentDisplayName(submittedMember.department)} ({submittedMember.batch})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Residence Status</span>
                  <span className="font-semibold text-slate-700">{submittedMember.residenceType}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Contact</span>
                  <span className="font-semibold text-slate-700">{submittedMember.contact}</span>
                </div>
                {submittedMember.specialization && (
                  <div className="col-span-2 bg-blue-50/70 p-2 rounded-lg border border-blue-100">
                    <span className="text-[10px] uppercase font-bold text-blue-600 block">Specialization / Branch</span>
                    <span className="font-bold text-slate-800 text-xs">{submittedMember.specialization}</span>
                  </div>
                )}
              </div>

              {/* NEXT STEPS CALLOUT */}
              <div className="bg-white p-4 rounded-xl border border-blue-100 space-y-2">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                  <Mail className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>Acknowledgment Email Dispatched</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  A screening confirmation email has been dispatched to <strong className="text-blue-700 font-semibold">{submittedMember.email}</strong> from <strong className="text-slate-800">techverse@ctuniversity.in</strong>.
                </p>
              </div>

              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-amber-700 flex-shrink-0" />
                  <span>President &amp; Club Committee Review</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  The President and Club Committee Members of TechVerse Club will review your profile and audition responses to assign your official <strong>Club Designation</strong> and <strong>Role Assignee</strong> soon.
                </p>
                <p className="text-emerald-700 font-semibold text-[11px] leading-relaxed">
                  Once your designation is assigned in the Admin Portal, your official verified <strong>TechVerse Club Membership Card</strong> will be automatically generated and delivered directly to your email inbox.
                </p>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button
                type="button"
                onClick={handleResetAndClose}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-2.5 rounded-xl shadow-md text-sm"
              >
                Got It, Thank You!
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSubmittedMember(null);
                  form.reset();
                  setPhotoPreview(null);
                }}
                className="font-semibold px-5 py-2.5 rounded-xl text-xs"
              >
                Submit Another Application
              </Button>
            </div>
          </div>
        ) : (
          /* ======================================================================= */
          /* ✅ REGISTRATION FORM VIEW */
          /* ======================================================================= */
          <>
            <DialogHeader className="text-center flex flex-col items-center">
              {/* TechVerse Logo on Top of Form */}
              <div className="flex items-center justify-center mb-3">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 rounded-full blur opacity-35 group-hover:opacity-60 transition duration-300"></div>
                  <img
                    src={TechverseLogo}
                    alt="TechVerse Logo"
                    className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-white shadow-md ring-2 ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="mx-auto inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[11px] font-bold uppercase tracking-wider mb-1">
                <IdCard className="w-3.5 h-3.5 text-blue-600" />
                New Member Joining Portal
              </div>
              <DialogTitle className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
                TechVerse Club — New Member Application
              </DialogTitle>
              <DialogDescription className="text-gray-600 text-sm max-w-xl mx-auto">
                Fill in your details below to become an official member of TechVerse Club. Your verified Club Membership ID Card will be generated and emailed directly from <strong className="text-blue-600 font-medium">techverse@ctuniversity.in</strong>.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit, onError)}
                className="space-y-6 mt-4"
              >
                {/* Photo Upload Section */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <FormLabel className="text-sm font-bold text-slate-800 block mb-2">
                    Upload Your Photograph (For Club ID Card) 📸
                  </FormLabel>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Preview circle / frame */}
                    <div className="relative w-24 h-28 rounded-xl border-2 border-dashed border-blue-400 bg-white overflow-hidden flex items-center justify-center shadow-inner flex-shrink-0">
                      {photoPreview ? (
                        <>
                          <img
                            src={photoPreview}
                            alt="Student preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow"
                            title="Remove photo"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <ImageIcon className="w-8 h-8 mb-1 text-slate-300" />
                          <span className="text-[10px] text-center px-1">Passport Photo</span>
                        </div>
                      )}
                    </div>

                    {/* File Upload Controls */}
                    <div className="flex-1 text-center sm:text-left">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        id="member-photo-upload"
                      />
                      <label
                        htmlFor="member-photo-upload"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-300 font-semibold text-xs sm:text-sm rounded-lg cursor-pointer transition-colors shadow-sm"
                      >
                        <Upload className="w-4 h-4" />
                        {photoPreview ? "Change Photo" : "Select Photo from Device"}
                      </label>
                      <p className="text-xs text-slate-500 mt-1.5">
                        Supported: JPG, PNG, WEBP (Max 5MB). Photo will appear on your generated membership card.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Registration Number */}
                <FormField
                  control={form.control}
                  name="regNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Registration Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. 2024101001"
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={field.value}
                          onChange={(e) => {
                            const numericVal = e.target.value.replace(/\D/g, "");
                            field.onChange(numericVal);
                          }}
                          onKeyDown={(e) => {
                            if (
                              !/^\d$/.test(e.key) &&
                              !["Backspace", "Tab", "Enter", "Delete", "ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key) &&
                              !e.ctrlKey &&
                              !e.metaKey
                            ) {
                              e.preventDefault();
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Contact & Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Number</FormLabel>
                        <FormControl>
                          <Input placeholder="9876543210" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="john@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Department & Batch */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <Select
                          onValueChange={(val) => {
                            field.onChange(val);
                            const currentBatch = form.getValues("batch");
                            const startYr = parseInt(currentBatch?.split("-")[0] || "2024", 10);
                            const dur = getDepartmentDuration(val);
                            form.setValue("batch", `${startYr}-${startYr + dur}`);
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="btech">B.Tech</SelectItem>
                            <SelectItem value="bca">BCA</SelectItem>
                            <SelectItem value="mca">MCA</SelectItem>
                            <SelectItem value="mtech">M.Tech</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="batch"
                    render={({ field }) => {
                      const duration = getDepartmentDuration(department);
                      const years = Array.from({ length: 12 }, (_, i) => calendarBaseYear + i);

                      return (
                        <FormItem className="flex flex-col justify-end">
                          <FormLabel>Batch Session (Calendar Year)</FormLabel>
                          <Popover
                            open={isBatchCalendarOpen}
                            onOpenChange={(isOpen) => {
                              if (isOpen) {
                                const curStart = parseInt(field.value?.split("-")[0] || "2024", 10);
                                if (!isNaN(curStart) && (curStart < calendarBaseYear || curStart > calendarBaseYear + 11)) {
                                  setCalendarBaseYear(Math.floor(curStart / 12) * 12);
                                }
                              }
                              setIsBatchCalendarOpen(isOpen);
                            }}
                          >
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  type="button"
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={isBatchCalendarOpen}
                                  disabled={!department}
                                  className={cn(
                                    "w-full justify-between h-10 px-3 bg-white font-normal hover:bg-slate-50 border border-slate-200 shadow-sm text-left transition-all",
                                    !field.value && "text-muted-foreground",
                                    isBatchCalendarOpen && "ring-2 ring-blue-500/20 border-blue-500"
                                  )}
                                >
                                  <span className="flex items-center gap-2 truncate">
                                    <CalendarIcon className="h-4 w-4 text-blue-600 shrink-0" />
                                    {field.value ? (
                                      <span className="font-semibold text-slate-800">
                                        Batch {field.value}
                                      </span>
                                    ) : (
                                      <span className="text-slate-400">Select Batch Year</span>
                                    )}
                                  </span>
                                  <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 shrink-0 ml-1">
                                    {getProgramBadge(department)}
                                  </span>
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-[330px] p-3.5 bg-white shadow-xl border border-slate-200 rounded-xl z-[100]"
                              align="start"
                              sideOffset={5}
                            >
                              <div className="space-y-3">
                                {/* Calendar Header Navigation */}
                                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setCalendarBaseYear((prev) => prev - 12)}
                                    className="h-7 w-7 p-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md"
                                  >
                                    <ChevronLeft className="h-4 w-4" />
                                  </Button>
                                  <div className="text-center">
                                    <div className="text-xs font-bold text-slate-800 flex items-center justify-center gap-1.5">
                                      <CalendarIcon className="h-3.5 w-3.5 text-blue-600" />
                                      {calendarBaseYear} – {calendarBaseYear + 11}
                                    </div>
                                    <div className="text-[10px] text-slate-500 flex items-center justify-center gap-1 mt-0.5">
                                      <GraduationCap className="h-3 w-3 text-slate-400" />
                                      {getDepartmentLabel(department)}
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setCalendarBaseYear((prev) => prev + 12)}
                                    className="h-7 w-7 p-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md"
                                  >
                                    <ChevronRight className="h-4 w-4" />
                                  </Button>
                                </div>

                                {/* Calendar Year Grid */}
                                <div className="grid grid-cols-3 gap-2">
                                  {years.map((year) => {
                                    const sessionStr = `${year}-${year + duration}`;
                                    const isSelected = field.value === sessionStr;
                                    const isCurrentYear = new Date().getFullYear() === year;

                                    return (
                                      <button
                                        key={year}
                                        type="button"
                                        onClick={() => {
                                          field.onChange(sessionStr);
                                          setIsBatchCalendarOpen(false);
                                        }}
                                        className={cn(
                                          "flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs transition-all relative border",
                                          isSelected
                                            ? "bg-blue-600 text-white border-blue-600 font-bold shadow-md shadow-blue-500/20"
                                            : "bg-white hover:bg-blue-50/70 text-slate-700 border-slate-200 hover:border-blue-300"
                                        )}
                                      >
                                        <span className="text-sm font-semibold">{year}</span>
                                        <span
                                          className={cn(
                                            "text-[10px] leading-tight",
                                            isSelected ? "text-blue-100" : "text-slate-400"
                                          )}
                                        >
                                          → {year + duration}
                                        </span>
                                        {isCurrentYear && !isSelected && (
                                          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-blue-500" />
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* Quick Select Presets */}
                                <div className="pt-2 border-t border-slate-100">
                                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                                    Quick Sessions:
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {getBatchOptions().map((batchOption) => (
                                      <button
                                        key={batchOption}
                                        type="button"
                                        onClick={() => {
                                          field.onChange(batchOption);
                                          setIsBatchCalendarOpen(false);
                                        }}
                                        className={cn(
                                          "text-[11px] px-2 py-0.5 rounded border transition-colors",
                                          field.value === batchOption
                                            ? "bg-blue-600 text-white border-blue-600 font-semibold"
                                            : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                                        )}
                                      >
                                        {batchOption}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </div>

                {/* Specialization / Branch (No dropdown, user types) */}
                <FormField
                  control={form.control}
                  name="specialization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center justify-between">
                        <span>Field of Specialization / Branch</span>
                        <span className="text-[11px] text-slate-400 font-normal">Free text (no dropdown)</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. AI & Machine Learning, Data Science, Cyber Security, Cloud, Full Stack..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Residential Status (Hosteller / Day Scholar) */}
                <FormField
                  control={form.control}
                  name="residenceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Residential Status (Hosteller or Day Scholar)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select residential status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Hosteller">
                            <span className="flex items-center gap-2">
                              🏢 Hosteller
                            </span>
                          </SelectItem>
                          <SelectItem value="Day Scholar">
                            <span className="flex items-center gap-2">
                              🚌 Day Scholar
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Areas of Interest - SINGLE OPTION SELECTION */}
                <FormField
                  control={form.control}
                  name="interests"
                  render={({ field }) => {
                    const selectedInterest = field.value?.[0] || "";

                    return (
                      <FormItem>
                        <div className="mb-2">
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-base font-semibold text-gray-800">
                              Area of Interest
                            </FormLabel>
                            <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                              Choose 1 Option
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Select your single primary domain of focus in TechVerse Club.
                          </p>
                          <FormMessage />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {areasOfInterest.map((interest) => {
                            const isSelected = selectedInterest === interest;

                            return (
                              <div
                                key={interest}
                                onClick={() => {
                                  field.onChange([interest]);
                                  setShowOther(interest === "Other");
                                  if (interest !== "Other") {
                                    form.setValue("otherInterest", "");
                                  }
                                }}
                                className={cn(
                                  "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none",
                                  isSelected
                                    ? "bg-blue-50/90 border-blue-500 shadow-sm ring-1 ring-blue-500/30 text-blue-900 font-medium"
                                    : "bg-white hover:bg-slate-50/80 border-slate-200 text-slate-700"
                                )}
                              >
                                {/* Radio Circle Indicator */}
                                <div
                                  className={cn(
                                    "w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all",
                                    isSelected
                                      ? "border-blue-600 bg-blue-600"
                                      : "border-slate-300 bg-white"
                                  )}
                                >
                                  {isSelected && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                  )}
                                </div>
                                <span className="text-sm font-medium leading-tight">{interest}</span>
                              </div>
                            );
                          })}
                        </div>

                        {showOther && (
                          <FormField
                            control={form.control}
                            name="otherInterest"
                            render={({ field: otherField }) => (
                              <FormItem className="mt-3">
                                <FormLabel>Specify Other Area of Interest</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Type your custom interest or specialization..."
                                    {...otherField}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </FormItem>
                    );
                  }}
                />

                {/* ======================================================================= */}
                {/* ⚠️ MANDATORY DECLARATION & CODE OF CONDUCT CONSENT                      */}
                {/* ======================================================================= */}
                <div className="border-2 border-amber-300 bg-gradient-to-br from-amber-50/70 via-red-50/30 to-slate-50 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3.5">
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 bg-amber-100 border border-amber-300 text-amber-900 rounded-xl flex-shrink-0 mt-0.5">
                      <ShieldAlert className="w-5 h-5 text-amber-700" />
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-red-100 text-red-800 border border-red-200 rounded-md text-[10px] font-black uppercase tracking-wider mb-1">
                        Important • Read &amp; Agree Before Submitting
                      </div>
                      <h4 className="text-sm sm:text-base font-black text-slate-900 leading-snug">
                        Club Commitment &amp; Disciplinary Code of Conduct
                      </h4>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs text-slate-700 leading-relaxed bg-white/90 p-3.5 sm:p-4 rounded-xl border border-amber-200/80 shadow-xs">
                    <div className="flex items-start gap-2.5">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-black text-[11px] flex-shrink-0 mt-0.5">
                        1
                      </span>
                      <p>
                        <strong className="text-slate-900 font-bold">Voluntary Commitment &amp; Punctuality:</strong> It is totally of my own will, interest, and passion to join TechVerse Club. I solemnly pledge to remain active in the community, contribute sincerely, and complete every assigned club task on time.
                      </p>
                    </div>

                    <div className="border-t border-slate-100 pt-2.5 flex items-start gap-2.5">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-800 font-black text-[11px] flex-shrink-0 mt-0.5">
                        2
                      </span>
                      <p>
                        <strong className="text-red-900 font-bold">Strict Disciplinary Actions &amp; Fines:</strong> If found guilty of any punishable act — such as <strong className="text-red-700 font-bold">sharing club IDs for bunking</strong>, taking club work casually, not being active in the community, or failing to attend mandatory club meetings — necessary disciplinary actions will be taken by the department, an <strong className="text-red-700 font-bold">immediate fine of ₹1,000</strong> will be imposed, and I may face suspension or expulsion from TechVerse Club.
                      </p>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="clubConsent"
                    render={({ field }) => (
                      <FormItem className="space-y-1 pt-1">
                        <div className="flex items-start space-x-3">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="mt-0.5 border-slate-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 h-4 w-4 rounded"
                            />
                          </FormControl>
                          <div className="space-y-0.5 leading-tight">
                            <FormLabel className="text-xs sm:text-sm font-bold text-slate-900 cursor-pointer block">
                              I have carefully read, understood, and voluntarily agree to the above commitments and disciplinary terms. <span className="text-red-500">*</span>
                            </FormLabel>
                          </div>
                        </div>
                        <FormMessage className="text-xs font-semibold text-red-600 pl-7" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 text-base sm:text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Submitting Application...
                    </span>
                  ) : (
                    "Submit Application for Review"
                  )}
                </Button>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
