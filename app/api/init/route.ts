import { initializeDatabase } from "@/lib/db-init";

export async function GET() {
  try {
    await initializeDatabase();
    return Response.json({
      success: true,
      message: "Database initialized successfully",
    });
  } catch (error) {
    console.error("❌ Database initialization error:", error);
    return Response.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
