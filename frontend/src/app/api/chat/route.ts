import { NextResponse } from 'next/server';

const FALLBACK_MODELS = [
  "openai/gpt-4o-mini",
  "meta-llama/llama-3.1-8b-instruct:free",
  "google/gemma-4-31b-it:free",
  "openai/gpt-oss-20b:free",
  "openrouter/auto"
];

export async function POST(req: Request) {
  try {
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    const { messages } = await req.json();

    if (OPENROUTER_API_KEY && OPENROUTER_API_KEY !== "your_key_here") {
      const systemMessage = {
        role: 'system',
        content: `أنت ScamGuardian، ذكاء اصطناعي متخصص في أمن الـ Web3 وتم تطويرك على شبكة Flare. 
هدفك هو حماية المستخدمين من الاحتيال، العقود الذكية الخبيثة، وعمليات سرقة المحافظ.
تتحدث العربية بطلاقة وبأسلوب احترافي ومساعد. 
لا تذكر أنك نموذج لغوي من OpenAI أو غيره، بل أنت جزء من نظام ScamGuardian فقط.`
      };

      const formattedMessages = [
        systemMessage,
        ...messages.map((msg: any) => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text || ""
        }))
      ];

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
              messages: formattedMessages
            })
          });

          if (response.ok) {
            const data = await response.json();
            return NextResponse.json({ reply: data.choices[0].message.content });
          }
        } catch (e) {
          // try next fallback
        }
      }
    }

    // --- FALLBACK MOCK LOGIC (No API Key needed) ---
    const lastUserMsg = messages.slice().reverse().find((m: any) => m.sender === 'user')?.text || "";
    const inputLower = lastUserMsg.toLowerCase();

    let mockReply = "";

    if (inputLower === "hi" || inputLower === "hello" || inputLower === "hey") {
      mockReply = "أهلاً بك! أنا ScamGuardian. هل لديك عقد ذكي تود فحصه اليوم؟";
    } else if (inputLower.includes("السلام") || inputLower.includes("مرحبا") || inputLower.includes("هاي")) {
      mockReply = "أهلاً ومرحباً بك! أنا نظام ScamGuardian لحمايتك في شبكة Flare وWeb3. ماذا نود أن نحلل اليوم؟";
    } else if (inputLower.includes("مشروع") || inputLower.includes("تطوير") || inputLower.includes("مهام")) {
      mockReply = "مشروعنا يهدف لحماية Web3. من الممكن تطوير مهام النظام مستقبلاً لتشمل مراقبة المعاملات لحظياً وفحص الثغرات المعقدة.";
    } else if (inputLower.includes("وقت") || inputLower.includes("ساعه") || inputLower.includes("ساعة")) {
      const now = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
      mockReply = `الوقت الآن هو ${now}. هل نبدأ بفحص أمني لعنوان معين؟`;
    } else {
      mockReply = "أنا جاهز لمساعدتك في فحص الأمان لمحافظ وعقود Web3. يرجى تزويدي بإدخال أو عنوان عقد لتحليله.";
    }

    return NextResponse.json({ reply: mockReply });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json({ reply: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى." }, { status: 500 });
  }
}
