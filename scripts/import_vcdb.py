"""Build aggregate-only CC BY-SA data from a pinned VCDB archive. No network at runtime.
Usage: python scripts/import_vcdb.py artifacts/vcdb.zip
"""
import collections, hashlib, json, pathlib, sys, zipfile
REVISION = '230cf22b56a481dd1a994b21e4d94c59e2bccea9'
def aggregate(records):
    groups = {}
    exclusions = collections.Counter()
    seen = set()
    for record in records:
        identifier = record.get('incident_id')
        if not identifier or identifier in seen:
            exclusions['missingOrDuplicateId'] += 1
            continue
        seen.add(identifier)
        if record.get('plus', {}).get('sub_source') in ('phidbr', 'priority'):
            exclusions['preferentialSampling'] += 1
            continue
        if record.get('security_incident') != 'Confirmed':
            exclusions['notConfirmed'] += 1
            continue
        if 'external' not in record.get('actor', {}):
            exclusions['noExternalActor'] += 1
            continue
        action = record.get('action', {})
        malware = action.get('malware', {}).get('variety', [])
        social = action.get('social', {}).get('variety', [])
        hacking = action.get('hacking', {}).get('variety', [])
        category = 'ransomware' if 'Ransomware' in malware else 'credentials' if 'Phishing' in social or 'Use of stolen creds' in hacking else 'other'
        sector = str(record.get('victim', {}).get('industry', '00'))[:2]
        for key in ['all', sector]:
            group = groups.setdefault(key, {'records': 0, 'categories': {'ransomware': 0, 'credentials': 0, 'other': 0}, 'actions': {}, 'assets': {}})
            group['records'] += 1
            group['categories'][category] += 1
            for name in action:
                group['actions'][name] = group['actions'].get(name, 0) + 1
            assets = {a.get('variety', 'Unknown') for a in record.get('asset', {}).get('assets', [])}
            for name in assets:
                group['assets'][name] = group['assets'].get(name, 0) + 1
    return groups, dict(exclusions)

def main(path):
    archive = pathlib.Path(path)
    with zipfile.ZipFile(archive) as z:
        files = sorted(n for n in z.namelist() if '/data/json/validated/' in n and n.endswith('.json'))
        if not all(n.startswith('VCDB-' + REVISION + '/') for n in files) or not files:
            raise ValueError('Expected pinned VCDB archive')
        groups, exclusions = aggregate(json.loads(z.read(n)) for n in files)
        license_name = next(n for n in z.namelist() if n.endswith('/LICENSE.txt'))
        pathlib.Path('fixtures/VCDB-LICENSE.txt').write_bytes(z.read(license_name))
    result = {'source': 'VERIS Community Database, Verizon RISK Team and contributors', 'revision': REVISION,
      'url': 'https://github.com/vz-risk/VCDB/tree/' + REVISION, 'license': 'CC-BY-SA-4.0',
      'archiveSha256': hashlib.sha256(archive.read_bytes()).hexdigest(), 'retrievedAt': '2026-09-27',
      'validatedRecords': len(files), 'exclusions': exclusions, 'groups': groups,
      'method': 'Validated records only; deduplicate incident_id; exclude phidbr/priority selection, unconfirmed incidents and records without external actors. Disjoint categories: ransomware first, then phishing/stolen credentials, then other external incidents. Actions and assets can overlap.',
      'limitation': 'Publicly reported incidents have reporting and selection bias. These frequencies are not population breach rates, causal effects or calibrated forecasts. Removing known preferential selections does not remove all bias.'}
    pathlib.Path('fixtures/vcdb-aggregate.json').write_text(json.dumps(result, indent=2, sort_keys=True) + '\n', encoding='utf-8')
    print(json.dumps({'validated': len(files), 'included': groups['all']['records'], 'categories': groups['all']['categories'], 'excluded': exclusions}))
if __name__ == '__main__': main(sys.argv[1])
