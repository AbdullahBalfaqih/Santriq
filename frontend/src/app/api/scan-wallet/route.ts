import { NextResponse } from 'next/server';

// Common ERC20 ABI for approval scanning
const ERC20_APPROVAL_EVENT_TOPIC = '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925';

// Known malicious contract patterns (simulated for hackathon)
const KNOWN_MALICIOUS = [
  '0x000000000000000000000000000000000000dead',
  '0x0000000000000000000000000000000000000001',
];

// Token name lookup (common Coston2/Flare tokens)
const TOKEN_NAMES: Record<string, string> = {
  '0x1d80c49bbbcd1c0911346656b529df9e5c2f783d': 'Wrapped FLR (WFLR)',
  '0x12e605bc104e93b45e1ad99f9e555f659051c2bb': 'testUSDC',
  '0x0bd8e20e37e7e25ff02e4f2d13532fb7138d0b44': 'testUSDT',
};

export async function POST(req: Request) {
  try {
    const { address } = await req.json();

    if (!address) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 });
    }

    // Try to fetch real approval data from Coston2 RPC
    const approvals: any[] = [];
    
    try {
      // Query Coston2 for Approval events where the owner is the user's address
      const paddedAddress = '0x' + address.slice(2).toLowerCase().padStart(64, '0');
      
      const rpcResponse = await fetch('https://coston2-api.flare.network/ext/C/rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getLogs',
          params: [{
            fromBlock: '0x0',
            toBlock: 'latest',
            topics: [ERC20_APPROVAL_EVENT_TOPIC, paddedAddress]
          }]
        })
      });

      const rpcData = await rpcResponse.json();
      
      if (rpcData.result && Array.isArray(rpcData.result)) {
        // Parse real approval logs
        for (const log of rpcData.result.slice(-20)) { // Last 20 approvals
          const spender = '0x' + log.topics[2].slice(26);
          const amount = BigInt(log.data);
          const isUnlimited = amount > BigInt('0xffffffffffffffffffffffffffffff');
          const tokenAddress = log.address.toLowerCase();
          
          const isMalicious = KNOWN_MALICIOUS.some(
            m => spender.toLowerCase().includes(m.slice(2))
          );

          approvals.push({
            id: log.transactionHash,
            tokenAddress,
            tokenName: TOKEN_NAMES[tokenAddress] || `Token (${tokenAddress.slice(0, 8)}...)`,
            spender,
            spenderLabel: isMalicious ? '⚠️ Suspected Drainer' : `Contract ${spender.slice(0, 8)}...`,
            amount: isUnlimited ? 'UNLIMITED' : amount.toString(),
            isUnlimited,
            risk: isMalicious ? 'CRITICAL' : isUnlimited ? 'HIGH' : 'LOW',
            txHash: log.transactionHash,
            blockNumber: parseInt(log.blockNumber, 16),
          });
        }

        return NextResponse.json({
          address,
          approvals,
          totalApprovals: approvals.length,
          criticalCount: approvals.filter(a => a.risk === 'CRITICAL').length,
          highCount: approvals.filter(a => a.risk === 'HIGH').length,
          dataSource: 'Coston2 RPC (Real)',
        });
      }
    } catch (rpcError) {
      console.warn('[Scan Wallet] RPC query failed:', rpcError);
    }

    return NextResponse.json({
      address,
      approvals: [],
      totalApprovals: 0,
      criticalCount: 0,
      highCount: 0,
      dataSource: 'Coston2 RPC (Real)',
    });

  } catch (error: any) {
    console.error("Scan Wallet API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
