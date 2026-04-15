type Searchable = {
  productName?: string;
  box_name?: string;
  name?: string;
  brand?: string;
  category?: string;
};

const normalize = (value: string) => value.trim().toLowerCase();

const fuzzyScore = (query: string, target: string) => {
  if (!query || !target) return 0;
  if (target === query) return 120;
  if (target.startsWith(query)) return 95;
  if (target.includes(query)) return 70;

  let queryIndex = 0;
  let consecutive = 0;
  let bestConsecutive = 0;

  for (let i = 0; i < target.length && queryIndex < query.length; i += 1) {
    if (target[i] === query[queryIndex]) {
      queryIndex += 1;
      consecutive += 1;
      bestConsecutive = Math.max(bestConsecutive, consecutive);
    } else {
      consecutive = 0;
    }
  }

  if (queryIndex !== query.length) return 0;

  const density = query.length / Math.max(target.length, 1);
  return 40 + bestConsecutive * 8 + density * 20;
};

export function rankByFuzzySearch<T extends Searchable>(
  list: T[],
  rawQuery: string,
  getPrimaryName: (entry: T) => string,
) {
  const query = normalize(rawQuery);
  if (!query) {
    return [...list].sort((left, right) =>
      getPrimaryName(left).localeCompare(getPrimaryName(right), undefined, {
        sensitivity: "base",
      }),
    );
  }

  return list
    .map((entry) => {
      const candidates = [
        getPrimaryName(entry),
        entry.name,
        entry.brand,
        entry.category,
      ]
        .filter(Boolean)
        .map((value) => normalize(String(value)));

      const score = Math.max(...candidates.map((candidate) => fuzzyScore(query, candidate)), 0);
      return { entry, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;

      return getPrimaryName(left.entry).localeCompare(getPrimaryName(right.entry), undefined, {
        sensitivity: "base",
      });
    })
    .map((entry) => entry.entry);
}
