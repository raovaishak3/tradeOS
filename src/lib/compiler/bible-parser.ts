/**
 * Bible Parser
 * 
 * Parses Trading Bible markdown documents and extracts structured
 * knowledge objects (concepts, rules, relationships, playbooks).
 * 
 * This is the first stage of the Knowledge Compiler pipeline.
 */

export interface ParsedConcept {
  knowledge_id: string;
  domain: string;
  category: string;
  name: string;
  definition: string;
  purpose: string;
  version: string;
  status: string;
  graph_level: number;
  priority: string;
  dependencies: string[];
  used_by: string[];
  embedding_required: boolean;
  recognition_rules: string[];
  validation_rules: string[];
  invalidation_rules: string[];
  confidence_contributions: Record<string, number>;
  relationships: ParsedRelationship[];
  rules: ParsedRule[];
}

export interface ParsedRelationship {
  target_name: string;
  type: string;
  direction: "parent" | "child" | "strengthens" | "weakens";
}

export interface ParsedRule {
  name: string;
  description: string;
  rule_type: string;
  priority: string;
}

export interface ParsedPlaybook {
  knowledge_id: string;
  name: string;
  category: string;
  description: string;
  sequence: string[];
  entry_rules: string[];
  exit_rules: string[];
  invalid_conditions: string[];
  required_confirmations: string[];
}

/**
 * Parse a Trading Bible markdown document and extract knowledge objects.
 */
export function parseBibleDocument(content: string, filename: string): ParsedConcept[] {
  const concepts: ParsedConcept[] = [];

  // Extract compiler metadata blocks
  const metadataBlocks = extractMetadataBlocks(content);
  
  for (const meta of metadataBlocks) {
    const concept = extractConceptFromSection(content, meta);
    if (concept) {
      concepts.push(concept);
    }
  }

  // If no metadata blocks found, try to extract from header structure
  if (concepts.length === 0) {
    const concept = extractFromHeaders(content, filename);
    if (concept) {
      concepts.push(concept);
    }
  }

  return concepts;
}

/**
 * Extract YAML metadata blocks from document.
 */
function extractMetadataBlocks(content: string): Record<string, string>[] {
  const blocks: Record<string, string>[] = [];
  const regex = /```yaml\n([\s\S]*?)```/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const yaml = match[1];
    if (yaml.includes("knowledge_id")) {
      const parsed = parseSimpleYaml(yaml);
      blocks.push(parsed);
    }
  }

  return blocks;
}

/**
 * Parse simple YAML (key: value pairs, one per line).
 */
function parseSimpleYaml(yaml: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = yaml.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("-")) continue;
    
    const colonIndex = trimmed.indexOf(":");
    if (colonIndex > 0) {
      const key = trimmed.substring(0, colonIndex).trim();
      const value = trimmed.substring(colonIndex + 1).trim();
      result[key] = value;
    }
  }

  return result;
}

/**
 * Extract concept data from the section surrounding a metadata block.
 */
function extractConceptFromSection(content: string, meta: Record<string, string>): ParsedConcept | null {
  const knowledgeId = meta.knowledge_id;
  if (!knowledgeId) return null;

  // Determine domain from knowledge_id prefix
  const domain = getDomainFromId(knowledgeId);
  const graphLevel = parseInt(meta.graph_level || "1");
  const priority = meta.priority || "normal";

  // Extract definition (look for # Definition section)
  const definition = extractSection(content, "Definition") || 
                     extractSection(content, "Purpose") || "";

  // Extract name from the document (first H1 after the metadata header)
  const name = extractMainTitle(content, knowledgeId) || knowledgeId;

  // Extract relationships
  const relationships = extractRelationships(content);

  // Extract confidence contributions
  const confidence = extractConfidenceContributions(content);

  // Extract recognition rules
  const recognitionRules = extractBulletList(content, "Recognition Rules");
  const validationRules = extractBulletList(content, "Validation Rules");
  const invalidationRules = extractBulletList(content, "Invalidation Rules");

  // Extract dependencies
  const deps = meta.dependencies ? meta.dependencies.split(",").map(d => d.trim()) : [];

  return {
    knowledge_id: knowledgeId,
    domain,
    category: meta.node_type || "general",
    name: cleanName(name),
    definition: definition.slice(0, 2000),
    purpose: extractSection(content, "Purpose") || "",
    version: meta.version || "1.0.0",
    status: "draft",
    graph_level: graphLevel,
    priority,
    dependencies: deps,
    used_by: [],
    embedding_required: meta.embedding_required === "true",
    recognition_rules: recognitionRules,
    validation_rules: validationRules,
    invalidation_rules: invalidationRules,
    confidence_contributions: confidence,
    relationships,
    rules: [],
  };
}

/**
 * Fallback: extract concept from document headers when no YAML metadata.
 */
