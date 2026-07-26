// Fitur: skema validasi materi
import { t } from "elysia";

export const htmlBlockSchema = t.Object({
  type: t.Literal("html"),
  content: t.String({ minLength: 1 }),
});

export const videoBlockSchema = t.Object({
  type: t.Literal("video"),
  url: t.String({ minLength: 1 }),
});

export const checkpointBlockSchema = t.Object({
  type: t.Literal("checkpoint"),
  question: t.String({ minLength: 1 }),
  options: t.Array(t.String({ minLength: 1 }), { minItems: 2 }),
  answer: t.Optional(t.Integer({ minimum: 0 })),
  answer_index: t.Optional(t.Integer({ minimum: 0 })),
});

export const fullhtmlBlockSchema = t.Object({
  type: t.Literal("fullhtml"),
  content: t.String({ minLength: 1 }),
  caption: t.Optional(t.String()),
});

export const blockSchema = t.Union([htmlBlockSchema, videoBlockSchema, checkpointBlockSchema, fullhtmlBlockSchema]);

export const createMaterialSchema = t.Object({
  classId: t.Optional(t.String()),
  class_id: t.Optional(t.String()),
  title: t.String({ minLength: 1 }),
  slug: t.Optional(t.String()),
  blocks: t.Array(blockSchema, { minItems: 1 }),
});

export const updateMaterialSchema = t.Partial(createMaterialSchema);

export type CreateMaterialBody = typeof createMaterialSchema.static;
export type UpdateMaterialBody = typeof updateMaterialSchema.static;
