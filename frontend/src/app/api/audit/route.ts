import { NextResponse } from 'next/server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const PORT = process.env.PORT || 3000;

// Fallback list of reliable free & low-latency models on OpenRouter
const FALLBACK_MODELS = [
  "openai/gpt-4o-mini",
  "meta-llama/llama-3.1-8b-instruct:free",
  "google/gemma-4-31b-it:free",
  "openai/gpt-oss-20b:free",
  "openrouter/auto"
];

export async function POST(req: Request) {
  try {
    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "OpenRouter API Key not configured." },
        { status: 500 }
      );
    }

    const { target } = await req.json();

    // 1. Fetch on-chain data from our Flare Indexer API
    let indexerData = null;
    try {
      const baseUrl = req.url ? new URL(req.url).origin : `http://localhost:${PORT}`;
      const indexerRes = await fetch(`${baseUrl}/api/indexer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: target }),
      });
      if (indexerRes.ok) {
        indexerData = await indexerRes.json();
      }
    } catch (err) {
      console.warn("Failed to fetch from indexer API", err);
    }

    // 2. Prepare AI Prompt
    const indexerContext = indexerData 
      ? `\n\nON-CHAIN DATA (from Flare Indexer):\nTransactions: ${indexerData.transactionCount}\nFirst Seen: ${indexerData.firstSeen}\nSignals: ${JSON.stringify(indexerData.signals)}`
      : "";

    const systemMessage = {
      role: 'system',
      content: `You are ScamGuardian, a Web3 security AI agent. 
Your task is to analyze the user's provided input (which might be a smart contract address, project name, or token symbol) across ANY network. Evaluate its community reputation, known rug pull reports, developer history, and overall fame based on your vast training data.
You MUST respond with ONLY a valid JSON object in the following format. Do not include any markdown formatting like \`\`\`json or \`\`\`. Just raw JSON.
{
  "score": <number between 0 and 100, where 100 is highly malicious>,
  "type": "<string describing the threat type, e.g., 'Malicious Wallet Drainer' or 'Standard Contract'>",
  "signals": [
    "<string explaining signal 1 found>",
    "<string explaining signal 2 found>",
    "<string explaining signal 3 found>"
  ]
}

Analyze the input realistically. Incorporate any ON-CHAIN DATA provided into your assessment.`
    };

    const userMessage = {
      role: 'user',
      content: `Analyze this: ${target}${indexerContext}`
    };

    let lastError = "";

    // 3. Automatic Fallback Loop across multiple free models
    for (const model of FALLBACK_MODELS) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model,
            messages: [systemMessage, userMessage],
            temperature: 0.2
          })
        });

        if (response.ok) {
          const data = await response.json();
          let replyText = data.choices[0].message.content.trim();
          replyText = replyText.replace(/```json/g, "").replace(/```/g, "").trim();
          const parsedJson = JSON.parse(replyText);
          
          // Inject indexer source info if available
          if (indexerData) {
            parsedJson.indexerSource = indexerData.dataSource;
            if (indexerData.riskScore > parsedJson.score) {
              parsedJson.score = indexerData.riskScore; // use higher risk score
            }
          }
          
          return NextResponse.json(parsedJson);
        } else {
          lastError = await response.text();
          console.warn(`[Audit API] Model '${model}' returned status ${response.status}, trying fallback...`);
        }
      } catch (e: any) {
        lastError = e?.message || "Fetch failed";
        console.warn(`[Audit API] Model '${model}' error: ${lastError}, trying fallback...`);
      }
    }

    console.error("All OpenRouter models failed:", lastError);
    return NextResponse.json({ error: `All AI models failed: ${lastError}` }, { status: 500 });

  } catch (error: any) {
    console.error("Server error during audit API:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
