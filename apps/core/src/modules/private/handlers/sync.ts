import { ofetch } from 'ofetch';
import { asyncParallelMap, currentQuad } from '@next/common';
import { DisciplinaModel } from '@next/models';
import type { FastifyReply, FastifyRequest } from 'fastify';

type StudentEnrollments = Record<string, number[]>;
type Enrollments = Record<string, number[]>;

const valueToJson = (payload: string, max?: number) => {
  const parts = payload.split('=');
  if (parts.length < 2) {
    return [];
  }

  const jsonStr = parts[1].split(';')[0];
  const json = JSON.parse(jsonStr);

  if (max) {
    return json.slice(0, max);
  }
  return json;
};

const parseEnrollments = (data: StudentEnrollments) => {
  const enrollments: Enrollments = {};

  for (const aluno_id in data) {
    const studentsEnrollments = data[aluno_id];
    studentsEnrollments.forEach((enrollment) => {
      enrollments[enrollment] = (enrollments[enrollment] ?? []).concat([
        Number.parseInt(aluno_id),
      ]);
    });
  }

  return enrollments;
};

export async function sync(
  request: FastifyRequest<{ Querystring: string }>,
  reply: FastifyReply,
) {
  const { redis } = request.server;
  const season = currentQuad();

  const operation = request.query;
  const operationMap = new Map([
    ['before_kick', 'before_kick'],
    ['after_kick', 'after_kick'],
    ['sync', 'alunos_matriculados'],
  ]);

  const operationField = operationMap.get(operation) || 'alunos_matriculados';

  const isSync = operationField === 'alunos_matriculados';

  const matriculas = await ofetch(
    'https://api.ufabcnext.com/snapshot/assets/matriculas.js',
  );
  const rawEnrollments = valueToJson(matriculas.data);
  const enrollments = parseEnrollments(rawEnrollments);

  async function updateEnrolledStudents(
    id: string,
    enrollments: Record<string, number>,
  ) {
    const cacheKey = `disciplina_${season}_${id}`;
    // only get cache result if we are doing a sync operation
    const cachedMatriculas = isSync ? await redis.cache.get(cacheKey) : {};

    // only update disciplinas that matriculas has changed
    if (JSON.stringify(cachedMatriculas) === JSON.stringify(enrollments[id])) {
      return cachedMatriculas;
    }

    // find and update disciplina
    const query = {
      disciplina_id: id,
      season,
    };
    const toUpdate = { [operationField]: enrollments[id] };
    const opts = {
      // returns the updated document
      upsert: true,
      // create if it not exists
      new: true,
    };
    const saved = await DisciplinaModel.findOneAndUpdate(query, toUpdate, opts);

    // save matriculas for this disciplina on cache if is sync1x operation
    if (isSync) {
      await redis.cache.set(cacheKey, enrollments[id]);
    }

    return saved;
  }

  const start = Date.now();
  await asyncParallelMap(
    Object.keys(enrollments),
    // @ts-expect-error for now
    updateEnrolledStudents,
    15,
    enrollments,
  );

  reply.send({
    status: 'Sync successfull',
    duration: Date.now() - start,
  });
}
