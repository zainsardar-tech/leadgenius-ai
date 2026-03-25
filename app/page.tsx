"use client";

import { useState, useEffect } from "react";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader2, Target, MapPin, TrendingUp, MessageSquare, Search, ChevronRight, Building, Filter, FileText, Plus, Wand2, Trash2, Copy, Check, Settings } from "lucide-react";

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

function ProfileForm({ profile, setProfile, onSubmit, isLoading, getApiKey }: any) {
  const [magicPrompt, setMagicPrompt] = useState("");
  const [isMagicFilling, setIsMagicFilling] = useState(false);
  const [isMagicModalOpen, setIsMagicModalOpen] = useState(false);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setProfile((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleMagicFill = async () => {
    if (!magicPrompt.trim()) return;
    setIsMagicFilling(true);
    try {
      const ai = new GoogleGenAI({ apiKey: getApiKey() });
      const prompt = `
        You are an AI assistant helping to fill out a business profile form.
        Based on the user's description, extract the relevant information and output a JSON object.
        
        User Description: "${magicPrompt}"
        
        The JSON object must match this structure exactly:
        {
          "companyName": "string",
          "industry": "string",
          "targetedIndustries": "string",
          "services": "string",
          "usp": "string",
          "targetMarket": "Local" | "National" | "International",
          "geographicTarget": "string",
          "budgetLevel": "Low" | "Medium" | "High",
          "salesGoal": "string (number only)",
          "salesGoalCurrency": "USD" | "PKR",
          "outreachChannel": "WhatsApp" | "Email" | "LinkedIn" | "Cold Call" | "Multi-channel",
          "competitors": "string"
        }
        
        If any information is missing from the description, make a reasonable guess or leave it as an empty string, but ensure the structure is valid JSON.
      `;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              companyName: { type: Type.STRING },
              industry: { type: Type.STRING },
              targetedIndustries: { type: Type.STRING },
              services: { type: Type.STRING },
              usp: { type: Type.STRING },
              targetMarket: { type: Type.STRING },
              geographicTarget: { type: Type.STRING },
              budgetLevel: { type: Type.STRING },
              salesGoal: { type: Type.STRING },
              salesGoalCurrency: { type: Type.STRING },
              outreachChannel: { type: Type.STRING },
              competitors: { type: Type.STRING }
            },
            required: ["companyName", "industry", "targetedIndustries", "services", "usp", "targetMarket", "geographicTarget", "budgetLevel", "salesGoal", "salesGoalCurrency", "outreachChannel", "competitors"]
          }
        }
      });
      
      const jsonText = response.text;
      if (jsonText) {
        const parsedProfile = JSON.parse(jsonText);
        setProfile((prev: any) => ({ ...prev, ...parsedProfile }));
        setMagicPrompt("");
        setIsMagicModalOpen(false);
      }
    } catch (error: any) {
      if (error?.message === "API_KEY_MISSING") return;
      console.error("Error auto-filling profile:", error);
      alert("Failed to auto-fill profile. Please try again.");
    } finally {
      setIsMagicFilling(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Business Details</h2>
        <button
          type="button"
          onClick={() => setIsMagicModalOpen(true)}
          className="inline-flex items-center px-3 py-2 border border-indigo-200 text-sm font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Wand2 className="mr-2 h-4 w-4" /> Magic Auto-Fill
        </button>
      </div>

      {isMagicModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 relative">
            <button 
              onClick={() => setIsMagicModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
            >
              ✕
            </button>
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-indigo-100 p-2 rounded-lg">
                <Wand2 className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Magic Auto-Fill</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Describe your business in a few sentences, and AI will fill out the form for you.
            </p>
            <textarea
              rows={4}
              value={magicPrompt}
              onChange={(e) => setMagicPrompt(e.target.value)}
              placeholder="e.g., I run a digital marketing agency in New York targeting small businesses with a $5000 monthly goal..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 mb-4"
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleMagicFill(); } }}
            />
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsMagicModalOpen(false)}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleMagicFill}
                disabled={isMagicFilling || !magicPrompt.trim()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                {isMagicFilling ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Wand2 className="mr-2 h-4 w-4" />}
                {isMagicFilling ? "Filling..." : "Auto Fill"}
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
          <input required type="text" name="companyName" value={profile.companyName} onChange={handleChange} className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
          <input required type="text" name="industry" value={profile.industry} onChange={handleChange} className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Targeted Industries</label>
          <input required type="text" name="targetedIndustries" value={profile.targetedIndustries} onChange={handleChange} placeholder="e.g. Healthcare, Tech Startups, Real Estate" className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Services/Products</label>
          <textarea required name="services" value={profile.services} onChange={handleChange} rows={3} className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Unique Selling Proposition (USP)</label>
          <textarea required name="usp" value={profile.usp} onChange={handleChange} rows={2} className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Target Market</label>
          <select name="targetMarket" value={profile.targetMarket} onChange={handleChange} className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
            <option value="Local">Local</option>
            <option value="National">National</option>
            <option value="International">International</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Geographic Target (City / Country)</label>
          <input required type="text" name="geographicTarget" value={profile.geographicTarget} onChange={handleChange} className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Budget Level</label>
          <select name="budgetLevel" value={profile.budgetLevel} onChange={handleChange} className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sales Goal (Monthly Revenue Target)</label>
          <div className="flex rounded-md shadow-sm">
            <select
              name="salesGoalCurrency"
              value={profile.salesGoalCurrency}
              onChange={handleChange}
              className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="USD">USD ($)</option>
              <option value="PKR">PKR (₨)</option>
            </select>
            <input 
              required 
              type="number" 
              name="salesGoal" 
              value={profile.salesGoal} 
              onChange={handleChange} 
              className="block w-full min-w-0 flex-1 rounded-none rounded-r-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" 
              placeholder="e.g. 10000"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Outreach Channel</label>
          <select name="outreachChannel" value={profile.outreachChannel} onChange={handleChange} className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
            <option value="WhatsApp">WhatsApp</option>
            <option value="Email">Email</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="Cold Call">Cold Call</option>
            <option value="Multi-channel">Multi-channel</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Competitors (Optional)</label>
          <input type="text" name="competitors" value={profile.competitors} onChange={handleChange} className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
        </div>
      </div>
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button type="submit" disabled={isLoading} className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
          {isLoading ? <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" /> : <Target className="-ml-1 mr-2 h-5 w-5" />}
          Analyze Business & Generate Strategy
        </button>
      </div>
    </form>
    </div>
  );
}

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