function extractFromHeaders(content: string, filename: string): ParsedConcept | null {
  // Look for header with Knowledge ID
  const headerMatch = content.match(/\*\*Knowledge ID:\*\*\s*(\S+)/);
  const domainMatch = content.match(/\*\*Domain:\*\*\s*(.+)/);
  const categoryMatch = content.match(/\*\*Category:\*\*\s*(.+)/);
  const versionMatch = content.match(/\*\*Version:\*\*\s*(.+)/);

  const knowledgeId = headerMatch?.[1] || filename.replace(".md", "").toUpperCase();
  const domain = domainMatch?.[1]?.trim().toLowerCase().replace(/\s+/g, "_") || "foundations";

  const titleMatch = content.match(/^#\s+(.+)$/m);
  const name = titleMatch?.[1] || filename.replace(".md", "");

  const definition = extractSection(content, "Definition") ||
                     extractSection(content, "Purpose") || "";

  return {
    knowledge_id: knowledgeId,
    domain: normalizeDomain(domain),
    category: categoryMatch?.[1]?.trim() || "general",
    name: cleanName(name),
    definition: definition.slice(0, 2000),
    purpose: extractSection(content, "Purpose") || "",
    version: versionMatch?.[1]?.trim() || "1.0.0",
    status: "draft",
    graph_level: 1,
    priority: "normal",
    dependencies: [],
    used_by: [],
    embedding_required: true,
    recognition_rules: extractBulletList(content, "Recognition Rules"),
    validation_rules: extractBulletList(content, "Validation Rules"),
    invalidation_rules: extractBulletList(content, "Invalidation Rules"),
    confidence_contributions: extractConfidenceContributions(content),
    relationships: extractRelationships(content),
    rules: [],
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDomainFromId(id: string): string {
  const prefix = id.split("-")[0];
  const map: Record<string, string> = {
    FND: "foundations",
    MS: "market_structure",
    LIQ: "liquidity",
    AOI: "aois",
    OF: "order_flow",
    IB: "institutional_behaviour",
    CNF: "confirmation",
    ENT: "entry",
    TM: "trade_management",
    EX: "exit",
    RSK: "risk",
    PRT: "portfolio",
    MAC: "macro",
    SES: "sessions",
    PSY: "psychology",
    EXE: "execution",
    GOV: "governance",
    LRN: "learning",
    EXP: "experience",
    PB: "playbooks",
  };
  return map[prefix] || "foundations";
}

function normalizeDomain(domain: string): string {
  const map: Record<string, string> = {
    "foundations": "foundations",
    "market_structure": "market_structure",
    "market structure": "market_structure",
    "liquidity": "liquidity",
    "areas_of_interest": "aois",
    "areas of interest (aois)": "aois",
    "aois": "aois",
    "order_flow": "order_flow",
    "order flow": "order_flow",
    "institutional_behaviour": "institutional_behaviour",
    "confirmation": "confirmation",
    "entry": "entry",
    "trade_management": "trade_management",
    "exit": "exit",
    "risk": "risk",
    "portfolio": "portfolio",
    "macro": "macro",
    "sessions": "sessions",
    "psychology": "psychology",
    "execution": "execution",
    "governance": "governance",
    "learning": "learning",
    "experience": "experience",
  };
  return map[domain.toLowerCase()] || "foundations";
}

function extractSection(content: string, heading: string): string {
  const regex = new RegExp(`#+ ${heading}\\s*\\n([\\s\\S]*?)(?=\\n#|$)`, "i");
  const match = content.match(regex);
  if (!match) return "";
  return match[1].trim().split("\n").filter(l => l.trim()).join(" ").slice(0, 2000);
}

function extractBulletList(content: string, heading: string): string[] {
  const regex = new RegExp(`#+ ${heading}[\\s\\S]*?\\n([\\s\\S]*?)(?=\\n#|$)`, "i");
  const match = content.match(regex);
  if (!match) return [];
  
  return match[1]
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.startsWith("✓") || l.startsWith("-") || l.startsWith("•"))
    .map(l => l.replace(/^[✓\-•]\s*/, "").trim())
    .filter(Boolean);
}

function extractRelationships(content: string): ParsedRelationship[] {
  const rels: ParsedRelationship[] = [];
  
  // Parent section
  const parentSection = extractSection(content, "Parent");
  if (parentSection) {
    parentSection.split(/\n|,/).forEach(p => {
      const name = p.trim();
      if (name && name.length > 2) {
        rels.push({ target_name: name, type: "child_of", direction: "parent" });
      }
    });
  }

  // Children section
  const childSection = extractSection(content, "Children");
  if (childSection) {
    childSection.split(/\n|,/).forEach(c => {
      const name = c.trim();
      if (name && name.length > 2) {
        rels.push({ target_name: name, type: "parent_of", direction: "child" });
      }
    });
  }

  return rels;
}

function extractConfidenceContributions(content: string): Record<string, number> {
  const contributions: Record<string, number> = {};
  const regex = /(.+?)\s*\n\s*([+-]\d+)/g;
  
  // Look in Confidence sections
  const confSection = content.match(/# Confidence Contribution[\s\S]*?(?=\n# |$)/i);
  if (confSection) {
    let match;
    while ((match = regex.exec(confSection[0])) !== null) {
      const key = match[1].trim();
      const value = parseInt(match[2]);
      if (!isNaN(value) && key.length > 2 && key.length < 50) {
        contributions[key] = value;
      }
    }
  }

  return contributions;
}

function extractMainTitle(content: string, knowledgeId: string): string {
  // Try to find the main heading
  const h1Match = content.match(/^# (.+)$/m);
  return h1Match?.[1]?.replace(/[#*_]/g, "").trim() || knowledgeId;
}

function cleanName(name: string): string {
  return name
    .replace(/\.md$/i, "")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
