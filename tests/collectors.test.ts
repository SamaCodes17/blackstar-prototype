import test from 'node:test';
import assert from 'node:assert/strict';
process.env.BLACKSTAR_DB = ':memory:';
const { scan } = await import('../server/collectors');
const { exampleOrganization, createOrganization } = await import('../server/seed');
const { save, getOrg, getOutput, timeline } = await import('../server/store');
const { compute } = await import('../src/core/pipeline');

test('Shodan saves indexed services, supports CVE arrays, and requires exact host and version evidence', async () => {
  const previous = process.env.SHODAN_API_KEY;
  process.env.SHODAN_API_KEY = 'test-fixture-not-a-real-key';
  try {
    const org = exampleOrganization();
    const banner = {
      ip_str: '192.0.2.44',
      port: 443,
      transport: 'tcp',
      product: 'Example server',
      version: '1.2',
      timestamp: '2026-09-25T12:00:00Z',
      vulns: ['CVE-2024-12345'],
    };
    const result = await scan(org, {
      discover: async () => ({ names: org.inventory, source: 'https://crt.sh/' }),
      read: async (url) => {
        if (url.includes('api.shodan.io'))
          return {
            matches: [
              null,
              { ...banner, hostnames: [org.assets[0].hostname + '.evil.example'] },
              { ...banner, hostnames: [org.assets[1].hostname], version: undefined },
              { ...banner, hostnames: [org.assets[0].hostname.toUpperCase() + '.'] },
              { ...banner, hostnames: [org.assets[2].hostname], vulns: undefined },
            ],
          };
        if (url.includes('first.org')) return { data: [] };
        if (url.includes('cisa.gov')) return { vulnerabilities: [] };
        return { totalResults: 1 };
      },
    });
    assert.equal(result.org.assets[0].services?.length, 1);
    assert.equal(result.org.assets[0].services?.[0].port, 443);
    assert.equal(result.org.assets[0].services?.[0].observedAt, banner.timestamp);
    assert.equal(result.org.assets[0].cve, 'CVE-2024-12345');
    assert.equal(result.org.assets[0].findingTag, 'CITED');
    assert.equal(result.org.assets[1].cve, undefined);
    assert.equal(result.org.assets[2].services?.length, 1);
    assert.equal(result.org.assets[2].cve, undefined);
    assert.equal(
      result.org.scans.find((s) => s.collector === 'Service / CVE correlation')?.count,
      3,
    );
    assert.ok(!JSON.stringify(result).includes('test-fixture-not-a-real-key'));
  } finally {
    if (previous === undefined) delete process.env.SHODAN_API_KEY;
    else process.env.SHODAN_API_KEY = previous;
  }
});

test('Shodan authentication failure claims unavailable, not a successful live lookup', async () => {
  const previous = process.env.SHODAN_API_KEY;
  process.env.SHODAN_API_KEY = 'test-fixture-not-a-real-key';
  try {
    const org = exampleOrganization();
    const result = await scan(org, {
      discover: async () => ({ names: org.inventory, source: 'https://crt.sh/' }),
      read: async () => {
        throw new Error('Public index responded 401');
      },
    });
    assert.equal(
      result.org.scans.find((s) => s.collector === 'Service / CVE correlation')?.status,
      'UNAVAILABLE',
    );
    assert.equal(result.org.assets[0].findingTag, 'PREVIEW');
    assert.equal(
      result.org.scans.find((s) => s.collector === 'Service / CVE correlation')?.issue,
      'ACCESS_DENIED',
    );
  } finally {
    if (previous === undefined) delete process.env.SHODAN_API_KEY;
    else process.env.SHODAN_API_KEY = previous;
  }
});
test('offline collectors preserve last good evidence and distinguish snapshot from live', async () => {
  const org = exampleOrganization(),
    before = structuredClone(org);
  const result = await scan(org, {
    discover: async () => {
      throw new Error('offline');
    },
    read: async () => {
      throw new Error('offline');
    },
  });
  assert.deepEqual(result.org.assets, before.assets);
  assert.equal(
    result.org.scans.find((s) => s.collector === 'Certificate transparency')?.status,
    'SNAPSHOT',
  );
  assert.ok(result.org.scans.every((s) => s.status !== 'LIVE'));
  assert.deepEqual(result.changed, []);
});
test('live global feeds do not promote preview asset associations', async () => {
  const org = exampleOrganization();
  const result = await scan(org, {
    discover: async () => ({ names: org.inventory, source: 'https://crt.sh/' }),
    read: async (url) =>
      url.includes('first.org')
        ? { data: [{ cve: 'CVE-2021-44228', epss: '0.75', date: '2026-09-25' }] }
        : url.includes('cisa.gov')
          ? { vulnerabilities: [{ cveID: 'CVE-2021-44228' }], dateReleased: '2026-09-25' }
          : { totalResults: 1 },
  });
  assert.equal(result.org.assets[0].findingTag, 'PREVIEW');
  assert.equal(result.org.assets[0].epss?.tag, 'CITED');
  assert.equal(result.org.assets[0].epss?.value, 0.75);
  assert.ok(result.changed.includes(result.org.assets[0].id));
});
test('unreachable new organization has no fabricated assets or vulnerabilities', async () => {
  const org = createOrganization('Test company', 'example.org', 'msme', 100, []);
  const result = await scan(org, {
    discover: async () => {
      throw new Error('unavailable');
    },
    read: async () => {
      throw new Error('Should not fetch vulnerability feeds without CVEs');
    },
  });
  assert.equal(result.org.assets.length, 1);
  assert.equal(result.org.assets[0].hostname, 'example.org');
  assert.equal(result.org.assets[0].cve, undefined);
});
test('organization-scoped storage and atomic output round trip', () => {
  const a = createOrganization('Test A', 'example.org', 'msme', 100, []),
    b = createOrganization('Test B', 'example.com', 'other', 400, []);
  const outputA = compute(a),
    outputB = compute(b);
  save(a, outputA, {
    at: outputA.at,
    event: 'A test event',
    ale: outputA.risk.ale,
    tag: 'COMPUTED',
    affected: [],
    alert: false,
  });
  save(b, outputB, {
    at: outputB.at,
    event: 'B test event',
    ale: outputB.risk.ale,
    tag: 'COMPUTED',
    affected: [],
    alert: false,
  });
  assert.equal(getOrg(a.id).name, 'Test A');
  assert.equal(getOutput(b.id).risk.ale, outputB.risk.ale);
  assert.equal(timeline(a.id)[0].event, 'A test event');
});
