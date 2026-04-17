import { describe, it, expect } from "vitest";
import { UserFacingError } from "./errors.js";

describe("UserFacingError", () => {
  it("message を保持する", () => {
    const err = new UserFacingError("APIキーが無効です");
    expect(err.message).toBe("APIキーが無効です");
    expect(err.name).toBe("UserFacingError");
  });

  it("cause を保持する", () => {
    const cause = new Error("original");
    const err = new UserFacingError("パース失敗", { cause });
    expect(err.cause).toBe(cause);
  });

  it("instanceof Error が true", () => {
    const err = new UserFacingError("test");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(UserFacingError);
  });
});
