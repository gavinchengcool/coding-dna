import { and, eq, isNotNull } from "drizzle-orm";
import { sha256 } from "@/lib/auth";
import { normalizeBuilderBioData, extractPortraitAvatarUrl } from "@/lib/builderbio";
import { db } from "@/lib/db";
import { profiles, users } from "@/lib/db/schema";

type AnyRecord = Record<string, unknown>;
type ToolBreakdown = {
  label: string;
  count: number;
  color: string;
};
type AgentRoleEntry = {
  name: string;
  role: string;
  summary: string;
  evidence: string;
  color: string;
};
type ComparisonEntry = {
  name: string;
  color: string;
  sessions: number;
  totalTurns: number;
  totalToolCalls: number;
  avgTurns: number;
  topTools: ToolBreakdown[];
  distribution: string;
};
type SignatureMove = {
  title: string;
  summary: string;
};
type HighMoment = {
  label: string;
  value: string;
  detail: string;
};
type ThreadEntry = {
  title: string;
  summary: string;
};
type SignatureThread = {
  name: string;
  summary: string;
  why: string;
  proof: string[];
};
type EraEntry = {
  title: string;
  period: string;
  summary: string;
  cue: string;
  bars: number[];
};
type ActivitySummary = {
  longestStreak: number;
  currentStreak: number;
  activeDays: number;
  totalDays: number;
  heatmap: AnyRecord;
};

type CopyLang = "zh" | "en";

function asObject(value: unknown): AnyRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as AnyRecord)
    : {};
}

function asArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function asOptionalNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function inLang<T>(lang: CopyLang, zh: T, en: T): T {
  return lang === "zh" ? zh : en;
}

function normalizeCopyLang(value: unknown): CopyLang | null {
  const raw = asString(value)?.toLowerCase();
  if (!raw) return null;
  if (raw.startsWith("zh")) return "zh";
  if (raw.startsWith("en")) return "en";
  return null;
}

function countChineseChars(value: string): number {
  const matches = value.match(/[\u3400-\u9fff]/g);
  return matches ? matches.length : 0;
}

function countLatinWords(value: string): number {
  const matches = value.match(/[A-Za-z]+/g);
  return matches ? matches.length : 0;
}

function detectContentLanguage(profile: AnyRecord, D: AnyRecord, E: AnyRecord): CopyLang {
  const explicit =
    normalizeCopyLang(profile.lang) ??
    normalizeCopyLang(profile.language) ??
    normalizeCopyLang(asObject(D.narrative)?.lang) ??
    normalizeCopyLang(asObject(E.insights)?.lang);
  if (explicit) return explicit;

  const candidates = [
    asString(profile.summary),
    asString(profile.builder_thesis),
    asString(asObject(D.highlights).favorite_prompt),
    ...asArray<AnyRecord>(D.projects)
      .slice(0, 3)
      .flatMap((project) => [asString(project.summary), asString(project.description), asString(project.name)]),
    asString(E.comparison_insight),
    asString(E.evolution_insight),
    asString(asObject(E.time).peak_detail),
  ].filter(Boolean) as string[];

  const combined = candidates.join("\n");
  const chineseChars = countChineseChars(combined);
  const latinWords = countLatinWords(combined);

  if (chineseChars >= 8 && chineseChars >= latinWords) return "zh";
  return "en";
}

function joinHuman(items: string[], lang: CopyLang): string {
  const clean = items.filter(Boolean);
  if (clean.length <= 1) return clean[0] || "";
  if (lang === "zh") return clean.join("、");
  if (clean.length === 2) return `${clean[0]} and ${clean[1]}`;
  return `${clean.slice(0, -1).join(", ")}, and ${clean[clean.length - 1]}`;
}

function uniq(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const clean = value.trim();
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(clean);
  }
  return result;
}

function looksLikeOverclaimedAgentCopy(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;
  const directMarkers =
    /主力全栈|运维安全|trae 前端|claude code 探索|承担了不同工作类型|different kinds of work|固定职责|rigid division|assign agents by role|different agents are assigned/.test(
      normalized
    );
  if (directMarkers) return true;

  const agentMentions = (
    normalized.match(/claude code|claude-code|codex|cursor|trae|antigravity|openclaw|windsurf/g) || []
  ).length;
  const specializationMarkers = (
    normalized.match(/前端|后端|运维|部署|探索|研究|主力|specialty|specialized|frontend|backend|ops|devops|research|role/g) || []
  ).length;

  return agentMentions >= 2 && specializationMarkers >= 2;
}

function pickSafeNarrativeHint(...candidates: Array<unknown>): string {
  for (const candidate of candidates) {
    const text = asString(candidate);
    if (text && !looksLikeOverclaimedAgentCopy(text)) {
      return text;
    }
  }
  return "";
}

function looksLikePeakHourText(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return /\b\d{1,2}:\d{2}\b/.test(normalized) || normalized.includes("peak hour");
}

const PERIOD_WINDOW_MAP: Record<string, string> = {
  deep_night: "00:00-06:00",
  morning: "06:00-12:00",
  afternoon: "12:00-18:00",
  evening: "18:00-24:00",
};

function getDominantPeriodKey(time: AnyRecord): string {
  const periods = asObject(time.period_data);
  const ranked = Object.entries(periods)
    .map(([key, raw]) => {
      const stats = asObject(raw);
      return {
        key,
        score: asNumber(stats.turns) * 2 + asNumber(stats.sessions),
      };
    })
    .sort((a, b) => b.score - a.score);
  return ranked[0]?.score ? ranked[0].key : "";
}

function getBuilderTypeWindow(time: AnyRecord): string {
  const builderType = asString(time.builder_type).toLowerCase();
  if (!builderType) return "";
  if (builderType.includes("深夜") || builderType.includes("late night")) return PERIOD_WINDOW_MAP.deep_night;
  if (builderType.includes("上午") || builderType.includes("morning")) return PERIOD_WINDOW_MAP.morning;
  if (builderType.includes("下午") || builderType.includes("afternoon")) return PERIOD_WINDOW_MAP.afternoon;
  if (builderType.includes("晚上") || builderType.includes("evening")) return PERIOD_WINDOW_MAP.evening;
  return "";
}

function peakHourToWindow(peakHour: number): string {
  if (peakHour < 6) return PERIOD_WINDOW_MAP.deep_night;
  if (peakHour < 12) return PERIOD_WINDOW_MAP.morning;
  if (peakHour < 18) return PERIOD_WINDOW_MAP.afternoon;
  return PERIOD_WINDOW_MAP.evening;
}

function windowContainsHour(windowLabel: string, peakHour: number): boolean {
  const match = windowLabel.match(/^(\d{2}):\d{2}-(\d{2}):\d{2}$/);
  if (!match) return false;
  const start = Number(match[1]);
  const end = Number(match[2]);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return false;
  return peakHour >= start && peakHour < end;
}

function hasPeakSignal(time: AnyRecord): boolean {
  return Boolean(
    asString(time.peak_window) ||
      asString(time.peak_text) ||
      asString(time.builder_type) ||
      Object.keys(asObject(time.period_data)).length ||
      Object.keys(asObject(time.hour_distribution)).length ||
      asNumber(time.peak_hour) > 0
  );
}

function isHeatmapDateKey(key: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(key);
}

function extractHeatmapMap(value: unknown): AnyRecord {
  const direct = asObject(value);
  const candidates = [
    direct,
    asObject(direct?.heatmap),
    asObject(direct?.map),
    asObject(direct?.days),
    asObject(direct?.daily),
    asObject(direct?.values),
  ];

  for (const candidate of candidates) {
    const entries = Object.entries(candidate).filter(([key, raw]) => {
      return isHeatmapDateKey(key) && asOptionalNumber(raw) !== null;
    });
    if (entries.length) {
      return Object.fromEntries(
        entries.map(([key, raw]) => [key, asOptionalNumber(raw) ?? 0])
      );
    }
  }

  return {};
}

