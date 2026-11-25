import { describe, expect, it } from 'vitest';
import { validatePublicIdentity } from '../validation/publicIdentity.schema.js';
describe('public donor identity', () => { it('requires a safe public alias before an update request', () => { expect(validatePublicIdentity({ publicAlias: 'A' }).publicAlias).toBeTruthy(); expect(validatePublicIdentity({ publicAlias: 'Campus Ally 24' })).toEqual({}); }); });
