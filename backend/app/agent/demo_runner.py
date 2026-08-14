"""
CLI Side-by-Side Demo Runner for Sentinel Layer (Phase 6).

Usage:
  python -m app.agent.demo_runner --scenario 1
  python -m app.agent.demo_runner --all
"""
import argparse
import asyncio
import json

from app.scenarios.attack_scenarios import SCENARIO_DEFINITIONS, run_scenario


def print_banner(text: str, char: str = "="):
    line = char * 80
    print(f"\n{line}\n  {text}\n{line}")


async def run_cli_demo(scenario_id: int):
    result = await run_scenario(scenario_id)

    print_banner(f"SCENARIO {result['scenario_id']}: {result['title']}")
    print(f"Description: {result['description']}")
    print(f"Incoming Source: {result['incoming_content']['source']}")
    print(f"Incoming Text:\n  \"{result['incoming_content']['text']}\"")
    print(f"Proposed Tool Call: {result['proposed_tool_call']['tool_name']} with args {result['proposed_tool_call']['arguments']}")

    print("\n" + "-" * 80)
    print(" [UNPROTECTED AGENT RUN] (Vulnerable)")
    print("-" * 80)
    unprotected = result["unprotected_run"]
    print(f"Status:        {unprotected['status']}")
    print(f"Tool Executed: {unprotected['tool_executed']}")
    print(f"Tool Output:   {json.dumps(unprotected['tool_output'])}")
    print(f"Summary:       {unprotected['security_summary']}")

    print("\n" + "-" * 80)
    print(" [SENTINEL PROTECTED AGENT RUN] (Secured)")
    print("-" * 80)

    protected = result["protected_run"]
    print(f"Status:        {protected['status']}")
    print(f"Tool Executed: {protected['tool_executed']}")
    if protected['screen_response']:
        sr = protected['screen_response']
        print(f"Verdict:       {sr['verdict'].upper()}")
        print(f"Risk Score:    {sr['risk_score']:.2f}")
        print(f"Explanation:   {sr['explanation']}")
        if sr['matched_signals']:
            print("Matched Signals:")
            for sig in sr['matched_signals']:
                print(f"  - [{sig['stage']}] {sig['signal']} (score: {sig.get('score')})")
    print(f"Summary:       {protected['security_summary']}")
    print_banner("DEMO RESULT: SENTINEL PREVENTED THE ATTACK!", char="*")


async def main():
    parser = argparse.ArgumentParser(description="Sentinel Layer Side-by-Side Demo Runner")
    parser.add_argument("--scenario", type=int, choices=[1, 2, 3], help="Scenario ID to run (1, 2, or 3)")
    parser.add_argument("--all", action="store_true", help="Run all 3 attack scenarios sequentially")

    args = parser.parse_args()

    if args.all:
        for sid in [1, 2, 3]:
            await run_cli_demo(sid)
    elif args.scenario:
        await run_cli_demo(args.scenario)
    else:
        print("Please specify --scenario 1/2/3 or --all. Example: python -m app.agent.demo_runner --scenario 1")


if __name__ == "__main__":
    asyncio.run(main())
