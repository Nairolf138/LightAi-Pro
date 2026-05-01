import './unit/lighting-engine.unit.test';
import './unit/patch-importer.unit.test';
import './unit/patch-audit.unit.test';
import './unit/preset-seeding.unit.test';
import './unit/brief-planner.unit.test';
import './unit/console-conversion.unit.test';
import './integration/protocols.integration.test';
import './integration/ai-suggestion-events.integration.test';
import './integration/collaboration-concurrency.integration.test';
import './e2e/show-workflow.e2e.test';
import './perf/performance.nonregression.test';
import { run } from './harness';

await run();
