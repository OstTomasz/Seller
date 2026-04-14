import { describe, expect, it } from "vitest";
import { updateRegionPrefixSchema, userRoleSchema } from "@seller/shared/types";

describe("shared schemas", () => {
  it("normalizes region prefix to upper-case", () => {
    const parsed = updateRegionPrefixSchema.parse({ prefix: "ab" });
    expect(parsed.prefix).toBe("AB");
  });

  it("rejects unsupported user role", () => {
    const result = userRoleSchema.safeParse("manager");
    expect(result.success).toBe(false);
  });
});
