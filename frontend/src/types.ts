/**
 * Sentinel Layer - Type Definitions
 */

export type VerdictType = 'ALLOW' | 'REQUIRE_APPROVAL' | 'BLOCK';

export interface AttackScenario {
  id: string;
  title: string;
  category: string;
  badge: string;
  prompt: string;
  proposedAction: {
    tool: string;
    target: string;
    params: Record<string, string | number | boolean>;
  };
  unprotectedOutcome: {
    executed: boolean;
    consequence: string;
    riskLevel: 'CRITICAL' | 'HIGH';
  };
  sentinelOutcome: {
    verdict: VerdictType;
    riskScore: number;
    ruleMatch?: string;
    semanticMatch?: string;
    llmJudgeVerdict?: string;
    policyViolation?: string;
    explanation: string;
  };
}

export interface ArchitecturePhase {
  phase: number;
  id: string;
  title: string;
  subtitle: string;
  description: string;
  technicalLabel: string;
  layer: 'SYSTEM' | 'SECURITY' | 'OPERATIONS';
  activeNodes: string[];
  metrics?: {
    latency?: string;
    confidence?: string;
    status?: string;
  };
}

export interface SocAuditEvent {
  id: string;
  timestamp: string;
  agentId: string;
  sessionId: string;
  tool: string;
  source: string;
  riskScore: number;
  verdict: VerdictType;
  matchedSignals: string[];
  policyDecision: 'ALLOW' | 'VIOLATION' | 'OVERRIDE' | 'EXEMPT';
  policyReason: string;
  explanation: string;
}

export interface TechStackItem {
  layer: string;
  technology: string;
  purpose: string;
  badge: string;
}

export type UserRole = 'admin' | 'developer' | 'intern' | 'tech_lead' | 'custom';

export interface UserSession {
  id: string;
  name: string;
  role: UserRole;
  roleTitle: string;
  badge: string;
  email: string;
  avatarColor: string;
  authMethod: 'one_click' | 'oauth_google' | 'oauth_github' | 'credentials';
  loginTime: string;
  permissions: string[];
}
