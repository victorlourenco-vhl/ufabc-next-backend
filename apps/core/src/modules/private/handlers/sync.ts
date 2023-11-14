import { ofetch } from 'ofetch';
import { currentQuad } from '@next/common';
import { DisciplinaModel } from '@next/models';
import { addSyncToQueue } from '@next/queue';
import { batchInsertItems } from '../helpers/batch-insert.js';
import type { ObjectId } from 'mongoose';
import type { FastifyReply, FastifyRequest } from 'fastify';

type SyncDisciplinas = {
  _id: ObjectId;
  disciplina_id: number;
  season: string;
  after_kick: number[];
  alunos_matriculados: number[];
  before_kick: number[];
  createdAt: Date;
  obrigatorias: number[];
  quad: 1 | 2 | 3;
  updatedAt: Date;
  year: number;
};

const valueToJson = (payload: string, max?: number) => {
  const parts = payload.split('=');
  if (parts.length < 2) {
    return [];
  }

  const jsonStr = parts[1].split(';')[0];
  const json = JSON.parse(jsonStr) as number[];
  if (max) {
    return json.slice(0, max);
  }
  return json;
};

const parseEnrollments = (data: Record<string, number[]>) => {
  const matriculas: Record<string, number[]> = {};

  for (const aluno_id in data) {
    const matriculasAluno = data[aluno_id];
    matriculasAluno.forEach((matricula) => {
      matriculas[matricula] = (matriculas[matricula] || []).concat([
        Number.parseInt(aluno_id),
      ]);
    });
  }

  return matriculas;
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

  const operationField = operationMap.get(operation) ?? 'alunos_matriculados';
  const isSync = operationField === 'alunos_matriculados';

  const matriculas = await ofetch(
    'https://api.ufabcnext.com/snapshot/assets/matriculas.js',
    {
      parseResponse: valueToJson,
    },
  );

  const enrollments = parseEnrollments(matriculas);

  async function updateEnrolledStudents(
    enrollmentId: string,
    payload: Record<string, number[]>,
  ): Promise<'OK' | SyncDisciplinas | null> {
    const cacheKey = `disciplina_${season}_${enrollmentId}`;
    // only get cache result if we are doing a sync operation
    const cachedMatriculas = isSync ? await redis.get(cacheKey) : {};
    const isPayloadEqual =
      JSON.stringify(cachedMatriculas) ===
      JSON.stringify(payload[enrollmentId]);
    // only update disciplinas that matriculas has changed
    if (isPayloadEqual) {
      return cachedMatriculas as SyncDisciplinas;
    }

    // find and update disciplina
    const query = {
      disciplina_id: enrollmentId,
      season,
    };
    const toUpdate = { [operationField]: payload[enrollmentId] };
    const opts = {
      // returns the updated document
      upsert: true,
      // create if it not exists
      new: true,
    };
    const saved = await DisciplinaModel.findOneAndUpdate<SyncDisciplinas>(
      query,
      toUpdate,
      opts,
    );
    // save matriculas for this disciplina on cache if is sync operation
    if (isSync) {
      await redis.set(
        cacheKey,
        JSON.stringify(payload[enrollmentId]),
        'EX',
        60 * 2,
        'NX',
      );

      await addSyncToQueue({
        enrollment: enrollments,
        enrollmentId,
        //@ts-expect-error ignore mongoose
        DisciplinaModel,
      });
    }

    return saved;
  }

  const start = Date.now();

  const errors = await batchInsertItems(
    Object.keys(enrollments),
    async (enrollmentId): Promise<any> => {
      const updatedStudents = await updateEnrolledStudents(
        enrollmentId,
        enrollments,
      );
      return updatedStudents;
    },
  );

  reply.send({
    status: 'Sync has been successfully',
    duration: Date.now() - start,
    errors,
  });
}