import { describe, expect, test } from '@jest/globals';
import fc from 'fast-check';

import {
  normalizeDate,
  parseCLISTResponse,
  parseKaggleResponse,
  parseKontestsResponse,
} from '../apiResponseParser.js';

describe('API response parser properties', () => {
  const realisticIsoDateArb = fc
    .integer({
      min: Date.parse('1970-01-01T00:00:00.000Z'),
      max: Date.parse('2100-01-01T00:00:00.000Z'),
    })
    .map((timestamp) => new Date(timestamp).toISOString());

  test('Property 3: invalid JSON returns descriptive errors without throwing', () => {
    fc.assert(
      fc.property(
        fc.string().filter((value) => {
          try {
            JSON.parse(value);
            return false;
          } catch {
            return true;
          }
        }),
        (invalidJson) => {
          const parsers = [
            parseKontestsResponse,
            parseCLISTResponse,
            parseKaggleResponse,
          ];

          for (const parser of parsers) {
            expect(() => parser(invalidJson)).not.toThrow();
            const result = parser(invalidJson);
            expect(result.error).toBeDefined();
            expect(result.error.code).toBe('INVALID_JSON');
            expect(result.error.message).toContain('Failed to parse');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 4: missing optional fields are handled with defaults', () => {
    const kontestsArb = fc.record(
      {
        name: fc.option(fc.string(), { nil: undefined }),
        url: fc.option(fc.webUrl(), { nil: undefined }),
        start_time: fc.option(realisticIsoDateArb, { nil: undefined }),
        end_time: fc.option(realisticIsoDateArb, { nil: undefined }),
        site: fc.option(fc.string(), { nil: undefined }),
      },
      { withDeletedKeys: true }
    );

    fc.assert(
      fc.property(kontestsArb, (entry) => {
        const result = parseKontestsResponse([entry]);
        expect(result.error).toBeUndefined();
        expect(result.competitions).toHaveLength(1);

        const [competition] = result.competitions;
        expect(competition.title).toBeTruthy();
        expect(competition.platform).toBeTruthy();
        expect(competition.url).toBeTruthy();
        expect(competition.location).toBe('Online');
        expect(competition.source).toBe('kontests');
      }),
      { numRuns: 100 }
    );
  });

  test('Property 5: supported date inputs normalize to ISO 8601', () => {
    const unixSeconds = fc.integer({ min: 1, max: 2147483647 });
    const unixMilliseconds = fc.integer({
      min: 1000,
      max: 2147483647000,
    });
    const isoDates = realisticIsoDateArb;
    const rfc2822Dates = realisticIsoDateArb.map((value) =>
      new Date(value).toUTCString()
    );

    fc.assert(
      fc.property(
        fc.oneof(unixSeconds, unixMilliseconds, isoDates, rfc2822Dates),
        (value) => {
          const normalized = normalizeDate(value);
          expect(typeof normalized).toBe('string');
          expect(Number.isNaN(new Date(normalized).getTime())).toBe(false);
          expect(normalized).toMatch(/\d{4}-\d{2}-\d{2}T/);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 6: competition JSON round-trip preserves parsed fields', () => {
    const competitionArb = fc.record({
      title: fc.string({ minLength: 1 }),
      url: fc.webUrl(),
      deadline: fc.date().map((value) => value.toISOString()),
      category: fc.constantFrom(
        'AI/Data Science',
        'Competitive Programming',
        'Hackathons',
        'CTF/Security'
      ),
      reward: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
    });

    fc.assert(
      fc.property(competitionArb, (competition) => {
        const serialized = JSON.stringify([competition]);
        const parsed = parseKaggleResponse(serialized);
        expect(parsed.error).toBeUndefined();

        const reparsed = JSON.parse(JSON.stringify(parsed.competitions));
        expect(reparsed[0]).toEqual(parsed.competitions[0]);
      }),
      { numRuns: 100 }
    );
  });
});
