import { HttpError } from "../../../src/errors";
import type {
  Student,
  StudentRepository,
} from "../../../src/modules/students/students.repository";
import { StudentsService } from "../../../src/modules/students/students.service";

async function getError(promise: Promise<unknown>): Promise<HttpError> {
  try {
    await promise;
  } catch (error) {
    return error as HttpError;
  }
  throw new Error("Era esperado um erro, mas nada foi lançado.");
}

function createRepository(): jest.Mocked<StudentRepository> {
  return {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
  };
}

describe("StudentsService", () => {
  let repository: jest.Mocked<StudentRepository>;
  let service: StudentsService;

  beforeEach(() => {
    repository = createRepository();
    service = new StudentsService(repository);
  });

  test("cria um aluno válido", async () => {
    const student: Student = { ra: 123, name: "Ana" };
    repository.create.mockResolvedValue(student);

    const result = await service.create({ ra: 123, name: "Ana" });

    expect(result).toBe(student);
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith({ ra: 123, name: "Ana" });
  });

  test("rejeita RA inválido com statusCode 400", async () => {
    const error = await getError(service.create({ ra: 0, name: "Ana" }));

    expect(error).toBeInstanceOf(HttpError);
    expect(error.statusCode).toBe(400);
    expect(repository.create).not.toHaveBeenCalled();
  });

  test("rejeita RA duplicado com statusCode 409", async () => {
    repository.create.mockRejectedValue({ code: "23505" });

    const error = await getError(service.create({ ra: 123, name: "Ana" }));

    expect(error).toBeInstanceOf(HttpError);
    expect(error.statusCode).toBe(409);
  });

  test("rejeita aluno inexistente com statusCode 404", async () => {
    repository.findOne.mockResolvedValue(undefined);

    const error = await getError(service.findOne(123));

    expect(error).toBeInstanceOf(HttpError);
    expect(error.statusCode).toBe(404);
  });

  test("propaga a falha inesperada na criação", async () => {
    const failure = new Error("falha inesperada");
    repository.create.mockRejectedValue(failure);

    await expect(service.create({ ra: 123, name: "Ana" })).rejects.toBe(
      failure,
    );
  });

  test("lista os alunos", async () => {
    const students: Student[] = [
      { ra: 123, name: "Ana" },
      { ra: 456, name: "Bruno" },
    ];
    repository.findAll.mockResolvedValue(students);

    const result = await service.findAll();

    expect(result).toBe(students);
    expect(repository.findAll).toHaveBeenCalledTimes(1);
    expect(repository.findAll).toHaveBeenCalledWith();
  });

  test("busca um aluno existente", async () => {
    const student: Student = { ra: 123, name: "Ana" };
    repository.findOne.mockResolvedValue(student);

    const result = await service.findOne(123);

    expect(result).toBe(student);
    expect(repository.findOne).toHaveBeenCalledTimes(1);
    expect(repository.findOne).toHaveBeenCalledWith(123);
  });
});
