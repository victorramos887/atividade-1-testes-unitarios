import { HttpError } from "../../../src/errors";
import type {
  Course,
  CourseRepository,
} from "../../../src/modules/courses/courses.repository";
import { CoursesService } from "../../../src/modules/courses/courses.service";

async function getError(promise: Promise<unknown>): Promise<HttpError> {
  try {
    await promise;
  } catch (error) {
    return error as HttpError;
  }
  throw new Error("Era esperado um erro, mas nada foi lançado.");
}

function createRepository(): jest.Mocked<CourseRepository> {
  return {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
  };
}

describe("CoursesService", () => {
  let repository: jest.Mocked<CourseRepository>;
  let service: CoursesService;

  beforeEach(() => {
    repository = createRepository();
    service = new CoursesService(repository);
  });

  test("cria uma disciplina válida", async () => {
    const course: Course = { id: 1, name: "Qualidade" };
    repository.create.mockResolvedValue(course);

    const result = await service.create({ name: "Qualidade" });

    expect(result).toBe(course);
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith({ name: "Qualidade" });
  });

  test.each([[null], [{}], [{ name: "A" }]])(
    "rejeita a criação inválida %p com statusCode 400",
    async (input) => {
      const error = await getError(service.create(input));

      expect(error).toBeInstanceOf(HttpError);
      expect(error.statusCode).toBe(400);
      expect(repository.create).not.toHaveBeenCalled();
    },
  );

  test("rejeita nome duplicado com statusCode 409", async () => {
    repository.create.mockRejectedValue({ code: "23505" });

    const error = await getError(service.create({ name: "Qualidade" }));

    expect(error).toBeInstanceOf(HttpError);
    expect(error.statusCode).toBe(409);
  });

  test("lista disciplinas usando um stub", async () => {
    const courses: Course[] = [
      { id: 1, name: "Qualidade" },
      { id: 2, name: "Testes" },
    ];
    repository.findAll.mockResolvedValue(courses);

    const result = await service.findAll();

    expect(result).toBe(courses);
    expect(repository.findAll).toHaveBeenCalledTimes(1);
  });

  test("busca uma disciplina existente", async () => {
    const course: Course = { id: 123, name: "Qualidade" };
    repository.findOne.mockResolvedValue(course);

    const result = await service.findOne(123);

    expect(result).toBe(course);
    expect(repository.findOne).toHaveBeenCalledTimes(1);
    expect(repository.findOne).toHaveBeenCalledWith(123);
  });

  test("rejeita disciplina inexistente com statusCode 404", async () => {
    repository.findOne.mockResolvedValue(undefined);

    const error = await getError(service.findOne(123));

    expect(error).toBeInstanceOf(HttpError);
    expect(error.statusCode).toBe(404);
  });

  test("rejeita identificador inválido com statusCode 400", async () => {
    const error = await getError(service.findOne(0));

    expect(error).toBeInstanceOf(HttpError);
    expect(error.statusCode).toBe(400);
    expect(repository.findOne).not.toHaveBeenCalled();
  });

  test("propaga a falha inesperada de create", async () => {
    const failure = new Error("falha inesperada");
    repository.create.mockRejectedValue(failure);

    await expect(service.create({ name: "Qualidade" })).rejects.toBe(failure);
  });

  test("propaga a falha inesperada de findAll", async () => {
    const failure = new Error("falha inesperada");
    repository.findAll.mockRejectedValue(failure);

    await expect(service.findAll()).rejects.toBe(failure);
  });

  test("propaga a falha inesperada de findOne", async () => {
    const failure = new Error("falha inesperada");
    repository.findOne.mockRejectedValue(failure);

    await expect(service.findOne(1)).rejects.toBe(failure);
  });

  test("usa spy para observar a chamada de findOne", async () => {
    const course: Course = { id: 1, name: "Qualidade" };
    const repositoryWithStub: CourseRepository = {
      create: async () => {
        throw new Error("não usado neste teste");
      },
      findAll: async () => [],
      findOne: async () => course,
    };
    const spy = jest.spyOn(repositoryWithStub, "findOne");
    const spyService = new CoursesService(repositoryWithStub);

    const result = await spyService.findOne(1);

    expect(result).toBe(course);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(1);
  });

  test("envia somente os campos usados ao criar", async () => {
    const course: Course = { id: 1, name: "Qualidade" };
    repository.create.mockResolvedValue(course);

    const result = await service.create({ name: "Qualidade", extra: true });

    expect(result).toBe(course);
    expect(repository.create).toHaveBeenCalledWith({ name: "Qualidade" });
  });
});
