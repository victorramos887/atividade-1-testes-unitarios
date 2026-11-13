import { isUniqueViolation } from "../../src/database/unique-violation";

describe("isUniqueViolation", () => {
  test("reconhece o código 23505", () => {
    expect(isUniqueViolation({ code: "23505" })).toBe(true);
  });

  test.each([null, undefined, "23505", 23503, {}, { code: "outro" }])(
    "não reconhece %p",
    (value) => {
      expect(isUniqueViolation(value)).toBe(false);
    },
  );
});
