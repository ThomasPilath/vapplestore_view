import { NextResponse } from "next/server";

/**
 * Réponse API standardisée pour le succès
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

/**
 * Réponse API standardisée pour les erreurs
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: Record<string, string[]>;
  timestamp: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Helper pour créer une réponse de succès
 */
export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    } as ApiSuccessResponse<T>,
    { status }
  );
}

/**
 * Helper pour créer une réponse d'erreur
 */
export function errorResponse(
  error: string,
  status: number = 400,
  details?: Record<string, string[]>
) {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(details && { details }),
      timestamp: new Date().toISOString(),
    } as ApiErrorResponse,
    { status }
  );
}

/**
 * Helper pour gérer les erreurs Zod
 */
export function validationErrorResponse(errors: Record<string, string[]>) {
  return errorResponse("Validation error", 400, errors);
}
