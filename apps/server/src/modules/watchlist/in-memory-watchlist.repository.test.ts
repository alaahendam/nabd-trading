import { describe, expect, it } from 'vitest';

import { InMemoryWatchlistRepository } from './in-memory-watchlist.repository.js';

const item = (symbol: string, addedAt = 1) => ({ symbol, addedAt });

describe('InMemoryWatchlistRepository', () => {
  it('REP-01 gives a new client an empty list', () => {
    expect(new InMemoryWatchlistRepository().list('nobody')).toEqual([]);
  });

  it('REP-02 lists saved items in insertion order', () => {
    const repository = new InMemoryWatchlistRepository();
    repository.save('a', item('MSFT'));
    repository.save('a', item('AAPL'));
    repository.save('a', item('NVDA'));
    expect(repository.list('a').map((entry) => entry.symbol)).toEqual(['MSFT', 'AAPL', 'NVDA']);
    expect(repository.get('a', 'AAPL')).toEqual(item('AAPL'));
    expect(repository.get('a', 'KO')).toBeUndefined();
  });

  it('REP-03 deletes, and deleting again is harmless', () => {
    const repository = new InMemoryWatchlistRepository();
    repository.save('a', item('AAPL'));
    repository.delete('a', 'AAPL');
    repository.delete('a', 'AAPL');
    repository.delete('unseen', 'AAPL');
    expect(repository.list('a')).toEqual([]);
  });

  it('REP-04 keeps clients apart', () => {
    const repository = new InMemoryWatchlistRepository();
    repository.save('a', item('AAPL'));
    repository.save('b', item('MSFT'));
    expect(repository.list('a')).toEqual([item('AAPL')]);
    expect(repository.list('b')).toEqual([item('MSFT')]);
  });

  it('REP-05 returns copies', () => {
    const repository = new InMemoryWatchlistRepository();
    repository.save('a', item('AAPL', 5));
    const listed = repository.list('a')[0];
    const fetched = repository.get('a', 'AAPL');
    if (!listed || !fetched) {
      throw new Error('expected items');
    }
    listed.addedAt = 999;
    fetched.addedAt = 999;
    expect(repository.get('a', 'AAPL')).toEqual(item('AAPL', 5));
  });

  it('REP-06 evicts the least recently used client at capacity', () => {
    const repository = new InMemoryWatchlistRepository(2);
    repository.save('first', item('AAPL'));
    repository.save('second', item('MSFT'));
    repository.save('third', item('NVDA'));
    expect(repository.list('first')).toEqual([]);
    expect(repository.list('second')).toEqual([item('MSFT')]);
    expect(repository.list('third')).toEqual([item('NVDA')]);
  });

  it('REP-06 keeps a client that was used recently', () => {
    const repository = new InMemoryWatchlistRepository(2);
    repository.save('first', item('AAPL'));
    repository.save('second', item('MSFT'));
    repository.get('first', 'AAPL');
    repository.save('third', item('NVDA'));
    expect(repository.list('first')).toEqual([item('AAPL')]);
    expect(repository.list('second')).toEqual([]);
  });

  it.each([0, -1, 1.5, Number.NaN])('REP-07 rejects a capacity of %s', (maxClients) => {
    expect(() => new InMemoryWatchlistRepository(maxClients)).toThrow(RangeError);
  });
});
