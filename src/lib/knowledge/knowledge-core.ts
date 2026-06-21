/**
 * Knowledge Core Engine
 * 
 * The permanent knowledge base of Trading Brain OS.
 * Manages concepts, rules, relationships, and playbooks.
 * Immutable during production — changes only through the Compiler.
 */

import { SupabaseClient } from "@supabase/supabase-js";
import type { Concept, Rule, Relationship, Playbook, KnowledgeDomain } from "../types";

export class KnowledgeCore {
  constructor(private db: SupabaseClient) {}

  // ─── Concepts ────────────────────────────────────────────────────────────

  async getConcept(knowledgeId: string): Promise<Concept | null> {
    const { data, error } = await this.db
      .from("concepts")
      .select("*, knowledge_domains(name)")
      .eq("knowledge_id", knowledgeId)
      .single();

    if (error || !data) return null;
    return this.mapConcept(data);
  }

  async getConceptsByDomain(domain: KnowledgeDomain): Promise<Concept[]> {
    const { data, error } = await this.db
      .from("concepts")
      .select("*, knowledge_domains(name)")
      .eq("knowledge_domains.name", domain)
      .order("graph_level", { ascending: true });

    if (error || !data) return [];
    return data.map(this.mapConcept);
  }

  async searchConcepts(query: string, limit = 20): Promise<Concept[]> {
    const { data, error } = await this.db
      .from("concepts")
      .select("*, knowledge_domains(name)")
      .or(`name.ilike.%${query}%,definition.ilike.%${query}%,knowledge_id.ilike.%${query}%`)
      .limit(limit);

    if (error || !data) return [];
    return data.map(this.mapConcept);
  }

  async getAllConcepts(status?: string): Promise<Concept[]> {
    let query = this.db
      .from("concepts")
      .select("*, knowledge_domains(name)")
      .order("graph_level", { ascending: true });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data.map(this.mapConcept);
  }

  async upsertConcept(concept: Partial<Concept> & { knowledge_id: string; name: string; definition: string; domain: KnowledgeDomain }): Promise<Concept | null> {
    // Get domain ID
    const { data: domainData } = await this.db
      .from("knowledge_domains")
      .select("id")
      .eq("name", concept.domain)
      .single();

    if (!domainData) return null;

    const { data, error } = await this.db
      .from("concepts")
      .upsert({
        knowledge_id: concept.knowledge_id,
        domain_id: domainData.id,
        category: concept.category || "general",
        name: concept.name,
        definition: concept.definition,
        purpose: concept.purpose || "",
        version: concept.version || "1.0.0",
        status: concept.status || "draft",
        graph_level: concept.graph_level || 1,
        priority: concept.priority || "normal",
        confidence_impact: concept.confidence_impact || 0,
        risk_impact: concept.risk_impact || 0,
        embedding_required: concept.embedding_required ?? true,
        metadata: concept.metadata || {},
        updated_at: new Date().toISOString(),
      }, { onConflict: "knowledge_id" })
      .select("*, knowledge_domains(name)")
      .single();

    if (error || !data) return null;
    return this.mapConcept(data);
  }

  // ─── Rules ──────────────────────────────────────────────────────────────

  async getRulesForConcept(conceptId: string): Promise<Rule[]> {
    const { data, error } = await this.db
      .from("rules")
      .select("*")
      .eq("concept_id", conceptId)
      .order("priority", { ascending: true });

    if (error || !data) return [];
    return data;
  }

  async upsertRule(rule: Partial<Rule> & { concept_id: string; name: string; description: string; rule_type: string }): Promise<Rule | null> {
    const { data, error } = await this.db
      .from("rules")
      .upsert({
        concept_id: rule.concept_id,
        knowledge_id: rule.knowledge_id || "",
        name: rule.name,
        description: rule.description,
        rule_type: rule.rule_type,
        priority: rule.priority || "normal",
        inputs: rule.inputs || [],
        outputs: rule.outputs || [],
        dependencies: rule.dependencies || [],
        exceptions: rule.exceptions || [],
        version: rule.version || "1.0.0",
        metadata: rule.metadata || {},
      })
      .select()
      .single();

    if (error || !data) return null;
    return data;
  }

  // ─── Relationships ──────────────────────────────────────────────────────

  async getRelationshipsForConcept(conceptId: string): Promise<Relationship[]> {
    const { data, error } = await this.db
      .from("relationships")
      .select("*")
      .or(`source_id.eq.${conceptId},target_id.eq.${conceptId}`);

    if (error || !data) return [];
    return data;
  }

