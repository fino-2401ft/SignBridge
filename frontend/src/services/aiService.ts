/**
 * AI Service for ASL Grammar Translation & Assistant queries via OpenRouter / Gemini.
 */

const AI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

export interface TranslationAIResult {
  aslGloss: string[];
  explanation: string;
}

/**
 * Uses LLM to translate natural English or Vietnamese into grammatical ASL Gloss tokens.
 */
export async function translateToASLGlossWithAI(
  inputText: string,
): Promise<TranslationAIResult> {
  const apiKey = AI_API_KEY;
  if (!apiKey) {
    return {
      aslGloss: inputText.toUpperCase().split(/\s+/),
      explanation: "Local rule-based fallback (API key not configured).",
    };
  }

  const prompt = `You are an expert ASL (American Sign Language) linguist.
Translate the following sentence into ASL Gloss notation (all UPPERCASE tokens):
"${inputText}"

Rules:
1. Use standard ASL Gloss (Topic-Comment, Time-First, WH-question words at the end).
2. Omit auxiliary verbs (am, is, are), prepositions, and articles.
3. Output JSON with the exact format:
{
  "aslGloss": ["WORD1", "WORD2", ...],
  "explanation": "Brief explanation of the ASL structure applied"
}`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://github.com/fino-2401ft/SignBridge",
        "X-Title": "SignBridge ASL Translator",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 400,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter returned status ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response from AI");
    }

    const parsed = JSON.parse(content);
    return {
      aslGloss: Array.isArray(parsed.aslGloss) ? parsed.aslGloss : [],
      explanation: parsed.explanation || "Grammar structured by SignBridge AI.",
    };
  } catch (err) {
    console.warn("[aiService] AI translation fallback:", err);
    return {
      aslGloss: inputText.toUpperCase().split(/\s+/),
      explanation: "Offline rule-based fallback applied.",
    };
  }
}
