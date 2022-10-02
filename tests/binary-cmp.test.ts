import Seekr, { BinaryCmp } from '../src';
import { Data, DataWithScore } from '../src/types';
import { getPath } from '../src/utils';
import launches from './data.json';

const pick = (data: DataWithScore[], path: string) => data.map((item) => getPath(item, path));

const data = launches as Data[];

describe('Binary comparator', () => {
  const ls = new Seekr(new BinaryCmp());

  it('performs shallow full text search on each field in the record', () => {
    /**
     * 'falcon_heavy' term is only within the `links` object in one of the records.
     * Since Seekr only does shallow full text search, it does not find this record and returns empty result.
     */
    let result = ls.search('falcon_heavy', data);
    expect(result).toEqual([]);

    /**
     * Term 'Falcon heavy' appears in multiple records, usually in `mission_name` or `details`.
     * Seekr performs search on all fields, hence all records having 'Falcon Heavy' somewhere in the record(1 level deep) will be returned.
     */
    result = ls.search('Falcon heavy', data);
    expect(pick(result, 'record.id')).toEqual([55, 40, 77]);
  });

  it('is case-insensitive', () => {
    /**
     * All records having "heavy"(in any case) will get returned.
     */
    let result = ls.search('HEAVY', data);
    expect(pick(result, 'record.id')).toEqual([55, 44, 40, 77]);
  });

  it('narrows the search by group selector', () => {
    /**
     * Group selectors narrow down the search to only that key in the object.
     * There's only 1 record with the term 'heavy' in its `mission_name` key.
     */
    let result = ls.search('mission_name:heavy', data);
    expect(pick(result, 'record.id')).toEqual([55]);
  });

  it('searches for atomic values in dotted path with group selectors', () => {
    /**
     * Seekr by default only performs full-text-search 1 level deep, but allows targeted
     * search on **atomic** values by passing in dotted path strings.
     *
     * In this search, all records where `rocket.rocket_name` has 'heavy' is returned.
     * (Mostly Falcon Heavy rockets in this case)
     */
    let result = ls.search('rocket.rocket_name:heavy', data);
    expect(pick(result, 'record.id')).toEqual([55, 81, 77]);

    /**
     * `rocket` is an object(and not atomic). Seekr does not perform full text search on all fields
     * within the `rocket` object. This query gives an empty result
     */
    result = ls.search('rocket:abc', data);
    expect(pick(result, 'record.id')).toEqual([]);
  });
});
