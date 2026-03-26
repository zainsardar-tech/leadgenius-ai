"use client";

import { type Dispatch, type SetStateAction, useEffect, useMemo, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Building, Check, ChevronRight, Copy, FileText, Filter, Loader2, MapPin, MessageSquare, Plus, Search, Settings, Target, Trash2, TrendingUp, Wand2 } from "lucide-react";

type BusinessProfile = {
  companyName: string;
  industry: string;
  targetedIndustries: string;
  services: string;
  usp: string;
  targetMarket: string;
  budgetLevel: string;
  salesGoal: string;
  salesGoalCurrency: string;
  outreachChannel: string;
  geographicTarget: string;
  competitors: string;
};

type Lead = {
  id: string;
  businessName: string;
  businessType: string;
  location: string;
  rating: string;
  whyHighPotential: string;
  salesAngle: string;
  classification: "Hot" | "Warm" | "Cold" | string;
  status?: string;
  outreachTemplate?: string;
  isGeneratingOutreach?: boolean;
};

type UserSession = {
  email: string;
  role: "admin" | "member";
};

type CsvColumnKey = "businessName" | "businessType" | "location" | "rating" | "whyHighPotential" | "salesAngle" | "classification" | "status";

const initialProfile: BusinessProfile = {
  companyName: "",
  industry: "",
  targetedIndustries: "",
  services: "",
  usp: "",
  targetMarket: "Local",
  budgetLevel: "Medium",
  salesGoal: "",
  salesGoalCurrency: "USD",
  outreachChannel: "Email",
  geographicTarget: "",
  competitors: "",
};

const CSV_COLUMNS: { key: CsvColumnKey; label: string }[] = [
  { key: "businessName", label: "Business Name" },
  { key: "businessType", label: "Business Type" },
  { key: "location", label: "Location" },
  { key: "rating", label: "Rating" },
  { key: "whyHighPotential", label: "Why High Potential" },
  { key: "salesAngle", label: "Sales Angle" },
  { key: "classification", label: "Classification" },
  { key: "status", label: "Status" },
];

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
const leadKey = (lead: Pick<Lead, "businessName" | "location">) => `${normalize(lead.businessName)}|${normalize(lead.location)}`;

async function fetchWithRetry(url: string, init: RequestInit, retries = 2): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, init);
      if (response.ok) return response;
      if (response.status !== 429 && response.status < 500) return response;
      if (attempt === retries) return response;
      await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
    } catch (error) {
      lastError = error;
      if (attempt === retries) break;
      await new Promise((resolve) => setTimeout(resolve, 400 * 2 ** attempt));
    }
  }
  throw lastError ?? new Error("Request failed");
}

