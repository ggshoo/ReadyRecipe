import { NextResponse } from "next/server";
import { generateShoppingList } from "../../../lib/ai/llm";

/**
 * POST /api/generateShoppingList
 * Body JSON: {
 *   recipes: [{ title: string, ingredients: string[] }, ...],
 *   userIngredients: string[]
 * }
 *
 * Response: { shoppingList: string[] }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const recipes = Array.isArray(body.recipes) ? body.recipes : [];
    const userIngredients = Array.isArray(body.userIngredients)
      ? body.userIngredients
      : [];

    // Basic validation
    if (!recipes.length) {
      return NextResponse.json(
        { error: "recipes array is required and must not be empty" },
        { status: 400 }
      );
    }

    const shoppingList = await generateShoppingList({
      recipes,
      userIngredients,
    });

    return NextResponse.json({ shoppingList }, { status: 200 });
  } catch (err) {
    console.error("generateShoppingList route error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
