/**
 * Reasoning Engine
 * 
 * The central intelligence layer of Trading Brain OS.
 * Transforms market observations into structured reasoning using
 * LLM (DeepSeek/OpenAI-compatible) + the Knowledge Graph.
 * 
 * Pipeline: Observe → Contextualize → Hypotheses → Evidence → 
 *           Score → Resolve Conflicts → Select Playbook → 
 *           Calculate Confidence → Recommend → Explain
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { GraphTraversal } from "../graph/traversal";

export interface ReasoningInput {
  symbol: string;
  timeframes: Record<string, TimeframeData>;
  session: string;
  macro_context?: string;
}

export interface TimeframeData {
  bias: string;
  structure: string;
  liquidity: string;
  key_levels: string;
  notes: string;
}

export interface ReasoningOutput {
  symbol: string;
  bias: string;
  market_state: string;
  confidence: number;
  narrative: string;
  primary_playbook: string | null;
  alternative_playbooks: string[];
  supporting_evidence: string[];
  contradicting_evidence: string[];
  decision: string;
  reasoning_tree: Record<string, unknown>;
  next_action: string;
  invalidation: string;
}

export class ReasoningEngine {
  private graph: GraphTraversal;

  constructor(private db: SupabaseClient) {
    this.graph = new GraphTraversal(db);
  }

  /**
   * Get LLM settings from database.
   */
  private async getLLMConfig() {
    const { data } = await this.db
      .from("user_settings")
      .select("key, value")
      .in("key", ["llm_provider", "llm_model", "llm_api_key", "llm_base_url"]);

    const config: Record<string, string> = {};
    (data || []).forEach(s => { config[s.key] = s.value; });
    return {
      provider: config.llm_provider || "deepseek",
      model: config.llm_model || "deepseek-chat",
      apiKey: config.llm_api_key || "",
      baseUrl: config.llm_base_url || "https://api.deepseek.com",
    };
  }

  /**
   * Call LLM via OpenAI-compatible API (works with DeepSeek, OpenAI, etc.)
   */
  private async callLLM(system: string, user: string): Promise<string> {
    const config = await this.getLLMConfig();
    if (!config.apiKey) {
      throw new Error("LLM API key not configured. Go to Settings to add it.");
    }

    const res = await fetch(`${config.baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        max_tokens: 4096,
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`LLM API error: ${res.status} — ${err}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  }

  /**
   * Run the full reasoning pipeline on market data.
   */
  async analyze(input: ReasoningInput): Promise<ReasoningOutput> {
    // 1. Load knowledge context
    const knowledge = await this.loadKnowledgeContext();

    // 2. Build system prompt with Trading Bible methodology
    const system = this.buildSystemPrompt(knowledge);

    // 3. Build analysis prompt
    const user = this.buildAnalysisPrompt(input);

    // 4. Call LLM
    const response = await this.callLLM(system, user);

    // 5. Parse structured response
    const result = this.parseResponse(response, input.symbol);

    // 6. Store in database
    await this.storeAnalysis(input, result);

    return result;
  }

  /**
   * Load relevant knowledge from the graph for the system prompt.
   */
  private async loadKnowledgeContext(): Promise<string> {
    const { data: concepts } = await this.db
      .from("concepts")
      .select("knowledge_id, name, definition, category")
      .in("priority", ["critical"])
      .order("graph_level");

    if (!concepts || concepts.length === 0) return "No knowledge loaded.";

    const grouped: Record<string, string[]> = {};
    concepts.forEach(c => {
      const cat = c.category;
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(`[${c.knowledge_id}] ${c.name}: ${c.definition}`);
    });

    return Object.entries(grouped)
      .map(([cat, items]) => `## ${cat}\n${items.join("\n")}`)
      .join("\n\n");
  }

  /**
   * System prompt — encodes the Trading Brain's methodology.
   */
  private buildSystemPrompt(knowledge: string): string {
    return `You are the Trading Brain — an institutional-grade AI reasoning engine for forex trading.

You analyze markets exactly like an institutional trader:
1. Start from LIQUIDITY — where are institutions likely to execute?
2. Then STRUCTURE — what is the market's structural state?
3. Then NARRATIVE — what is the highest-probability explanation?
4. Then AOIs — where are the execution zones?
5. Then CONFIRMATION — is there evidence to act?
6. Then DECISION — execute, wait, or reject?

CORE RULES:
- You NEVER predict. You evaluate probability based on evidence.
- Liquidity determines WHERE. Structure determines HOW. Narrative determines WHY.
- Higher timeframes ALWAYS dominate lower timeframes.
- You need: Liquidity + Structure + AOI + Narrative + Confirmation = TRADE
- If ANY is missing: NO TRADE or WAIT.
- CHOCH alone is NOT a reversal. MSS is required.
- Every trade must have a playbook: Continuation, Reversal, Breaker, Inducement, or Mitigation.

CONFIDENCE MODEL:
- 95-100: Institutional Grade — Execute
- 85-94: High Probability — Execute
- 70-84: Good — Execute with reduced risk
- 60-69: Weak — Wait
- Below 60: Reject

PLAYBOOKS:
- Continuation: Trend + BOS + Retracement + AOI + Entry
- Reversal: Liquidity Sweep + CHOCH + MSS + Retest AOI + Entry
- Breaker: OB Fails + CHOCH + MSS + Retest Breaker + Entry
- Inducement: Range + Inducement + Sweep + CHOCH + MSS + Entry
- Mitigation: Impulse + FVG/OB left + Retracement + Mitigation + Entry

KNOWLEDGE BASE:
${knowledge}

RESPONSE FORMAT (JSON):
{
  "bias": "bullish|bearish|neutral",
  "market_state": "trending|ranging|accumulating|distributing|expanding|retracing|reversing|compressing|unknown",
  "confidence": 0-100,
  "narrative": "One paragraph institutional narrative",
  "primary_playbook": "continuation|reversal|breaker|inducement|mitigation|null",
  "alternative_playbooks": [],
  "supporting_evidence": ["evidence 1", "evidence 2"],
  "contradicting_evidence": ["evidence 1"],
  "decision": "buy|sell|wait|no_trade",
  "next_action": "What should the trader watch for next",
  "invalidation": "What would invalidate this analysis"
}

Respond ONLY with valid JSON. No markdown, no explanation outside the JSON.`;
  }

  /**
   * Build the analysis prompt from market data input.
   */
  private buildAnalysisPrompt(input: ReasoningInput): string {
    let prompt = `Analyze ${input.symbol} for a potential trade.\n\nCurrent Session: ${input.session}\n`;

    if (input.macro_context) {
      prompt += `\nMacro Context: ${input.macro_context}\n`;
    }

    prompt += `\nMulti-Timeframe Analysis:\n`;
    for (const [tf, data] of Object.entries(input.timeframes)) {
      prompt += `\n### ${tf}\n`;
      prompt += `- Bias: ${data.bias}\n`;
      prompt += `- Structure: ${data.structure}\n`;
      prompt += `- Liquidity: ${data.liquidity}\n`;
      prompt += `- Key Levels: ${data.key_levels}\n`;
      if (data.notes) prompt += `- Notes: ${data.notes}\n`;
    }

    prompt += `\nApply the full institutional reasoning pipeline. Determine bias, select playbook (if any), calculate confidence, and provide your decision.`;
    return prompt;
  }

  /**
   * Parse the LLM's JSON response into structured output.
   */
  private parseResponse(response: string, symbol: string): ReasoningOutput {
    try {
      // Strip any markdown code fences
      const cleaned = response.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      return {
        symbol,
        bias: parsed.bias || "neutral",
        market_state: parsed.market_state || "unknown",
        confidence: Number(parsed.confidence) || 0,
        narrative: parsed.narrative || "",
        primary_playbook: parsed.primary_playbook || null,
        alternative_playbooks: parsed.alternative_playbooks || [],
        supporting_evidence: parsed.supporting_evidence || [],
        contradicting_evidence: parsed.contradicting_evidence || [],
        decision: parsed.decision || "wait",
        reasoning_tree: parsed,
        next_action: parsed.next_action || "",
        invalidation: parsed.invalidation || "",
      };
    } catch {
      return {
        symbol,
        bias: "neutral",
        market_state: "unknown",
        confidence: 0,
        narrative: "Failed to parse reasoning response: " + response.slice(0, 200),
        primary_playbook: null,
        alternative_playbooks: [],
        supporting_evidence: [],
        contradicting_evidence: [],
        decision: "wait",
        reasoning_tree: { raw: response },
        next_action: "Manual review required",
        invalidation: "",
      };
    }
  }

  /**
   * Store analysis result in the database.
   */
  private async storeAnalysis(input: ReasoningInput, result: ReasoningOutput) {
    await this.db.from("top_down_analyses").insert({
      symbol: input.symbol,
      bias: result.bias,
      market_state: result.market_state,
      alignment_score: result.confidence,
      institutional_narrative: result.narrative,
      liquidity_objective: {},
      timeframe_analyses: input.timeframes,
      playbook_candidates: result.primary_playbook
        ? [{ name: result.primary_playbook, score: result.confidence }]
        : [],
      confidence: result.confidence,
      valid: true,
      metadata: {
        decision: result.decision,
        supporting: result.supporting_evidence,
        contradicting: result.contradicting_evidence,
        invalidation: result.invalidation,
        next_action: result.next_action,
      },
    });
  }
}