async function callAiApi<T>(payload: object): Promise<T> {
  const response = await fetchWithRetry("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const json = (await response.json()) as { error?: string } & T;
  if (!response.ok) throw new Error(json.error || "AI request failed.");
  return json;
}

function ProfileForm({ profile, setProfile, onSubmit, isLoading, onMagicFill }: { profile: BusinessProfile; setProfile: Dispatch<SetStateAction<BusinessProfile>>; onSubmit: () => void; isLoading: boolean; onMagicFill: (description: string) => Promise<Partial<BusinessProfile> | null>; }) {
  const [magicPrompt, setMagicPrompt] = useState("");
  const [isMagicModalOpen, setIsMagicModalOpen] = useState(false);
  const [isMagicFilling, setIsMagicFilling] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleMagicFill = async () => {
    if (!magicPrompt.trim()) return;
    setIsMagicFilling(true);
    try {
      const parsed = await onMagicFill(magicPrompt);
      if (parsed) {
        setProfile((prev) => ({ ...prev, ...parsed }));
        setMagicPrompt("");
        setIsMagicModalOpen(false);
      }
    } finally {
      setIsMagicFilling(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-3 flex-wrap">
        <h2 className="text-lg font-medium text-gray-900">Business Details</h2>
        <button type="button" onClick={() => setIsMagicModalOpen(true)} className="inline-flex items-center px-3 py-2 border border-indigo-200 text-sm font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100">
          <Wand2 className="mr-2 h-4 w-4" /> Magic Auto-Fill
        </button>
      </div>

      {isMagicModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 relative">
            <button onClick={() => setIsMagicModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-500">x</button>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Magic Auto-Fill</h3>
            <textarea rows={4} value={magicPrompt} onChange={(e) => setMagicPrompt(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm mb-4" />
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setIsMagicModalOpen(false)} className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">Cancel</button>
              <button type="button" onClick={() => void handleMagicFill()} disabled={isMagicFilling || !magicPrompt.trim()} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
                {isMagicFilling ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Wand2 className="mr-2 h-4 w-4" />}
                {isMagicFilling ? "Filling..." : "Auto Fill"}
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label><input required type="text" name="companyName" value={profile.companyName} onChange={handleChange} className="w-full rounded-md border border-gray-300 px-3 py-2" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Industry</label><input required type="text" name="industry" value={profile.industry} onChange={handleChange} className="w-full rounded-md border border-gray-300 px-3 py-2" /></div>
          <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Targeted Industries</label><input required type="text" name="targetedIndustries" value={profile.targetedIndustries} onChange={handleChange} className="w-full rounded-md border border-gray-300 px-3 py-2" /></div>
          <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Services / Products</label><textarea required name="services" value={profile.services} onChange={handleChange} rows={3} className="w-full rounded-md border border-gray-300 px-3 py-2" /></div>
          <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Unique Selling Proposition</label><textarea required name="usp" value={profile.usp} onChange={handleChange} rows={2} className="w-full rounded-md border border-gray-300 px-3 py-2" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Target Market</label><select name="targetMarket" value={profile.targetMarket} onChange={handleChange} className="w-full rounded-md border border-gray-300 px-3 py-2"><option value="Local">Local</option><option value="National">National</option><option value="International">International</option></select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Geographic Target</label><input required type="text" name="geographicTarget" value={profile.geographicTarget} onChange={handleChange} className="w-full rounded-md border border-gray-300 px-3 py-2" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Budget Level</label><select name="budgetLevel" value={profile.budgetLevel} onChange={handleChange} className="w-full rounded-md border border-gray-300 px-3 py-2"><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option></select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Monthly Sales Goal</label><div className="flex"><select name="salesGoalCurrency" value={profile.salesGoalCurrency} onChange={handleChange} className="rounded-l-md border border-r-0 border-gray-300 px-3 text-gray-500"><option value="USD">USD</option><option value="PKR">PKR</option></select><input required type="number" name="salesGoal" value={profile.salesGoal} onChange={handleChange} className="w-full rounded-r-md border border-gray-300 px-3 py-2" /></div></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Preferred Outreach Channel</label><select name="outreachChannel" value={profile.outreachChannel} onChange={handleChange} className="w-full rounded-md border border-gray-300 px-3 py-2"><option value="WhatsApp">WhatsApp</option><option value="Email">Email</option><option value="LinkedIn">LinkedIn</option><option value="Cold Call">Cold Call</option><option value="Multi-channel">Multi-channel</option></select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Competitors</label><input type="text" name="competitors" value={profile.competitors} onChange={handleChange} className="w-full rounded-md border border-gray-300 px-3 py-2" /></div>
        </div>
        <div className="flex justify-end pt-4 border-t border-gray-200"><button type="submit" disabled={isLoading} className="inline-flex items-center px-6 py-3 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">{isLoading ? <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" /> : <Target className="-ml-1 mr-2 h-5 w-5" />}Analyze Business & Generate Strategy</button></div>
      </form>
    </div>
  );
}

export default function SecurePage() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [profile, setProfile] = useState<BusinessProfile>(initialProfile);
  const [activeTab, setActiveTab] = useState<"profile" | "strategy" | "leads" | "outreach" | "report">("profile");
  const [strategy, setStrategy] = useState("");
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [rawLeadsText, setRawLeadsText] = useState("");
  const [isGeneratingLeads, setIsGeneratingLeads] = useState(false);
  const [leadLinks, setLeadLinks] = useState<Array<{ title: string; uri: string; type: "web" | "maps" }>>([]);
  const [leadFilter, setLeadFilter] = useState("All");
  const [angleFilter, setAngleFilter] = useState("");
  const [visibleLeadCount, setVisibleLeadCount] = useState(10);
  const [outreach, setOutreach] = useState("");
  const [isGeneratingOutreach, setIsGeneratingOutreach] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [report, setReport] = useState("");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [selectedCsvColumns, setSelectedCsvColumns] = useState<CsvColumnKey[]>(CSV_COLUMNS.map((column) => column.key));

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("/api/auth/session", { credentials: "include" });
        if (!response.ok) {
          setSession(null);
          setIsAuthModalOpen(true);
          return;
        }
        const data = (await response.json()) as { authenticated: boolean; user?: UserSession };
        if (data.authenticated && data.user) {
          setSession(data.user);
          setIsAuthModalOpen(false);
        } else {
          setSession(null);
          setIsAuthModalOpen(true);
        }
      } catch {
        setSession(null);
        setIsAuthModalOpen(true);
      } finally {
        setIsCheckingSession(false);
      }
    };
    void checkSession();
  }, []);

  const filteredLeads = useMemo(() => leads.filter((lead) => (leadFilter === "All" || lead.classification.toLowerCase().includes(leadFilter.toLowerCase())) && lead.salesAngle.toLowerCase().includes(angleFilter.toLowerCase())), [leads, leadFilter, angleFilter]);
  const visibleLeads = filteredLeads.slice(0, visibleLeadCount);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setAuthError("Email and password are required.");
      return;
    }
    setAuthError("");
    setIsLoggingIn(true);
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ email, password }) });
      const data = (await response.json()) as { error?: string; role?: "admin" | "member"; email?: string };
      if (!response.ok || !data.role || !data.email) {
        setAuthError(data.error || "Invalid credentials.");
        return;
      }
      setSession({ email: data.email, role: data.role });
      setIsAuthModalOpen(false);
      setEmail("");
      setPassword("");
    } catch {
      setAuthError("Unable to login right now.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setSession(null);
    setIsAuthModalOpen(true);
  };

  const handleMagicFill = async (description: string) => {
    try {
      setGlobalError(null);
      const data = await callAiApi<{ profile: Partial<BusinessProfile> }>({ action: "magicFill", description });
      return data.profile;
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : "Auto-fill failed.");
      return null;
    }
  };

  const handleGenerateStrategy = async () => {
    setIsGeneratingStrategy(true);
    setStrategy("");
    setGlobalError(null);
    try {
      const data = await callAiApi<{ text: string }>({ action: "strategy", profile });
      setStrategy(data.text);
      setActiveTab("strategy");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error generating strategy.";
      setGlobalError(message);
      setStrategy(message);
    } finally {
      setIsGeneratingStrategy(false);
    }
  };

  const handleGenerateLeads = async (append = false) => {
    setIsGeneratingLeads(true);
    setGlobalError(null);
    if (!append) {
      setLeads([]);
      setLeadLinks([]);
      setRawLeadsText("");
      setVisibleLeadCount(10);
    }

    try {
      const existingLeadKeys = (append ? leads : []).map((lead) => leadKey(lead));
      const data = await callAiApi<{ leads: Lead[]; links: Array<{ title: string; uri: string; type: "web" | "maps" }>; rawText: string }>({ action: "leads", profile, existingLeadKeys });
      setRawLeadsText(data.rawText);
      setLeadLinks((prev) => {
        const seen = new Set(prev.map((link) => link.uri));
        const out = [...prev];
        for (const link of data.links) {
          if (!seen.has(link.uri)) {
            seen.add(link.uri);
            out.push(link);
          }
        }
        return out;
      });
      setLeads((prev) => {
        const base = append ? [...prev] : [];
        const seen = new Set(base.map((lead) => leadKey(lead)));
        for (const lead of data.leads) {
          const key = leadKey(lead);
          if (!seen.has(key)) {
            seen.add(key);
            base.push(lead);
          }
        }
        return base;
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error generating leads.";
      setGlobalError(message);
      setRawLeadsText(message);
    } finally {
      setIsGeneratingLeads(false);
    }
  };

  const handleGenerateOutreach = async () => {
    setIsGeneratingOutreach(true);
    setOutreach("");
    setGlobalError(null);
    try {
      const data = await callAiApi<{ text: string }>({ action: "outreachGeneral", profile, leads });
      setOutreach(data.text);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error generating outreach templates.";
      setGlobalError(message);
      setOutreach(message);
    } finally {
      setIsGeneratingOutreach(false);
    }
  };

  const handleGenerateOutreachForLead = async (leadId: string) => {
    const selectedLead = leads.find((lead) => lead.id === leadId);
    if (!selectedLead) return;
    setLeads((prev) => prev.map((lead) => (lead.id === leadId ? { ...lead, isGeneratingOutreach: true, outreachTemplate: "" } : lead)));
    try {
      const data = await callAiApi<{ text: string }>({ action: "outreachLead", profile, lead: selectedLead });
      setLeads((prev) => prev.map((lead) => (lead.id === leadId ? { ...lead, outreachTemplate: data.text } : lead)));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error generating template.";
      setGlobalError(message);
      setLeads((prev) => prev.map((lead) => (lead.id === leadId ? { ...lead, outreachTemplate: message } : lead)));
    } finally {
      setLeads((prev) => prev.map((lead) => (lead.id === leadId ? { ...lead, isGeneratingOutreach: false } : lead)));
    }
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    setReport("");
    setGlobalError(null);
    try {
      const data = await callAiApi<{ text: string }>({ action: "report", profile, leads });
      setReport(data.text);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error generating report.";
      setGlobalError(message);
      setReport(message);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleExportCSV = () => {
    if (!leads.length || !selectedCsvColumns.length) return;
    const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const headers = selectedCsvColumns.map((key) => CSV_COLUMNS.find((column) => column.key === key)?.label || key);
    const rows = [headers.map(escapeCsv).join(",")];
    for (const lead of leads) {
      const row = selectedCsvColumns.map((key) => {
        const value = key === "status" ? lead.status || "New" : String(lead[key] || "");
        return escapeCsv(value);
      });
      rows.push(row.join(","));
    }
    const blob = new Blob([`\ufeff${rows.join("\n")}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "leadgenius_leads.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsCsvModalOpen(false);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isCheckingSession) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="h-8 w-8 text-indigo-600 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-16 py-2 flex items-center justify-between gap-3"><div className="flex items-center space-x-2"><div className="bg-indigo-600 p-2 rounded-lg"><Target className="h-6 w-6 text-white" /></div><h1 className="text-xl font-bold text-gray-900 tracking-tight">LeadGenius AI</h1></div><div className="flex items-center gap-2 flex-wrap justify-end"><div className="hidden sm:block text-sm text-gray-500 font-medium">Advanced Sales Strategy Expert</div>{session && <span className="hidden md:inline text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">{session.email} ({session.role})</span>}<button onClick={() => { if (session) { void handleLogout(); } else { setIsAuthModalOpen(true); } }} className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors" title={session ? "Logout" : "Login"}><Settings className="h-5 w-5" /></button></div></div></header>
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 shrink-0"><nav className="space-y-1 flex md:block gap-2 overflow-x-auto pb-2 md:pb-0">{[{ id: "profile", label: "Business Profile", icon: Building, enabled: true },{ id: "strategy", label: "Strategy & Analysis", icon: TrendingUp, enabled: !!strategy || isGeneratingStrategy },{ id: "leads", label: "Lead Generation", icon: Search, enabled: !!strategy },{ id: "outreach", label: "Outreach Templates", icon: MessageSquare, enabled: !!strategy },{ id: "report", label: "Final Report", icon: FileText, enabled: !!strategy && leads.length > 0 }].map((tab) => { const Icon = tab.icon; const isActive = activeTab === tab.id; return <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)} disabled={!tab.enabled} className={`min-w-max md:w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${isActive ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-100"} ${!tab.enabled ? "opacity-50 cursor-not-allowed" : ""}`}><Icon className="mr-3 h-5 w-5 flex-shrink-0" />{tab.label}</button>; })}</nav></aside>
        <main className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[600px]">
          {globalError && <div className="mx-6 mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{globalError}</div>}
          {activeTab === "profile" && <div className="p-6 sm:p-8"><div className="mb-8"><h2 className="text-2xl font-bold text-gray-900">Business Profile</h2><p className="mt-1 text-sm text-gray-500">Tell us about your business to generate a tailored sales strategy and qualified leads.</p></div><ProfileForm profile={profile} setProfile={setProfile} onSubmit={handleGenerateStrategy} isLoading={isGeneratingStrategy} onMagicFill={handleMagicFill} /></div>}
          {activeTab === "strategy" && <div className="p-6 sm:p-8 h-full flex flex-col"><div className="mb-6 flex items-center justify-between gap-3 flex-wrap"><div><h2 className="text-2xl font-bold text-gray-900">Strategy & Analysis</h2><p className="mt-1 text-sm text-gray-500">Your personalized business model analysis and action plan.</p></div><button onClick={() => setActiveTab("leads")} className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">Find Leads Next <ChevronRight className="ml-2 h-4 w-4" /></button></div><div className="flex-1 overflow-y-auto">{isGeneratingStrategy && !strategy ? <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 text-indigo-600 animate-spin" /><span className="ml-3 text-gray-500 font-medium">Analyzing business model...</span></div> : <div className="prose prose-indigo max-w-none"><Markdown remarkPlugins={[remarkGfm]}>{strategy}</Markdown></div>}</div></div>}
          {activeTab === "leads" && <div className="p-6 sm:p-8 h-full flex flex-col"><div className="mb-6 flex items-center justify-between gap-3 flex-wrap"><div><h2 className="text-2xl font-bold text-gray-900">Lead Generation</h2><p className="mt-1 text-sm text-gray-500">Find qualified leads using Google Maps and Search grounding.</p></div><div className="flex gap-3 flex-wrap justify-end">{leads.length > 0 && !isGeneratingLeads && <button onClick={() => { if (confirm("Are you sure you want to clear all leads?")) { setLeads([]); setLeadLinks([]); setRawLeadsText(""); setVisibleLeadCount(10); } }} className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">Clear Leads</button>}{leads.length > 0 && !isGeneratingLeads && <button onClick={() => setIsCsvModalOpen(true)} className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">Export CSV</button>}{!leads.length && !isGeneratingLeads && <button onClick={() => void handleGenerateLeads(false)} className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"><Search className="mr-2 h-4 w-4" /> Generate Leads</button>}</div></div><div className="flex-1 overflow-y-auto">{isGeneratingLeads && leads.length === 0 ? <div className="flex flex-col items-center justify-center h-64"><Loader2 className="h-8 w-8 text-indigo-600 animate-spin mb-4" /><span className="text-gray-500 font-medium">Searching for qualified leads...</span><div className="mt-4 max-w-lg w-full text-xs text-gray-400 whitespace-pre-wrap overflow-hidden h-20 opacity-50">{rawLeadsText}</div></div> : leads.length ? <div className="space-y-6"><div className="flex flex-col md:flex-row items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200 gap-4"><div className="flex items-center space-x-2 w-full md:w-auto"><Filter className="h-5 w-5 text-gray-500" /><select value={leadFilter} onChange={(e) => setLeadFilter(e.target.value)} className="rounded-md border border-gray-300 py-1.5 px-2 text-sm"><option value="All">All Leads</option><option value="Hot">Hot Leads</option><option value="Warm">Warm Leads</option><option value="Cold">Cold Leads</option></select></div><div className="flex items-center space-x-2 w-full md:w-auto"><Search className="h-5 w-5 text-gray-500" /><input type="text" placeholder="Filter by sales angle" value={angleFilter} onChange={(e) => setAngleFilter(e.target.value)} className="w-full md:w-64 rounded-md border border-gray-300 py-1.5 px-3 text-sm" /></div><div className="text-sm text-gray-500">Showing {Math.min(visibleLeadCount, filteredLeads.length)} of {filteredLeads.length}</div></div><div className="grid grid-cols-1 gap-6">{visibleLeads.map((lead) => <div key={lead.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"><div className="p-5"><div className="flex justify-between items-start gap-3"><div><h3 className="text-lg font-bold text-gray-900">{lead.businessName}</h3><p className="text-sm text-gray-500 flex items-center mt-1 flex-wrap gap-x-2"><span className="flex items-center"><Building className="h-4 w-4 mr-1" /> {lead.businessType}</span><span className="hidden sm:inline">-</span><span className="flex items-center"><MapPin className="h-4 w-4 mr-1" /> {lead.location}</span></p></div><div className="flex items-center gap-2"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${lead.classification.toLowerCase().includes("hot") ? "bg-red-100 text-red-800" : lead.classification.toLowerCase().includes("warm") ? "bg-orange-100 text-orange-800" : "bg-blue-100 text-blue-800"}`}>{lead.classification}</span><button onClick={() => setLeads((prev) => prev.filter((item) => item.id !== lead.id))} className="text-gray-400 hover:text-red-500" title="Delete lead"><Trash2 className="h-4 w-4" /></button></div></div><div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4"><div><h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Why High Potential</h4><p className="mt-1 text-sm text-gray-900">{lead.whyHighPotential}</p></div><div><h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Suggested Sales Angle</h4><p className="mt-1 text-sm text-gray-900">{lead.salesAngle}</p></div></div><div className="mt-4 pt-4 border-t border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4"><div className="flex items-center gap-2 flex-wrap"><span className="text-sm font-medium text-gray-700">Status:</span>{[{ value: "New", active: !lead.status || lead.status === "New" },{ value: "Contacted", active: lead.status === "Contacted" },{ value: "Qualified", active: lead.status === "Qualified" }].map((status) => <button key={status.value} onClick={() => setLeads((prev) => prev.map((item) => (item.id === lead.id ? { ...item, status: status.value } : item)))} className={`px-3 py-1 text-xs font-medium rounded-full border ${status.active ? "bg-indigo-100 border-indigo-300 text-indigo-800" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"}`}>{status.value}</button>)}<input type="text" placeholder="Custom" className="text-xs border border-gray-300 rounded-full px-3 py-1 w-28" onBlur={(e) => { if (e.target.value) setLeads((prev) => prev.map((item) => (item.id === lead.id ? { ...item, status: e.target.value } : item))); }} onKeyDown={(e) => { if (e.key === "Enter") setLeads((prev) => prev.map((item) => (item.id === lead.id ? { ...item, status: e.currentTarget.value } : item))); }} /></div>{!lead.outreachTemplate ? <button onClick={() => void handleGenerateOutreachForLead(lead.id)} disabled={lead.isGeneratingOutreach} className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">{lead.isGeneratingOutreach ? <Loader2 className="animate-spin mr-1.5 h-3 w-3" /> : <MessageSquare className="mr-1.5 h-3 w-3" />}{lead.isGeneratingOutreach ? "Generating..." : "Generate Outreach"}</button> : <button onClick={() => setActiveTab("outreach")} className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"><MessageSquare className="mr-1.5 h-3 w-3" /> View Template</button>}</div></div></div>)}</div>{filteredLeads.length > visibleLeadCount && <div className="flex justify-center"><button onClick={() => setVisibleLeadCount((prev) => prev + 10)} className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">Show More ({filteredLeads.length - visibleLeadCount} left)</button></div>}<div className="flex justify-center pt-2"><button onClick={() => void handleGenerateLeads(true)} disabled={isGeneratingLeads} className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">{isGeneratingLeads ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}{isGeneratingLeads ? "Generating..." : "Load More Leads"}</button></div>{leadLinks.length > 0 && <div className="mt-8 pt-8 border-t border-gray-200"><h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><MapPin className="mr-2 h-5 w-5 text-gray-500" /> Source Links</h3><ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">{leadLinks.map((link, index) => <li key={`${link.uri}-${index}`}><a href={link.uri} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline">{link.title}</a></li>)}</ul></div>}</div> : <div className="text-center py-16"><div className="mx-auto h-12 w-12 text-gray-400 bg-gray-100 rounded-full flex items-center justify-center mb-4"><Search className="h-6 w-6" /></div><h3 className="text-lg font-medium text-gray-900">No leads generated yet</h3><p className="mt-1 text-sm text-gray-500">Click Generate Leads to begin.</p></div>}</div></div>}
          {activeTab === "outreach" && <div className="p-6 sm:p-8 h-full flex flex-col"><div className="mb-6 flex items-center justify-between gap-3 flex-wrap"><div><h2 className="text-2xl font-bold text-gray-900">Outreach Templates</h2><p className="mt-1 text-sm text-gray-500">Personalized scripts for your selected outreach channel.</p></div><div className="flex gap-3 flex-wrap justify-end">{(outreach || leads.some((lead) => lead.outreachTemplate)) && !isGeneratingOutreach && <button onClick={() => { if (confirm("Are you sure you want to clear all outreach templates?")) { setOutreach(""); setLeads((prev) => prev.map((lead) => ({ ...lead, outreachTemplate: undefined }))); } }} className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">Clear Templates</button>}{!outreach && !isGeneratingOutreach && <button onClick={() => void handleGenerateOutreach()} className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"><MessageSquare className="mr-2 h-4 w-4" /> Generate General Templates</button>}</div></div><div className="flex-1 overflow-y-auto space-y-8">{isGeneratingOutreach && !outreach && <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 text-indigo-600 animate-spin" /><span className="ml-3 text-gray-500 font-medium">Crafting outreach messages...</span></div>}{outreach && <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 relative group"><button onClick={() => handleCopy(outreach, "general")} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 rounded-md transition-colors opacity-0 group-hover:opacity-100" title="Copy">{copiedId === "general" ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}</button><h3 className="text-lg font-bold text-gray-900 mb-4">General Templates</h3><div className="prose prose-indigo max-w-none"><Markdown remarkPlugins={[remarkGfm]}>{outreach}</Markdown></div></div>}{leads.filter((lead) => lead.outreachTemplate).length > 0 && <div className="space-y-6"><h3 className="text-xl font-bold text-gray-900 border-b pb-2">Lead-Specific Templates</h3>{leads.filter((lead) => lead.outreachTemplate).map((lead) => <div key={lead.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 relative group"><button onClick={() => handleCopy(lead.outreachTemplate || "", lead.id)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 rounded-md transition-colors opacity-0 group-hover:opacity-100" title="Copy">{copiedId === lead.id ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}</button><h4 className="text-lg font-bold text-gray-900 mb-2">{lead.businessName}</h4><div className="prose prose-indigo max-w-none text-sm"><Markdown remarkPlugins={[remarkGfm]}>{lead.outreachTemplate || ""}</Markdown></div></div>)}</div>}</div></div>}
          {activeTab === "report" && <div className="p-6 sm:p-8 h-full flex flex-col"><div className="mb-6 flex items-center justify-between gap-3 flex-wrap"><div><h2 className="text-2xl font-bold text-gray-900">Final Strategy Report</h2><p className="mt-1 text-sm text-gray-500">Comprehensive summary of performance and next actions.</p></div>{!report && !isGeneratingReport && <button onClick={() => void handleGenerateReport()} className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"><FileText className="mr-2 h-4 w-4" /> Generate Report</button>}</div><div className="flex-1 overflow-y-auto">{isGeneratingReport && !report ? <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 text-indigo-600 animate-spin" /><span className="ml-3 text-gray-500 font-medium">Generating report...</span></div> : <div className="prose prose-indigo max-w-none"><Markdown remarkPlugins={[remarkGfm]}>{report}</Markdown></div>}</div></div>}
        </main>
      </div>

      {isCsvModalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 relative"><button onClick={() => setIsCsvModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-500">x</button><h3 className="text-lg font-bold text-gray-900 mb-2">CSV Export Columns</h3><p className="text-sm text-gray-500 mb-4">Select columns for a clean, structured export.</p><div className="space-y-2 max-h-64 overflow-y-auto mb-4">{CSV_COLUMNS.map((column) => <label key={column.key} className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={selectedCsvColumns.includes(column.key)} onChange={(event) => { setSelectedCsvColumns((prev) => (event.target.checked ? [...prev, column.key] : prev.filter((key) => key !== column.key))); }} />{column.label}</label>)}</div><div className="flex justify-between items-center"><button onClick={() => setSelectedCsvColumns(CSV_COLUMNS.map((column) => column.key))} className="text-sm text-indigo-600 hover:text-indigo-500">Select all</button><div className="flex gap-3"><button onClick={() => setIsCsvModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button><button onClick={handleExportCSV} disabled={!selectedCsvColumns.length} className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">Export</button></div></div></div></div>}

      {isAuthModalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"><h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center"><Settings className="mr-2 h-5 w-5 text-indigo-600" /> Secure Login</h3><p className="text-sm text-gray-500 mb-4">Sign in to access protected AI features.</p>{authError && <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{authError}</div>}<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm mb-3" /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm mb-4" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void handleLogin(); } }} /><div className="flex justify-end gap-3"><button onClick={() => { if (session) setIsAuthModalOpen(false); }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button><button onClick={() => void handleLogin()} disabled={isLoggingIn} className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">{isLoggingIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Login</button></div></div></div>}
    </div>
  );
}
