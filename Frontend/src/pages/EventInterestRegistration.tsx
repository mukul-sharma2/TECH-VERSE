import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { ArrowDown, ArrowRight, CheckCircle2, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitEventInterestRegistration, submitMementoRegistration } from "@/services/api";

const interestOptions = [
  "Yes, I'm interested.",
  "No, I'm not interested.",
  "Maybe, I need more information.",
];

const highlights = [
  { number: "01", title: "A keepsake", detail: "Mementos for every attendee" },
  { number: "02", title: "A table set for you", detail: "Lunch and complimentary snacks" },
  { number: "03", title: "The Fashion Walk", detail: "An evening of style and self-expression" },
  { number: "04", title: "On stage", detail: "Dance and singing performances" },
  { number: "05", title: "Live music", detail: "A live band, followed by the DJ" },
  { number: "06", title: "Play along", detail: "Truth or Dare, Balloon Finder and Spin the Wheel" },
  { number: "07", title: "Little surprises", detail: "Goodies and prizes for the games" },
  { number: "08", title: "A moment in the spotlight", detail: "Mr. Handsome and Mrs. Beautiful awards" },
  { number: "09", title: "Room to rehearse", detail: "Rooms and accommodation arranged for rehearsals" },
];

const EventInterestRegistration = () => {
  const [form, setForm] = useState({
    fullName: "",
    batch: "",
    program: "",
    section: "",
    registrationNumber: "",
    interested: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [mementoForm, setMementoForm] = useState({ name: "", regNo: "", program: "" });
  const [mementoPhoto, setMementoPhoto] = useState<File | null>(null);
  const [mementoPhotoPreview, setMementoPhotoPreview] = useState("");
  const [isMementoSubmitting, setIsMementoSubmitting] = useState(false);
  const [mementoError, setMementoError] = useState("");
  const [mementoSubmitted, setMementoSubmitted] = useState(false);

  useEffect(() => {
    return () => {
      if (mementoPhotoPreview) URL.revokeObjectURL(mementoPhotoPreview);
    };
  }, [mementoPhotoPreview]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await submitEventInterestRegistration(form);
      setSubmitted(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit your response. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMementoPhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (file && file.size > 5 * 1024 * 1024) {
      setMementoPhoto(null);
      setMementoPhotoPreview("");
      setMementoError("Please choose an image smaller than 5 MB.");
      event.target.value = "";
      return;
    }

    setMementoError("");
    setMementoPhoto(file);
    setMementoPhotoPreview(file ? URL.createObjectURL(file) : "");
  };

  const handleMementoSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMementoError("");

    if (!mementoPhoto) {
      setMementoError("Please choose a photo for your memento.");
      return;
    }

    const formData = new FormData();
    formData.append("name", mementoForm.name);
    formData.append("regNo", mementoForm.regNo);
    formData.append("program", mementoForm.program);
    formData.append("photo", mementoPhoto);

    setIsMementoSubmitting(true);
    try {
      await submitMementoRegistration(formData);
      setMementoSubmitted(true);
    } catch (submitError) {
      setMementoError(submitError instanceof Error ? submitError.message : "Unable to submit your memento details. Please try again.");
    } finally {
      setIsMementoSubmitting(false);
    }
  };

  return (
    <main className="event-interest-page bg-[#F5F0E7] text-[#352A25]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap');
        .event-interest-page { font-family: 'DM Sans', sans-serif; }
        .event-interest-page .gala-display { font-family: 'Playfair Display', Georgia, serif; }
        .event-interest-page .gala-hero {
          background-position: center;
          background-size: cover;
        }
        @media (min-width: 1024px) {
          .event-interest-page .gala-hero {
            background-position: center 56%;
            background-size: auto 128%;
          }
        }
        body:has(.event-interest-page) #root > nav {
          background: rgba(23, 22, 21, .96) !important;
          border-color: rgba(184, 154, 98, .35) !important;
          color: #F5F0E7 !important;
        }
        body:has(.event-interest-page) #root > nav h1,
        body:has(.event-interest-page) #root > nav a {
          color: #F5F0E7 !important;
        }
        body:has(.event-interest-page) #root > nav a:hover {
          background: rgba(184, 154, 98, .14) !important;
          color: #F5F0E7 !important;
        }
        body:has(.event-interest-page) #root > nav a[href="/events/codecrafter"] {
          animation: none !important;
          background: transparent !important;
          border-color: transparent !important;
          box-shadow: none !important;
          color: #DED3C1 !important;
          font-family: 'DM Sans', sans-serif !important;
          letter-spacing: normal !important;
          text-shadow: none !important;
          transform: none !important;
        }
        body:has(.event-interest-page) #root > nav button {
          color: #F5F0E7 !important;
        }
      `}</style>

      <section
        aria-labelledby="event-title"
        className="gala-hero relative flex min-h-[min(860px,100svh)] items-center overflow-hidden bg-[#171615] px-5 pb-14 pt-36 text-[#F5F0E7] sm:px-8 sm:pb-20 lg:px-14"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(23,22,21,.82) 0%, rgba(23,22,21,.62) 48%, rgba(23,22,21,.24) 100%), linear-gradient(0deg, rgba(23,22,21,.62), transparent 56%), url('https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=2400&q=85')",
        }}
      >
        <div className="relative mx-auto grid w-full max-w-[1440px] gap-12 lg:grid-cols-[minmax(0,1fr)_250px] lg:items-center">
          <div className="max-w-4xl">
            <p className="mb-6 text-[11px] font-semibold uppercase tracking-[0.32em] text-[#DED3C1]">
              CT University · A celebration together
            </p>
            <h1 id="event-title" className="gala-display max-w-4xl text-[clamp(2.2rem,8.5vw,8rem)] font-normal uppercase leading-[.94] tracking-[-0.045em] text-[#F5F0E7]">
              An evening<br />to remember
            </h1>
            <div className="my-7 flex items-center gap-4" aria-hidden="true">
              <span className="h-px w-14 bg-[#B89A62]" />
              <span className="h-1.5 w-1.5 rotate-45 bg-[#B89A62]" />
            </div>
            <p className="text-sm font-medium tracking-[0.13em] text-[#F5F0E7]/90 sm:text-base">
              Music. Celebration. Memories.
            </p>
            <a
              href="#registration"
              className="mt-9 inline-flex min-h-12 items-center gap-5 border border-[#B89A62] bg-[#B89A62] px-5 text-xs font-bold uppercase tracking-[0.15em] text-[#171615] transition-colors hover:border-[#DED3C1] hover:bg-[#DED3C1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#B89A62]"
            >
              Register your interest <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <div className="hidden border-l border-[#F5F0E7]/35 pb-1 pl-6 lg:block">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#B89A62]">The college celebration</p>
            <p className="gala-display mt-3 text-2xl leading-snug text-[#F5F0E7]">
              Good company.<br />A night to share.
            </p>
            <p className="mt-4 text-xs leading-5 text-[#F5F0E7]/70">
              Tell us if you would like to be part of the evening.
            </p>
          </div>
        </div>
        <a href="#event-details" aria-label="Scroll to event details" className="absolute bottom-7 right-6 hidden items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#F5F0E7]/75 transition-colors hover:text-white sm:flex lg:right-14">
          Discover the evening <ArrowDown className="h-3.5 w-3.5 text-[#B89A62]" />
        </a>
      </section>

      <section id="event-details" className="px-5 py-20 sm:px-8 sm:py-28 lg:px-14">
        <div className="mx-auto grid max-w-[1240px] gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-[#642F38]">A few things to look forward to</p>
            <h2 className="gala-display mt-5 text-4xl font-normal leading-[1.08] tracking-[-0.025em] text-[#352A25] sm:text-5xl">
              Made for<br />the moments<br />we remember.
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-6 text-[#352A25]/75">
              An evening of performances, good food and a little friendly competition—planned for the whole college community.
            </p>

            <div className="mt-10 border-l-2 border-[#B89A62] pl-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#642F38]">Estimated contribution</p>
              <p className="gala-display mt-2 text-4xl leading-none text-[#352A25]">
                ₹700 <span className="font-sans text-sm font-medium tracking-normal text-[#352A25]/65">approximately / student</span>
              </p>
              <p className="mt-3 max-w-sm text-xs leading-5 text-[#352A25]/70">
                This is an estimate, not the confirmed fee. The final amount will be shared within the next few days.
              </p>
            </div>
          </div>

          <div className="border-t border-[#B9AC98]">
            {highlights.map((item) => (
              <article key={item.number} className="grid grid-cols-[2.5rem_1fr] gap-4 border-b border-[#B9AC98] py-5 sm:grid-cols-[3.5rem_1fr] sm:gap-6 sm:py-6">
                <span className="pt-1 text-[10px] font-semibold tracking-[0.12em] text-[#9A7D4D]">{item.number}</span>
                <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-baseline sm:gap-5">
                  <h3 className="gala-display text-xl text-[#352A25] sm:text-2xl">{item.title}</h3>
                  <p className="max-w-sm text-xs leading-5 text-[#352A25]/70 sm:text-right">{item.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="registration" className="scroll-mt-20 bg-[#171615] px-5 py-20 text-[#F5F0E7] sm:px-8 sm:py-28 lg:px-14">
        <div className="mx-auto grid max-w-[1240px] gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:gap-24">
          <div className="lg:pt-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-[#B89A62]">The guest list begins here</p>
            <h2 className="gala-display mt-5 max-w-md text-4xl font-normal uppercase leading-[1.08] tracking-[-0.025em] sm:text-5xl">
              Be part of<br />the celebration
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-6 text-[#F5F0E7]/70">
              Share your details and let us know if you would like to join us.
            </p>
            <p className="mt-9 border-t border-[#F5F0E7]/20 pt-4 text-[10px] uppercase tracking-[0.16em] text-[#F5F0E7]/55">
              All fields are required
            </p>
          </div>

          <div className="border-t border-[#B89A62] pt-7 sm:pt-9">
            {submitted ? (
              <div role="status" className="max-w-xl border-l-2 border-[#B89A62] bg-[#352A25] p-6 sm:p-8">
                <CheckCircle2 className="mb-5 h-7 w-7 text-[#B89A62]" />
                <h3 className="gala-display text-2xl text-[#F5F0E7] sm:text-3xl">Your response has been recorded.</h3>
                <p className="mt-3 text-sm leading-6 text-[#F5F0E7]/70">
                  Thank you for sharing your interest in the college event.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-7">
                <div>
                  <label htmlFor="event-full-name" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#F5F0E7]/85">Full Name</label>
                  <Input
                    id="event-full-name"
                    autoComplete="name"
                    required
                    maxLength={120}
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className="h-12 rounded-none border-[#DED3C1]/60 bg-[#F5F0E7] px-4 text-sm text-[#352A25] placeholder:text-[#352A25]/45 focus-visible:border-[#B89A62] focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>

                <div className="grid gap-x-6 gap-y-7 sm:grid-cols-2">
                  <div>
                    <label htmlFor="event-batch" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#F5F0E7]/85">Batch</label>
                    <Input id="event-batch" required maxLength={40} value={form.batch} onChange={(e) => setForm({ ...form, batch: e.target.value })} className="h-12 rounded-none border-[#DED3C1]/60 bg-[#F5F0E7] px-4 text-sm text-[#352A25] focus-visible:border-[#B89A62] focus-visible:ring-0 focus-visible:ring-offset-0" />
                  </div>
                  <div>
                    <label htmlFor="event-program" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#F5F0E7]/85">Program</label>
                    <Input id="event-program" required maxLength={120} value={form.program} onChange={(e) => setForm({ ...form, program: e.target.value })} className="h-12 rounded-none border-[#DED3C1]/60 bg-[#F5F0E7] px-4 text-sm text-[#352A25] focus-visible:border-[#B89A62] focus-visible:ring-0 focus-visible:ring-offset-0" />
                  </div>
                  <div>
                    <label htmlFor="event-section" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#F5F0E7]/85">Section</label>
                    <Input id="event-section" required maxLength={40} value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} className="h-12 rounded-none border-[#DED3C1]/60 bg-[#F5F0E7] px-4 text-sm text-[#352A25] focus-visible:border-[#B89A62] focus-visible:ring-0 focus-visible:ring-offset-0" />
                  </div>
                  <div>
                    <label htmlFor="event-registration-number" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#F5F0E7]/85">Registration Number</label>
                    <Input id="event-registration-number" required maxLength={50} value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} className="h-12 rounded-none border-[#DED3C1]/60 bg-[#F5F0E7] px-4 text-sm text-[#352A25] focus-visible:border-[#B89A62] focus-visible:ring-0 focus-visible:ring-offset-0" />
                  </div>
                </div>

                <fieldset>
                  <legend className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#F5F0E7]/85">
                    Interest status
                  </legend>
                  <div className="grid gap-2">
                    {interestOptions.map((option) => (
                      <label
                        key={option}
                        className={`flex min-h-12 cursor-pointer items-center gap-3 border px-4 py-3 text-sm transition-colors ${
                          form.interested === option
                            ? "border-[#B89A62] bg-[#352A25] text-[#F5F0E7]"
                            : "border-[#F5F0E7]/20 text-[#F5F0E7]/75 hover:border-[#DED3C1]/60"
                        }`}
                      >
                        <input
                          type="radio"
                          name="interested"
                          value={option}
                          required
                          checked={form.interested === option}
                          onChange={(e) => setForm({ ...form, interested: e.target.value })}
                          className="h-4 w-4 accent-[#B89A62] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B89A62]"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                {error && (
                  <p role="alert" className="border-l-2 border-[#B89A62] bg-[#642F38] px-4 py-3 text-sm leading-5 text-[#F5F0E7]">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-12 w-full justify-between rounded-none bg-[#B89A62] px-5 text-xs font-bold uppercase tracking-[0.15em] text-[#171615] transition-colors hover:bg-[#DED3C1] focus-visible:ring-2 focus-visible:ring-[#B89A62] focus-visible:ring-offset-2 focus-visible:ring-offset-[#171615] sm:w-auto sm:min-w-64"
                >
                  {isSubmitting ? "Submitting response..." : "Submit your interest"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>

      <section id="memento-registration" className="scroll-mt-20 bg-[#DED3C1]/45 px-5 py-20 sm:px-8 sm:py-28 lg:px-14">
        <div className="mx-auto grid max-w-[1240px] gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:gap-24">
          <div className="lg:pt-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-[#642F38]">A keepsake of the evening</p>
            <h2 className="gala-display mt-5 max-w-md text-4xl font-normal leading-[1.08] tracking-[-0.025em] text-[#352A25] sm:text-5xl">
              Make your<br />memento personal
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-6 text-[#352A25]/75">
              Share your details and a photo to help us prepare your event memento.
            </p>
            <p className="mt-9 border-t border-[#352A25]/15 pt-4 text-[10px] uppercase tracking-[0.16em] text-[#352A25]/60">
              All four fields are required
            </p>
          </div>

          <div className="border-t border-[#B89A62] pt-7 sm:pt-9">
            {mementoSubmitted ? (
              <div role="status" className="max-w-xl border-l-2 border-[#B89A62] bg-[#F5F0E7] p-6 sm:p-8">
                <CheckCircle2 className="mb-5 h-7 w-7 text-[#9A7D4D]" />
                <h3 className="gala-display text-2xl text-[#352A25] sm:text-3xl">Your memento details have been received.</h3>
                <p className="mt-3 text-sm leading-6 text-[#352A25]/70">Thank you. We look forward to seeing you at the event.</p>
              </div>
            ) : (
              <form onSubmit={handleMementoSubmit} className="space-y-7">
                <div className="grid gap-x-6 gap-y-7 sm:grid-cols-2">
                  <div>
                    <label htmlFor="memento-name" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#352A25]/85">Name</label>
                    <Input
                      id="memento-name"
                      autoComplete="name"
                      required
                      maxLength={120}
                      value={mementoForm.name}
                      onChange={(e) => setMementoForm({ ...mementoForm, name: e.target.value })}
                      className="h-12 rounded-none border-[#B9AC98] bg-[#F5F0E7] px-4 text-sm text-[#352A25] focus-visible:border-[#9A7D4D] focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                  <div>
                    <label htmlFor="memento-reg-no" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#352A25]/85">Registration Number</label>
                    <Input
                      id="memento-reg-no"
                      required
                      maxLength={50}
                      value={mementoForm.regNo}
                      onChange={(e) => setMementoForm({ ...mementoForm, regNo: e.target.value })}
                      className="h-12 rounded-none border-[#B9AC98] bg-[#F5F0E7] px-4 text-sm text-[#352A25] focus-visible:border-[#9A7D4D] focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="memento-program" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#352A25]/85">Program</label>
                    <Input
                      id="memento-program"
                      required
                      maxLength={120}
                      value={mementoForm.program}
                      onChange={(e) => setMementoForm({ ...mementoForm, program: e.target.value })}
                      className="h-12 rounded-none border-[#B9AC98] bg-[#F5F0E7] px-4 text-sm text-[#352A25] focus-visible:border-[#9A7D4D] focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="memento-photo" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#352A25]/85">Photo</label>
                  <label htmlFor="memento-photo" className="group flex min-h-44 cursor-pointer items-center justify-center overflow-hidden border border-dashed border-[#9A7D4D]/60 bg-[#F5F0E7] transition-colors hover:border-[#642F38]">
                    {mementoPhotoPreview ? (
                      <div className="flex w-full flex-col items-center gap-3 p-4 sm:flex-row sm:justify-between">
                        <img src={mementoPhotoPreview} alt="Selected memento photo preview" className="h-32 w-32 object-cover" />
                        <span className="max-w-full break-all text-sm text-[#352A25]/75">{mementoPhoto?.name}</span>
                        <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.14em] text-[#642F38]">Change photo</span>
                      </div>
                    ) : (
                      <span className="flex flex-col items-center gap-3 px-5 py-8 text-center">
                        <ImagePlus className="h-6 w-6 text-[#9A7D4D]" />
                        <span className="text-sm text-[#352A25]">Choose a photo</span>
                        <span className="text-xs text-[#352A25]/60">JPEG, PNG, WebP, GIF or AVIF · Up to 5 MB</span>
                      </span>
                    )}
                    <input
                      id="memento-photo"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                      required
                      onChange={handleMementoPhotoChange}
                      className="sr-only"
                    />
                  </label>
                </div>

                {mementoError && (
                  <p role="alert" className="border-l-2 border-[#642F38] bg-[#642F38] px-4 py-3 text-sm leading-5 text-[#F5F0E7]">
                    {mementoError}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={isMementoSubmitting}
                  className="h-12 w-full justify-between rounded-none bg-[#642F38] px-5 text-xs font-bold uppercase tracking-[0.15em] text-[#F5F0E7] transition-colors hover:bg-[#352A25] focus-visible:ring-2 focus-visible:ring-[#B89A62] focus-visible:ring-offset-2 focus-visible:ring-offset-[#DED3C1] sm:w-auto sm:min-w-64"
                >
                  {isMementoSubmitting ? "Submitting memento details..." : "Submit memento details"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>

      <div className="flex items-center justify-between gap-4 px-5 py-5 text-[10px] font-semibold uppercase tracking-[0.17em] text-[#352A25]/65 sm:px-8 lg:px-14">
        <span>CT University · College Event</span>
        <a href="#event-title" className="transition-colors hover:text-[#642F38]">Back to the beginning ↑</a>
      </div>
    </main>
  );
};

export default EventInterestRegistration;
