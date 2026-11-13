import type { Database } from "../../../src/database/connection";
import {
  PgCourseRepository,
  type Course,
} from "../../../src/modules/courses/courses.repository";

function normalizeSql(sql: string): string {
  return sql.replace(/\s+/g, " ").trim();
}

describe("PgCourseRepository", () => {
  let query: jest.Mock;
  let repository: PgCourseRepository;

  beforeEach(() => {
    query = jest.fn();
    repository = new PgCourseRepository({ query } as unknown as Database);
  });

  test("create insere a disciplina e retorna a linha", async () => {
    const course: Course = { id: 1, name: "Qualidade" };
    query.mockResolvedValue({ rows: [course] });

    const result = await repository.create({ name: "Qualidade" });

    expect(result).toBe(course);
    expect(query).toHaveBeenCalledTimes(1);

    const [sql, values] = query.mock.calls[0];
    expect(normalizeSql(sql)).toBe(
      "INSERT INTO courses (name) VALUES ($1) RETURNING id, name",
    );
    expect(values).toEqual(["Qualidade"]);
  });

  test("findAll devolve as linhas simuladas", async () => {
    const courses: Course[] = [
      { id: 1, name: "Qualidade" },
      { id: 2, name: "Testes" },
    ];
    query.mockResolvedValue({ rows: courses });

    const result = await repository.findAll();

    expect(result).toBe(courses);
    expect(query).toHaveBeenCalledTimes(1);

    const [sql, values] = query.mock.calls[0];
    expect(normalizeSql(sql)).toBe(
      "SELECT id, name FROM courses ORDER BY id",
    );
    expect(values).toBeUndefined();
  });

  test("findAll devolve uma lista vazia", async () => {
    query.mockResolvedValue({ rows: [] });

    const result = await repository.findAll();

    expect(result).toEqual([]);
  });

  test("findOne devolve a primeira linha", async () => {
    const course: Course = { id: 7, name: "Qualidade" };
    query.mockResolvedValue({ rows: [course] });

    const result = await repository.findOne(7);

    expect(result).toBe(course);
    expect(query).toHaveBeenCalledTimes(1);

    const [sql, values] = query.mock.calls[0];
    expect(normalizeSql(sql)).toBe(
      "SELECT id, name FROM courses WHERE id = $1",
    );
    expect(values).toEqual([7]);
  });

  test("findOne devolve undefined quando não encontra", async () => {
    query.mockResolvedValue({ rows: [] });

    const result = await repository.findOne(7);

    expect(result).toBeUndefined();
  });

  test("create propaga o erro do banco", async () => {
    const failure = new Error("falha no banco");
    query.mockRejectedValue(failure);

    await expect(repository.create({ name: "Qualidade" })).rejects.toBe(
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

    await expect(repository.findOne(7)).rejects.toBe(failure);
    expect(query).toHaveBeenCalledTimes(1);
  });
});
