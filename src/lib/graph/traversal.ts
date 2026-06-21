/**
 * Knowledge Graph Traversal Engine
 * 
 * Enables the Reasoning Engine to traverse the graph from any concept
 * to discover relevant methodology paths based on market context.
 */

import { SupabaseClient } from "@supabase/supabase-js";

export interface GraphPath {
  nodes: GraphPathNode[];
  total_weight: number;
  total_confidence_modifier: number;
}

export interface GraphPathNode {
  concept_id: string;
  knowledge_id: string;
  name: string;
  relationship_type: string | null;
  weight: number;
  confidence_modifier: number;
  depth: number;
}

export class GraphTraversal {
  constructor(private db: SupabaseClient) {}

  /**
   * Find all paths from a source concept to a target concept.
   * Uses BFS with max depth to prevent infinite loops.
   */
  async findPaths(
    sourceKnowledgeId: string,
    targetKnowledgeId: string,
    maxDepth = 5
  ): Promise<GraphPath[]> {
    const concepts = await this.loadConcepts();
    const edges = await this.loadEdges();

    const sourceId = concepts.find(c => c.knowledge_id === sourceKnowledgeId)?.id;
    const targetId = concepts.find(c => c.knowledge_id === targetKnowledgeId)?.id;
    if (!sourceId || !targetId) return [];

    const paths: GraphPath[] = [];
    const queue: { path: GraphPathNode[]; visited: Set<string> }[] = [];

    const sourceConcept = concepts.find(c => c.id === sourceId)!;
    queue.push({
      path: [{
        concept_id: sourceId,
        knowledge_id: sourceConcept.knowledge_id,
        name: sourceConcept.name,
        relationship_type: null,
        weight: 1,
        confidence_modifier: 0,
        depth: 0,
      }],
      visited: new Set([sourceId]),
    });

    while (queue.length > 0) {
      const { path, visited } = queue.shift()!;
      const current = path[path.length - 1];

      if (current.depth >= maxDepth) continue;

      const outgoing = edges.filter(e => e.source_id === current.concept_id);
      for (const edge of outgoing) {
        if (visited.has(edge.target_id)) continue;

        const targetConcept = concepts.find(c => c.id === edge.target_id);
        if (!targetConcept) continue;

        const newNode: GraphPathNode = {
          concept_id: edge.target_id,
          knowledge_id: targetConcept.knowledge_id,
          name: targetConcept.name,
          relationship_type: edge.relationship_type,
          weight: edge.weight,
          confidence_modifier: edge.confidence_modifier,
          depth: current.depth + 1,
        };

        const newPath = [...path, newNode];

        if (edge.target_id === targetId) {
          paths.push({
            nodes: newPath,
            total_weight: newPath.reduce((sum, n) => sum * n.weight, 1),
            total_confidence_modifier: newPath.reduce((sum, n) => sum + n.confidence_modifier, 0),
          });
        } else {
          const newVisited = new Set(visited);
          newVisited.add(edge.target_id);
          queue.push({ path: newPath, visited: newVisited });
        }
      }
    }

    return paths.sort((a, b) => b.total_weight - a.total_weight);
  }

  /**
   * Get all concepts reachable from a source within N hops.
   */
  async getReachable(sourceKnowledgeId: string, maxDepth = 3): Promise<GraphPathNode[]> {
    const concepts = await this.loadConcepts();
    const edges = await this.loadEdges();

    const sourceId = concepts.find(c => c.knowledge_id === sourceKnowledgeId)?.id;
    if (!sourceId) return [];

    const visited = new Set<string>();
    const result: GraphPathNode[] = [];
    const queue: { id: string; depth: number; relType: string | null; weight: number; confMod: number }[] = [
      { id: sourceId, depth: 0, relType: null, weight: 1, confMod: 0 }
    ];

    while (queue.length > 0) {
      const { id, depth, relType, weight, confMod } = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);

      const concept = concepts.find(c => c.id === id);
      if (!concept) continue;

      result.push({
        concept_id: id,
        knowledge_id: concept.knowledge_id,
        name: concept.name,
        relationship_type: relType,
        weight,
        confidence_modifier: confMod,
        depth,
      });

      if (depth < maxDepth) {
        const outgoing = edges.filter(e => e.source_id === id);
        for (const edge of outgoing) {
          if (!visited.has(edge.target_id)) {
            queue.push({
              id: edge.target_id,
              depth: depth + 1,
              relType: edge.relationship_type,
              weight: edge.weight,
              confMod: edge.confidence_modifier,
            });
          }
        }
      }
    }

    return result;
  }

  /**
   * Get graph statistics.
   */
  async getMetrics() {
    const [conceptsRes, relsRes] = await Promise.all([
      this.db.from("concepts").select("id", { count: "exact", head: true }),
      this.db.from("relationships").select("id", { count: "exact", head: true }),
    ]);

    const nodes = conceptsRes.count || 0;
    const edgeCount = relsRes.count || 0;

    return {
      total_nodes: nodes,
      total_edges: edgeCount,
      average_degree: nodes > 0 ? ((edgeCount * 2) / nodes).toFixed(1) : "0",
      density: nodes > 1 ? (edgeCount / (nodes * (nodes - 1))).toFixed(4) : "0",
    };
  }

  // ─── Private ────────────────────────────────────────────────────────────

  private conceptsCache: { id: string; knowledge_id: string; name: string }[] | null = null;
  private edgesCache: { source_id: string; target_id: string; relationship_type: string; weight: number; confidence_modifier: number }[] | null = null;

  private async loadConcepts() {
    if (!this.conceptsCache) {
      const { data } = await this.db.from("concepts").select("id, knowledge_id, name");
      this.conceptsCache = data || [];
    }
    return this.conceptsCache;
  }

  private async loadEdges() {
    if (!this.edgesCache) {
      const { data } = await this.db.from("relationships").select("source_id, target_id, relationship_type, weight, confidence_modifier");
      this.edgesCache = data || [];
    }
    return this.edgesCache;
  }
}