function deriveStreaksFromHeatmap(heatmap: AnyRecord): {
  activeDays: number;
  longestStreak: number;
  currentStreak: number;
} {
  const activeDates = Object.entries(heatmap)
    .filter(([key, value]) => isHeatmapDateKey(key) && asNumber(value) > 0)
    .map(([key]) => key)
    .sort();

  if (!activeDates.length) {
    return {
      activeDays: 0,
      longestStreak: 0,
      currentStreak: 0,
    };
  }

  let longestStreak = 1;
  let runningStreak = 1;

  for (let index = 1; index < activeDates.length; index += 1) {
    const previous = new Date(`${activeDates[index - 1]}T00:00:00Z`);
    const current = new Date(`${activeDates[index]}T00:00:00Z`);
    const diffDays = Math.round(
      (current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 1) {
      runningStreak += 1;
    } else {
      runningStreak = 1;
    }

    longestStreak = Math.max(longestStreak, runningStreak);
  }

  let currentStreak = 0;
  for (let index = activeDates.length - 1; index >= 0; index -= 1) {
    if (index === activeDates.length - 1) {
      currentStreak = 1;
      continue;
    }

    const previous = new Date(`${activeDates[index]}T00:00:00Z`);
    const next = new Date(`${activeDates[index + 1]}T00:00:00Z`);
    const diffDays = Math.round(
      (next.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 1) {
      currentStreak += 1;
    } else {
      break;
    }
  }

  return {
    activeDays: activeDates.length,
    longestStreak,
    currentStreak,
  };
}

function hasMeaningfulBusiestDay(day: AnyRecord): boolean {
  return Boolean(
    asString(day.date) &&
      ((asOptionalNumber(day.sessions) ?? 0) > 0 ||
        (asOptionalNumber(day.turns) ?? 0) > 0)
  );
}

function derivePeakWindowLabel(lang: CopyLang, time: AnyRecord): string {
  const explicit = asString(time.peak_window);
  if (explicit) return explicit;

  const dominantPeriod = getDominantPeriodKey(time);
  if (dominantPeriod && PERIOD_WINDOW_MAP[dominantPeriod]) {
    return PERIOD_WINDOW_MAP[dominantPeriod];
  }

  const builderTypeWindow = getBuilderTypeWindow(time);
  if (builderTypeWindow) return builderTypeWindow;

  const peakHour = asNumber(time.peak_hour);
  if (peakHour !== null && peakHour >= 0) {
    return peakHourToWindow(peakHour);
  }

  const peakText = asString(time.peak_text);
  if (peakText && !looksLikePeakHourText(peakText)) return peakText;
  return inLang(lang, "高峰时段", "Peak window");
}

function derivePeakDetail(lang: CopyLang, time: AnyRecord): string {
  const peakHour = asNumber(time.peak_hour);
  const builderType = asString(time.builder_type);
  const peakWindow = derivePeakWindowLabel(lang, time);
  const reliablePoint = peakHour >= 0 && windowContainsHour(peakWindow, peakHour);

  if (reliablePoint) {
    return builderType
      ? inLang(
          lang,
          `整体最稳定的窗口落在 ${peakWindow}，最密集的单点大约在 ${peakHour}:00，整体节奏更接近 ${builderType}。`,
          `The steadiest window lands in ${peakWindow}, with the single densest point around ${peakHour}:00. Overall the rhythm reads closer to ${builderType}.`
        )
      : inLang(
          lang,
          `整体最稳定的窗口落在 ${peakWindow}，最密集的单点大约在 ${peakHour}:00。`,
          `The steadiest window lands in ${peakWindow}, with the single densest point around ${peakHour}:00.`
        );
  }

  if (builderType) {
    return inLang(
      lang,
      `整体最稳定的窗口落在 ${peakWindow}，从整段周期看更接近 ${builderType}。`,
      `The steadiest window lands in ${peakWindow}, and the overall rhythm reads closer to ${builderType}.`
    );
  }

  if (peakWindow && peakWindow !== inLang(lang, "高峰时段", "Peak window")) {
    return inLang(
      lang,
      `整体最稳定的工作窗口落在 ${peakWindow}。`,
      `The steadiest stretch of work lands in ${peakWindow}.`
    );
  }

  return (
    asString(time.peak_detail) ||
    inLang(lang, "一天里最稳定的高能时段会反复出现在这里。", "The most reliable high-energy stretch of the day keeps appearing here.")
  );
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatCompact(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: value >= 1_000_000 ? 1 : 0,
  }).format(value);
}

function parseDisplayNumber(value: string): number {
  const raw = value.trim().toUpperCase();
  if (!raw) return 0;
  const match = raw.match(/^([0-9]+(?:\.[0-9]+)?)([KMB])?$/);
  if (!match) return Number(raw.replace(/,/g, "")) || 0;

  const base = Number(match[1]);
  const suffix = match[2];
  if (!suffix) return base;
  const multiplierMap: Record<"K" | "M" | "B", number> = {
    K: 1_000,
    M: 1_000_000,
    B: 1_000_000_000,
  };
  return Math.round(base * multiplierMap[suffix as "K" | "M" | "B"]);
}

function humanizeTag(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/[A-Z]/.test(trimmed) || trimmed.includes(" ")) return trimmed;

  const map: Record<string, string> = {
    ai: "AI",
    cli: "CLI",
    ui: "UI",
    ux: "UX",
    saas: "SaaS",
    mcp: "MCP",
    nextjs: "Next.js",
    typescript: "TypeScript",
    javascript: "JavaScript",
    html: "HTML",
    css: "CSS",
    sql: "SQL",
    devops: "DevOps",
    openclaw: "OpenClaw",
    claude: "Claude",
    codex: "Codex",
    trae: "Trae",
  };

  return trimmed
    .split(/[-_/]+/)
    .map((token) => {
      const key = token.toLowerCase();
      return map[key] ?? `${key.charAt(0).toUpperCase()}${key.slice(1)}`;
    })
    .join(" ");
}

function agentColor(agent: string): string {
  const colors: Record<string, string> = {
    "claude-code": "#FF6B35",
    codex: "#34D399",
    trae: "#60A5FA",
    "trae-cn": "#60A5FA",
    cursor: "#FBBF24",
    openclaw: "#A78BFA",
    windsurf: "#2DD4BF",
    "bustly-agent": "#FB923C",
  };
  return colors[agent] ?? "#A78BFA";
}

function agentLabel(agent: string, stats?: AnyRecord): string {
  return (
    asString(stats?.display_name) ||
    {
      "claude-code": "Claude Code",
      codex: "Codex",
      trae: "Trae",
      "trae-cn": "Trae",
      cursor: "Cursor",
      openclaw: "OpenClaw",
      windsurf: "Windsurf",
      "bustly-agent": "Bustly Agent",
    }[agent] ||
    humanizeTag(agent)
  );
}

const TOKEN_BLIND_AGENTS = new Set([
  "trae",
  "trae-cn",
  "cursor",
  "antigravity",
  "kiro",
  "windsurf",
  "cline",
  "roo-code",
  "augment",
  "continue",
  "goose",
]);

function formatDateRange(range: AnyRecord): string {
  const start = asString(range?.start);
  const end = asString(range?.end);
  if (start && end) return `${start} → ${end}`;
  return start || end || "";
}

function projectScore(project: AnyRecord): number {
  return (
    asNumber(project.total_turns) * 1.5 +
    asNumber(project.total_tool_calls) +
    asNumber(project.total_sessions) * 45
  );
}

function normalizeProjectStatus(
  lang: CopyLang,
  status: string,
  signatureName: string,
  projectName: string
): string {
  if (projectName === signatureName) return inLang(lang, "代表作", "Signature build");
  const normalized = status.toLowerCase();
  if (normalized.includes("progress")) return inLang(lang, "进行中", "In progress");
  if (normalized.includes("ship") || normalized.includes("done") || normalized.includes("complete")) {
    return inLang(lang, "已完成", "Completed");
  }
  if (normalized.includes("explore")) return inLang(lang, "已探索", "Explored");
  return status || inLang(lang, "进行中", "In progress");
}

async function computeVerificationHash(D: AnyRecord): Promise<string> {
  const profile = asObject(D.profile);
  const projects = asArray(D.projects);
  const key = [
    asNumber(profile.total_sessions),
    asNumber(profile.total_turns),
    asNumber(profile.total_tokens),
    asNumber(profile.active_days),
    projects.length,
  ].join("|");
  return sha256(key);
}

function deriveTasteSignals(profile: AnyRecord, D: AnyRecord, E: AnyRecord): string[] {
  const style = asObject(D.style);
  const time = asObject(E.time);
  const techEntries = Object.entries(asObject(E.tech)).sort((a, b) => asNumber(b[1]) - asNumber(a[1]));
  const signals = [
    asString(style.style_label),
    asString(time.builder_type) || asString(time.peak_window),
    ...techEntries.slice(0, 2).map(([label]) => humanizeTag(label)),
  ];

  const commandRatio = Math.round(asNumber(style.command_ratio) * 100);
  if (commandRatio >= 45) signals.push("CLI 优先");
  else if (commandRatio >= 25) signals.push("终端驱动");

  const agents = Object.keys(asObject(profile.agents_used));
  if (agents.length > 1) signals.push("多 Agent 协作");
  if (asArray(D.projects).length >= 4) signals.push("多项目推进");

  return uniq(signals).slice(0, 6);
}

function deriveProfileTitle(
  lang: CopyLang,
  techLabels: string[],
  agentCount: number,
  mode = "builder"
): string {
  if (mode === "conversation-first") {
    return inLang(
      lang,
      "AI 思考搭子型用户 · Conversation-first",
      "Conversation-first user · Thinks with AI"
    );
  }
  if (mode === "hybrid") {
    return inLang(
      lang,
      "混合型 AI 协作者 · Build + Think",
      "Hybrid AI collaborator · Build + Think"
    );
  }
  const lower = techLabels.map((item) => item.toLowerCase());

  if (lower.some((item) => /(product|strategy|saas)/.test(item))) {
    return inLang(lang, "产品驱动型创作者 · AI Native Builder", "Product-led creator · AI-Native Builder");
  }
  if (lower.some((item) => /(research|analysis|content|translation)/.test(item))) {
    return inLang(lang, "研究型创作者 · AI Native Builder", "Research-driven creator · AI-Native Builder");
  }
  if (lower.some((item) => /(react|next|typescript|javascript|frontend|web)/.test(item))) {
    return inLang(lang, "全栈构建者 · AI Native Builder", "Full-stack builder · AI-Native Builder");
  }
  if (agentCount >= 3) {
    return inLang(lang, "多 Agent Builder · AI Native Builder", "Multi-agent builder · AI-Native Builder");
  }
  return "AI-Native Builder";
}

