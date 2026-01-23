import { describe, it, expect, beforeEach } from "bun:test";
import { rateLimit, getClientIp, rateLimitResponse } from "../../lib/rate-limit";
import { NextRequest } from "next/server";

// Helper pour créer un mock NextRequest
function createMockRequest(headers: Record<string, string> = {}): NextRequest {
  return new NextRequest("http://localhost:3000/test", {
    headers: new Headers(headers),
  });
}

describe("Rate Limiting", () => {
  // Nettoyer entre chaque test pour éviter les interférences
  beforeEach(() => {
    // Le Map est internal, mais on peut tester avec des clés uniques
  });

  describe("rateLimit function", () => {
    it("should allow requests within limit", () => {
      const req = createMockRequest();
      const result = rateLimit(req, "test-allow-key", 5, 60000);
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeLessThanOrEqual(5);
    });

    it("should block requests exceeding limit", () => {
      const req = createMockRequest();
      const key = "block-test-key-" + Date.now();
      
      // Make 5 requests (should all pass)
      for (let i = 0; i < 5; i++) {
        const result = rateLimit(req, key, 5, 60000);
        expect(result.allowed).toBe(true);
      }
      
      // 6th request should be blocked
      const result = rateLimit(req, key, 5, 60000);
      expect(result.allowed).toBe(false);
      expect(result.retryAfterSeconds).toBeGreaterThan(0);
    });

    it("should provide remaining count", () => {
      const req = createMockRequest();
      const key = "remaining-test-key-" + Date.now();
      
      const result1 = rateLimit(req, key, 3, 60000);
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(2); // 3 - 1
      
      const result2 = rateLimit(req, key, 3, 60000);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(1); // 3 - 2
    });

    it("should distinguish between different keys", () => {
      const req = createMockRequest();
      const timestamp = Date.now();
      
      const result1 = rateLimit(req, "key1-" + timestamp, 2, 60000);
      const result2 = rateLimit(req, "key2-" + timestamp, 2, 60000);
      
      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
      expect(result1.remaining).toBe(1);
      expect(result2.remaining).toBe(1);
    });

    it("should calculate correct retry after seconds", () => {
      const req = createMockRequest();
      const key = "retry-test-key-" + Date.now();
      const windowMs = 5000; // 5 seconds
      
      // Fill up the limit
      for (let i = 0; i < 3; i++) {
        rateLimit(req, key, 3, windowMs);
      }
      
      // Next request should be blocked with retry-after
      const result = rateLimit(req, key, 3, windowMs);
      expect(result.allowed).toBe(false);
      expect(result.retryAfterSeconds).toBeGreaterThan(0);
      expect(result.retryAfterSeconds).toBeLessThanOrEqual(Math.ceil(windowMs / 1000));
    });

    it("should reset after window expires", async () => {
      const req = createMockRequest();
      const key = "expire-test-key-" + Date.now();
      const windowMs = 100; // 100ms window
      
      // Fill up the limit
      for (let i = 0; i < 2; i++) {
        rateLimit(req, key, 2, windowMs);
      }
      
      // Should be blocked
      let result = rateLimit(req, key, 2, windowMs);
      expect(result.allowed).toBe(false);
      
      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should be allowed again
      result = rateLimit(req, key, 2, windowMs);
      expect(result.allowed).toBe(true);
    });
  });

  describe("getClientIp function", () => {
    it("should extract IP from x-forwarded-for header", () => {
      const req = createMockRequest({ "x-forwarded-for": "192.168.1.1, 10.0.0.1" });
      const ip = getClientIp(req);
      expect(ip).toBe("192.168.1.1");
    });

    it("should extract IP from x-real-ip header", () => {
      const req = createMockRequest({ "x-real-ip": "192.168.1.2" });
      const ip = getClientIp(req);
      expect(ip).toBe("192.168.1.2");
    });

    it("should prefer x-forwarded-for over x-real-ip", () => {
      const req = createMockRequest({ 
        "x-forwarded-for": "192.168.1.1",
        "x-real-ip": "192.168.1.2" 
      });
      const ip = getClientIp(req);
      expect(ip).toBe("192.168.1.1");
    });

    it("should return unknown when no IP headers present", () => {
      const req = createMockRequest({});
      const ip = getClientIp(req);
      expect(ip).toBe("unknown");
    });

    it("should handle empty x-forwarded-for", () => {
      const req = createMockRequest({ "x-forwarded-for": "" });
      const ip = getClientIp(req);
      expect(ip).toBe("unknown");
    });
  });

  describe("rateLimitResponse function", () => {
    it("should create 429 response with correct headers", async () => {
      const response = rateLimitResponse(60);
      
      expect(response.status).toBe(429);
      expect(response.headers.get("Content-Type")).toBe("application/json");
      expect(response.headers.get("Retry-After")).toBe("60");
      
      const body = await response.json();
      expect(body.error).toBeDefined();
      expect(body.error).toContain("Trop de tentatives");
    });

    it("should include retry-after in seconds", async () => {
      const response = rateLimitResponse(120);
      expect(response.headers.get("Retry-After")).toBe("120");
    });
  });
});
