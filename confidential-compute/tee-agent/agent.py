#!/usr/bin/env python3
"""
ScamGuardian TEE Agent
======================
A Flare Confidential Compute (FCC) extension that:
1. Listens for AnalysisRequested events on the ScamGuardian contract (Coston2)
2. Runs AI analysis via OpenRouter
3. Submits results back on-chain via submitResult()

SIMULATED_TEE=true mode - valid for hackathon judging per admin announcement.
"""

import os
import json
import time
import requests
from web3 import Web3

# ─── CONFIG ──────────────────────────────────────────────────────────────────
COSTON2_RPC      = "https://coston2-api.flare.network/ext/C/rpc"
PRIVATE_KEY      = os.environ.get("PRIVATE_KEY", "")
OPENROUTER_KEY   = os.environ.get("OPENROUTER_API_KEY", "")
CONTRACT_ADDRESS = os.environ.get("CONTRACT_ADDRESS", "")  # Set after deploy
POLL_INTERVAL    = 5  # seconds between polling

# ScamGuardian ABI (only the functions/events we need)
CONTRACT_ABI = [
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True,  "name": "requestId",     "type": "uint256"},
            {"indexed": True,  "name": "requester",     "type": "address"},
            {"indexed": False, "name": "encryptedData", "type": "string"}
        ],
        "name": "AnalysisRequested",
        "type": "event"
    },
    {
        "inputs": [
            {"name": "_requestId", "type": "uint256"},
            {"name": "_reportJson","type": "string"}
        ],
        "name": "submitResult",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"name": "", "type": "uint256"}],
        "name": "results",
        "outputs": [
            {"name": "reportJson",   "type": "string"},
            {"name": "isProcessed",  "type": "bool"}
        ],
        "stateMutability": "view",
        "type": "function"
    }
]
# ─────────────────────────────────────────────────────────────────────────────

FALLBACK_MODELS = [
    "openai/gpt-4o-mini",
    "meta-llama/llama-3.1-8b-instruct:free",
    "google/gemma-4-31b-it:free",
    "openai/gpt-oss-20b:free",
    "openrouter/auto"
]

def analyze_with_ai(target: str) -> dict:
    """Call OpenRouter with automatic fallback if rate-limited."""
    system_msg = (
        "You are ScamGuardian, a Web3 security AI agent. "
        "Analyze the provided input (contract address, project name, or token symbol) "
        "across ANY blockchain network. Evaluate community reputation, known rug pull reports, "
        "developer history, and overall trustworthiness. "
        "Respond ONLY with a valid JSON object (no markdown). Format:\n"
        '{"score": <0-100, higher=more malicious>, "type": "<threat type>", '
        '"signals": ["<finding 1>", "<finding 2>", "<finding 3>"]}'
    )

    last_error = None
    for model in FALLBACK_MODELS:
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_msg},
                {"role": "user",   "content": f"Analyze this: {target}"}
            ],
            "temperature": 0.2
        }
        headers = {
            "Authorization": f"Bearer {OPENROUTER_KEY}",
            "Content-Type": "application/json"
        }
        try:
            resp = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                json=payload,
                headers=headers,
                timeout=30
            )
            if resp.status_code == 200:
                raw = resp.json()["choices"][0]["message"]["content"].strip()
                raw = raw.replace("```json", "").replace("```", "").strip()
                return json.loads(raw)
            else:
                last_error = f"Status {resp.status_code}: {resp.text}"
                print(f"    [!] Model {model} failed, trying fallback...")
        except Exception as e:
            last_error = str(e)
            print(f"    [!] Model {model} exception: {e}, trying fallback...")

    raise RuntimeError(f"All AI models failed. Last error: {last_error}")


def submit_result_on_chain(w3, contract, account, request_id: int, report: dict):
    """Submit the analysis result to the blockchain."""
    report_json = json.dumps(report)
    nonce = w3.eth.get_transaction_count(account.address)
    gas_price = w3.eth.gas_price

    tx = contract.functions.submitResult(request_id, report_json).build_transaction({
        "from":     account.address,
        "nonce":    nonce,
        "gasPrice": gas_price,
        "gas":      300_000,
    })
    signed = account.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
    return receipt


def main():
    print("=" * 60)
    print("  ScamGuardian TEE Agent  (SIMULATED_TEE=true)")
    print("=" * 60)

    if not PRIVATE_KEY:
        print("[ERROR] PRIVATE_KEY not set in environment")
        return
    if not OPENROUTER_KEY:
        print("[ERROR] OPENROUTER_API_KEY not set in environment")
        return
    if not CONTRACT_ADDRESS:
        print("[ERROR] CONTRACT_ADDRESS not set in environment")
        return

    w3 = Web3(Web3.HTTPProvider(COSTON2_RPC))
    if not w3.is_connected():
        print("[ERROR] Cannot connect to Coston2 RPC")
        return

    account = w3.eth.account.from_key(PRIVATE_KEY)
    contract = w3.eth.contract(
        address=Web3.to_checksum_address(CONTRACT_ADDRESS),
        abi=CONTRACT_ABI
    )

    print(f"[+] Connected to Coston2")
    print(f"[+] Agent wallet: {account.address}")
    print(f"[+] Contract:     {CONTRACT_ADDRESS}")
    print(f"[+] Polling every {POLL_INTERVAL}s for new requests...\n")

    processed_ids = set()
    last_block = w3.eth.block_number - 100  # start from recent blocks

    while True:
        try:
            current_block = w3.eth.block_number
            # Fetch AnalysisRequested events
            events = contract.events.AnalysisRequested.get_logs(
                fromBlock=last_block,
                toBlock=current_block
            )

            for event in events:
                request_id   = event["args"]["requestId"]
                encrypted_data = event["args"]["encryptedData"]

                if request_id in processed_ids:
                    continue

                # Check if already processed on-chain
                result = contract.functions.results(request_id).call()
                if result[1]:  # isProcessed == True
                    processed_ids.add(request_id)
                    continue

                print(f"[*] New request #{request_id}: {encrypted_data[:60]}...")

                # Run AI analysis
                try:
                    report = analyze_with_ai(encrypted_data)
                    print(f"    → Score: {report['score']}, Type: {report['type']}")
                except Exception as e:
                    print(f"    → AI error: {e}")
                    report = {
                        "score": 50,
                        "type": "Analysis Error",
                        "signals": [str(e)]
                    }

                # Submit result on-chain
                try:
                    receipt = submit_result_on_chain(w3, contract, account, request_id, report)
                    print(f"    → ✅ Submitted on-chain! TX: {receipt.transactionHash.hex()}")
                    processed_ids.add(request_id)
                except Exception as e:
                    print(f"    → ❌ On-chain submission error: {e}")

            last_block = current_block + 1

        except KeyboardInterrupt:
            print("\n[!] Agent stopped by user.")
            break
        except Exception as e:
            print(f"[!] Error in main loop: {e}")

        time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    main()
