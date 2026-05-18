import { assert, test } from '../harness';
import { copilotReducer, initialCopilotState } from '../../src/features/copilot/copilotState';

test('flux copilot complet: draft brief → génération → diff → accept partiel → merge', () => {
  let state = { ...initialCopilotState };

  state = copilotReducer(state, { type: 'brief/update', payload: 'Intro doux puis drop énergique.' });
  assert.equal(state.brief.includes('drop'), true);

  state = copilotReducer(state, { type: 'generation/mock' });
  assert.equal(state.versions.safe.length > 0, true);
  assert.equal(state.versions.balanced.length > 0, true);
  assert.equal(state.versions.creative.length > 0, true);

  const cue = state.versions.balanced[0];
  assert.equal(cue.changes.length > 0, true);

  state = copilotReducer(state, { type: 'cue/accept', payload: { cueId: cue.id, actor: 'qa.user', why: 'Conforme à la direction artistique' } });
  assert.deepEqual(state.acceptedCueIds, [cue.id]);

  state = copilotReducer(state, { type: 'batch/merge', payload: { actor: 'qa.user', why: 'Merge partiel validé' } });
  assert.equal(state.decisionHistory[state.decisionHistory.length - 1]?.action, 'merge');
  assert.equal(state.requiresValidation, true);

  state = copilotReducer(state, { type: 'show/validate' });
  assert.equal(state.requiresValidation, false);
});
