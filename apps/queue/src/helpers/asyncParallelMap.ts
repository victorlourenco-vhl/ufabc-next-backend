/**
 * Executes an asynchronous function on each element of an array in parallel.
 * TODO: Find out if this function works like the mapLimit function from the legacy code
 * */
export async function asyncParallelMap<T, R>(
  arr: T[],
  func: (element: T, ...args: unknown[]) => Promise<R>,
  limit = 2,
  ...args: unknown[]
): Promise<R[]> {
  const results: R[] = [];
  const inProgress: Promise<R | number | void>[] = [];

  for (const element of arr) {
    // Check if the concurrency limit has been reached
    while (inProgress.length >= limit) {
      await Promise.race(inProgress);
    }

    // Execute the function asynchronously
    //TODO: Find out why the type is Promise<number | void> instead of Promise<R>
    const promise = func(element, ...args)
      .then((result) => results.push(result))
      .catch(async (error) => {
        // If an error occurs, immediately reject all other promises
        for (const promise of inProgress) {
          promise.catch(() => {});
          await Promise.reject(error);
        }
      });

    inProgress.push(promise);
  }

  // Wait for all promises to settle
  await Promise.all(inProgress);

  return results;
}
