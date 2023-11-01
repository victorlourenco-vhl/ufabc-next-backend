import { createHash } from 'node:crypto';
import { logger } from '@next/common';
import { camelCase } from 'lodash-es';
import type { Disciplina } from '@/types/models.js';

/**
 * Generates a unique identifier for a given disciplina
 * */
export function generateIdentifier(
  disciplina: Record<string, Disciplina>,
  keys: string[] = ['disciplina', 'turno', 'campus', 'turma'],
  silent = true,
) {
  //TODO: Find a way of doing this without lodash
  // const disc = chain(disciplina)
  //   .pick(keys)
  //   .mapValues(String)
  //   .mapValues((value: string) => {
  //     camelCase(value);
  //   })
  //   .toPairs()
  //   .sortBy(0)
  //   .fromPairs()
  //   .values()
  //   .value()
  //   .join('');

  // TODO2: See if it behaves the same
  const disc = keys
    .map((key) => String(disciplina[key]))
    .map((value) => camelCase(value)) // Use camelCase
    .join('');

  if (!silent) {
    logger.info(disc);
  }

  return createHash('md5').update(disc).digest('hex');
}
