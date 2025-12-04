import OpenAI from "openai";
import { ingredientMatches } from "../utils";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || undefined,
});

/**
 * Input shape:
 *   recipes: Array<{ title: string; ingredients: string[] }>
 *   userIngredients: string[]
 *
 * Output: array of shopping list items (strings).
 *
 * Behavior:
 *  - If OPENAI_API_KEY is set, calls the OpenAI chat model to produce
 *    a concise shopping list (expects JSON output from the model).
 *  - If no API key, uses a deterministic fallback that returns the
 *    unique set of recipe ingredients not matched by userIngredients.
 */
export async function generateShoppingList(params: {
  recipes: { title: string; ingredients: string[] }[];
  userIngredients: string[];
}): Promise<string[]> {
  const { recipes, userIngredients } = params;

  // Fallback deterministic method (no external calls)
  function deterministicList(): string[] {
    const missing = new Set<string>();
    for (const recipe of recipes) {
      for (const ing of recipe.ingredients) {
        const matched = userIngredients.some((u) =>
          ingredientMatches(u, ing)
        );
        if (!matched) {
          missing.add(ing.trim());
        }
      }
    }
    return Array.from(missing).sort((a, b) => a.localeCompare(b));
  }

  // If no OpenAI key, return fallback
  if (!process.env.OPENAI_API_KEY) {
    console.log("LLM_SOURCE=FALLBACK");
    return deterministicList();
  }

  // Build prompt
  const recipeSummaries = recipes
    .map(
      (r, idx) =>
        `${idx + 1}. ${r.title}\nIngredients: ${r.ingredients
          .map((i) => `- ${i}`)
          .join("\n")}`
    )
    .join("\n\n");

  const userList = userIngredients.length
    ? userIngredients.map((i) => `- ${i}`).join("\n")
    : "(none)";

  const systemPrompt =
    "You are a helpful cooking assistant. Given a list of recipes and the user's existing ingredients, produce a concise shopping list containing only the missing items required to make the recipes. Output must be valid JSON with a top-level key `shoppingList` whose value is an array of strings. Keep items short (no quantities unless explicitly provided). Do not include duplicate entries.";

  const userPrompt = `Recipes:\n${recipeSummaries}\n\nUser pantry / ingredients:\n${userList}\n\nReturn JSON only. Example: {"shoppingList":["eggs","milk","olive oil"]}`;

  try {
    const resp = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 300,
    });

    // Extract assistant text
    const assistantText =
      resp.choices?.[0]?.message?.content || "";

    // Try to parse JSON from assistantText
    try {
      // Some models wrap JSON in markdown; try to extract the JSON substring
      const jsonMatch = assistantText.match(/\{[\s\S]*\}/m);
      const jsonStr = jsonMatch ? jsonMatch[0] : assistantText;
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed.shoppingList)) {
        // Normalize: trim and dedupe
        const normalized = Array.from(
          new Set(parsed.shoppingList.map((s: string) => s.trim()))
        ) as string[];
        console.log("LLM_SOURCE=OpenAI (parsed JSON)");
        return normalized;
      }
      // If parse ok but shape unexpected, fallthrough to fallback
    } catch (e) {
      // parsing failed — fall back to line splitting
    }

    // If parsing failed, try line splitting heuristics
    const lines = assistantText
      .split(/\r?\n/)
      .map((l) => l.replace(/^[-\d.\s]+/, "").trim())
      .filter(Boolean);
    if (lines.length > 0) {
      const normalized = Array.from(new Set(lines)) as string[];
      console.log("LLM_SOURCE=OpenAI (heuristic)");
      return normalized;
    }

    // If everything else fails, deterministic fallback
    console.log("LLM_SOURCE=OpenAI (no usable response) -> FALLBACK");
    return deterministicList();
  } catch (err) {
    console.error("OpenAI LLM error (debug):", err);
    console.log("LLM_SOURCE=FALLBACK (OpenAI error)");
    return deterministicList();
  }
}

export default { generateShoppingList };
