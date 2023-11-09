export type ProcessFn<Param> = (item: Param, idx?: number) => Promise<Param>;
type BatchOptions = {
  maxConcurrency: number;
};

export async function batchInsertItems<Item>(
  items: Item[],
  func: ProcessFn<Item>,
  { maxConcurrency }: BatchOptions,
) {
  const errors: Array<{ item: Item; error: unknown }> = [];
  let i = 0;
  const concurrency = Math.min(maxConcurrency, items.length);
  const worker = async () => {
    while (i < items.length) {
      const item = items[i++];
      try {
        await func(item);
      } catch (error) {
        errors.push({ item, error });
      }
    }
  };

  // eslint-disable-next-line unicorn/no-array-callback-reference
  const promises = Array.from({ length: concurrency }).fill(null).map(worker);

  await Promise.all(promises);
  return errors;
}
