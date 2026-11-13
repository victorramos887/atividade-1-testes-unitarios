import { isForeignKeyViolation } from "../../src/database/foreign-key-violation";

describe("isForeignKeyViolation", () => {
  test("reconhece o código 23503", () => {
    expect(isForeignKeyViolation({ code: "23503" })).toBe(true);
  });

  test.each([null, undefined, "23505", 23503, {}, { code: "outro" }])(
    "não reconhece %p",
    (value) => {
      expect(isForeignKeyViolation(value)).toBe(false);
    },
  );
});
