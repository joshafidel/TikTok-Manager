import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/** Where a piece of content sits in the production pipeline. */
export const STATUSES = [
  "idea",
  "scripted",
  "recorded",
  "edited",
  "scheduled",
  "posted",
] as const;
export type Status = (typeof STATUSES)[number];

/** Full word-for-word scripts, or a beat sheet for improvised delivery. */
export type ScriptStyle = "full" | "beats";

export type Format = {
  key: string;
  name: string;
  description: string;
  structure: string;
};

export const channels = sqliteTable("channels", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  handle: text("handle"),
  accent: text("accent").notNull(),
  /** What this channel is for. Drives every generated idea. */
  mission: text("mission").notNull(),
  audience: text("audience").notNull(),
  voice: text("voice").notNull(),
  formats: text("formats", { mode: "json" }).$type<Format[]>().notNull(),
  neverDo: text("never_do", { mode: "json" }).$type<string[]>().notNull(),
  cta: text("cta"),
  scriptStyle: text("script_style").$type<ScriptStyle>().notNull(),
  cadencePerWeek: integer("cadence_per_week").notNull(),
  /** Warn when fewer than this many edited videos are banked. */
  targetDepth: integer("target_depth").notNull(),
  /** Days of the week reserved for filming. 0 = Sunday. */
  recordDays: text("record_days", { mode: "json" }).$type<number[]>().notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  /** Path under /public — the account icon shown on the picker screen. */
  logo: text("logo"),
});

export const items = sqliteTable("items", {
  id: text("id").primaryKey(),
  channelId: text("channel_id")
    .notNull()
    .references(() => channels.id),
  title: text("title").notNull(),
  formatKey: text("format_key"),
  status: text("status").$type<Status>().notNull().default("idea"),
  premise: text("premise"),
  hook: text("hook"),
  script: text("script"),
  shotNotes: text("shot_notes"),
  loopLine: text("loop_line"),
  estimatedSeconds: integer("estimated_seconds"),
  caption: text("caption"),
  hashtags: text("hashtags"),
  /** The two dates that make the calendar work: film day and post day. */
  recordOn: text("record_on"),
  postOn: text("post_on"),
  postTime: text("post_time"),
  assetUrl: text("asset_url"),
  postUrl: text("post_url"),
  clipId: text("clip_id"),
  notes: text("notes"),
  archived: integer("archived", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

/** Source material queue — the real bottleneck on a reaction channel. */
export const clips = sqliteTable("clips", {
  id: text("id").primaryKey(),
  channelId: text("channel_id")
    .notNull()
    .references(() => channels.id),
  sourceUrl: text("source_url").notNull(),
  premise: text("premise"),
  source: text("source"),
  status: text("status").$type<"queued" | "used" | "rejected">().notNull().default("queued"),
  usedByItemId: text("used_by_item_id"),
  addedAt: text("added_at").notNull(),
});

export const performance = sqliteTable("performance", {
  id: text("id").primaryKey(),
  itemId: text("item_id")
    .notNull()
    .references(() => items.id),
  views: integer("views"),
  likes: integer("likes"),
  comments: integer("comments"),
  shares: integer("shares"),
  saves: integer("saves"),
  follows: integer("follows"),
  recordedAt: text("recorded_at").notNull(),
});

/** Where an uploaded recording is in the auto-edit pipeline. */
export const VIDEO_STATUSES = [
  "uploaded",
  "transcribing",
  "planning",
  "rendering",
  "ready",
  "failed",
] as const;
export type VideoStatus = (typeof VIDEO_STATUSES)[number];

export type Word = { text: string; start: number; end: number; filler?: boolean };
export type Cut = { start: number; end: number; reason: "filler" | "silence" };
export type Caption = { text: string; start: number; end: number };

/** The plan the editor derived from the transcript, before rendering. */
export type EditPlan = {
  sourceDuration: number;
  keptDuration: number;
  cuts: Cut[];
  captions: Caption[];
};

export const videos = sqliteTable("videos", {
  id: text("id").primaryKey(),
  channelId: text("channel_id")
    .notNull()
    .references(() => channels.id),
  itemId: text("item_id"),
  filename: text("filename").notNull(),
  sourceUrl: text("source_url").notNull(),
  sizeBytes: integer("size_bytes"),
  status: text("status").$type<VideoStatus>().notNull().default("uploaded"),
  transcriptId: text("transcript_id"),
  transcriptText: text("transcript_text"),
  words: text("words", { mode: "json" }).$type<Word[]>(),
  plan: text("plan", { mode: "json" }).$type<EditPlan>(),
  renderId: text("render_id"),
  renderUrl: text("render_url"),
  error: text("error"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export type Channel = typeof channels.$inferSelect;
export type Item = typeof items.$inferSelect;
export type Clip = typeof clips.$inferSelect;
export type Performance = typeof performance.$inferSelect;
export type Video = typeof videos.$inferSelect;
