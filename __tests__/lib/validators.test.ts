import { describe, it, expect } from "bun:test";
import { passwordSchema, usernameSchema, emailSchema } from "../../lib/validators";

describe("Validators", () => {
  describe("Password validation", () => {
    it("should accept valid password", () => {
      const result = passwordSchema.safeParse("ValidPass123!");
      expect(result.success).toBe(true);
    });

    it("should reject short password", () => {
      const result = passwordSchema.safeParse("Short1!");
      expect(result.success).toBe(false);
    });

    it("should reject password without uppercase", () => {
      const result = passwordSchema.safeParse("validpass123!");
      expect(result.success).toBe(false);
    });

    it("should reject password without number", () => {
      const result = passwordSchema.safeParse("ValidPass!");
      expect(result.success).toBe(false);
    });

    it("should reject password without special char", () => {
      const result = passwordSchema.safeParse("ValidPass123");
      expect(result.success).toBe(false);
    });
  });

  describe("Username validation", () => {
    it("should accept valid username", () => {
      const result = usernameSchema.safeParse("johndoe");
      expect(result.success).toBe(true);
    });

    it("should accept username with numbers", () => {
      const result = usernameSchema.safeParse("john123");
      expect(result.success).toBe(true);
    });

    it("should reject too short username", () => {
      const result = usernameSchema.safeParse("ab");
      expect(result.success).toBe(false);
    });

    it("should reject username with special chars", () => {
      const result = usernameSchema.safeParse("john@doe");
      expect(result.success).toBe(false);
    });

    it("should reject username with spaces", () => {
      const result = usernameSchema.safeParse("john doe");
      expect(result.success).toBe(false);
    });
  });

  describe("Email validation", () => {
    it("should accept valid email", () => {
      const result = emailSchema.safeParse("test@example.com");
      expect(result.success).toBe(true);
    });

    it("should accept email with subdomain", () => {
      const result = emailSchema.safeParse("test@mail.example.com");
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const result = emailSchema.safeParse("notanemail");
      expect(result.success).toBe(false);
    });

    it("should reject email without domain", () => {
      const result = emailSchema.safeParse("test@");
      expect(result.success).toBe(false);
    });
  });
});
