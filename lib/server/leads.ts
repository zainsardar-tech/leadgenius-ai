export type Lead = {
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

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const inferClassification = (input: string) => {
  const value = input.toLowerCase();
  if (value.includes("hot")) return "Hot";
  if (value.includes("warm")) return "Warm";
  return "Cold";
};

export function parseLeadsFromText(raw: string, prefix = "lead"): Lead[] {
  const leadBlocks = raw.split("---LEAD_START---").slice(1);

  const parsed = leadBlocks
    .map((block, index) => {
      const content = block.split("---LEAD_END---")[0] || "";
      const extract = (field: string) => {
        const regex = new RegExp(`${field}:\\s*(.*)`, "i");
        const match = content.match(regex);
        return match ? match[1].trim() : "";
      };

      const businessName = extract("Business Name");
      const businessType = extract("Business Type");
      const location = extract("Location");
      const whyHighPotential = extract("Why High Potential");
      const salesAngle = extract("Sales Angle");

      return {
        id: `${prefix}-${Date.now()}-${index}`,
        businessName,
        businessType,
        location,
        rating: extract("Rating"),
        whyHighPotential,
        salesAngle,
        classification: inferClassification(extract("Classification")),
      } satisfies Lead;
    })
    .filter((lead) => lead.businessName && lead.location && lead.salesAngle);

  const seen = new Set<string>();

  return parsed.filter((lead) => {
    const key = `${normalize(lead.businessName)}|${normalize(lead.location)}`;
    if (!key || key === "|") return false;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
