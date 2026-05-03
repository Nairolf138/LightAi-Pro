import { exportCanonicalShowToEos, importEosStateToCanonicalSync } from '../../src/integrations/eos-bridge';
import { mediumShow } from '../fixtures/shows/medium-show';
import { smallShow } from '../fixtures/shows/small-show';
import { assert, test } from '../harness';

const verifyRoundTrip = (label: string, show: typeof smallShow | typeof mediumShow) => {
  test(`round-trip ${label}: export Eos puis réimport + comparaison structurelle`, () => {
    const exported = exportCanonicalShowToEos(show, { copilotOnly: true });

    assert.equal(exported.outputPolicy.copilotOnly, true);
    assert.equal(exported.outputPolicy.localDmxOutputEnabled, false);
    assert.ok(exported.eos.patch.length > 0);

    const reimported = importEosStateToCanonicalSync(show, exported.eos);

    assert.equal(reimported.dmx.fixtures.length, show.dmx.fixtures.length);
    assert.equal(reimported.palettes.length, show.palettes.length);
    assert.equal(reimported.cues.length, show.cues.length);

    assert.ok(exported.warnings.length >= 0);
  });
};

verifyRoundTrip('small-show', smallShow);
verifyRoundTrip('medium-show', mediumShow);

test('signale explicitement la perte de granularité timing/features', () => {
  const exported = exportCanonicalShowToEos(smallShow);

  assert.ok(exported.warnings.some((warning) => warning.code === 'TIMING_QUANTIZED'));
  assert.ok(exported.warnings.some((warning) => warning.code === 'UNSUPPORTED_FOLLOW'));
  assert.ok(exported.report.quantizedTimings >= 1);
  assert.ok(exported.report.unmappedFeatures >= 1);
});
