import './unit/lighting-engine.unit.test';
import './unit/patch-importer.unit.test';
import './integration/protocols.integration.test';
import './e2e/show-workflow.e2e.test';
import './perf/performance.nonregression.test';
import { run } from './harness';

await run();
