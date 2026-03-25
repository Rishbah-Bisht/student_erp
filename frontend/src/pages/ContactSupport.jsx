import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Phone,
    Mail,
    ChevronDown,
    Building2,
    MapPin,
    LifeBuoy,
    Heart,
    Send,
    MessageSquare,
    ArrowLeft,
} from "lucide-react";

const faqs = {
    General: [
        {
            q: "How do I reset my portal password?",
            a: "Go to Settings > Security and use the 'Update Password' form. You'll need your current password to set a new one.",
        },
        {
            q: "Can I access the portal on my phone?",
            a: "Yes! The portal is fully responsive. For the best experience, you can also install it as a PWA from your browser's menu.",
        },
        {
            q: "How do I update my personal details?",
            a: "Navigate to your Profile page and tap 'Edit Profile'. Changes to official records like name or DOB require admin approval.",
        },
    ],
    Academic: [
        {
            q: "My attendance is marked incorrectly.",
            a: "Attendance is updated by subject faculty. Please contact your teacher directly or visit the HOD office for corrections.",
        },
        {
            q: "Where do I find my timetable?",
            a: "Your class timetable is available under the 'Academics' section on the dashboard. It updates automatically each semester.",
        },
        {
            q: "How are internal marks calculated?",
            a: "Internal marks include assignments, quizzes, and mid-term tests. The weightage breakdown is shown on your results page.",
        },
    ],
    Fees: [
        {
            q: "Where can I find my fee receipts?",
            a: "All your processed payments are listed in the 'Fees' section. Click on any paid month to download the official PDF receipt.",
        },
        {
            q: "What payment methods are accepted?",
            a: "We accept UPI, Net Banking, Debit/Credit cards, and NEFT transfers. Cash payments must be made at the accounts office.",
        },
        {
            q: "What happens if I miss a fee deadline?",
            a: "A late fine may be applied after the due date. Contact the accounts office to request a deadline extension if needed.",
        },
    ],
    Technical: [
        {
            q: "The portal is not loading on my browser.",
            a: "Try clearing your browser cache and cookies. The portal is best experienced on Chrome or Firefox — latest versions.",
        },
        {
            q: "I'm not receiving OTP on my phone.",
            a: "Check your registered mobile number in profile settings. If the number is correct, try after 2 minutes or use email OTP.",
        },
        {
            q: "My documents won't upload.",
            a: "Accepted formats are PDF, JPG, and PNG under 5MB. Rename the file to remove special characters and try again.",
        },
    ],
};

const tabs = ["General", "Academic", "Fees", "Technical"];

const tabColors = {
    General: { bg: "#1a1b4b", text: "#fff" },
    Academic: { bg: "#0f766e", text: "#fff" },
    Fees: { bg: "#b45309", text: "#fff" },
    Technical: { bg: "#7c3aed", text: "#fff" },
};

