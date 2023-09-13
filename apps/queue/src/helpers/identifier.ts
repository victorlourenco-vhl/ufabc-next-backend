import { logger } from '@ufabcnext/common';
//TODO: Find a way of importing without the * as
import * as crypto from 'crypto';
import * as _ from 'lodash';

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
  const disc = _.chain(disciplina)
    .pick(keys)
    .mapValues(String)
    .mapValues((value: string) => {
      _.camelCase(value);
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

  return crypto.createHash('md5').update(disc).digest('hex');
}
