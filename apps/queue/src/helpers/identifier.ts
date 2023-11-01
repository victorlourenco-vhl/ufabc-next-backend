import { createHash } from 'node:crypto';
import { logger } from '@next/common';
import { camelCase, chain } from 'lodash-es';

/**
 * Generates a unique identifier for a given disciplina
 * */
export function generateIdentifier(
  disciplina: Record<string, unknown>,
  keys: string[],
  silent = true,
) {
  keys = keys || ['disciplina', 'turno', 'campus', 'turma'];

  //TODO: Find a way of doing this without lodash
  const disc = chain(disciplina)
    .pick(keys)
    .mapValues(String)
    .mapValues((value: string) => {
      camelCase(value);
    })
    .toPairs()
    .sortBy(0)
    .fromPairs()
    .values()
    .value()
    .join('');

  if (!silent) {
    logger.info(disc);
  }

  return createHash('md5').update(disc).digest('hex');
}