export default function ContactSupport() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("General");
    const [openFaq, setOpenFaq] = useState(null);
    const [formData, setFormData] = useState({ subject: "", message: "" });
    const [submitted, setSubmitted] = useState(false);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setOpenFaq(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitted(true);
        setTimeout(() => {
            setSubmitted(false);
            setFormData({ subject: "", message: "" });
        }, 3000);
    };

    const activeFaqs = faqs[activeTab];
    const activeColor = tabColors[activeTab];

    return (
        <div
            style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}
            className="bg-[#f4f5f9] min-h-screen text-slate-900 pb-24"
        >
            {/* Hero */}
            <section className="bg-white px-6 pt-12 pb-10 rounded-b-[40px] shadow-sm">
                <div className="max-w-lg mx-auto flex flex-col items-center text-center">
                    <div className="w-full flex justify-start mb-4">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="h-10 w-10 rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 flex items-center justify-center hover:bg-slate-100 transition-colors"
                            aria-label="Go back"
                        >
                            <ArrowLeft size={18} />
                        </button>
                    </div>
                    <div
                        className="w-20 h-20 rounded-[28px] flex items-center justify-center mb-6 transition-colors duration-500"
                        style={{ background: activeColor.bg + "18" }}
                    >
                        <LifeBuoy
                            size={38}
                            strokeWidth={1.5}
                            style={{ color: activeColor.bg }}
                        />
                    </div>
                    <h1 className="text-3xl font-black text-[#1a1b4b] mb-2 tracking-tight leading-tight">
                        How can we help?
                    </h1>
                    <p className="text-slate-400 font-medium max-w-[260px] leading-relaxed text-sm">
                        Browse by category or reach out to our support team directly.
                    </p>
                </div>
            </section>

            {/* Tab Strip */}
            <div className="max-w-2xl mx-auto px-5 py-7">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pb-1">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab;
                        return (
                            <button
                                key={tab}
                                onClick={() => handleTabChange(tab)}
                                className="px-3 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-300 border"
                                style={
                                    isActive
                                        ? {
                                            background: tabColors[tab].bg,
                                            color: tabColors[tab].text,
                                            borderColor: tabColors[tab].bg,
                                            boxShadow: `0 4px 14px ${tabColors[tab].bg}40`,
                                            transform: "translateY(-1px)",
                                        }
                                        : {
                                            background: "#fff",
                                            color: "#94a3b8",
                                            borderColor: "#e2e8f0",
                                        }
                                }
                            >
                                {tab}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* FAQ Section */}
            <section className="max-w-2xl mx-auto px-5 space-y-3">
                <div className="flex items-center gap-2 px-1 mb-4">
                    <div
                        className="w-1 h-4 rounded-full"
                        style={{ background: activeColor.bg }}
                    />
                    <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                        {activeTab} Questions
                    </h2>
                    <span
                        className="ml-auto text-[10px] font-bold px-2.5 py-1 rounded-full"
                        style={{
                            background: activeColor.bg + "14",
                            color: activeColor.bg,
                        }}
                    >
                        {activeFaqs.length} topics
                    </span>
                </div>

                {activeFaqs.map((faq, idx) => {
                    const isOpen = openFaq === idx;
                    return (
                        <div
                            key={`${activeTab}-${idx}`}
                            className="bg-white rounded-[24px] border overflow-hidden transition-all duration-300"
                            style={{
                                borderColor: isOpen ? activeColor.bg + "40" : "#f1f5f9",
                                boxShadow: isOpen
                                    ? `0 4px 20px ${activeColor.bg}14`
                                    : "0 1px 4px rgba(0,0,0,0.04)",
                            }}
                        >
                            <button
                                onClick={() => setOpenFaq(isOpen ? null : idx)}
                                className="w-full px-6 py-5 flex items-center justify-between text-left gap-4"
                            >
                                <span
                                    className="font-bold text-[15px] leading-snug flex-1"
                                    style={{ color: isOpen ? activeColor.bg : "#1a1b4b" }}
                                >
                                    {faq.q}
                                </span>
                                <div
                                    className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300"
                                    style={
                                        isOpen
                                            ? { background: activeColor.bg, color: "#fff" }
                                            : { background: "#f1f5f9", color: "#94a3b8" }
                                    }
                                >
                                    <ChevronDown
                                        size={14}
                                        style={{
                                            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                                            transition: "transform 0.3s ease",
                                        }}
                                    />
                                </div>
                            </button>

                            <div
                                style={{
                                    maxHeight: isOpen ? "200px" : "0px",
                                    opacity: isOpen ? 1 : 0,
                                    overflow: "hidden",
                                    transition: "max-height 0.35s ease, opacity 0.25s ease",
                                }}
                            >
                                <div className="px-6 pb-6">
                                    <p
                                        className="text-sm leading-relaxed font-medium p-4 rounded-2xl"
                                        style={{
                                            background: activeColor.bg + "08",
                                            color: "#475569",
                                            borderLeft: `3px solid ${activeColor.bg}50`,
                                        }}
                                    >
                                        {faq.a}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </section>

            {/* Support Ticket Form */}
            <section className="max-w-2xl mx-auto px-5 mt-10">
                <div className="flex items-center gap-2 px-1 mb-4">
                    <div className="w-1 h-4 rounded-full bg-slate-300" />
                    <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                        Raise a Ticket
                    </h2>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4"
                >
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">
                            Issue Category
                        </label>
                        <input
                            type="text"
                            value={formData.subject}
                            onChange={(e) =>
                                setFormData({ ...formData, subject: e.target.value })
                            }
                            placeholder="e.g., Attendance Correction"
                            required
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-[#1a1b4b] outline-none transition-all placeholder:text-slate-300 placeholder:font-normal"
                            style={{ focusOutline: "none" }}
                            onFocus={(e) =>
                                (e.target.style.borderColor = activeColor.bg + "80")
                            }
                            onBlur={(e) => (e.target.style.borderColor = "#f1f5f9")}
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">
                            Message Details
                        </label>
                        <textarea
                            rows="4"
                            value={formData.message}
                            onChange={(e) =>
                                setFormData({ ...formData, message: e.target.value })
                            }
                            placeholder="Describe your issue in detail..."
                            required
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-[#1a1b4b] outline-none transition-all placeholder:text-slate-300 placeholder:font-normal resize-none"
                            onFocus={(e) =>
                                (e.target.style.borderColor = activeColor.bg + "80")
                            }
                            onBlur={(e) => (e.target.style.borderColor = "#f1f5f9")}
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full text-white font-extrabold py-5 rounded-2xl transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
                        style={{
                            background: submitted
                                ? "#16a34a"
                                : `linear-gradient(135deg, ${activeColor.bg}, ${activeColor.bg}cc)`,
                            transition: "background 0.4s ease",
                        }}
                    >
                        {submitted ? (
                            <>
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 20 20"
                                    fill="none"
                                    stroke="white"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M4 10l5 5 7-8" />
                                </svg>
                                Request Sent!
                            </>
                        ) : (
                            <>
                                <Send size={16} />
                                Send Request
                            </>
                        )}
                    </button>
                </form>
            </section>

            {/* Contact Channels */}
            <section className="max-w-2xl mx-auto px-5 mt-10 space-y-4">
                <div className="flex items-center gap-2 px-1 mb-4">
                    <div className="w-1 h-4 rounded-full bg-slate-300" />
                    <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                        Direct Contact
                    </h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-3">
                            <Phone size={20} />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                            Call Us
                        </span>
                        <span className="text-sm font-bold text-[#1a1b4b]">
                            +1 234 567 890
                        </span>
                    </div>
                    <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-3">
                            <Mail size={20} />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                            Email Us
                        </span>
                        <span className="text-sm font-bold text-[#1a1b4b]">
                            support@nexus.edu
                        </span>
                    </div>
                </div>

                {/* Map placeholder */}
                <div className="w-full h-48 bg-slate-200 rounded-[24px] flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20"
                        style={{
                            backgroundImage: "repeating-linear-gradient(0deg,#94a3b8 0,#94a3b8 1px,transparent 1px,transparent 40px),repeating-linear-gradient(90deg,#94a3b8 0,#94a3b8 1px,transparent 1px,transparent 40px)"
                        }}
                    />
                    <MapPin size={28} className="text-slate-400 z-10" />
                </div>

                <div className="flex items-start gap-4 px-2">
                    <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 mt-1 shrink-0 text-[#1a1b4b]">
                        <Building2 size={22} />
                    </div>
                    <div>
                        <h3 className="font-extrabold text-[#1a1b4b] mb-1 text-base tracking-tight">
                            Main Administration Office
                        </h3>
                        <p className="text-slate-500 font-medium text-sm leading-relaxed">
                            University Square, Building 4<br />
                            ClassNexus Campus, Academic Drive<br />
                            CA 94305, United States
                        </p>
                    </div>
                </div>
            </section>

            {/* Developer Badge */}
            <div className="pt-12 pb-2 flex justify-center px-5">
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-[#1a1b4b] rounded-full shadow-lg">
                    <p className="text-[13px] font-medium text-slate-300 flex items-center gap-1.5 tracking-wide">
                        Developed with
                        <Heart size={14} className="text-red-400 fill-red-400 mx-0.5" />
                        by
                        <span className="font-extrabold text-transparent bg-clip-text ml-1 text-sm"
                            style={{ backgroundImage: "linear-gradient(90deg, #67e8f9, #60a5fa, #c084fc)" }}
                        >
                            RISHABH BISHT
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
}