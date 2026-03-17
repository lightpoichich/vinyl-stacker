import { z } from 'zod';

export const ConditionSchema = z.enum(['M', 'NM', 'VG+', 'VG', 'G+', 'G', 'F', 'P']);
export type Condition = z.infer<typeof ConditionSchema>;
