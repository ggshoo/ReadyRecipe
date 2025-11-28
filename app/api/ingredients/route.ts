import { NextResponse } from "next/server";
import {
  getAllIngredients,
  searchIngredients,
  addIngredient,
} from "@/lib/ingredients";

/**
 * GET /api/ingredients
 * Retrieves all ingredients or searches by query parameter
 * Query params:
 *   - q: search query (optional)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (query) {
      const ingredients = await searchIngredients(query);
      return NextResponse.json({ ingredients });
    }

    const ingredients = await getAllIngredients();
    return NextResponse.json({ ingredients });
  } catch (error) {
    console.error("Error fetching ingredients:", error);
    return NextResponse.json(
      { error: "Failed to fetch ingredients" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ingredients
 * Creates a new ingredient
 * Body: { name: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Ingredient name is required and must be a string" },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      return NextResponse.json(
        { error: "Ingredient name cannot be empty" },
        { status: 400 }
      );
    }

    if (trimmedName.length > 100) {
      return NextResponse.json(
        { error: "Ingredient name must be 100 characters or less" },
        { status: 400 }
      );
    }

    const ingredient = await addIngredient(trimmedName);
    return NextResponse.json({ ingredient }, { status: 201 });
  } catch (error) {
    console.error("Error creating ingredient:", error);
    return NextResponse.json(
      { error: "Failed to create ingredient" },
      { status: 500 }
    );
  }
}
