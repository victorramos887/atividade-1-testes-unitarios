import { HttpError } from "../../../src/errors";
import type {
  Enrollment,
  EnrollmentRepository,
} from "../../../src/modules/enrollments/enrollments.repository";
import { EnrollmentsService } from "../../../src/modules/enrollments/enrollments.service";

const enrolledAt = new Date("2024-05-10T12:00:00.000Z");

async function getError(promise: Promise<unknown>): Promise<HttpError> {
  try {
    await promise;
  } catch (error) {
    return error as HttpError;
  }
  throw new Error("Era esperado um erro, mas nada foi lançado.");
}

function createRepository(): jest.Mocked<EnrollmentRepository> {
  return {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
  };
}

describe("EnrollmentsService", () => {
  let repository: jest.Mocked<EnrollmentRepository>;
  let service: EnrollmentsService;

  beforeEach(() => {
    repository = createRepository();
    service = new EnrollmentsService(repository);
  });

  test("cria uma matrícula válida", async () => {
    const enrollment: Enrollment = {
      studentRa: 123,
      courseId: 1,
      enrolledAt,
    };
    repository.create.mockResolvedValue(enrollment);

    const result = await service.create({ studentRa: 123, courseId: 1 });

    expect(result).toBe(enrollment);
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith(123, 1);
  });

  test.each([
    [{ studentRa: 0, courseId: 1 }],
    [{ studentRa: 123, courseId: 0 }],
  ])("rejeita a chave inválida %p com statusCode 400", async (input) => {
    const error = await getError(service.create(input));

    expect(error).toBeInstanceOf(HttpError);
    expect(error.statusCode).toBe(400);
    expect(repository.create).not.toHaveBeenCalled();
  });

  test("rejeita referência inexistente com statusCode 404", async () => {
    repository.create.mockRejectedValue({ code: "23503" });

    const error = await getError(service.create({ studentRa: 123, courseId: 1 }));

    expect(error).toBeInstanceOf(HttpError);
    expect(error.statusCode).toBe(404);
  });

  test("rejeita matrícula duplicada com statusCode 409", async () => {
    repository.create.mockRejectedValue({ code: "23505" });

    const error = await getError(service.create({ studentRa: 123, courseId: 1 }));

    expect(error).toBeInstanceOf(HttpError);
    expect(error.statusCode).toBe(409);
  });

  test("rejeita matrícula inexistente com statusCode 404", async () => {
    repository.findOne.mockResolvedValue(undefined);

    const error = await getError(service.findOne(123, 1));

    expect(error).toBeInstanceOf(HttpError);
    expect(error.statusCode).toBe(404);
    expect(repository.findOne).toHaveBeenCalledWith(123, 1);
  });

  test("propaga a falha inesperada na criação", async () => {
    const failure = new Error("falha inesperada");
    repository.create.mockRejectedValue(failure);

    await expect(service.create({ studentRa: 123, courseId: 1 })).rejects.toBe(
      failure,
    );
  });

  test("lista as matrículas", async () => {
    const enrollments: Enrollment[] = [
      { studentRa: 123, courseId: 1, enrolledAt },
      { studentRa: 123, courseId: 2, enrolledAt },
    ];
    repository.findAll.mockResolvedValue(enrollments);

    const result = await service.findAll();

    expect(result).toBe(enrollments);
    expect(repository.findAll).toHaveBeenCalledTimes(1);
    expect(repository.findAll).toHaveBeenCalledWith();
  });

  test("busca uma matrícula existente", async () => {
    const enrollment: Enrollment = {
      studentRa: 123,
      courseId: 1,
      enrolledAt,
    };
    repository.findOne.mockResolvedValue(enrollment);

    const result = await service.findOne(123, 1);

    expect(result).toBe(enrollment);
    expect(repository.findOne).toHaveBeenCalledTimes(1);
    expect(repository.findOne).toHaveBeenCalledWith(123, 1);
  });
});
