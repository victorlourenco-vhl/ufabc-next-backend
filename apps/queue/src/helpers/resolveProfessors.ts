import type { Teacher } from '@ufabcnext/models';
import { SequenceMatcher, getCloseMatches } from 'difflib';
import * as _ from 'lodash';

export async function resolveProfessors(
  name: string,
  teachers: Teacher[],
  mappings: Record<string, string> = {},
) {
  if (name in mappings) {
    return mappings[name];
  }

  const normalizedName = _.startCase(_.camelCase(name));

  if (!normalizedName || normalizedName === 'N D' || normalizedName === 'Falso')
    return null;

  const foundTeacher =
    teachers.find((t) => t.name === normalizedName) ||
    teachers.find((t) => (t.alias || []).includes(normalizedName));

  if (foundTeacher) return foundTeacher;

  const bestMatch = getCloseMatches(
    normalizedName,
    teachers.map((t) => t.name),
  )[0];

  const sequenceMatcher = new SequenceMatcher(null, bestMatch, normalizedName);

  if (sequenceMatcher.ratio() > 0.8)
    return teachers.find((t) => t.name === bestMatch);

  return { error: 'Missing Teacher: ' + normalizedName };
}