export default function LeadIntelligenceApp() {
  const [apiKey, setApiKey] = useState<string>("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const storedKey = localStorage.getItem("gemini_api_key");
    if (storedKey) setApiKey(storedKey);
  }, []);

  const getApiKey = () => {
    const key = apiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!key) {
      setIsSettingsOpen(true);
      throw new Error("API_KEY_MISSING");
    }
    return key;
  };

  const [profile, setProfile] = useState<BusinessProfile>(initialProfile);
  const [activeTab, setActiveTab] = useState<"profile" | "strategy" | "leads" | "outreach" | "report">("profile");
  
  const [strategy, setStrategy] = useState<string>("");
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [rawLeadsText, setRawLeadsText] = useState<string>("");
  const [isGeneratingLeads, setIsGeneratingLeads] = useState(false);
  const [leadLinks, setLeadLinks] = useState<any[]>([]);
  const [leadFilter, setLeadFilter] = useState<string>("All");
  const [angleFilter, setAngleFilter] = useState<string>("");
  
  const [outreach, setOutreach] = useState<string>("");
  const [isGeneratingOutreach, setIsGeneratingOutreach] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [report, setReport] = useState<string>("");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleGenerateStrategy = async () => {
    setIsGeneratingStrategy(true);
    setStrategy("");
    try {
      const ai = new GoogleGenAI({ apiKey: getApiKey() });
      const prompt = `
        You are an Advanced AI Lead Intelligence & Sales Strategy Expert.
        Analyze the following business profile and provide a comprehensive strategy report.
        
        Business Profile:
        - Company Name: ${profile.companyName}
        - Industry: ${profile.industry}
        - Targeted Industries: ${profile.targetedIndustries}
        - Services/Products: ${profile.services}
        - USP: ${profile.usp}
        - Target Market: ${profile.targetMarket}
        - Budget Level: ${profile.budgetLevel}
        - Sales Goal: ${profile.salesGoal} ${profile.salesGoalCurrency}
        - Preferred Outreach Channel: ${profile.outreachChannel}
        - Geographic Target: ${profile.geographicTarget}
        - Competitors: ${profile.competitors}
        
        Please provide a detailed report with the following sections:
        1. **Business Model Analysis**
        2. **Best Industries to Target & Most Profitable Niche**
        3. **Expected Close Rate Strategy**
        4. **30-Day Action Plan**
        5. **90-Day Sales Scaling Strategy**
      `;
      
      const response = await ai.models.generateContentStream({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: { thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH } }
      });
      
      for await (const chunk of response) {
        setStrategy((prev) => prev + chunk.text);
      }
      setActiveTab("strategy");
    } catch (error: any) {
      if (error?.message === "API_KEY_MISSING") return;
      console.error(error);
      if (error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("quota")) {
        setStrategy("Rate limit exceeded. Please wait a moment and try again.");
      } else {
        setStrategy("Error generating strategy. Please try again.");
      }
    } finally {
      setIsGeneratingStrategy(false);
    }
  };

  const handleGenerateLeads = async (append = false) => {
    setIsGeneratingLeads(true);
    if (!append) {
      setLeads([]);
      setRawLeadsText("");
      setLeadLinks([]);
    }
    try {
      const ai = new GoogleGenAI({ apiKey: getApiKey() });
      const prompt = `
        You are an Advanced AI Lead Intelligence & Sales Strategy Expert.
        Based on the following business profile, find highly qualified leads in the target geographic area using Google Maps and Google Search.
        
        Business Profile:
        - Industry: ${profile.industry}
        - Targeted Industries: ${profile.targetedIndustries}
        - Services/Products: ${profile.services}
        - Target Market: ${profile.targetMarket}
        - Geographic Target: ${profile.geographicTarget}
        
        For each lead, provide a structured format exactly like this:
        
        ---LEAD_START---
        Business Name: [Name]
        Business Type: [Type]
        Location: [Location]
        Rating: [Rating]
        Why High Potential: [Reason]
        Sales Angle: [Angle]
        Classification: [Hot/Warm/Cold]
        ---LEAD_END---
        
        Generate at least 10 leads. ${append ? "Make sure they are completely different from the previous ones." : ""}
      `;
      
      const response = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleMaps: {} }, { googleSearch: {} }],
        }
      });
      
      let fullText = "";
      for await (const chunk of response) {
        fullText += chunk.text;
        setRawLeadsText((prev) => prev + chunk.text);
        
        if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
          const chunks = chunk.candidates[0].groundingMetadata.groundingChunks;
          const newLinks = chunks.map((c: any) => {
            if (c.web?.uri) return { title: c.web.title, uri: c.web.uri, type: 'web' };
            if (c.maps?.uri) return { title: c.maps.title || 'Google Maps', uri: c.maps.uri, type: 'maps' };
            return null;
          }).filter(Boolean);
          
          setLeadLinks((prev) => {
            const existingUris = new Set(prev.map(l => l.uri));
            const uniqueNewLinks = newLinks.filter((l: any) => !existingUris.has(l.uri));
            return [...prev, ...uniqueNewLinks];
          });
        }
      }

      // Parse fullText into leads
      const leadBlocks = fullText.split("---LEAD_START---").slice(1);
      const parsedLeads: Lead[] = leadBlocks.map((block, i) => {
        const content = block.split("---LEAD_END---")[0] || "";
        const extract = (field: string) => {
          const regex = new RegExp(`${field}:\\s*(.*)`, "i");
          const match = content.match(regex);
          return match ? match[1].trim() : "";
        };
        
        return {
          id: `lead-${Date.now()}-${i}`,
          businessName: extract("Business Name"),
          businessType: extract("Business Type"),
          location: extract("Location"),
          rating: extract("Rating"),
          whyHighPotential: extract("Why High Potential"),
          salesAngle: extract("Sales Angle"),
          classification: extract("Classification"),
        };
      }).filter(l => l.businessName);

      setLeads(prev => append ? [...prev, ...parsedLeads] : parsedLeads);
      
    } catch (error: any) {
      if (error?.message === "API_KEY_MISSING") return;
      console.error(error);
      if (error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("quota")) {
        setRawLeadsText("Rate limit exceeded. Please wait a moment and try again.");
      } else {
        setRawLeadsText("Error generating leads. Please try again.");
      }
    } finally {
      setIsGeneratingLeads(false);
    }
  };

  const handleGenerateOutreach = async () => {
    setIsGeneratingOutreach(true);
    setOutreach("");
    try {
      const ai = new GoogleGenAI({ apiKey: getApiKey() });
      
      const leadsContext = leads.length > 0 
        ? `Here are the generated leads to personalize for:\n${leads.slice(0, 10).map(l => `- ${l.businessName} (${l.businessType}): ${l.salesAngle}`).join('\n')}`
        : "No specific leads generated yet, provide general templates.";

      const prompt = `
        You are an Advanced AI Lead Intelligence & Sales Strategy Expert.
        Generate personalized outreach messages based on the business profile.
        
        Business Profile:
        - Company Name: ${profile.companyName}
        - Services/Products: ${profile.services}
        - USP: ${profile.usp}
        - Preferred Outreach Channel: ${profile.outreachChannel}
        
        ${leadsContext}
        
        Generate specialized outreach templates for EACH of the leads listed above (or general if none).
        The templates MUST be specifically tailored for the Preferred Outreach Channel: ${profile.outreachChannel}.
        
        For each lead, provide:
        1. The initial outreach message (via ${profile.outreachChannel})
        2. A follow-up message (Day 2)
        3. A final follow-up message (Day 5)
        
        Messages must be personalized to the lead's business and sales angle, focus on value, not spammy, include a clear CTA, and be conversion focused.
      `;
      
      const response = await ai.models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      
      for await (const chunk of response) {
        setOutreach((prev) => prev + chunk.text);
      }
    } catch (error: any) {
      if (error?.message === "API_KEY_MISSING") return;
      console.error(error);
      if (error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("quota")) {
        setOutreach("Rate limit exceeded. Please wait a moment and try again.");
      } else {
        setOutreach("Error generating outreach templates. Please try again.");
      }
    } finally {
      setIsGeneratingOutreach(false);
    }
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    setReport("");
    try {
      const ai = new GoogleGenAI({ apiKey: getApiKey() });
      const prompt = `
        You are an Advanced AI Lead Intelligence & Sales Strategy Expert.
        Generate a final strategy summary report based on the business profile and the generated leads.
        
        Business Profile:
        - Company Name: ${profile.companyName}
        - Industry: ${profile.industry}
        - Targeted Industries: ${profile.targetedIndustries}
        - Target Market: ${profile.targetMarket}
        - Budget Level: ${profile.budgetLevel}
        - Sales Goal: ${profile.salesGoal} ${profile.salesGoalCurrency}
        
        Generated Leads: ${leads.length} leads found.
        Hot Leads: ${leads.filter(l => (l.classification || "").toLowerCase().includes('hot')).length}
        Warm Leads: ${leads.filter(l => (l.classification || "").toLowerCase().includes('warm')).length}
        Cold Leads: ${leads.filter(l => (l.classification || "").toLowerCase().includes('cold')).length}
        
        Please provide a detailed final report with the following sections:
        1. **Total Leads Generated & Breakdown**
        2. **Industry Opportunity Level**
        3. **Expected Conversion Rate**
        4. **Estimated Revenue Potential** (based on the sales goal and conversion rate)
        5. **Final Recommendations**
      `;
      
      const response = await ai.models.generateContentStream({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: { thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH } }
      });
      
      for await (const chunk of response) {
        setReport((prev) => prev + chunk.text);
      }
    } catch (error: any) {
      if (error?.message === "API_KEY_MISSING") return;
      console.error(error);
      if (error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("quota")) {
        setReport("Rate limit exceeded. Please wait a moment and try again.");
      } else {
        setReport("Error generating report. Please try again.");
      }
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleUpdateLeadStatus = (leadId: string, status: string) => {
    setLeads(prev => prev.map(lead => lead.id === leadId ? { ...lead, status } : lead));
  };

  const handleDeleteLead = (leadId: string) => {
    setLeads(prev => prev.filter(lead => lead.id !== leadId));
  };

  const handleClearLeads = () => {
    if (confirm("Are you sure you want to clear all leads?")) {
      setLeads([]);
      setRawLeadsText("");
      setLeadLinks([]);
    }
  };

  const handleClearOutreach = () => {
    if (confirm("Are you sure you want to clear all outreach templates?")) {
      setOutreach("");
      setLeads(prev => prev.map(l => ({ ...l, outreachTemplate: undefined })));
    }
  };

  const handleExportCSV = () => {
    if (leads.length === 0) return;
    
    const headers = ["Business Name", "Business Type", "Location", "Rating", "Why High Potential", "Sales Angle", "Classification", "Status"];
    const csvRows = [headers.join(",")];
    
    for (const lead of leads) {
      const row = [
        `"${lead.businessName?.replace(/"/g, '""') || ''}"`,
        `"${lead.businessType?.replace(/"/g, '""') || ''}"`,
        `"${lead.location?.replace(/"/g, '""') || ''}"`,
        `"${lead.rating?.replace(/"/g, '""') || ''}"`,
        `"${lead.whyHighPotential?.replace(/"/g, '""') || ''}"`,
        `"${lead.salesAngle?.replace(/"/g, '""') || ''}"`,
        `"${lead.classification?.replace(/"/g, '""') || ''}"`,
        `"${lead.status || 'New'}"`
      ];
      csvRows.push(row.join(","));
    }
    
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "leadgenius_leads.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateOutreachForLead = async (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, isGeneratingOutreach: true, outreachTemplate: "" } : l));
    
    try {
      const ai = new GoogleGenAI({ apiKey: getApiKey() });
      const prompt = `
        You are an Advanced AI Lead Intelligence & Sales Strategy Expert.
        Generate a highly personalized outreach message for the following lead based on the business profile.
        
        My Business Profile:
        - Company Name: ${profile.companyName}
        - Services/Products: ${profile.services}
        - USP: ${profile.usp}
        - Preferred Outreach Channel: ${profile.outreachChannel}
        
        Target Lead:
        - Business Name: ${lead.businessName}
        - Business Type: ${lead.businessType}
        - Sales Angle: ${lead.salesAngle}
        - Why High Potential: ${lead.whyHighPotential}
        
        Generate specialized outreach templates tailored for the Preferred Outreach Channel: ${profile.outreachChannel}.
        
        Provide:
        1. The initial outreach message (via ${profile.outreachChannel})
        2. A follow-up message (Day 2)
        3. A final follow-up message (Day 5)
        
        Messages must be highly personalized to the lead's business and sales angle, focus on value, not spammy, include a clear CTA, and be conversion focused.
      `;
      
      const response = await ai.models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      
      let template = "";
      for await (const chunk of response) {
        template += chunk.text;
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, outreachTemplate: template } : l));
      }
    } catch (error: any) {
      if (error?.message === "API_KEY_MISSING") return;
      console.error(error);
      if (error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("quota")) {
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, outreachTemplate: "Rate limit exceeded. Please wait a moment and try again." } : l));
      } else {
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, outreachTemplate: "Error generating template. Please try again." } : l));
      }
    } finally {
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, isGeneratingOutreach: false } : l));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Target className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">LeadGenius AI</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden sm:block text-sm text-gray-500 font-medium">Advanced Sales Strategy Expert</div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
              title="API Settings"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 shrink-0">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab("profile")}
              className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                activeTab === "profile" ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Building className="mr-3 h-5 w-5 flex-shrink-0" />
              Business Profile
            </button>
            <button
              onClick={() => setActiveTab("strategy")}
              disabled={!strategy && !isGeneratingStrategy}
              className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                activeTab === "strategy" ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-100"
              } ${!strategy && !isGeneratingStrategy ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <TrendingUp className="mr-3 h-5 w-5 flex-shrink-0" />
              Strategy & Analysis
            </button>
            <button
              onClick={() => setActiveTab("leads")}
              disabled={!strategy}
              className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                activeTab === "leads" ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-100"
              } ${!strategy ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <Search className="mr-3 h-5 w-5 flex-shrink-0" />
              Lead Generation
            </button>
            <button
              onClick={() => setActiveTab("outreach")}
              disabled={!strategy}
              className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                activeTab === "outreach" ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-100"
              } ${!strategy ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <MessageSquare className="mr-3 h-5 w-5 flex-shrink-0" />
              Outreach Templates
            </button>
            <button
              onClick={() => setActiveTab("report")}
              disabled={!strategy || leads.length === 0}
              className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                activeTab === "report" ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-100"
              } ${!strategy || leads.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <FileText className="mr-3 h-5 w-5 flex-shrink-0" />
              Final Report
            </button>
          </nav>
        </aside>

        <main className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[600px]">
          {activeTab === "profile" && (
            <div className="p-6 sm:p-8">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Business Profile</h2>
                <p className="mt-1 text-sm text-gray-500">Tell us about your business to generate a tailored sales strategy and qualified leads.</p>
              </div>
              <ProfileForm profile={profile} setProfile={setProfile} onSubmit={handleGenerateStrategy} isLoading={isGeneratingStrategy} getApiKey={getApiKey} />
            </div>
          )}

          {activeTab === "strategy" && (
            <div className="p-6 sm:p-8 h-full flex flex-col">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Strategy & Analysis</h2>
                  <p className="mt-1 text-sm text-gray-500">Your personalized business model analysis and 90-day action plan.</p>
                </div>
                <button
                  onClick={() => setActiveTab("leads")}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Find Leads Next <ChevronRight className="ml-2 h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {isGeneratingStrategy && !strategy ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                    <span className="ml-3 text-gray-500 font-medium">Analyzing business model...</span>
                  </div>
                ) : (
                  <div className="prose prose-indigo max-w-none">
                    <Markdown remarkPlugins={[remarkGfm]}>{strategy}</Markdown>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "leads" && (
            <div className="p-6 sm:p-8 h-full flex flex-col">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Lead Generation</h2>
                  <p className="mt-1 text-sm text-gray-500">Discover highly qualified leads in your target market using Google Maps & Search.</p>
                </div>
                <div className="flex space-x-3">
                  {leads.length > 0 && !isGeneratingLeads && (
                    <button
                      onClick={handleClearLeads}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Clear Leads
                    </button>
                  )}
                  {leads.length > 0 && !isGeneratingLeads && (
                    <button
                      onClick={handleExportCSV}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Export CSV
                    </button>
                  )}
                  {!leads.length && !isGeneratingLeads && (
                    <button
                      onClick={() => handleGenerateLeads(false)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      <Search className="mr-2 h-4 w-4" /> Generate Leads
                    </button>
                  )}
                  {leads.length > 0 && !isGeneratingLeads && (
                    <button
                      onClick={() => setActiveTab("outreach")}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      View Outreach <ChevronRight className="ml-2 h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {isGeneratingLeads && leads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mb-4" />
                    <span className="text-gray-500 font-medium">Scouring the web and maps for qualified leads...</span>
                    <div className="mt-4 max-w-lg w-full text-xs text-gray-400 whitespace-pre-wrap overflow-hidden h-20 opacity-50">
                      {rawLeadsText}
                    </div>
                  </div>
                ) : leads.length > 0 ? (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200 gap-4">
                      <div className="flex items-center space-x-2 w-full sm:w-auto">
                        <Filter className="h-5 w-5 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Classification:</span>
                        <select 
                          value={leadFilter}
                          onChange={(e) => setLeadFilter(e.target.value)}
                          className="ml-2 block w-32 rounded-md border-gray-300 py-1.5 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                        >
                          <option value="All">All Leads</option>
                          <option value="Hot">Hot Leads</option>
                          <option value="Warm">Warm Leads</option>
                          <option value="Cold">Cold Leads</option>
                        </select>
                      </div>
                      <div className="flex items-center space-x-2 w-full sm:w-auto">
                        <Search className="h-5 w-5 text-gray-500" />
                        <input 
                          type="text"
                          placeholder="Filter by Sales Angle..."
                          value={angleFilter}
                          onChange={(e) => setAngleFilter(e.target.value)}
                          className="block w-full sm:w-64 rounded-md border border-gray-300 py-1.5 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                        />
                      </div>
                      <div className="text-sm text-gray-500 whitespace-nowrap">
                        Showing {leads.filter(l => (leadFilter === "All" || l.classification.toLowerCase().includes(leadFilter.toLowerCase())) && l.salesAngle.toLowerCase().includes(angleFilter.toLowerCase())).length} of {leads.length}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      {leads
                        .filter(l => (leadFilter === "All" || l.classification.toLowerCase().includes(leadFilter.toLowerCase())) && l.salesAngle.toLowerCase().includes(angleFilter.toLowerCase()))
                        .map((lead) => (
                        <div key={lead.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                          <div className="p-5">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="text-lg font-bold text-gray-900">{lead.businessName}</h3>
                                <p className="text-sm text-gray-500 flex items-center mt-1">
                                  <Building className="h-4 w-4 mr-1" /> {lead.businessType}
                                  <span className="mx-2">•</span>
                                  <MapPin className="h-4 w-4 mr-1" /> {lead.location}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  lead.classification.toLowerCase().includes('hot') ? 'bg-red-100 text-red-800' :
                                  lead.classification.toLowerCase().includes('warm') ? 'bg-orange-100 text-orange-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {lead.classification}
                                </span>
                                <button
                                  onClick={() => handleDeleteLead(lead.id)}
                                  className="text-gray-400 hover:text-red-500 transition-colors"
                                  title="Delete Lead"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Why High Potential</h4>
                                <p className="mt-1 text-sm text-gray-900">{lead.whyHighPotential}</p>
                              </div>
                              <div>
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Suggested Sales Angle</h4>
                                <p className="mt-1 text-sm text-gray-900">{lead.salesAngle}</p>
                              </div>
                            </div>
                            
                            {lead.rating && (
                              <div className="mt-4 pt-4 border-t border-gray-100">
                                <span className="text-sm font-medium text-gray-700">Rating: </span>
                                <span className="text-sm text-gray-600">{lead.rating}</span>
                              </div>
                            )}
                            
                            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                                <span className="text-sm font-medium text-gray-700">Status:</span>
                                <div className="flex space-x-2 items-center flex-wrap gap-y-2">
                                  <button
                                    onClick={() => handleUpdateLeadStatus(lead.id, "New")}
                                    className={`px-3 py-1 text-xs font-medium rounded-full border ${
                                      (!lead.status || lead.status === "New") 
                                        ? "bg-gray-100 border-gray-300 text-gray-800" 
                                        : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                                    }`}
                                  >
                                    New
                                  </button>
                                  <button
                                    onClick={() => handleUpdateLeadStatus(lead.id, "Contacted")}
                                    className={`px-3 py-1 text-xs font-medium rounded-full border ${
                                      lead.status === "Contacted" 
                                        ? "bg-blue-100 border-blue-300 text-blue-800" 
                                        : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                                    }`}
                                  >
                                    Contacted
                                  </button>
                                  <button
                                    onClick={() => handleUpdateLeadStatus(lead.id, "Qualified")}
                                    className={`px-3 py-1 text-xs font-medium rounded-full border ${
                                      lead.status === "Qualified" 
                                        ? "bg-green-100 border-green-300 text-green-800" 
                                        : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                                    }`}
                                  >
                                    Qualified
                                  </button>
                                  <input 
                                    type="text" 
                                    placeholder="Custom status..." 
                                    className="text-xs border border-gray-300 rounded-full px-3 py-1 w-32 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                    onBlur={(e) => { if(e.target.value) handleUpdateLeadStatus(lead.id, e.target.value) }}
                                    onKeyDown={(e) => { if(e.key === 'Enter') handleUpdateLeadStatus(lead.id, e.currentTarget.value) }}
                                  />
                                </div>
                              </div>
                              {lead.outreachTemplate ? (
                                <button
                                  onClick={() => setActiveTab("outreach")}
                                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                                >
                                  <MessageSquare className="mr-1.5 h-3 w-3" /> View Template
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleGenerateOutreachForLead(lead.id)}
                                  disabled={lead.isGeneratingOutreach}
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                                >
                                  {lead.isGeneratingOutreach ? (
                                    <><Loader2 className="animate-spin mr-1.5 h-3 w-3" /> Generating...</>
                                  ) : (
                                    <><MessageSquare className="mr-1.5 h-3 w-3" /> Generate Outreach</>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex justify-center pt-4">
                      <button
                        onClick={() => handleGenerateLeads(true)}
                        disabled={isGeneratingLeads}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        {isGeneratingLeads ? (
                          <><Loader2 className="animate-spin mr-2 h-4 w-4" /> Generating...</>
                        ) : (
                          <><Plus className="mr-2 h-4 w-4" /> Load More Leads</>
                        )}
                      </button>
                    </div>
                    
                    {leadLinks.length > 0 && (
                      <div className="mt-8 pt-8 border-t border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <MapPin className="mr-2 h-5 w-5 text-gray-500" />
                          Source Links & Maps
                        </h3>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {leadLinks.map((link, idx) => (
                            <li key={idx} className="flex items-start">
                              <a href={link.uri} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline flex items-center">
                                <span className="truncate">{link.title}</span>
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="mx-auto h-12 w-12 text-gray-400 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Search className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No leads generated yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Click the button above to start finding leads based on your strategy.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "outreach" && (
            <div className="p-6 sm:p-8 h-full flex flex-col">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Outreach Templates</h2>
                  <p className="mt-1 text-sm text-gray-500">Personalized scripts for WhatsApp, Email, LinkedIn, and Cold Calling.</p>
                </div>
                <div className="flex space-x-3">
                  {(outreach || leads.some(l => l.outreachTemplate)) && !isGeneratingOutreach && (
                    <button
                      onClick={handleClearOutreach}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Clear Templates
                    </button>
                  )}
                  {!outreach && !isGeneratingOutreach && (
                    <button
                      onClick={handleGenerateOutreach}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      <MessageSquare className="mr-2 h-4 w-4" /> Generate General Templates
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-8">
                {isGeneratingOutreach && !outreach && (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                    <span className="ml-3 text-gray-500 font-medium">Crafting high-converting outreach messages...</span>
                  </div>
                )}
                
                {outreach && (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 relative group">
                    <button
                      onClick={() => handleCopy(outreach, 'general')}
                      className="absolute top-4 right-4 p-2 text-gray-400 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                      title="Copy to clipboard"
                    >
                      {copiedId === 'general' ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                    </button>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">General Templates</h3>
                    <div className="prose prose-indigo max-w-none">
                      <Markdown remarkPlugins={[remarkGfm]}>{outreach}</Markdown>
                    </div>
                  </div>
                )}

                {leads.filter(l => l.outreachTemplate).length > 0 && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-gray-900 border-b pb-2">Lead-Specific Templates</h3>
                    {leads.filter(l => l.outreachTemplate).map(lead => (
                      <div key={lead.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 relative group">
                        <button
                          onClick={() => handleCopy(lead.outreachTemplate || "", lead.id)}
                          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                          title="Copy to clipboard"
                        >
                          {copiedId === lead.id ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                        </button>
                        <h4 className="text-lg font-bold text-gray-900 mb-2">{lead.businessName}</h4>
                        <div className="prose prose-indigo max-w-none text-sm">
                          <Markdown remarkPlugins={[remarkGfm]}>{lead.outreachTemplate || ""}</Markdown>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!outreach && !isGeneratingOutreach && leads.filter(l => l.outreachTemplate).length === 0 && (
                  <div className="text-center py-16">
                    <div className="mx-auto h-12 w-12 text-gray-400 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No templates generated yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Generate a general template or generate specific templates from the Leads tab.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "report" && (
            <div className="p-6 sm:p-8 h-full flex flex-col">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Final Strategy Report</h2>
                  <p className="mt-1 text-sm text-gray-500">Comprehensive summary of leads, conversion rates, and revenue potential.</p>
                </div>
                {!report && !isGeneratingReport && (
                  <button
                    onClick={handleGenerateReport}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <FileText className="mr-2 h-4 w-4" /> Generate Report
                  </button>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {isGeneratingReport && !report ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                    <span className="ml-3 text-gray-500 font-medium">Analyzing data and generating final report...</span>
                  </div>
                ) : report ? (
                  <div className="prose prose-indigo max-w-none">
                    <Markdown remarkPlugins={[remarkGfm]}>{report}</Markdown>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="mx-auto h-12 w-12 text-gray-400 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <FileText className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No report generated yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Generate your final strategy summary report based on the collected leads.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 relative">
            <button 
              onClick={() => setIsSettingsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
            >
              ✕
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center">
              <Settings className="mr-2 h-5 w-5 text-indigo-600" /> API Settings
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Enter your Google Gemini API key to use LeadGenius AI. You can get a free API key from{" "}
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-500 underline">
                Google AI Studio
              </a>.
              Your key is stored locally in your browser and is never sent to our servers.
            </p>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 mb-4"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); localStorage.setItem("gemini_api_key", apiKey); setIsSettingsOpen(false); } }}
            />
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem("gemini_api_key", apiKey);
                  setIsSettingsOpen(false);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Save Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
