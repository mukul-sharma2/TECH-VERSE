import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Eye, RefreshCw, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  deleteEventInterestRegistration,
  EventInterestRegistration,
  EventInterestRegistrationStats,
  getEventInterestRegistrations,
  getEventInterestRegistrationStats,
} from "@/services/api";

const interestOptions = [
  "Yes, I'm interested.",
  "No, I'm not interested.",
  "Maybe, I need more information.",
];

const csvCell = (value: string) => {
  const safeValue = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safeValue.replace(/"/g, '""')}"`;
};

const EventInterestRegistrations = () => {
  const [registrations, setRegistrations] = useState<EventInterestRegistration[]>([]);
  const [stats, setStats] = useState<EventInterestRegistrationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [batch, setBatch] = useState("all");
  const [program, setProgram] = useState("all");
  const [section, setSection] = useState("all");
  const [interest, setInterest] = useState("all");
  const [selectedRegistration, setSelectedRegistration] = useState<EventInterestRegistration | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadRegistrations = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [registrationData, statsData] = await Promise.all([
        getEventInterestRegistrations(),
        getEventInterestRegistrationStats(),
      ]);
      setRegistrations(registrationData);
      setStats(statsData);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Could not load event registrations.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRegistrations();
  }, [loadRegistrations]);

  const distinct = (key: "batch" | "program" | "section") =>
    Array.from(new Set(registrations.map((registration) => registration[key]).filter(Boolean))).sort();

  const filteredRegistrations = useMemo(() => {
    const query = search.trim().toLowerCase();
    return registrations.filter((registration) => (
      (!query || registration.fullName.toLowerCase().includes(query) || registration.registrationNumber.toLowerCase().includes(query)) &&
      (batch === "all" || registration.batch === batch) &&
      (program === "all" || registration.program === program) &&
      (section === "all" || registration.section === section) &&
      (interest === "all" || registration.interested === interest)
    ));
  }, [registrations, search, batch, program, section, interest]);

  const handleDelete = async (registration: EventInterestRegistration) => {
    if (!window.confirm(`Delete the registration for ${registration.fullName}? This cannot be undone.`)) return;

    setDeletingId(registration._id);
    try {
      await deleteEventInterestRegistration(registration._id);
      setRegistrations((current) => current.filter((item) => item._id !== registration._id));
      setSelectedRegistration(null);
      setStats(null);
      toast.success("Event registration deleted.");
      try {
        setStats(await getEventInterestRegistrationStats());
      } catch {
        toast.error("Registration deleted, but the summary counts could not be refreshed.");
      }
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "Could not delete the registration.";
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  const exportCsv = () => {
    const headers = ["Student Name", "Batch", "Program", "Section", "Registration Number", "Interest Status", "Registration Date"];
    const rows = filteredRegistrations.map((registration) => [
      registration.fullName,
      registration.batch,
      registration.program,
      registration.section,
      registration.registrationNumber,
      registration.interested,
      new Date(registration.createdAt).toISOString(),
    ]);
    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
    const downloadUrl = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = "college-event-registrations.csv";
    link.click();
    URL.revokeObjectURL(downloadUrl);
  };

  const statCards = [
    { label: "Total registrations", value: stats?.totalRegistrations, color: "text-white", border: "border-white/10" },
    { label: "Interested students", value: stats?.interested, color: "text-emerald-300", border: "border-emerald-400/20" },
    { label: "Not interested", value: stats?.notInterested, color: "text-rose-300", border: "border-rose-400/20" },
    { label: "Maybe", value: stats?.maybe, color: "text-amber-200", border: "border-amber-400/20" },
  ];

  const filterClass = "h-10 rounded-md border border-white/15 bg-[#0b1126] px-3 text-sm text-slate-200";

  return (
    <section className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-white sm:text-2xl">College Event Registrations</h2>
          <p className="mt-1 text-sm text-slate-400">Manage student event interest responses.</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={loadRegistrations} disabled={loading} className="border-white/15 bg-white/5 text-slate-200 hover:bg-white/10">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button type="button" onClick={exportCsv} disabled={filteredRegistrations.length === 0} className="bg-cyan-600 text-white hover:bg-cyan-500">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className={`rounded-2xl border ${card.border} bg-[#0b1126]/80 p-4`}>
            <p className="text-xs font-medium text-slate-400">{card.label}</p>
            <p className={`mt-2 text-2xl font-black ${card.color}`}>{card.value ?? "—"}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3 rounded-2xl border border-white/10 bg-[#0b1126]/80 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by student name or registration number" className="border-white/15 bg-white/5 pl-9 text-white placeholder:text-slate-500" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select aria-label="Filter by batch" value={batch} onChange={(event) => setBatch(event.target.value)} className={filterClass}>
            <option value="all">All batches</option>
            {distinct("batch").map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <select aria-label="Filter by program" value={program} onChange={(event) => setProgram(event.target.value)} className={filterClass}>
            <option value="all">All programs</option>
            {distinct("program").map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <select aria-label="Filter by section" value={section} onChange={(event) => setSection(event.target.value)} className={filterClass}>
            <option value="all">All sections</option>
            {distinct("section").map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <select aria-label="Filter by interest status" value={interest} onChange={(event) => setInterest(event.target.value)} className={filterClass}>
            <option value="all">All interest responses</option>
            {interestOptions.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </div>
      </div>

      {error && (
        <div role="alert" className="flex flex-col gap-3 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200 sm:flex-row sm:items-center sm:justify-between">
          <span>{error}</span>
          <Button type="button" variant="outline" onClick={loadRegistrations} className="border-red-300/30 text-red-100 hover:bg-red-400/10">Try again</Button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1126]/80">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <p className="text-sm text-slate-300">Showing <strong className="text-white">{filteredRegistrations.length}</strong> of {registrations.length}</p>
          <Badge className="border-cyan-400/20 bg-cyan-400/10 text-cyan-200">Interest responses</Badge>
        </div>
        {loading && registrations.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400">Loading event registrations...</p>
        ) : filteredRegistrations.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400">{registrations.length ? "No registrations match these filters." : "No event registrations yet."}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Student Name</th>
                  <th className="px-4 py-3 font-semibold">Batch</th>
                  <th className="px-4 py-3 font-semibold">Program</th>
                  <th className="px-4 py-3 font-semibold">Section</th>
                  <th className="px-4 py-3 font-semibold">Registration Number</th>
                  <th className="px-4 py-3 font-semibold">Interest Status</th>
                  <th className="px-4 py-3 font-semibold">Registration Date</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredRegistrations.map((registration) => (
                  <tr key={registration._id} className="text-slate-300">
                    <td className="px-4 py-3 font-medium text-white">{registration.fullName}</td>
                    <td className="px-4 py-3">{registration.batch}</td>
                    <td className="px-4 py-3">{registration.program}</td>
                    <td className="px-4 py-3">{registration.section}</td>
                    <td className="px-4 py-3 font-mono text-xs">{registration.registrationNumber}</td>
                    <td className="px-4 py-3">{registration.interested}</td>
                    <td className="px-4 py-3">{new Date(registration.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button type="button" variant="ghost" size="icon" aria-label={`View ${registration.fullName}`} onClick={() => setSelectedRegistration(registration)} className="text-cyan-200 hover:bg-cyan-400/10">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" aria-label={`Delete ${registration.fullName}`} disabled={deletingId === registration._id} onClick={() => void handleDelete(registration)} className="text-rose-300 hover:bg-rose-400/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={Boolean(selectedRegistration)} onOpenChange={(open) => !open && setSelectedRegistration(null)}>
        <DialogContent className="border-white/10 bg-[#0b1126] text-slate-100">
          <DialogHeader>
            <DialogTitle>Registration details</DialogTitle>
            <DialogDescription className="text-slate-400">Complete student response for the college event.</DialogDescription>
          </DialogHeader>
          {selectedRegistration && (
            <dl className="grid gap-4 sm:grid-cols-2">
              {[
                ["Full Name", selectedRegistration.fullName],
                ["Batch", selectedRegistration.batch],
                ["Program", selectedRegistration.program],
                ["Section", selectedRegistration.section],
                ["Registration Number", selectedRegistration.registrationNumber],
                ["Interest Response", selectedRegistration.interested],
                ["Registered At", new Date(selectedRegistration.createdAt).toLocaleString()],
                ["Last Updated", new Date(selectedRegistration.updatedAt).toLocaleString()],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <dt className="text-xs text-slate-400">{label}</dt>
                  <dd className="mt-1 break-words text-sm text-white">{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default EventInterestRegistrations;
