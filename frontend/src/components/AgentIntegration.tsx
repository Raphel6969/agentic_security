import React, { useState } from 'react';
import { Terminal, Code, Copy, Check, CheckCircle2, Cpu, ArrowRight, ShieldCheck } from 'lucide-react';

export const AgentIntegration: React.FC = () => {
  const [selectedFramework, setSelectedFramework] = useState<'python' | 'typescript' | 'langchain' | 'crewai'>('python');
  const [copied, setCopied] = useState(false);

  const snippets: Record<string, string> = {
    python: `# Python SDK Integration
from kyron import KyronClient

# 1. Initialize client pointing to local or hosted Kyron gateway
kyron = KyronClient(base_url="http://localhost:8000")

async def execute_agent_tool(agent_id: str, tool_name: str, arguments: dict):
    # 2. Intercept proposed action before execution
    screen_result = await kyron.screen(
        agent_id=agent_id,
        tool=tool_name,
        params=arguments,
        untrusted_context=agent.get_latest_context()
    )

    # 3. Enforce deterministic machine-readable verdict
    if screen_result.verdict == "ALLOW":
        return await real_tool_executor(tool_name, arguments)
    elif screen_result.verdict == "REQUIRE_APPROVAL":
        return await pause_for_human_approval(screen_result.session_id)
    else:
        raise SecurityException(f"Blocked by Kyron: {screen_result.reason}")`,

    typescript: `// TypeScript / Node.js SDK
import { KyronClient } from '@kyron-layer/sdk';

const kyron = new KyronClient({ endpoint: process.env.KYRON_GATEWAY_URL });

export async function interceptToolCall(agentId: string, tool: string, args: Record<string, unknown>) {
  // Pre-execution runtime interception
  const decision = await kyron.screen({
    agentId,
    tool,
    params: args,
  });

  if (decision.verdict === 'ALLOW') {
    return runNativeTool(tool, args);
  } else if (decision.verdict === 'REQUIRE_APPROVAL') {
    return await requestOperatorApproval(decision.eventId);
  } else {
    throw new Error(\`Kyron Block: \${decision.explanation}\`);
  }
}`,

    langchain: `# LangChain Tool Interceptor Callback
from langchain.callbacks.base import BaseCallbackHandler
from kyron import KyronClient

class KyronSecurityCallback(BaseCallbackHandler):
    def __init__(self, gateway_url: str):
        self.kyron = KyronClient(base_url=gateway_url)

    def on_tool_start(self, serialized: dict, input_str: str, **kwargs):
        decision = self.kyron.screen_sync(
            tool=serialized.get("name"),
            input_payload=input_str
        )
        if decision.verdict == "BLOCK":
            raise ValueError(f"Kyron Policy Block: {decision.reason}")`,

    crewai: `# CrewAI Custom Guardrail Hook
from crewai.tools import tool
from kyron import KyronClient

kyron = KyronClient(base_url="http://kyron-gateway:8000")

@tool("sandboxed_filesystem_writer")
def safe_write_file(path: str, content: str) -> str:
    """Writes content to disk after Kyron validation"""
    verdict = kyron.screen_sync(
        tool="write_file",
        params={"path": path, "content": content}
    )
    if verdict.is_blocked:
        return f"Action prevented: {verdict.explanation}"
    
    with open(path, "w") as f:
        f.write(content)
    return "File written safely."`
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(snippets[selectedFramework]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="agent-integration" className="py-24 px-4 sm:px-6 lg:px-8 relative border-t border-white/5 bg-transparent">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-mono mb-4 border border-teal-500/20 backdrop-blur-md">
            <Terminal className="w-3.5 h-3.5 text-teal-400" />
            <span className="font-semibold uppercase tracking-wider">FOR DEVELOPERS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-white tracking-tight leading-[1.18]">
            Add a security layer without rebuilding your agent.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-300/90 leading-relaxed font-sans">
            Kyron is designed around a thin agent-side integration layer. Instead of rewriting your agent's core architecture, intercept the single moment before a tool executes and forward the action to Kyron.
          </p>
        </div>

        {/* 3 Step Integration Flow */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-6 shadow-lg hover:bg-white/10 hover:border-white/20 transition-all">
            <div className="text-xs font-mono text-teal-400 mb-2 font-bold">STEP 01</div>
            <h3 className="text-lg font-display font-semibold text-white">Intercept Tool Invocation</h3>
            <p className="text-xs text-slate-400 mt-2">
              Hook into your agent framework's tool-dispatch handler or middleware.
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 border border-teal-500/30 backdrop-blur-xl p-6 shadow-lg shadow-teal-500/10">
            <div className="text-xs font-mono text-teal-300 mb-2 font-bold">STEP 02</div>
            <h3 className="text-lg font-display font-semibold text-white">Query /screen Endpoint</h3>
            <p className="text-xs text-slate-400 mt-2">
              Forward context, tool target, and parameters. Kyron resolves in &lt;2ms.
            </p>
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-6 shadow-lg hover:bg-white/10 hover:border-white/20 transition-all">
            <div className="text-xs font-mono text-teal-400 mb-2 font-bold">STEP 03</div>
            <h3 className="text-lg font-display font-semibold text-white">Enforce Verdict</h3>
            <p className="text-xs text-slate-400 mt-2">
              Execute on ALLOW, pause on APPROVAL, or halt on BLOCK with auditable logs.
            </p>
          </div>
        </div>

        {/* Code Snippet Box */}
        <div className="mt-10 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl overflow-hidden shadow-2xl">
          {/* Tabs Bar */}
          <div className="flex flex-wrap items-center justify-between px-6 py-3.5 bg-slate-950/60 border-b border-white/10 backdrop-blur-md">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'python', label: 'Python SDK' },
                { id: 'typescript', label: 'TypeScript / Node' },
                { id: 'langchain', label: 'LangChain' },
                { id: 'crewai', label: 'CrewAI' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedFramework(tab.id as any)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-medium transition-all cursor-pointer ${
                    selectedFramework === tab.id
                      ? 'bg-gradient-to-r from-teal-500 to-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs font-mono text-teal-300 hover:text-white px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-white/20 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>

          {/* Code Viewer */}
          <div className="p-6 overflow-x-auto text-xs sm:text-sm font-mono text-slate-200 bg-slate-950/80 leading-relaxed backdrop-blur-sm">
            <pre><code>{snippets[selectedFramework]}</code></pre>
          </div>
        </div>

      </div>
    </section>
  );
};
