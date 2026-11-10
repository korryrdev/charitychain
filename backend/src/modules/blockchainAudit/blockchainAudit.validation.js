'use strict';

import { z } from 'zod';

export const queueAnchorSchema = z.object({ evidenceId: z.uuid() }).strict();
export const anchorParamsSchema = z.object({ anchorId: z.uuid() }).strict();
