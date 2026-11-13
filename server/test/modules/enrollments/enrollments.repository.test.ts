import type { Database } from "../../../src/database/connection";
import {
  PgEnrollmentRepository,
  type Enrollment,
} from "../../../src/modules/enrollments/enrollments.repository";

const enrolledAt = new Date("2024-05-10T12:00:00.000Z");

function normalizeSql(sql: string): string {
  return sql.replace(/\s+/g, " ").trim();
}

describe("PgEnrollmentRepository", () => {
  let query: jest.Mock;
  let repository: PgEnrollmentRepository;

  beforeEach(() => {
    query = jest.fn();
    repository = new PgEnrollmentRepository({ query } as unknown as Database);
  });

  test("create insere a matrícula e retorna a linha", async () => {
    const enrollment: Enrollment = {
      studentRa: 123,
      courseId: 7,
      enrolledAt,
    };
    query.mockResolvedValue({ rows: [enrollment] });

    const result = await repository.create(123, 7);

    expect(result).toBe(enrollment);
    expect(result.studentRa).toBe(123);
    expect(result.courseId).toBe(7);
    expect(result.enrolledAt).toBe(enrolledAt);
    expect(query).toHaveBeenCalledTimes(1);

    const [sql, values] = query.mock.calls[0];
    expect(normalizeSql(sql)).toBe(
      'INSERT INTO enrollments (student_ra, course_id) VALUES ($1, $2) RETURNING student_ra AS "studentRa", course_id AS "courseId", enrolled_at AS "enrolledAt"',
    );
    expect(values).toEqual([123, 7]);
  });

  test("findAll devolve as linhas simuladas", async () => {
    const enrollments: Enrollment[] = [
      { studentRa: 123, courseId: 7, enrolledAt },
      { studentRa: 123, courseId: 8, enrolledAt },
    ];
    query.mockResolvedValue({ rows: enrollments });

    const result = await repository.findAll();

    expect(result).toBe(enrollments);
    expect(result[0].studentRa).toBe(123);
    expect(result[0].courseId).toBe(7);
    expect(result[0].enrolledAt).toBe(enrolledAt);
    expect(query).toHaveBeenCalledTimes(1);

    const [sql, values] = query.mock.calls[0];
    expect(normalizeSql(sql)).toBe(
      'SELECT student_ra AS "studentRa", course_id AS "courseId", enrolled_at AS "enrolledAt" FROM enrollments ORDER BY student_ra, course_id',
    );
    expect(values).toBeUndefined();
  });

  test("findAll devolve uma lista vazia", async () => {
    query.mockResolvedValue({ rows: [] });

    const result = await repository.findAll();

    expect(result).toEqual([]);
  });

  test("findOne devolve a primeira linha", async () => {
    const enrollment: Enrollment = {
      studentRa: 123,
      courseId: 7,
      enrolledAt,
    };
    query.mockResolvedValue({ rows: [enrollment] });

    const result = await repository.findOne(123, 7);

    expect(result).toBe(enrollment);
    expect(result?.studentRa).toBe(123);
    expect(result?.courseId).toBe(7);
    expect(result?.enrolledAt).toBe(enrolledAt);
    expect(query).toHaveBeenCalledTimes(1);

    const [sql, values] = query.mock.calls[0];
    expect(normalizeSql(sql)).toBe(
      'SELECT student_ra AS "studentRa", course_id AS "courseId", enrolled_at AS "enrolledAt" FROM enrollments WHERE student_ra = $1 AND course_id = $2',
    );
    expect(values).toEqual([123, 7]);
  });

  test("findOne devolve undefined quando não encontra", async () => {
    query.mockResolvedValue({ rows: [] });

    const result = await repository.findOne(123, 7);

    expect(result).toBeUndefined();
  });

  test("create propaga o erro do banco", async () => {
    const failure = new Error("falha no banco");
    query.mockRejectedValue(failure);

    await expect(repository.create(123, 7)).rejects.toBe(failure);
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

    await expect(repository.findOne(123, 7)).rejects.toBe(failure);
    expect(query).toHaveBeenCalledTimes(1);
  });
});
