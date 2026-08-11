import { NextResponse } from 'next/server';
import { createPublicClient, http, defineChain } from 'viem';

const coston2 = defineChain({
  id: 114,
  name: 'Coston2',
  nativeCurrency: { name: 'Coston2 FLR', symbol: 'C2FLR', decimals: 18 },
  rpcUrls: { default: { http: ['https://coston2-api.flare.network/ext/C/rpc'] } },
  blockExplorers: {
    default: { name: 'Coston2 Explorer', url: 'https://coston2-explorer.flare.network' },
  },
});

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

const CONTRACT_ABI = [
  {
    inputs: [{ name: '', type: 'uint256' }],
    name: 'results',
    outputs: [
      { name: 'reportJson', type: 'string' },
      { name: 'isProcessed', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'nextRequestId',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export async function GET(req: Request) {
  try {
    if (!CONTRACT_ADDRESS) {
      return NextResponse.json({ error: 'Contract address not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get('requestId');

    const client = createPublicClient({ chain: coston2, transport: http() });

    if (requestId !== null) {
      // Fetch a specific result
      const result = await client.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'results',
        args: [BigInt(requestId)],
      });

      if (result[1]) {
        // isProcessed = true
        return NextResponse.json({
          requestId,
          isProcessed: true,
          report: JSON.parse(result[0]),
        });
      } else {
        return NextResponse.json({ requestId, isProcessed: false });
      }
    }

    // No requestId — return next request ID counter
    const nextId = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'nextRequestId',
    });

    return NextResponse.json({ nextRequestId: nextId.toString() });
  } catch (error) {
    console.error('On-chain read error:', error);
    return NextResponse.json({ error: 'Failed to read from blockchain' }, { status: 500 });
  }
}
