import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCapabilityIndexes, toCapabilitySchema, validateCapabilitySchema } from '../../src/core/fixtures/capabilities';
import { FIXTURE_PROFILE_FORMAT_VERSION, type FixtureProfile } from '../../src/core/fixtures/types';

const profile: FixtureProfile = {
  format: FIXTURE_PROFILE_FORMAT_VERSION,
  manufacturer: 'LightAi',
  model: 'Hybrid 200',
  profileId: 'lightai-hybrid-200',
  modes: [
    {
      id: 'standard',
      name: 'Standard 8ch',
      channels: [
        { key: 'dimmer', name: 'Dimmer', type: 'intensity', defaultValue: 0 },
        { key: 'red', name: 'Red', type: 'color' },
        { key: 'green', name: 'Green', type: 'color' },
        { key: 'blue', name: 'Blue', type: 'color' },
        { key: 'pan', name: 'Pan', type: 'position', resolutionBits: 8 },
        { key: 'panFine', name: 'Pan Fine', type: 'position', resolutionBits: 16 },
      ],
    },
  ],
};

test('conversion vers schema capabilities/channelMap/constraints', () => {
  const schema = toCapabilitySchema(profile, profile.modes[0]);

  assert.equal(schema.profileId, 'lightai-hybrid-200');
  assert.equal(schema.modeId, 'standard');
  assert.equal(schema.channelMap[1].attributeId, 'intensity.dimmer');
  assert.equal(schema.channelMap[6].attributeId, 'position.panFine');
  assert.ok(schema.capabilities['color.red']);
});

test('validation stricte signale incoherences de plage et dependance mode fine/coarse', () => {
  const schema = toCapabilitySchema(profile, profile.modes[0]);
  schema.channelMap[2].range = { min: 255, max: 0 };
  schema.channelMap[3].defaultValue = 500;
  schema.channelMap[5].attributeId = 'position.tiltFine';

  const issues = validateCapabilitySchema(schema);
  assert.ok(issues.some((issue) => issue.code === 'invalidRange'));
  assert.ok(issues.some((issue) => issue.code === 'invalidDefaultValue'));
  assert.ok(issues.some((issue) => issue.code === 'invalidFineDependency'));
});

test('indexation attribut/famille/plage DMX compatible fixtures', () => {
  const schema = toCapabilitySchema(profile, profile.modes[0]);
  const indexes = buildCapabilityIndexes(schema);

  assert.deepEqual(indexes.byAttribute['color.red'], [2]);
  assert.deepEqual(indexes.byFamily.color, [2, 3, 4]);
  assert.equal(indexes.byDmxRange[0].start, 0);
  assert.ok(indexes.byDmxRange.some((entry) => entry.attributeId === 'position.panFine'));
});
