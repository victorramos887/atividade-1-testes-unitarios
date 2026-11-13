import { HttpError } from "../src/errors";
import {
  parseId,
  positiveInteger,
  validateBody,
  validateName,
} from "../src/validation";

function getError(callback: () => unknown): HttpError {
  try {
    callback();
  } catch (error) {
    return error as HttpError;
  }
  throw new Error("Era esperado um erro, mas nada foi lançado.");
}

describe("positiveInteger", () => {
  test.each([1, 2147483647])("aceita o valor %p", (value) => {
    expect(positiveInteger(value, "RA")).toBe(value);
  });

  test.each([0, -1, 1.5, NaN, Infinity, 2147483648, "123", null, undefined])(
    "rejeita o valor %p com statusCode 400",
    (value) => {
      const error = getError(() => positiveInteger(value, "RA"));

      expect(error).toBeInstanceOf(HttpError);
      expect(error.statusCode).toBe(400);
    },
  );
});

describe("parseId", () => {
  test.each([
    ["1", 1],
    ["2147483647", 2147483647],
  ])("converte %p em %p", (value, expected) => {
    expect(parseId(value, "RA")).toBe(expected);
  });

  test.each(["1abc", "1.2", "1e2", "", "-1", "0", "2147483648", 123])(
    "rejeita o valor %p com statusCode 400",
    (value) => {
      const error = getError(() => parseId(value, "RA"));

      expect(error).toBeInstanceOf(HttpError);
      expect(error.statusCode).toBe(400);
    },
  );
});

describe("validateName", () => {
  test.each(["Ana", "a".repeat(100)])(
    "aceita e devolve o nome %p",
    (value) => {
      expect(validateName(value)).toBe(value);
    },
  );

  test.each(["", "ab", "   ", " a ", "a".repeat(101), 123, null, undefined])(
    "rejeita o nome %p com statusCode 400",
    (value) => {
      const error = getError(() => validateName(value));

      expect(error).toBeInstanceOf(HttpError);
      expect(error.statusCode).toBe(400);
    },
  );
});

describe("validateBody", () => {
  test("aceita um objeto congelado e devolve a mesma referência", () => {
    const body = Object.freeze({ name: "Ana" });

    expect(validateBody(body)).toBe(body);
    expect(body).toEqual({ name: "Ana" });
  });

  test.each([[null], [undefined], [[]], ["Ana"], [12]])(
    "rejeita o corpo %p com statusCode 400",
    (value) => {
      const error = getError(() => validateBody(value));

      expect(error).toBeInstanceOf(HttpError);
      expect(error.statusCode).toBe(400);
    },
  );

  test("aceita campos extras e devolve a mesma referência", () => {
    const body = { name: "Ana", extra: true };

    const result = validateBody(body);

    expect(result).toBe(body);
    expect(result).toEqual({ name: "Ana", extra: true });
  });
});
