import { describe, expect, test } from "bun:test";
import { requireDirectoryAccess, requireSameOrigin } from "./directory-access";

describe("shared passcode access", () => {
  test("locked visitors cannot read or change contacts", () => {
    expect(() => requireDirectoryAccess(false)).toThrow("Unlock the directory first.");
  });
  test("unlocked visitors can access contacts", () => {
    expect(() => requireDirectoryAccess(true)).not.toThrow();
  });
  test("cross-origin writes are rejected", () => {
    expect(() => requireSameOrigin("https://other.example", "https://fou-dialer.lovable.app/")).toThrow();
    expect(() => requireSameOrigin(null, "https://fou-dialer.lovable.app/")).toThrow();
    expect(() => requireSameOrigin("https://fou-dialer.lovable.app", "https://fou-dialer.lovable.app/")).not.toThrow();
  });
});