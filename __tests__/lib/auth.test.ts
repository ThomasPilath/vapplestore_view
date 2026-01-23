import { describe, it, expect } from "bun:test";
import { hashPassword, comparePassword, generateTokens, verifyAccessToken } from "../../lib/auth";

describe("Authentication Service", () => {
  describe("Password hashing", () => {
    it("should hash password correctly", async () => {
      const password = "Test123!@#";
      const hashed = await hashPassword(password);
      
      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
      expect(hashed.length).toBeGreaterThan(20);
    });

    it("should compare password correctly", async () => {
      const password = "Test123!@#";
      const hashed = await hashPassword(password);
      
      const match = await comparePassword(password, hashed);
      expect(match).toBe(true);
    });

    it("should fail on wrong password", async () => {
      const password = "Test123!@#";
      const hashed = await hashPassword(password);
      
      const match = await comparePassword("WrongPassword", hashed);
      expect(match).toBe(false);
    });
  });

  describe("JWT tokens", () => {
    it("should generate token pair", () => {
      const payload = { userId: "1", username: "testuser", role: "user", roleLevel: 0 };
      const tokens = generateTokens(payload);
      
      expect(tokens).toBeDefined();
      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(typeof tokens.accessToken).toBe("string");
      expect(typeof tokens.refreshToken).toBe("string");
      expect(tokens.accessToken.split(".").length).toBe(3); // JWT format: header.payload.signature
    });

    it("should verify access token", () => {
      const payload = { userId: "1", username: "testuser", role: "user", roleLevel: 0 };
      const tokens = generateTokens(payload);
      
      const verified = verifyAccessToken(tokens.accessToken);
      expect(verified).toBeDefined();
      expect(verified?.userId).toBe(payload.userId);
      expect(verified?.username).toBe(payload.username);
    });

    it("should return null for invalid token", () => {
      const invalidToken = "invalid.token.here";
      
      const verified = verifyAccessToken(invalidToken);
      expect(verified).toBeNull();
    });
  });
});
