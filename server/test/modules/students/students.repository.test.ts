import type { Database } from "../../../src/database/connection";
import {
  PgStudentRepository,
  type Student,
} from "../../../src/modules/students/students.repository";

function normalizeSql(sql: string): string {
  return sql.replace(/\s+/g, " ").trim();
}

describe("PgStudentRepository", () => {
  let query: jest.Mock;
  let repository: PgStudentRepository;

  beforeEach(() => {
    query = jest.fn();
    repository = new PgStudentRepository({ query } as unknown as Database);
  });

  test("create insere o aluno e retorna a linha", async () => {
    const student: Student = { ra: 123, name: "Ana" };
    query.mockResolvedValue({ rows: [student] });

    const result = await repository.create({ ra: 123, name: "Ana" });

    expect(result).toBe(student);
    expect(query).toHaveBeenCalledTimes(1);

    const [sql, values] = query.mock.calls[0];
    expect(normalizeSql(sql)).toBe(
      "INSERT INTO students (ra, name) VALUES ($1, $2) RETURNING ra, name",
    );
    expect(values).toEqual([123, "Ana"]);
  });

  test("findAll devolve as linhas simuladas", async () => {
    const students: Student[] = [
      { ra: 123, name: "Ana" },
      { ra: 456, name: "Bruno" },
    ];
    query.mockResolvedValue({ rows: students });

    const result = await repository.findAll();

    expect(result).toBe(students);
    expect(query).toHaveBeenCalledTimes(1);

    const [sql, values] = query.mock.calls[0];
    expect(normalizeSql(sql)).toBe(
      "SELECT ra, name FROM students ORDER BY name",
    );
    expect(values).toBeUndefined();
  });

  test("findAll devolve uma lista vazia", async () => {
    query.mockResolvedValue({ rows: [] });

    const result = await repository.findAll();

    expect(result).toEqual([]);
  });

  test("findOne devolve a primeira linha", async () => {
    const student: Student = { ra: 123, name: "Ana" };
    query.mockResolvedValue({ rows: [student] });

    const result = await repository.findOne(123);

    expect(result).toBe(student);
    expect(query).toHaveBeenCalledTimes(1);

    const [sql, values] = query.mock.calls[0];
    expect(normalizeSql(sql)).toBe(
      "SELECT ra, name FROM students WHERE ra = $1",
    );
    expect(values).toEqual([123]);
  });

  test("findOne devolve undefined quando não encontra", async () => {
    query.mockResolvedValue({ rows: [] });

    const result = await repository.findOne(123);

    expect(result).toBeUndefined();
  });

  test("create propaga o erro do banco", async () => {
    const failure = new Error("falha no banco");
    query.mockRejectedValue(failure);

    await expect(repository.create({ ra: 123, name: "Ana" })).rejects.toBe(
      failure,
    );
    expect(query).toHaveBeenCalledTimes(1);
  });

  test("findAll propaga o erro do banco", async () => {
    const failure = new Error("falha no banco");
    query.mockRejectedValue(failure);

    await expect(repository.findAll()).rejects.toBe(failure);
    expect(query).toHaveBeenCalledTimes(1);
  });

  test("findOne propaga o erro do banco", async () => {
    const failure = new Error("falha no banco");
    query.mockRejectedValue(failure);

    await expect(repository.findOne(123)).rejects.toBe(failure);
    expect(query).toHaveBeenCalledTimes(1);
  });
});
