import { describe, expect, it } from "vitest";
import { assertDirector } from "../../src/domain/rbac/access-policy";
import { ForbiddenError } from "../../src/utils/errors";

describe("access policy", () => {
  it("allows director", () => {
    expect(() => assertDirector("director")).not.toThrow();
  });

  it("blocks non-director roles", () => {
    expect(() => assertDirector("deputy")).toThrow(ForbiddenError);
    expect(() => assertDirector("advisor")).toThrow(ForbiddenError);
    expect(() => assertDirector("salesperson")).toThrow(ForbiddenError);
  });
});