  async createRelationship(rel: Partial<Relationship> & { source_id: string; target_id: string; relationship_type: string }): Promise<Relationship | null> {
    const { data, error } = await this.db
      .from("relationships")
      .insert({
        source_id: rel.source_id,
        target_id: rel.target_id,
        relationship_type: rel.relationship_type,
        weight: rel.weight || 0.5,
        confidence_modifier: rel.confidence_modifier || 0,
        priority: rel.priority || 50,
        direction: rel.direction || "unidirectional",
        conditions: rel.conditions || null,
        version: rel.version || "1.0.0",
        metadata: rel.metadata || {},
      })
      .select()
      .single();

    if (error || !data) return null;
    return data;
  }

  // ─── Playbooks ──────────────────────────────────────────────────────────

  async getPlaybook(knowledgeId: string): Promise<Playbook | null> {
    const { data, error } = await this.db
      .from("playbooks")
      .select("*")
      .eq("knowledge_id", knowledgeId)
      .single();

    if (error || !data) return null;
    return data;
  }

  async getActivePlaybooks(): Promise<Playbook[]> {
    const { data, error } = await this.db
      .from("playbooks")
      .select("*")
      .eq("status", "production")
      .order("category");

    if (error || !data) return [];
    return data;
  }

  async upsertPlaybook(playbook: Partial<Playbook> & { knowledge_id: string; name: string; category: string; description: string }): Promise<Playbook | null> {
    const { data, error } = await this.db
      .from("playbooks")
      .upsert({
        knowledge_id: playbook.knowledge_id,
        name: playbook.name,
        category: playbook.category,
        description: playbook.description,
        purpose: playbook.purpose || "",
        version: playbook.version || "1.0.0",
        status: playbook.status || "draft",
        market_conditions: playbook.market_conditions || {},
        preferred_markets: playbook.preferred_markets || [],
        preferred_sessions: playbook.preferred_sessions || [],
        required_timeframes: playbook.required_timeframes || [],
        required_concepts: playbook.required_concepts || [],
        required_confirmations: playbook.required_confirmations || [],
        required_confidence: playbook.required_confidence || 80,
        entry_rules: playbook.entry_rules || {},
        management_rules: playbook.management_rules || {},
        exit_rules: playbook.exit_rules || {},
        invalidation_rules: playbook.invalidation_rules || {},
        risk_rules: playbook.risk_rules || {},
        sequence: playbook.metadata?.sequence || [],
        metadata: playbook.metadata || {},
        updated_at: new Date().toISOString(),
      }, { onConflict: "knowledge_id" })
      .select()
      .single();

    if (error || !data) return null;
    return data;
  }

  // ─── Graph Metrics ──────────────────────────────────────────────────────

  async getGraphMetrics() {
    const [concepts, relationships] = await Promise.all([
      this.db.from("concepts").select("id", { count: "exact" }),
      this.db.from("relationships").select("id", { count: "exact" }),
    ]);

    const totalNodes = concepts.count || 0;
    const totalEdges = relationships.count || 0;

    return {
      total_nodes: totalNodes,
      total_edges: totalEdges,
      average_degree: totalNodes > 0 ? (totalEdges * 2) / totalNodes : 0,
    };
  }

  // ─── Coverage ───────────────────────────────────────────────────────────

  async getDomainCoverage(): Promise<Record<string, number>> {
    const { data, error } = await this.db
      .from("knowledge_domains")
      .select("name, coverage");

    if (error || !data) return {};
    return Object.fromEntries(data.map((d) => [d.name, d.coverage || 0]));
  }

  // ─── Helpers ────────────────────────────────────────────────────────────

  private mapConcept(data: Record<string, unknown>): Concept {
    return {
      id: data.id as string,
      knowledge_id: data.knowledge_id as string,
      domain: (data.knowledge_domains as { name: string })?.name as KnowledgeDomain || "foundations",
      category: data.category as string,
      name: data.name as string,
      definition: data.definition as string,
      purpose: data.purpose as string || "",
      version: data.version as string,
      status: data.status as Concept["status"],
      graph_level: data.graph_level as number,
      priority: data.priority as Concept["priority"],
      parent_ids: [],
      child_ids: [],
      brain_version: data.brain_version as string || "",
      confidence_impact: data.confidence_impact as number || 0,
      risk_impact: data.risk_impact as number || 0,
      embedding_required: data.embedding_required as boolean,
      created_at: data.created_at as string,
      updated_at: data.updated_at as string,
      metadata: data.metadata as Record<string, unknown> || {},
    };
  }
}
