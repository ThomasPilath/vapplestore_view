import { describe, it, expect } from "bun:test";
import { apiResponse } from "../../lib/api-response";

describe("API Response Helpers", () => {
  describe("Success responses", () => {
    it("should create 200 OK response", () => {
      const response = apiResponse.ok({ message: "Success" });
      expect(response.status).toBe(200);
    });

    it("should create 201 Created response", () => {
      const response = apiResponse.created({ id: 1, name: "Test" });
      expect(response.status).toBe(201);
    });
  });

  describe("Error responses", () => {
    it("should create 400 Bad Request response", () => {
      const response = apiResponse.badRequest("Invalid input");
      expect(response.status).toBe(400);
    });

    it("should create 401 Unauthorized response", () => {
      const response = apiResponse.unauthorized("Invalid credentials");
      expect(response.status).toBe(401);
    });

    it("should create 403 Forbidden response", () => {
      const response = apiResponse.forbidden("Access denied");
      expect(response.status).toBe(403);
    });

    it("should create 404 Not Found response", () => {
      const response = apiResponse.notFound("Resource not found");
      expect(response.status).toBe(404);
    });

    it("should create 500 Internal Server Error response", () => {
      const response = apiResponse.internalError("Something went wrong");
      expect(response.status).toBe(500);
    });
  });

  describe("Response content", () => {
    it("should include error message in error response", async () => {
      const response = apiResponse.badRequest("Invalid field");
      const json = await response.json();
      expect(json.error).toBe("Invalid field");
    });

    it("should include data in success response", async () => {
      const data = { id: 1, name: "Test" };
      const response = apiResponse.ok(data);
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.data).toEqual(data);
      expect(json.timestamp).toBeDefined();
    });
  });
});