function deriveBuilderThesis(
  lang: CopyLang,
  name: string,
  profile: AnyRecord,
  D: AnyRecord,
  E: AnyRecord
): string {
  const explicit = asString(profile.summary);
  if (explicit) return explicit;

  const projects = asArray<AnyRecord>(D.projects);
  const signature = projects.slice().sort((a, b) => projectScore(b) - projectScore(a))[0];
  const topTech = Object.entries(asObject(E.tech))
    .sort((a, b) => asNumber(b[1]) - asNumber(a[1]))
    .slice(0, 2)
    .map(([label]) => humanizeTag(label));

  if (signature && topTech.length) {
    return inLang(
      lang,
      `${name} 会把 ${joinHuman(topTech, "zh")} 持续做成能落地的东西，而 ${signature.name} 是最明显的代表。`,
      `${name} keeps turning ${joinHuman(topTech, "en")} into things that ship, and ${signature.name} is the clearest proof.`
    );
  }
  if (signature) {
    return inLang(
      lang,
      `${name} 会反复回到 ${signature.name} 这类项目上，把想法真正磨成成品。`,
      `${name} keeps coming back to projects like ${signature.name} until the idea turns into something real.`
    );
  }
  return inLang(
    lang,
    `${name} 的日志里，明显能看到一种更偏向持续构建、而不是浅尝辄止的 AI 协作方式。`,
    `${name}'s logs show a pattern of sustained building with AI rather than occasional experimentation.`
  );
}

function deriveManagementStyle(lang: CopyLang, D: AnyRecord, E: AnyRecord, profile: AnyRecord) {
  const style = asObject(D.style);
  const prompt = asString(style.prompt_type_label || style.prompt_type);
  const rhythm = asString(style.rhythm_label || style.session_rhythm);
  const label = [prompt, rhythm].filter(Boolean).join(" × ") || asString(style.style_label) || "Builder operating model";
  const summary =
    pickSafeNarrativeHint(style.style_sub, E.comparison_insight, E.evolution_insight) ||
    deriveBuilderThesis(
      lang,
      asString(profile.display_name || profile.username || inLang(lang, "这位 Builder", "this builder")),
      profile,
      D,
      E
    );
  const commandRatio = Math.round(asNumber(style.command_ratio) * 100);
  const traits = [
    asString(style.prompt_type_desc),
    commandRatio >= 25
      ? inLang(lang, `${commandRatio}% 的工具调用通过命令行完成。`, `${commandRatio}% of tool calls are completed through command-line flows.`)
      : "",
    Object.keys(asObject(profile.agents_used)).length > 1
      ? inLang(lang, "多个 agent 会在同一条工作流里轮换出现，切换更多是为了继续推进，而不是固定死分工。", "Multiple agents keep rotating through the same workflow; the switching looks more like keeping momentum than locking each one into a fixed specialty.")
      : "",
    asString(asObject(E.time).peak_detail),
  ].filter(Boolean);

  return {
    label: "AI management style",
    name: label,
    summary,
    traits: uniq(traits).slice(0, 3),
  };
}

function deriveHowIbuild(lang: CopyLang, D: AnyRecord, E: AnyRecord, profile: AnyRecord) {
  const style = asObject(D.style);
  const dist = asObject(style.session_length_distribution);
  const short = asNumber(dist.short);
  const medium = asNumber(dist.medium);
  const long = asNumber(dist.long);
  const commandRatio = Math.round(asNumber(style.command_ratio) * 100);
  const toolTotals = Object.entries(asObject(style.tool_totals))
    .map(([label, count]) => ({ label, count: asNumber(count), color: agentColor(label.toLowerCase()) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 7);

  return {
    archetype: asString(style.style_label) || "稳定推进型",
    summary:
      pickSafeNarrativeHint(style.style_sub, E.comparison_insight) ||
      inLang(lang, "会在高频推进和长上下文推进之间切换，多个 agent 经常被放进同一条工作流里。", "They move between fast iteration and longer-context sessions, and several agents keep showing up inside the same overall workflow."),
    promptStyle: asString(style.prompt_type_label || style.prompt_type) || inLang(lang, "直接指令", "Direct instruction"),
    promptDetail: asString(style.prompt_type_desc) || inLang(lang, "更偏向直接给出任务和约束，而不是写很长的需求文档。", "They prefer giving direct tasks and constraints instead of writing long requirement docs."),
    sessionRhythm: asString(style.rhythm_label || style.session_rhythm) || inLang(lang, "持续推进", "Steady iteration"),
    sessionDetail: inLang(lang, `${short} 个短会话 · ${medium} 个中会话 · ${long} 个长会话`, `${short} short · ${medium} medium · ${long} long sessions`),
    toolPreference: asString(style.tool_pref_label || style.tool_preference) || inLang(lang, "命令行优先", "Command-line first"),
    toolDetail: inLang(lang, `${commandRatio}% 的工具调用是命令行或 shell 驱动`, `${commandRatio}% of tool calls are command-line or shell driven`),
    agentLoyalty:
      Object.keys(asObject(profile.agents_used)).length > 1
        ? inLang(lang, "多 Agent 协作", "Multi-agent collaboration")
        : inLang(lang, "单 Agent 深挖", "Single-agent depth"),
    agentDetail:
      pickSafeNarrativeHint(style.loyalty_desc, E.comparison_insight) ||
      inLang(lang, "不同 agent 的会话形态和密度有差异，但不代表它们只负责完全不同的任务。", "The agents show different session shapes and densities, but that does not automatically mean each one owns a completely separate job."),
    toolTotals,
  };
}

function deriveAgentRoles(lang: CopyLang, E: AnyRecord): AgentRoleEntry[] {
  const comparison = asObject(E.comparison);
  return Object.entries(comparison)
    .sort((a, b) => asNumber(asObject(b[1]).total_turns) - asNumber(asObject(a[1]).total_turns))
    .slice(0, 4)
    .map(([agent, raw]) => {
      const stats = asObject(raw);
      const avg = asNumber(stats.avg_turns);
      const sessions = asNumber(stats.sessions);
      const turns = asNumber(stats.total_turns);
      const tools = asNumber(stats.total_tool_calls);
      let role = inLang(lang, "持续推进", "Steady cadence");
      let summary = inLang(lang, "会反复被拉回来继续同一条工作流，更多体现的是使用节奏，而不是固定职责。", "Keeps getting pulled back into the same workflow. This says more about usage cadence than a fixed job title.");

      if (avg >= 100) {
        role = inLang(lang, "长上下文", "Long-context");
        summary = inLang(lang, "平均单次会话更长，说明它经常被用在需要连续上下文的推进里。", "The average session runs longer, which suggests it is often used when the work needs sustained context.");
      } else if (sessions >= 40 && tools >= turns) {
        role = inLang(lang, "工具密集", "Tool-heavy");
        summary = inLang(lang, "工具调用密度更高，说明它经常出现在需要快速执行和验证的回路里。", "Tool density is higher here, which suggests it often shows up in faster execution-and-verification loops.");
      } else if (sessions >= 40) {
        role = inLang(lang, "高频回访", "Frequent return");
        summary = inLang(lang, "被频繁重新叫回来继续推进，说明它在整个周期里出现得很稳定。", "It keeps getting called back in, which shows up as a very stable presence across the period.");
      } else if (tools >= turns) {
        role = inLang(lang, "执行偏重", "Execution-weighted");
        summary = inLang(lang, "更多落在命令、编辑和直接执行上，而不是长时间来回讨论。", "It leans more toward commands, edits, and direct execution than long back-and-forth discussion.");
      }

      const topTool = asArray(stats.top_tools)[0];
      const topToolName = Array.isArray(topTool) ? asString(topTool[0]) : "";

      return {
        name: agentLabel(agent, stats),
        role,
        summary,
        evidence: inLang(
          lang,
          `${formatNumber(sessions)} 个 sessions · ${formatNumber(turns)} turns · ${formatNumber(tools)} 次工具调用${topToolName ? ` · 常用 ${topToolName}` : ""}`,
          `${formatNumber(sessions)} sessions · ${formatNumber(turns)} turns · ${formatNumber(tools)} tool calls${topToolName ? ` · frequent ${topToolName}` : ""}`
        ),
        color: agentColor(agent),
      };
    });
}

function deriveComparison(lang: CopyLang, E: AnyRecord): ComparisonEntry[] {
  const comparison = asObject(E.comparison);
  return Object.entries(comparison)
    .sort((a, b) => asNumber(asObject(b[1]).total_turns) - asNumber(asObject(a[1]).total_turns))
    .slice(0, 4)
    .map(([agent, raw]) => {
      const stats = asObject(raw);
      const topTools = asArray(stats.top_tools)
        .slice(0, 4)
        .map((tool) => {
          const [label, count] = Array.isArray(tool) ? tool : [asString(asObject(tool).name), asNumber(asObject(tool).count)];
          return {
            label: asString(label),
            count: asNumber(count),
            color: agentColor(asString(label).toLowerCase()),
          };
        });
      const distribution = asObject(stats.distribution);
      return {
        name: agentLabel(agent, stats),
        color: agentColor(agent),
        sessions: asNumber(stats.sessions),
        totalTurns: asNumber(stats.total_turns),
        totalToolCalls: asNumber(stats.total_tool_calls),
        avgTurns: asNumber(stats.avg_turns),
        topTools,
        distribution: inLang(
          lang,
          `${asNumber(distribution.short)} 短 · ${asNumber(distribution.medium)} 中 · ${asNumber(distribution.long)} 长`,
          `${asNumber(distribution.short)} S · ${asNumber(distribution.medium)} M · ${asNumber(distribution.long)} L`
        ),
      };
    });
}

function deriveSignatureMoves(lang: CopyLang, D: AnyRecord, E: AnyRecord, profile: AnyRecord): SignatureMove[] {
  const style = asObject(D.style);
  const commandRatio = Math.round(asNumber(style.command_ratio) * 100);
  const projects = asArray<AnyRecord>(D.projects);
  const signature = projects.slice().sort((a, b) => projectScore(b) - projectScore(a))[0];
  const time = asObject(E.time);
  const peakWindow = derivePeakWindowLabel(lang, time);
  const topTech = Object.entries(asObject(E.tech))
    .sort((a, b) => asNumber(b[1]) - asNumber(a[1]))
    .slice(0, 3)
    .map(([label]) => humanizeTag(label));
  const moves = [
    commandRatio >= 25
      ? {
          title: inLang(lang, "把循环留在终端里", "Keep the loop in the terminal"),
          summary: inLang(
            lang,
            `${commandRatio}% 的工具调用来自 Bash、shell command 或 stdin 驱动，推进方式很明显偏向终端。`,
            `${commandRatio}% of tool calls come from Bash, shell commands, or stdin-driven flows, so the work clearly stays terminal-first.`
          ),
        }
      : null,
    Object.keys(asObject(profile.agents_used)).length > 1
      ? {
          title: inLang(lang, "在多个 Agent 之间轮换推进", "Rotate across agents to keep momentum"),
          summary: inLang(
            lang,
            "多个 agent 会在同一条工作流里交替出现，切换更多是为了继续推进，而不是固定死某个工具只做一种事。",
            "Several agents keep appearing inside the same workflow. The switching looks more like preserving momentum than pinning each tool to one narrow job."
          ),
        }
      : null,
    signature
      ? {
          title: inLang(lang, "会回到一条主线项目上", "Keep returning to one main line"),
          summary: inLang(
            lang,
            `${signature.name} 一直在把 turns、工具调用和注意力重新聚拢到一起。`,
            `${signature.name} keeps pulling turns, tool calls, and attention back into one central line of work.`
          ),
        }
      : null,
    topTech.some((label) => /(Product|Research|Strategy|Content|AI)/i.test(label))
      ? {
          title: inLang(lang, "把思考直接做成产物", "Turn thinking directly into output"),
          summary: inLang(
            lang,
            `${joinHuman(topTech, "zh")} 会一起出现在同一段 build history 里，而不是分散在不同工具中。`,
            `${joinHuman(topTech, "en")} show up in the same build history instead of being scattered across disconnected tools.`
          ),
        }
      : null,
    hasPeakSignal(time)
      ? {
          title: inLang(lang, "有很明显的工作节奏", "Show a clear working rhythm"),
          summary: inLang(
            lang,
            `${peakWindow} 这一段不是偶然出现，而是整个周期里反复回来的高能窗口。`,
            `${peakWindow} is not a one-off spike; it keeps returning as the recurring high-energy window.`
          ),
        }
      : null,
  ].filter((move): move is SignatureMove => Boolean(move));

  return moves.slice(0, 4);
}

function deriveHighMoments(lang: CopyLang, D: AnyRecord, E: AnyRecord): HighMoment[] {
  const highlights = asObject(D.highlights);
  const evolution = asArray<AnyRecord>(E.evolution);
  const time = asObject(E.time);
  const peakWindow = derivePeakWindowLabel(lang, time);
  const peakDetail = derivePeakDetail(lang, time);
  const peakWeek = evolution
    .slice()
    .sort((a, b) => asNumber(b.turns) - asNumber(a.turns))[0];
  const biggestSession = asObject(highlights.biggest_session);
  const busiestDay = asObject(highlights.busiest_day);
  const hasPeakWeek = Boolean(peakWeek && asNumber(peakWeek.turns) > 0);
  const hasBusiestDay = hasMeaningfulBusiestDay(busiestDay);
  const hasBiggestSession = asNumber(biggestSession.turns) > 0;

  return [
    hasPeakWeek
      ? {
          label: inLang(lang, "峰值周", "Peak week"),
          value: `${formatCompact(asNumber(peakWeek.turns))} turns`,
          detail: inLang(
            lang,
            `${asString(peakWeek.week)} 这一周的 turns 最高，说明当时明显进入了强输出阶段。`,
            `${asString(peakWeek.week)} had the highest turn volume of the cycle, which points to a clear output surge.`
          ),
        }
      : null,
    hasBusiestDay
      ? {
          label: inLang(lang, "最忙的一天", "Busiest day"),
          value: asString(busiestDay.date),
          detail: inLang(
            lang,
            `${asNumber(busiestDay.sessions)} 个 sessions · ${formatNumber(asNumber(busiestDay.turns))} turns`,
            `${asNumber(busiestDay.sessions)} sessions · ${formatNumber(asNumber(busiestDay.turns))} turns`
          ),
        }
      : null,
    hasPeakSignal(time)
      ? {
          label: inLang(lang, "高峰时段", "Peak window"),
          value: peakWindow,
          detail: peakDetail,
        }
      : hasBiggestSession
        ? {
            label: inLang(lang, "最大会话", "Biggest session"),
            value: `${formatNumber(asNumber(biggestSession.turns))} turns`,
            detail:
              asString(biggestSession.display) ||
              inLang(lang, "这是整个周期里最深的一次单线程推进。", "This was the deepest single-thread push in the whole cycle."),
          }
        : null,
  ].filter((moment): moment is HighMoment => Boolean(moment));
}

function deriveSignatureThread(
  lang: CopyLang,
  profile: AnyRecord,
  D: AnyRecord,
  E: AnyRecord
): SignatureThread {
  const favoritePrompt = asString(asObject(D.highlights).favorite_prompt);
  const time = asObject(E.time);
  const totalTurns = asNumber(profile.total_turns);
  const activeDays = asNumber(profile.active_days);
  const peakWindow = derivePeakWindowLabel(lang, time);
  const lowerPrompt = favoritePrompt.toLowerCase();

  let name = inLang(lang, "反复回来的问题线程", "Recurring question thread");
  if (
    /(为什么|怎么想|怎么办|should|decide|decision|方向|问题)/.test(lowerPrompt)
  ) {
    name = inLang(lang, "Decision unwind loop", "Decision unwind loop");
  } else if (
    /(learn|explain|study|理解|学习|解释|分析)/.test(lowerPrompt)
  ) {
    name = inLang(lang, "Learning-by-dialogue thread", "Learning-by-dialogue thread");
  } else if (
    /(feel|emotion|anxiety|情绪|焦虑|关系|陪伴)/.test(lowerPrompt)
  ) {
    name = inLang(lang, "Reflection and reset thread", "Reflection and reset thread");
  }

  return {
    name,
    summary:
      favoritePrompt ||
      inLang(
        lang,
        "这条 thread 最像这类用户会一再回来的对话主线：不是为了交付代码，而是为了把问题讲清楚。",
        "This thread best captures the kind of conversation the user keeps returning to: not for code delivery, but to make the question clearer."
      ),
    why: inLang(
      lang,
      "它说明 AI 在这里不只是工具，而是一个会被反复叫回来、继续往下想的对话对象。",
      "It shows that AI is not only a tool here, but a conversational counterpart the user keeps returning to in order to keep thinking."
    ),
    proof: [
      inLang(lang, `${formatCompact(totalTurns)} turns`, `${formatCompact(totalTurns)} turns`),
      activeDays > 0
        ? inLang(lang, `${formatNumber(activeDays)} 个活跃日`, `${formatNumber(activeDays)} active days`)
        : "",
      peakWindow
        ? inLang(lang, `高峰时段在 ${peakWindow}`, `Peak window around ${peakWindow}`)
        : "",
    ].filter(Boolean),
  };
}

function deriveRecurringThreads(
  lang: CopyLang,
  profile: AnyRecord,
  D: AnyRecord,
  E: AnyRecord
): ThreadEntry[] {
  const favoritePrompt = asString(asObject(D.highlights).favorite_prompt).toLowerCase();
  const summaryText = [
    asString(profile.summary),
    asString(profile.builder_thesis),
    asString(asObject(E.time).peak_detail),
  ]
    .join(" ")
    .toLowerCase();
  const combined = `${favoritePrompt} ${summaryText}`;
  const entries: ThreadEntry[] = [];

  if (/(decide|decision|tradeoff|方向|选择|取舍|问题)/.test(combined)) {
    entries.push({
      title: "Decision untangling",
      summary: inLang(
        lang,
        "面对模糊决定时，会反复回来把问题重新拆开，而不是只问一次就离开。",
        "When a decision stays fuzzy, the user keeps coming back to unpack it instead of asking once and leaving."
      ),
    });
  }
  if (/(learn|explain|study|理解|学习|解释|分析|research)/.test(combined)) {
    entries.push({
      title: "Learning by dialogue",
      summary: inLang(
        lang,
        "学习不是一次性查答案，而是通过追问、换角度和复述把理解慢慢压实。",
        "Learning happens through follow-up questions, reframing, and rephrasing rather than one-off answer lookup."
      ),
    });
  }
  if (/(night|late|晚上|深夜|凌晨|焦虑|reflect|emotion|情绪)/.test(combined)) {
    entries.push({
      title: "Late-night reframing",
      summary: inLang(
        lang,
        "很多关键对话发生在晚间，更像是在给白天没想清楚的事情重新命名。",
        "Many of the key conversations happen late in the day, more like renaming things that did not get clarified earlier."
      ),
    });
  }

  if (entries.length < 3) {
    const keywords = asArray(E.keywords)
      .slice(0, 6)
      .map((item) => (Array.isArray(item) ? asString(item[0]) : asString(asObject(item).word)))
      .filter(Boolean);
    for (const keyword of keywords) {
      entries.push({
        title: humanizeTag(keyword),
        summary: inLang(
          lang,
          `${humanizeTag(keyword)} 会反复出现，说明它不是一次性的提问，而是一条长期会回来的对话主题。`,
          `${humanizeTag(keyword)} keeps showing up, which means it is a recurring thread rather than a one-off question.`
        ),
      });
      if (entries.length >= 3) break;
    }
  }

  return entries.slice(0, 3);
}

function deriveConversationRoles(
  lang: CopyLang,
  comparison: ComparisonEntry[]
): AgentRoleEntry[] {
  return comparison.slice(0, 4).map((entry) => {
    let role = inLang(lang, "Thinking partner", "Thinking partner");
    let summary = inLang(
      lang,
      "更多承担对话、澄清和来回推敲，而不是单纯执行代码任务。",
      "Shows up more as a dialogue and clarification partner than as a pure code execution lane."
    );

    if (entry.totalToolCalls >= entry.totalTurns * 0.5) {
      role = inLang(lang, "Research helper", "Research helper");
      summary = inLang(
        lang,
        "更适合查找、整理和快速补充事实，再把结果带回主线程里。",
        "More useful for looking things up, organizing material, and feeding it back into the main thread."
      );
    } else if (entry.avgTurns >= 60) {
      role = inLang(lang, "Reflection partner", "Reflection partner");
      summary = inLang(
        lang,
        "会陪着一个问题待得更久，帮助用户把含混的感觉重新说清楚。",
        "Stays with a question longer and helps the user turn fuzzy feelings into clearer language."
      );
    }

    return {
      ...entry,
      role,
      summary,
      evidence: inLang(
        lang,
        `${formatNumber(entry.sessions)} 个 sessions · ${formatNumber(entry.totalTurns)} turns · ${formatNumber(entry.totalToolCalls)} 次工具调用`,
        `${formatNumber(entry.sessions)} sessions · ${formatNumber(entry.totalTurns)} turns · ${formatNumber(entry.totalToolCalls)} tool calls`
      ),
    };
  });
}

function deriveEras(lang: CopyLang, E: AnyRecord): EraEntry[] {
  const evolution = asArray<AnyRecord>(E.evolution);
  if (!evolution.length) {
    return [
      {
        title: "Active period",
        period: inLang(lang, "扫描周期内", "During the scanned period"),
        summary: inLang(
          lang,
          "这段时间里持续有新的 build 轨迹，只是还不足以切出更细的阶段变化。",
          "The work stayed active throughout the scan window, but there is not enough signal yet to split it into clearer phases."
        ),
        cue: inLang(lang, "持续推进", "Steady progress"),
        bars: [45, 70, 55],
      },
    ];
  }

  const groups: AnyRecord[][] = [];
  const size = Math.max(1, Math.ceil(evolution.length / 3));
  for (let i = 0; i < evolution.length; i += size) {
    groups.push(evolution.slice(i, i + size));
  }

  const labels =
    lang === "zh"
      ? ["早期探索", "开始变深", "进入输出期"]
      : ["Exploration", "Deepening", "Output phase"];
  const maxSessions = Math.max(...groups.map((group) => group.reduce((sum, item) => sum + asNumber(item.sessions), 0)), 1);
  const maxTurns = Math.max(...groups.map((group) => group.reduce((sum, item) => sum + asNumber(item.turns), 0)), 1);
  const maxAvg = Math.max(
    ...groups.map((group) => {
      const turns = group.reduce((sum, item) => sum + asNumber(item.turns), 0);
      const sessions = group.reduce((sum, item) => sum + asNumber(item.sessions), 0);
      return sessions > 0 ? turns / sessions : 0;
    }),
    1
  );

  return groups.map((group, index) => {
    const turns = group.reduce((sum, item) => sum + asNumber(item.turns), 0);
    const sessions = group.reduce((sum, item) => sum + asNumber(item.sessions), 0);
    const avg = sessions > 0 ? turns / sessions : 0;
    const first = asString(group[0]?.week);
    const last = asString(group[group.length - 1]?.week);

    const summaries =
      lang === "zh"
        ? [
            `${formatNumber(sessions)} 个 sessions 把问题铺得更开，重心还在摸索方向和试探路径。`,
            `平均每个 session 大约 ${Math.round(avg)} turns，说明工作开始从试探转向更深的推进。`,
            `${formatNumber(turns)} turns 集中在后段，说明输出和交付已经开始形成连续性。`,
          ]
        : [
            `${formatNumber(sessions)} sessions spread the work wider, with the focus still on probing directions and testing paths.`,
            `At roughly ${Math.round(avg)} turns per session, the work starts shifting from trial runs into deeper execution.`,
            `${formatNumber(turns)} turns land in the later phase, which means output and delivery have started compounding.`,
          ];
    const cues =
      lang === "zh"
        ? ["广度更大 · 先摸方向", "开始收束 · 深度上来", "持续输出 · 结果更集中"]
        : ["Broader search · finding direction", "Narrowing down · depth rises", "Sustained output · results concentrate"];

    return {
      title: labels[index] || `阶段 ${index + 1}`,
      period: first && last ? `${first} → ${last}` : first || last || "扫描周期内",
      summary: summaries[index] || summaries[summaries.length - 1],
      cue: cues[index] || cues[cues.length - 1],
      bars: [
        Math.round((sessions / maxSessions) * 100),
        Math.round((turns / maxTurns) * 100),
        Math.round((avg / maxAvg) * 100),
      ],
    };
  });
}

function deriveEvidence(
  lang: CopyLang,
  D: AnyRecord,
  E: AnyRecord,
  profile: AnyRecord,
  comparison: ComparisonEntry[],
  isUnfiltered: boolean,
) {
  const techEntries = Object.entries(asObject(E.tech))
    .sort((a, b) => asNumber(b[1]) - asNumber(a[1]))
    .slice(0, 6)
    .map(([label, value]) => ({ label: humanizeTag(label), value: Math.round(asNumber(value)) }));
  const toolTotals = Object.entries(asObject(asObject(D.style).tool_totals))
    .sort((a, b) => asNumber(b[1]) - asNumber(a[1]));
  const topTool = toolTotals[0];
  const topTech = techEntries.slice(0, 3).map((item) => item.label).join(" · ");
  const topAgents = comparison.slice(0, 2);
  const time = asObject(E.time);

  return {
    coverage: {
      status: isUnfiltered ? "Unfiltered log receipts" : "Published BuilderBio data",
      summary: isUnfiltered
        ? inLang(lang, "核心统计和高光都能回到原始 session 日志。", "Core metrics and standout moments can be traced back to raw session logs.")
        : inLang(lang, "核心统计来自已发布的 BuilderBio 数据，页面按同一套 recap 结构重组呈现。", "Core metrics come from the published BuilderBio payload and are reorganized into the recap layout."),
      note: isUnfiltered
        ? inLang(lang, "只要页面上展示的结论，就应该能在真实 sessions 里找到对应证据。", "If a claim appears on the page, there should be a matching trace in the real sessions.")
        : inLang(lang, "虽然不是 Unfiltered 状态，但主要统计和项目轨迹仍然来自用户自己的扫描结果。", "Even without Unfiltered status, the main metrics and project trajectory still come from the user's own scan results."),
    },
    receipts: [
      {
        label: inLang(lang, "高峰时段", "Peak window"),
        value: derivePeakWindowLabel(lang, time) || "未标注",
        detail: derivePeakDetail(lang, time),
      },
      {
        label: inLang(lang, "第一工具", "Top tool"),
        value: topTool ? humanizeTag(topTool[0]) : "未标注",
        detail: topTool
          ? inLang(lang, `整个周期累计 ${formatNumber(asNumber(topTool[1]))} 次调用`, `${formatNumber(asNumber(topTool[1]))} calls across the scanned period`)
          : inLang(lang, "工具分布数据不足。", "Tool-distribution data is too sparse."),
      },
      {
        label: inLang(lang, "关键词簇", "Keyword cluster"),
        value: topTech || "项目主线",
        detail: topTech
          ? inLang(lang, "这些反复出现的主题，基本就是这段时间的主线。", "These repeated themes are effectively the main line of work.")
          : inLang(lang, "从项目和工作流里能看到明确主线。", "The projects and workflow still point to a clear throughline."),
      },
      {
        label: inLang(lang, "Agent 混合", "Agent mix"),
        value: topAgents.length >= 2 ? `${topAgents[0].sessions} / ${topAgents[1].sessions}` : `${Object.keys(asObject(profile.agents_used)).length}`,
        detail: topAgents.length >= 2
          ? inLang(lang, `${topAgents[0].name} 和 ${topAgents[1].name} 是出现频率最高的两条协作线，但这更像使用形态差异，不是固定职责划分。`, `${topAgents[0].name} and ${topAgents[1].name} are the two strongest collaboration traces here, but that looks more like usage shape than a rigid division of labor.`)
          : inLang(lang, "当前主要由一个 agent 承担大部分可见协作。", "One agent is carrying most of the visible collaboration right now."),
      },
    ],
    tech: techEntries,
    rhythm: [],
  };
}

function deriveWhenIbuild(lang: CopyLang, E: AnyRecord) {
  const time = asObject(E.time);
  const distribution = asObject(time.hour_distribution);
  const periods = asObject(time.period_data);
  const peakWindow = derivePeakWindowLabel(lang, time);
  const peakHourValue = asNumber(time.peak_hour);
  const peakPointReliable = peakHourValue >= 0 && windowContainsHour(peakWindow, peakHourValue);
  const periodLabels: Record<string, string> =
    lang === "zh"
      ? {
          deep_night: "深夜",
          morning: "上午",
          afternoon: "下午",
          evening: "晚上",
        }
      : {
          deep_night: "Late night",
          morning: "Morning",
          afternoon: "Afternoon",
          evening: "Evening",
        };

  return {
    builderType: asString(time.builder_type) || inLang(lang, "活跃时间型 Builder", "Time-pattern builder"),
    peakLead: peakPointReliable
      ? `${peakHourValue}:00`
      : peakWindow,
    peakHour:
      peakPointReliable
        ? `${peakHourValue}:00`
        : inLang(lang, "未标注", "Unspecified"),
    peakWindow,
    peakWindowSessions: Math.max(...Object.values(distribution).map((value) => asNumber(value)), 0),
    hourDistribution: Object.fromEntries(
      Array.from({ length: 24 }, (_, hour) => [hour, asNumber(distribution[String(hour)])])
    ),
    periods: Object.entries(periods).map(([key, value]) => {
      const stats = asObject(value);
      return {
        label: periodLabels[key] || humanizeTag(key),
        emoji: "",
        sessions: asNumber(stats.sessions),
        turns: asNumber(stats.turns),
        color: agentColor(key),
      };
    }),
  };
}

function deriveActivity(D: AnyRecord): ActivitySummary {
  const rawHeatmap = asObject(D.heatmap);
  const fallbackHeatmap =
    asObject(D.activity_map) ||
    asObject(D.activityMap) ||
    asObject(asObject(D.activity).heatmap);
  const heatmap = extractHeatmapMap(rawHeatmap);
  const resolvedHeatmap =
    Object.keys(heatmap).length > 0 ? heatmap : extractHeatmapMap(fallbackHeatmap);
  const highlights = asObject(D.highlights);
  const derivedStreaks = deriveStreaksFromHeatmap(resolvedHeatmap);
  const explicitActiveDays = asOptionalNumber(asObject(D.profile).active_days);
  const rawActiveDays =
    asOptionalNumber(rawHeatmap.active_days) ??
    asOptionalNumber(fallbackHeatmap.active_days);
  const rawTotalDays =
    asOptionalNumber(rawHeatmap.total_days) ??
    asOptionalNumber(fallbackHeatmap.total_days);
  const rawLongestStreak =
    asOptionalNumber(highlights.longest_streak) ??
    asOptionalNumber(rawHeatmap.longest_streak) ??
    asOptionalNumber(fallbackHeatmap.longest_streak);
  const rawCurrentStreak =
    asOptionalNumber(highlights.current_streak) ??
    asOptionalNumber(rawHeatmap.current_streak) ??
    asOptionalNumber(fallbackHeatmap.current_streak);

  return {
    longestStreak: rawLongestStreak ?? derivedStreaks.longestStreak,
    currentStreak: rawCurrentStreak ?? derivedStreaks.currentStreak,
    activeDays:
      explicitActiveDays ??
      rawActiveDays ??
      derivedStreaks.activeDays,
    totalDays:
      rawTotalDays ??
      (Object.keys(resolvedHeatmap).length > 0
        ? Object.keys(resolvedHeatmap).length
        : explicitActiveDays ?? rawActiveDays ?? derivedStreaks.activeDays),
    heatmap: resolvedHeatmap,
  };
}

function deriveTokenCoverage(lang: CopyLang, profile: AnyRecord): {
  partial: boolean;
  label: string;
  note: string;
  missingAgents: string[];
} {
  const coverage = asObject(profile.token_coverage);
  const explicitStatus = asString(coverage.status);
  const explicitMissing = asArray(coverage.missing_agents)
    .map((agent) => agentLabel(asString(agent).toLowerCase()))
    .filter(Boolean);

  const agentIds = Object.keys(asObject(profile.agents_used)).map((agent) =>
    asString(agent).toLowerCase()
  );
  const inferredMissing = agentIds
    .filter((agent) => TOKEN_BLIND_AGENTS.has(agent))
    .map((agent) => agentLabel(agent));

  const missingAgents = uniq(
    explicitMissing.length > 0 ? explicitMissing : inferredMissing
  );
  const partial =
    explicitStatus === "partial" ||
    (missingAgents.length > 0 && asNumber(profile.total_tokens) > 0);

  return {
    partial,
    label: partial
      ? inLang(lang, "Observed tokens", "Observed tokens")
      : "Tokens",
    note: partial
      ? inLang(
          lang,
          `${joinHuman(missingAgents, "zh") || "部分工具"} 本地没有稳定的 token 记录，所以这里展示的是可观测到的下限。`,
          `${joinHuman(missingAgents, "en") || "Some agents"} do not expose reliable local token logs, so this number is an observed lower bound.`
        )
      : inLang(
          lang,
          "这些 token 来自当前扫描到的全部可计量来源。",
          "These tokens come from all scanned sources that expose reliable local counts."
        ),
    missingAgents,
  };
}

const THEME_STYLES: Record<string, Record<string, string>> = {
  default: {},
  "yc-orange": {
    "--accent": "#FF6B35",
    "--accent-dim": "#FF6B3533",
    "--accent-hover": "#FF8A5C",
  },
  "terminal-green": {
    "--accent": "#00FF41",
    "--accent-dim": "#00FF4133",
    "--accent-hover": "#00CC33",
  },
  "minimal-light": {
    "--bg-primary": "#FAFAFA",
    "--bg-secondary": "#FFFFFF",
    "--bg-tertiary": "#F3F3F3",
    "--border": "#E2E2E2",
    "--text-primary": "#111111",
    "--text-secondary": "#555555",
    "--text-muted": "#8A8A8A",
    "--accent": "#111111",
    "--accent-dim": "#11111114",
    "--accent-hover": "#333333",
  },
  cyberpunk: {
    "--accent": "#F472B6",
    "--accent-dim": "#F472B633",
    "--accent-hover": "#FB7185",
  },
  "product-operator": {
    "--accent": "#FF6B35",
    "--accent-dim": "#FF6B3533",
    "--accent-hover": "#FF8A5C",
  },
  "terminal-native": {
    "--accent": "#00E676",
    "--accent-dim": "#00E67633",
    "--accent-hover": "#34F5A1",
  },
  "editorial-maker": {
    "--accent": "#5B6CFF",
    "--accent-dim": "#5B6CFF24",
    "--accent-hover": "#7A88FF",
  },
  "night-shift": {
    "--accent": "#F97316",
    "--accent-dim": "#F9731630",
    "--accent-hover": "#FB923C",
  },
  "research-forge": {
    "--accent": "#2DD4BF",
    "--accent-dim": "#2DD4BF26",
    "--accent-hover": "#5EEAD4",
  },
  "calm-craft": {
    "--bg-primary": "#15171A",
    "--bg-secondary": "#1B1E22",
    "--bg-tertiary": "#22262B",
    "--border": "#2E343D",
    "--text-primary": "#F6F1EA",
    "--text-secondary": "#C6BBB0",
    "--text-muted": "#9A9188",
    "--accent": "#D9A86C",
    "--accent-dim": "#D9A86C26",
    "--accent-hover": "#E6BB84",
  },
  "companion-journal": {
    "--bg-primary": "#F7F2EA",
    "--bg-secondary": "#FFFDF8",
    "--bg-tertiary": "#F1E8D9",
    "--border": "#E2D2BC",
    "--text-primary": "#2F241D",
    "--text-secondary": "#6B5649",
    "--text-muted": "#987F70",
    "--accent": "#C67B55",
    "--accent-dim": "#C67B5520",
    "--accent-hover": "#D99671",
  },
  "idea-salon": {
    "--bg-primary": "#F5F0FF",
    "--bg-secondary": "#FFFDFF",
    "--bg-tertiary": "#EDE5FF",
    "--border": "#D6C6FF",
    "--text-primary": "#271A45",
    "--text-secondary": "#56467A",
    "--text-muted": "#8476A5",
    "--accent": "#6D5EF5",
    "--accent-dim": "#6D5EF520",
    "--accent-hover": "#877BFF",
  },
};

export async function loadPublicBuilderBioRecap(username: string) {
  const results = await db
    .select({
      username: users.username,
      displayName: users.displayName,
      builderBioData: profiles.builderBioData,
      portrait: profiles.portrait,
      dataHash: profiles.dataHash,
      styleTheme: profiles.styleTheme,
      updatedAt: profiles.updatedAt,
    })
    .from(users)
    .innerJoin(profiles, eq(profiles.userId, users.id))
    .where(and(eq(users.username, username), eq(profiles.isPublic, 1)))
    .limit(1);

  if (results.length === 0) return null;

  const result = results[0];
  const rawBioData = result.builderBioData as { D: AnyRecord; E: AnyRecord } | null;
  if (!rawBioData?.D || !rawBioData?.E) return null;

  const normalized = normalizeBuilderBioData(rawBioData);
  const D = asObject(normalized.D);
  const E = asObject(normalized.E);
  const profile = asObject(D.profile);
  const displayName = asString(profile.display_name) || result.displayName || username;
  const contentLang = detectContentLanguage(profile, D, E);
  const avatarUrl = asString(profile.avatar_url) || extractPortraitAvatarUrl(result.portrait) || "";
  const dateRange = formatDateRange(asObject(profile.date_range));
  const projects = asArray<AnyRecord>(D.projects).slice().sort((a, b) => projectScore(b) - projectScore(a));
  const signatureBuild = projects[0] ?? {};
  const topTechLabels = Object.entries(asObject(E.tech))
    .sort((a, b) => asNumber(b[1]) - asNumber(a[1]))
    .slice(0, 4)
    .map(([label]) => humanizeTag(label));
  const comparison = deriveComparison(contentLang, E);
  const agentRoles = deriveAgentRoles(contentLang, E);
  const totalSessions = asNumber(profile.total_sessions);
  const totalTurns = asNumber(profile.total_turns);
  const totalToolCalls = asNumber(profile.total_tool_calls);
  const totalTokens = asNumber(profile.total_tokens);
  const activeDays = asNumber(profile.active_days);
  const normalizedChosenTheme =
    asString(profile.chosen_style_theme) ?? asString(profile.style_theme);
  const normalizedInferredTheme =
    asString(profile.inferred_style_theme) ?? normalizedChosenTheme;
  const normalizedChosenMode =
    asString(profile.chosen_interaction_mode) ??
    asString(profile.interaction_mode) ??
    "builder";
  const normalizedInferredMode =
    asString(profile.inferred_interaction_mode) ?? normalizedChosenMode;
  const storedTheme = asString(result.styleTheme);
  const effectiveTheme =
    storedTheme && storedTheme !== "default"
      ? storedTheme
      : normalizedChosenTheme || normalizedInferredTheme || storedTheme || "default";
  const isUnfiltered = result.dataHash
    ? result.dataHash === (await computeVerificationHash(D))
    : false;
  const tasteSignals = deriveTasteSignals(profile, D, E);
  const managementStyle = deriveManagementStyle(contentLang, D, E, { ...profile, username, display_name: displayName });
  const howIbuild = deriveHowIbuild(contentLang, D, E, profile);
  const activity = deriveActivity(D);
  const evidence = deriveEvidence(contentLang, D, E, profile, comparison, isUnfiltered);
  const whenIbuild = deriveWhenIbuild(contentLang, E);
  const highMoments = deriveHighMoments(contentLang, D, E);
  const eras = deriveEras(contentLang, E);
  const tokenCoverage = deriveTokenCoverage(contentLang, profile);
  const socialLinks = asArray<AnyRecord>(profile.social_links).map((item) => ({
    label: {
      x: "X",
      twitter: "X",
      linkedin: "LinkedIn",
      github: "GitHub",
      website: "Website",
    }[asString(item.platform).toLowerCase()] || humanizeTag(asString(item.platform)) || "Link",
    href: asString(item.url),
  })).filter((item) => item.href);
  const favoritePrompt = asString(asObject(D.highlights).favorite_prompt);
  const high = asObject(D.highlights);
  const rawBusiestDay = asObject(high.busiest_day);
  const resolvedBusiestDay = hasMeaningfulBusiestDay(rawBusiestDay)
    ? rawBusiestDay
    : {};
  const resolvedLongestStreak =
    asOptionalNumber(high.longest_streak) ?? activity.longestStreak;
  const signatureThread = deriveSignatureThread(contentLang, profile, D, E);
  const recurringThreads = deriveRecurringThreads(contentLang, profile, D, E);
  const conversationRoles = deriveConversationRoles(contentLang, comparison);

  const recap = {
    label: isUnfiltered ? "Built from real session logs" : "Built from published BuilderBio data",
    sectionLabel: `${displayName} annual recap`,
    lang: contentLang,
    name: displayName,
    slug: `${username}.builderbio.dev`,
    avatarUrl,
    avatarLetter: (displayName || username || "?")[0]?.toUpperCase() || "?",
    title: deriveProfileTitle(
      contentLang,
      topTechLabels,
      comparison.length,
      normalizedChosenMode
    ),
    thesis: deriveBuilderThesis(contentLang, displayName, { ...profile, display_name: displayName, username }, D, E),
    recap: inLang(
      contentLang,
      `${dateRange} 这段时间里，${displayName} 主要围绕 ${signatureBuild.name || "核心项目"}、${joinHuman(topTechLabels.slice(0, 2), "zh") || "主要技术主线"} 持续推进，并把 ${joinHuman(comparison.map((item) => item.name).slice(0, 2), "zh") || "AI agent"} 放进同一条工作流里。`,
      `From ${dateRange}, ${displayName} kept pushing on ${signatureBuild.name || "a core project"}, ${joinHuman(topTechLabels.slice(0, 2), "en") || "the main technical throughline"}, and ${joinHuman(comparison.map((item) => item.name).slice(0, 2), "en") || "AI agents"} inside one shared workflow.`
    ),
    social: socialLinks,
    trust: {
      unfiltered: isUnfiltered,
      generatedAt: result.updatedAt ? result.updatedAt.toISOString().split("T")[0] : "",
      note: isUnfiltered
        ? inLang(contentLang, "顶部统计和 Unfiltered 标记对应原始 session 日志校验结果。", "Top-line metrics and the Unfiltered badge are backed by raw session-log verification.")
        : inLang(contentLang, "这页基于已发布的 BuilderBio 数据重组为 recap 结构，核心统计仍然来自用户自己的扫描结果。", "This page is rebuilt from published BuilderBio data, and the core metrics still come from the user's own scan results."),
    },
    presentation: {
      inferredMode: normalizedInferredMode,
      chosenMode: normalizedChosenMode,
      modeReason: asString(profile.interaction_mode_reason),
      inferredTheme: normalizedInferredTheme || effectiveTheme,
      chosenTheme: normalizedChosenTheme || effectiveTheme,
      themeReason: asString(profile.style_theme_reason),
      themeCandidates: asArray<AnyRecord>(profile.theme_candidates)
        .map((item) => {
          const candidate = asObject(item);
          return {
            theme: asString(candidate.theme),
            score: asNumber(candidate.score),
            reason: asString(candidate.reason),
          };
        })
        .filter((item) => item.theme),
    },
    dateRange,
    stats: [
      { label: "Sessions", value: formatCompact(totalSessions) },
      { label: "Turns", value: formatCompact(totalTurns) },
      { label: "Tool Calls", value: formatCompact(totalToolCalls) },
      { label: "Active Days", value: formatNumber(activeDays) },
    ],
    totalTokens,
    agents: agentRoles.slice(0, 4).map((item) => ({
      name: item.name,
      role: item.role,
      sessions:
        comparison.find((entry) => entry.name === item.name)?.sessions ??
        0,
      color: item.color,
    })),
    tasteSignals,
    keywordSignals: uniq([
      ...asArray(E.keywords)
        .slice(0, 6)
        .map((item) => (Array.isArray(item) ? asString(item[0]) : asString(asObject(item).word))),
      ...topTechLabels,
    ]).slice(0, 6),
    managementStyle,
    howIbuild,
    signatureBuild: {
      name: asString(signatureBuild.name) || "Primary build",
      stage: "Signature build",
      summary:
        asString(signatureBuild.description) ||
        asString(signatureBuild.summary) ||
        inLang(contentLang, "这条项目线里聚拢了最多的 turns、工具调用和持续注意力。", "This project line pulled together the most turns, tool calls, and sustained attention."),
      why:
        topTechLabels.length > 0
          ? inLang(
              contentLang,
              `它把 ${joinHuman(topTechLabels.slice(0, 3), "zh")} 和持续推进的项目主线捏在了一起。`,
              `It pulls ${joinHuman(topTechLabels.slice(0, 3), "en")} into the same sustained project line.`
            )
          : inLang(contentLang, "它最能代表这段时间里反复投入的主线工作。", "It is the clearest representation of the work this builder kept returning to."),
      proof: [
        `${formatCompact(asNumber(signatureBuild.total_turns))} turns`,
        `${formatCompact(asNumber(signatureBuild.total_tool_calls))} tool calls`,
        `${formatNumber(asNumber(signatureBuild.total_sessions))} sessions`,
      ].filter((item) => !item.startsWith("0")),
    },
    signatureMoves: deriveSignatureMoves(contentLang, D, E, profile),
    highMoments,
    projects: projects.slice(0, 6).map((project) => ({
      name: asString(project.name) || "Untitled project",
      status: normalizeProjectStatus(contentLang, asString(project.status), asString(signatureBuild.name), asString(project.name)),
      summary:
        asString(project.description) ||
        asString(project.summary) ||
        inLang(contentLang, "这条项目线里有持续的构建痕迹。", "There is a sustained build trail inside this project line."),
      tags: asArray(project.tags).map((item) => humanizeTag(asString(item))).filter(Boolean).slice(0, 4),
      proof: `${formatCompact(asNumber(project.total_turns))} turns · ${formatCompact(asNumber(project.total_tool_calls))} tool calls`,
    })),
    agentRoles,
    comparison,
    eras,
    socialCurrency: {
      title:
        normalizedChosenMode === "conversation-first"
          ? "Conversation scale"
          : normalizedChosenMode === "hybrid"
            ? "AI relationship scale"
            : "Collaboration scale",
      summary: tokenCoverage.partial
        ? inLang(
            contentLang,
            `目前观测到 ${formatCompact(totalTokens)} tokens、${formatNumber(totalSessions)} 个会话和 ${formatCompact(totalTurns)} turns。由于 ${joinHuman(tokenCoverage.missingAgents, "zh") || "部分工具"} 本地不稳定记录 token，这里更接近可观测到的下限。`,
            `BuilderBio currently observes ${formatCompact(totalTokens)} tokens across ${formatNumber(totalSessions)} sessions and ${formatCompact(totalTurns)} turns. Because ${joinHuman(tokenCoverage.missingAgents, "en") || "some agents"} do not keep reliable local token logs, this is closer to an observed lower bound than a complete total.`
          )
        : inLang(
            contentLang,
            `${formatCompact(totalTokens)} tokens、${formatNumber(totalSessions)} 个会话和 ${formatCompact(totalTurns)} turns，说明这已经是持续而深入的 AI 协作，而不是偶尔试用。`,
            `${formatCompact(totalTokens)} tokens, ${formatNumber(totalSessions)} sessions, and ${formatCompact(totalTurns)} turns point to sustained, deep AI collaboration rather than occasional experimentation.`
          ),
      tokenLabel: tokenCoverage.label,
      coverageNote: tokenCoverage.note,
      partial: tokenCoverage.partial,
      facts: [
        { label: inLang(contentLang, "最大会话", "Biggest session"), value: `${formatNumber(asNumber(asObject(high.biggest_session).turns))} turns` },
        hasMeaningfulBusiestDay(resolvedBusiestDay)
          ? {
              label: inLang(contentLang, "最忙的一天", "Busiest day"),
              value: inLang(
                contentLang,
                `${asNumber(resolvedBusiestDay.sessions)} 个 sessions · ${formatCompact(asNumber(resolvedBusiestDay.turns))} turns`,
                `${asNumber(resolvedBusiestDay.sessions)} sessions · ${formatCompact(asNumber(resolvedBusiestDay.turns))} turns`
              ),
            }
          : null,
        resolvedLongestStreak > 0
          ? {
              label: inLang(contentLang, "最长连续天数", "Longest streak"),
              value: inLang(
                contentLang,
                `${formatNumber(resolvedLongestStreak)} 天`,
                `${formatNumber(resolvedLongestStreak)} days`
              ),
            }
          : null,
        tokenCoverage.partial
          ? {
              label: inLang(contentLang, "Token 口径", "Token scope"),
              value: inLang(contentLang, "可观测下限", "Observed lower bound"),
            }
          : null,
      ].filter(Boolean),
    },
    whenIbuild,
    activity,
    highlights: {
      biggestSession: {
        turns: asNumber(asObject(high.biggest_session).turns),
        display:
          asString(asObject(high.biggest_session).display) ||
          inLang(contentLang, "这是整个周期里最深的一次单线程推进。", "This was the deepest single-thread push in the whole cycle."),
      },
      busiestDay: {
        date: asString(resolvedBusiestDay.date),
        sessions: asNumber(resolvedBusiestDay.sessions),
        turns: asNumber(resolvedBusiestDay.turns),
      },
      longestStreak: resolvedLongestStreak,
      favoritePrompt,
    },
    conversation: {
      signatureThread,
      recurringThreads,
      aiRoles: conversationRoles,
    },
    hybrid: {
      summary: inLang(
        contentLang,
        `${displayName} 的 BuilderBio 同时有 build line 和 thread line。页面中段不该只剩项目，也不该只剩对话，而是把两条线一起摆出来。`,
        `${displayName}'s BuilderBio clearly contains both a build line and a thread line. The middle of the page should not collapse into only projects or only dialogue; it needs to show both.`
      ),
      threadBridge: signatureThread,
    },
    evidence,
  };

  return {
    recap,
    themeStyle: THEME_STYLES[effectiveTheme] || {},
    seo: {
      title:
        normalizedChosenMode === "conversation-first"
          ? `${displayName}'s BuilderBio — How They Think With AI`
          : normalizedChosenMode === "hybrid"
            ? `${displayName}'s BuilderBio — Build and Think With AI`
            : `${displayName}'s BuilderBio — What I Built with AI`,
      description:
        normalizedChosenMode === "conversation-first"
          ? `${formatNumber(totalSessions)} sessions, ${formatNumber(totalTurns)} turns, and ${formatNumber(activeDays)} active days of thinking with ${comparison.map((item) => item.name.toLowerCase()).join(" and ") || "AI agents"}. See the recurring threads in ${displayName}'s AI relationship.`
          : normalizedChosenMode === "hybrid"
            ? `${formatNumber(totalSessions)} sessions, ${formatNumber(totalTurns)} turns, and ${formatNumber(activeDays)} active days of building and thinking with ${comparison.map((item) => item.name.toLowerCase()).join(" and ") || "AI agents"}. See how ${displayName} mixes project work with recurring AI threads.`
            : `${formatNumber(totalSessions)} sessions, ${formatNumber(totalTurns)} turns, ${formatNumber(activeDays)} active days of building with ${comparison.map((item) => item.name.toLowerCase()).join(" and ") || "AI coding agents"}. See what ${displayName} shipped with AI coding agents.`,
      canonical: `https://${username}.builderbio.dev`,
    },
  };
}

export async function loadPublicBuilderBioRecapGallery(
  mode: "builder" | "hybrid" | "conversation-first",
  limit = 8
) {
  const rows = await db
    .select({
      username: users.username,
    })
    .from(users)
    .innerJoin(profiles, eq(profiles.userId, users.id))
    .where(and(eq(profiles.isPublic, 1), isNotNull(profiles.builderBioData)))
    .orderBy(users.username)
    .limit(50);

  const items = [];
  for (const row of rows) {
    const loaded = await loadPublicBuilderBioRecap(row.username);
    if (!loaded) continue;
    if (loaded.recap.presentation.chosenMode !== mode) continue;

    const totalSessions = parseDisplayNumber(
      String(loaded.recap.stats.find((item) => item.label === "Sessions")?.value ?? 0)
    );
    const totalTurns = parseDisplayNumber(
      String(loaded.recap.stats.find((item) => item.label === "Turns")?.value ?? 0)
    );

    items.push({
      username: row.username,
      name: loaded.recap.name,
      slug: loaded.recap.slug,
      title: loaded.recap.title,
      thesis: loaded.recap.thesis,
      theme: loaded.recap.presentation.chosenTheme,
      inferredTheme: loaded.recap.presentation.inferredTheme,
      mode: loaded.recap.presentation.chosenMode,
      dateRange: loaded.recap.dateRange,
      totalSessions,
      totalTurns,
      totalTokens: loaded.recap.totalTokens,
      activeDays: parseDisplayNumber(
        String(loaded.recap.stats.find((item) => item.label === "Active Days")?.value ?? 0)
      ),
      sparse:
        totalSessions === 0 ||
        totalTurns === 0 ||
        (!loaded.recap.dateRange && loaded.recap.totalTokens === 0),
    });

    if (items.length >= limit) break;
  }

  return items;
}
