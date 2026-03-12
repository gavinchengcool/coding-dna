import type { Metadata } from "next";
import { headers } from "next/headers";
import Titlebar from "@/components/Titlebar";
import InstallCommandBox from "@/components/InstallCommandBox";

async function isLiveGavinHost() {
  const headerStore = await headers();
  const host = (headerStore.get("host") || "").split(":")[0];
  return host === "gavin.builderbio.dev";
}

export async function generateMetadata(): Promise<Metadata> {
  const live = await isLiveGavinHost();

  if (live) {
    return {
      title: "Gavin's BuilderBio — What I Built with AI",
      description:
        "230 sessions, 12.7K turns, 34 active days of building with Claude Code and Codex. See how Gavin works with AI coding agents.",
      alternates: {
        canonical: "https://gavin.builderbio.dev",
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  }

  return {
    title: "BuilderBio Preview",
    description: "Local preview of the next BuilderBio annual-recap direction.",
    alternates: {
      canonical: "https://builderbio.dev/builderbio-preview",
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

const preview = {
  label: "Local preview · not deployed",
  sectionLabel: "Gavin-based annual recap direction",
  name: "Gavin",
  slug: "gavin.builderbio.dev",
  avatarUrl: "/avatar-gavin.jpg",
  avatarLetter: "G",
  title: "产品型操盘手 · AI Native Builder",
  thesis: "一个把 Agent 研究、产品策略和实际交付串成同一条工作流的 Builder。",
  recap:
    "这个预览页直接以 Gavin 当前的 BuilderBio 为素材，但会用更清晰的方式去讲：他是什么样的 Builder、他怎么管理 AI、以及哪些作品最能代表他的 taste。",
  social: [
    { label: "X", href: "https://x.com/gavin0922" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/gavin-c-b271a492/" },
    { label: "网站", href: "https://builderbio.dev" },
  ],
  trust: {
    unfiltered: true,
    generatedAt: "2026-03-10",
    note: "这个页面顶部的核心统计都直接来自原始 agent session 日志。只有当服务器里的校验哈希和 BuilderBio payload 完全一致时，才会显示 Unfiltered。",
  },
  dateRange: "Jan 19 → Mar 10, 2026",
  stats: [
    { label: "会话", value: "230" },
    { label: "轮对话", value: "12.7K" },
    { label: "工具调用", value: "8.8K" },
    { label: "活跃天数", value: "34" },
  ],
  totalTokens: 9_990_000_000,
  agents: [
    { name: "Claude Code", role: "深工位", sessions: 51, color: "#FF6B35" },
    { name: "Codex", role: "快手术刀", sessions: 179, color: "#34D399" },
  ],
  tasteSignals: [
    "CLI 优先",
    "晨间型 Builder",
    "研究和交付并行",
    "把策略做成工具",
  ],
  keywordSignals: ["Agent", "Claude Code", "Codex", "MCP", "产品", "Skills"],
  managementStyle: {
    label: "AI management style",
    name: "导演型 × 冲刺型",
    summary:
      "平时以高频、终端驱动的快循环推进；一旦遇到需要结构化思考的产品或系统问题，就会切换到更深的工作模式。",
    traits: [
      "Codex 承担高频执行和快速推进",
      "Claude Code 留给更深的重构和长会话",
      "策略、研究、交付被放在同一条连续工作流里",
    ],
  },
  howIbuild: {
    archetype: "委派型 × 冲刺型",
    summary: "偏爱短指令、快循环、重度 CLI，同时明确把“快速执行”和“深度重构”分给不同的工作方式。",
    promptStyle: "委派型",
    promptDetail: "更像下指令，而不是写长篇需求文档",
    sessionRhythm: "冲刺型",
    sessionDetail: "132 个短会话 · 73 个中会话 · 25 个长会话",
    toolPreference: "Commander",
    toolDetail: "31% 的工具调用是 CLI 命令",
    agentLoyalty: "多 Agent 协作",
    agentDetail: "同时重度使用 Claude Code 和 Codex",
    toolTotals: [
      { label: "Bash", count: 6855, color: "#FF6B35" },
      { label: "Read", count: 485, color: "#60a5fa" },
      { label: "Edit", count: 429, color: "#34D399" },
      { label: "write_stdin", count: 196, color: "#fbbf24" },
      { label: "Write", count: 152, color: "#f472b6" },
      { label: "TaskUpdate", count: 142, color: "#a78bfa" },
      { label: "Grep", count: 110, color: "#2dd4bf" },
    ],
  },
  signatureBuild: {
    name: "Coding Agent Showcase",
    stage: "Signature build",
    summary:
      "做了一个 Claude Code skill，能扫描本地 session 日志，并生成一个可分享的 Builder 画像页。",
    why: "它最能代表 Gavin 这段时间的主线，因为它把真实数据里最反复出现的三件事放到了一起：Agent 研究、产品表达，以及把 AI Native 的工作方式做成别人也能看懂的工具。",
    proof: [
      "这个项目线累计 2.3K turns",
      "把内部工作流直接做成了公共展示物",
      "它本身就来自 Gavin 每天在研究和使用的 Agent 生态",
    ],
  },
  signatureMoves: [
    {
      title: "把研究直接做成产品",
      summary: "这里的行业研究和竞品分析不是支线任务，而是直接决定下一个该做什么。",
    },
    {
      title: "让 AI 同时参与策略和执行",
      summary: "同一条工作流里既有产品思考，也有工具实现、翻译整理和包装表达。",
    },
    {
      title: "先在终端里推进，再长出故事",
      summary: "先靠高占比 CLI 保住推进速度，等事情成形后，再把它改写成别人能读懂、能使用的东西。",
    },
  ],
  highMoments: [
    {
      label: "峰值周",
      value: "4.3K turns",
      detail: "3 月 2 日那一周是整段 Builder 轨迹里强度最高的一周，执行和表达同时提速。",
    },
    {
      label: "转折点",
      value: "2 月 23 日",
      detail: "单次会话平均 turns 超过 150，说明工作开始从广泛探索转向更深的项目推进。",
    },
    {
      label: "高峰时段",
      value: "10 AM",
      detail: "最稳定的高能状态明显出现在上午，趁环境还没变吵的时候开始 build。",
    },
  ],
  projects: [
    {
      name: "Product Strategy & Iteration",
      status: "进行中",
      summary:
        "围绕核心 AI 产品做策略规划、产品迭代、竞品分析和协作推进。",
      tags: ["Product Strategy", "SaaS", "AI Agent"],
      proof: "1.6K turns · 1.4K tool calls",
    },
    {
      name: "Coding Agent Showcase",
      status: "代表作",
      summary:
        "一个 Claude Code skill，能扫描本地 session 日志并生成可分享的 Builder 画像页。",
      tags: ["Claude Code Skill", "Python", "HTML"],
      proof: "2.3K turns · 1.1K tool calls",
    },
    {
      name: "AI Agent Industry Research",
      status: "已完成",
      summary:
        "深入研究 Agent 生态、行业趋势、竞争格局和技术架构。",
      tags: ["Research", "AI Agent", "Industry Analysis"],
      proof: "1.4K turns · 1.3K tool calls",
    },
    {
      name: "Deep Reading & Translation",
      status: "已完成",
      summary:
        "把 AI 和科技文章做阅读、翻译和再包装，变成更容易消费和传播的形式。",
      tags: ["Reading", "Translation", "Content"],
      proof: "1.2K turns · 1.5K tool calls",
    },
    {
      name: "Dev Environment & Tooling",
      status: "已完成",
      summary:
        "MCP 集成、开发环境配置、VPN 网络和保证系统可用的那层基础设施。",
      tags: ["DevOps", "Tooling", "MCP"],
      proof: "680 turns · 465 tool calls",
    },
    {
      name: "Social Media Image Scraper",
      status: "已完成",
      summary:
        "一个带 Web UI 和定时抓取能力的社媒图片下载器，目标非常直接，就是好用。",
      tags: ["Python", "Web Scraping", "Automation"],
      proof: "495 turns · 729 tool calls",
    },
  ],
  agentRoles: [
    {
      name: "Claude Code",
      role: "深工位",
      summary:
        "当 Gavin 需要在一个问题里待得足够久，直到结构真正长出来时，就会切到 Claude Code。",
      evidence: "51 个 sessions · 6.4K turns · 平均每次 126 turns",
    },
    {
      name: "Codex",
      role: "快手术刀",
      summary:
        "更适合高频执行、终端驱动的推进，以及问完就干的快循环。",
      evidence: "179 个 sessions · 6.3K turns · 平均每次 35 turns",
    },
  ],
  comparison: [
    {
      name: "Claude Code",
      color: "#FF6B35",
      sessions: 51,
      totalTurns: 6413,
      totalToolCalls: 2270,
      avgTurns: 126,
      topTools: [
        { label: "Bash", count: 656, color: "#FF6B35" },
        { label: "Read", count: 485, color: "#60a5fa" },
        { label: "Edit", count: 429, color: "#34D399" },
        { label: "Write", count: 152, color: "#f472b6" },
      ],
      distribution: "24 短 · 16 中 · 11 长",
    },
    {
      name: "Codex",
      color: "#34D399",
      sessions: 179,
      totalTurns: 6298,
      totalToolCalls: 6530,
      avgTurns: 35,
      topTools: [
        { label: "shell_command", count: 4108, color: "#34D399" },
        { label: "Bash", count: 2091, color: "#FF6B35" },
        { label: "write_stdin", count: 196, color: "#fbbf24" },
        { label: "view_image", count: 61, color: "#a78bfa" },
      ],
      distribution: "108 短 · 57 中 · 14 长",
    },
  ],
  eras: [
    {
      title: "Exploration",
      period: "1 月 19 日 → 2 月 9 日",
      summary:
        "这段时间里，Agent 使用、产品问题和工具类工作铺得很开，广度很大，但单次会话的深度还比较有限。",
      cue: "高频 · 面很广 · 深度偏浅",
      bars: [68, 74, 39],
    },
    {
      title: "转向深度构建",
      period: "2 月 23 日",
      summary:
        "工作突然变深了。会话变长，而且开始明显以结构化推进为主，而不是单纯试一试。",
      cue: "次数更少 · 深度暴涨 · 意图更强",
      bars: [34, 28, 100],
    },
    {
      title: "进入复利输出",
      period: "3 月 2 日 → 3 月 10 日",
      summary:
        "执行、讲述和产品包装开始汇合，输出不再只是内部工作，而是逐渐变成对外可见的公共产物。",
      cue: "产出峰值 · 表达更清晰 · 公开化",
      bars: [91, 100, 86],
    },
  ],
  socialCurrency: {
    title: "Collaboration scale",
    summary:
      "这些数字本身不是故事，但它们往往是别的 Builder 第一眼判断“这页是不是来真的”的地方。",
    facts: [
      { label: "最大会话", value: "1,283 turns" },
      { label: "最忙的一天", value: "13 个 sessions · 1,597 turns" },
      { label: "最长连续天数", value: "7 天" },
    ],
  },
  whenIbuild: {
    builderType: "晨间型 Builder",
    peakHour: "10 AM",
    peakWindow: "9–11 AM",
    peakWindowSessions: 69,
    hourDistribution: {
      0: 10,
      1: 4,
      2: 5,
      3: 0,
      4: 0,
      5: 0,
      6: 0,
      7: 4,
      8: 0,
      9: 16,
      10: 40,
      11: 13,
      12: 2,
      13: 10,
      14: 7,
      15: 12,
      16: 12,
      17: 26,
      18: 28,
      19: 9,
      20: 4,
      21: 14,
      22: 0,
      23: 14,
    },
    periods: [
      { label: "深夜", emoji: "Moon", sessions: 19, turns: 286, color: "#a78bfa" },
      { label: "上午", emoji: "Sun", sessions: 73, turns: 2832, color: "#fbbf24" },
      { label: "下午", emoji: "Bolt", sessions: 69, turns: 6271, color: "#fb923c" },
      { label: "晚上", emoji: "Owl", sessions: 69, turns: 3322, color: "#FF6B35" },
    ],
  },
  activity: {
    longestStreak: 7,
    currentStreak: 2,
    activeDays: 34,
    totalDays: 61,
    heatmap: {
      "2026-01-09": 0,
      "2026-01-10": 0,
      "2026-01-11": 0,
      "2026-01-12": 0,
      "2026-01-13": 0,
      "2026-01-14": 0,
      "2026-01-15": 0,
      "2026-01-16": 0,
      "2026-01-17": 0,
      "2026-01-18": 0,
      "2026-01-19": 111,
      "2026-01-20": 144,
      "2026-01-21": 608,
      "2026-01-22": 177,
      "2026-01-23": 530,
      "2026-01-24": 14,
      "2026-01-25": 0,
      "2026-01-26": 779,
      "2026-01-27": 153,
      "2026-01-28": 248,
      "2026-01-29": 105,
      "2026-01-30": 276,
      "2026-01-31": 0,
      "2026-02-01": 117,
      "2026-02-02": 204,
      "2026-02-03": 0,
      "2026-02-04": 187,
      "2026-02-05": 40,
      "2026-02-06": 0,
      "2026-02-07": 105,
      "2026-02-08": 39,
      "2026-02-09": 50,
      "2026-02-10": 587,
      "2026-02-11": 49,
      "2026-02-12": 25,
      "2026-02-13": 401,
      "2026-02-14": 0,
      "2026-02-15": 93,
      "2026-02-16": 0,
      "2026-02-17": 0,
      "2026-02-18": 0,
      "2026-02-19": 0,
      "2026-02-20": 0,
      "2026-02-21": 0,
      "2026-02-22": 0,
      "2026-02-23": 0,
      "2026-02-24": 0,
      "2026-02-25": 64,
      "2026-02-26": 118,
      "2026-02-27": 547,
      "2026-02-28": 1416,
      "2026-03-01": 0,
      "2026-03-02": 503,
      "2026-03-03": 813,
      "2026-03-04": 671,
      "2026-03-05": 736,
      "2026-03-06": 1597,
      "2026-03-07": 0,
      "2026-03-08": 0,
      "2026-03-09": 53,
      "2026-03-10": 1151,
    },
  },
  highlights: {
    biggestSession: {
      turns: 1283,
      display:
        "把任务管理系统整块重做了一遍，包括 rollover 上下文、用户备注和 AI 总结的完整串联。",
    },
    busiestDay: {
      date: "2026-03-06",
      sessions: 13,
      turns: 1597,
    },
    longestStreak: 7,
    favoritePrompt:
      "回到任务列表。昨天的任务现在已经有 rollover 标签了，这很好，但背景上下文还是缺的。AI 提过的问题、用户给出的回答、用户额外输入的任何备注，以及最后 AI 自动生成的总结，这些都必须一起显示出来。",
  },
  evidence: {
    coverage: {
      status: "真实 Gavin 页面数据",
      summary: "直接使用 gavin.builderbio.dev 当前静态页内容，再重组到新一代布局里",
      note: "这个预览页用的不是占位数据，而是 Gavin 当前 BuilderBio 页面的真实内容。",
    },
    receipts: [
      { label: "高峰时段", value: "10 AM", detail: "晨间型 Builder" },
      { label: "第一工具", value: "Bash", detail: "整个周期累计 6.8K 次调用" },
      { label: "关键词簇", value: "Agent · MCP · Product", detail: "这些反复出现的词说明主线就是 Agent 生态与产品工作" },
      { label: "Agent 分工", value: "179 / 51", detail: "Codex 负责速度，Claude Code 负责深度" },
    ],
    tech: [
      { label: "Shell / CLI", value: 100 },
      { label: "HTML / CSS", value: 31 },
      { label: "Product Strategy", value: 27 },
      { label: "Content Processing", value: 19 },
      { label: "Claude Code Skills", value: 15 },
      { label: "AI Agent Ecosystem", value: 15 },
    ],
    rhythm: [
      { label: "Morning", sessions: 73 },
      { label: "Afternoon", sessions: 69 },
      { label: "Evening", sessions: 69 },
      { label: "Late night", sessions: 19 },
    ],
  },
};

function pct(value: number) {
  return `${Math.max(6, Math.min(100, value))}%`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: value >= 1_000_000_000 ? 2 : 1,
  }).format(value);
}

function heatmapLevel(value: number) {
  if (value === 0) return "bg-bg-primary";
  if (value < 20) return "bg-[#18362f]";
  if (value < 100) return "bg-[#1f6b58]";
  if (value < 300) return "bg-[#27a783]";
  return "bg-[#34D399]";
}

function hourColor(hour: number) {
  if (hour < 6) return "#a78bfa";
  if (hour < 12) return "#fbbf24";
  if (hour < 18) return "#fb923c";
  return "#FF6B35";
}

export default async function BuilderBioPreviewPage() {
  const liveGavin = await isLiveGavinHost();
  const hourEntries = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    sessions:
      preview.whenIbuild.hourDistribution[
        hour as keyof typeof preview.whenIbuild.hourDistribution
      ] ?? 0,
  }));
  const maxHourSessions = Math.max(...hourEntries.map((entry) => entry.sessions), 1);
  const heatmapDates = Object.keys(preview.activity.heatmap).sort();
  const firstHeatmapDate = new Date(`${heatmapDates[0]}T00:00:00`);
  const heatmapPadBefore = (firstHeatmapDate.getDay() || 7) - 1;
  const heatmapCells = [
    ...Array.from({ length: heatmapPadBefore }, (_, index) => ({
      key: `pad-${index}`,
      value: 0,
      date: "",
      empty: true,
    })),
    ...heatmapDates.map((date) => ({
      key: date,
      date,
      value: preview.activity.heatmap[date as keyof typeof preview.activity.heatmap],
      empty: false,
    })),
  ];

  return (
    <>
      <Titlebar forceBuiltByActive={liveGavin} />
      <div className="relative overflow-hidden pt-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,107,53,0.18),transparent_38%),radial-gradient(circle_at_80%_20%,rgba(52,211,153,0.12),transparent_30%)]" />

        <main className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          <section className="mb-10 rounded-3xl border border-accent/20 bg-bg-secondary/70 p-6 shadow-[0_0_0_1px_rgba(255,107,53,0.06)] backdrop-blur sm:p-8">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-accent">
                {preview.label}
              </span>
              <span className="rounded-full border border-border px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-text-secondary">
                {preview.sectionLabel}
              </span>
            </div>

            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <div className="mb-6 flex flex-wrap items-center gap-4">
                  <div
                    className="flex h-20 w-20 items-center justify-center rounded-3xl border border-accent/25 bg-accent/10 text-3xl font-black text-accent shadow-[0_12px_40px_rgba(255,107,53,0.12)]"
                    style={{
                      backgroundImage: `linear-gradient(rgba(17,17,17,0.04), rgba(17,17,17,0.04)), url(${preview.avatarUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    <span className="sr-only">{preview.avatarLetter}</span>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-text-muted">{preview.slug}</p>
                    <h1 className="mt-2 text-3xl font-black text-text-primary sm:text-4xl">
                      {preview.name}
                    </h1>
                    <p className="mt-1 text-sm text-text-secondary">{preview.title}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {preview.social.map((item) => (
                        <a
                          key={item.label}
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full border border-border px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-text-secondary transition-colors hover:border-accent/40 hover:text-accent"
                        >
                          {item.label}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mb-4 flex flex-wrap items-center gap-2">
                  {preview.trust.unfiltered ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-[#34d399]/25 bg-[#34d399]/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#34d399]">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4Zm-1 15-4-4 1.41-1.41L11 13.17l5.59-5.59L18 9l-7 7Z" />
                      </svg>
                      <span>Unfiltered</span>
                    </span>
                  ) : null}
                  <span className="rounded-full border border-border px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-text-secondary">
                    生成于 {preview.trust.generatedAt}
                  </span>
                </div>

                <h2 className="max-w-4xl text-4xl font-black leading-[0.95] text-text-primary sm:text-6xl">
                  {preview.thesis}
                </h2>
                <p className="mt-5 max-w-3xl text-sm leading-7 text-text-secondary sm:text-base">
                  {preview.recap}
                </p>
                <p className="mt-3 max-w-3xl text-xs leading-6 text-text-muted">
                  {preview.trust.note}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-text-secondary">
                  <span className="rounded-full border border-border px-3 py-1.5 text-text-primary">
                    {preview.dateRange}
                  </span>
                  {preview.keywordSignals.map((keyword) => (
                    <span
                      key={keyword}
                      className="rounded-full border border-border px-3 py-1.5 text-text-secondary"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {preview.tasteSignals.map((signal) => (
                    <span
                      key={signal}
                      className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-text-primary"
                    >
                      {signal}
                    </span>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-text-secondary">
                  {preview.agents.map((agent) => (
                    <span
                      key={agent.name}
                      className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5"
                    >
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: agent.color }} />
                      <span className="text-text-primary">{agent.name}</span>
                      <span className="text-text-muted">{agent.role}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid gap-4">
                <div className="rounded-3xl border border-border bg-bg-primary/55 p-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-accent">
                    {preview.managementStyle.label}
                  </p>
                  <h3 className="mt-3 text-2xl font-black text-text-primary">
                    {preview.managementStyle.name}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-text-secondary">
                    {preview.managementStyle.summary}
                  </p>
                  <div className="mt-4 space-y-3">
                    {preview.managementStyle.traits.map((trait) => (
                      <div key={trait} className="flex gap-3 text-sm text-text-secondary">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                        <span>{trait}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-accent/25 bg-[linear-gradient(135deg,rgba(255,107,53,0.12),rgba(255,107,53,0.03))] p-5">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-accent">
                        {preview.socialCurrency.title}
                      </p>
                      <div className="mt-2 text-4xl font-black leading-none text-text-primary sm:text-5xl">
                        {formatCompact(preview.totalTokens)}
                      </div>
                      <p className="mt-2 text-sm font-semibold text-text-primary/90">与 AI 协作产生的 tokens</p>
                    </div>
                    <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
                      社交货币
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-text-secondary">
                    {preview.socialCurrency.summary}
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {preview.socialCurrency.facts.map((fact) => (
                      <div
                        key={fact.label}
                        className="rounded-2xl border border-accent/15 bg-bg-secondary/60 p-3"
                      >
                        <div className="text-[10px] uppercase tracking-[0.18em] text-text-muted">
                          {fact.label}
                        </div>
                        <div className="mt-2 text-sm font-bold text-text-primary">{fact.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {preview.stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-2xl border border-border bg-bg-primary/55 p-4"
                    >
                      <div className="text-3xl font-black text-accent sm:text-4xl">{stat.value}</div>
                      <div className="mt-2 text-[11px] uppercase tracking-[0.22em] text-text-muted">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="mb-10 grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="rounded-3xl border border-border bg-bg-secondary p-6 sm:p-8">
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-accent">
                  {preview.signatureBuild.stage}
                </span>
                <span className="text-xs uppercase tracking-[0.2em] text-text-muted">
                  最能解释这个 Builder 的那个作品
                </span>
              </div>

              <h2 className="text-3xl font-black text-text-primary sm:text-4xl">
                {preview.signatureBuild.name}
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-text-secondary sm:text-base">
                {preview.signatureBuild.summary}
              </p>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-text-primary/90">
                {preview.signatureBuild.why}
              </p>

              <div className="mt-6 rounded-2xl border border-border bg-bg-primary/60 p-4">
                <p className="mb-3 text-[11px] uppercase tracking-[0.18em] text-text-muted">
                  为什么它重要
                </p>
                <div className="space-y-3">
                  {preview.signatureBuild.proof.map((item) => (
                    <div key={item} className="flex gap-3 text-sm text-text-secondary">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-bg-secondary p-6 sm:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">
                High moments
              </p>
              <h2 className="mt-2 text-2xl font-black text-text-primary sm:text-3xl">
                这些才是别人真的会记住、会转述的部分。
              </h2>

              <div className="mt-6 space-y-4">
                {preview.highMoments.map((moment) => (
                  <div
                    key={moment.label}
                    className="rounded-2xl border border-border bg-bg-primary/55 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-text-muted">
                        {moment.label}
                      </div>
                      <div className="text-sm font-bold text-accent">{moment.value}</div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-text-secondary">{moment.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mb-10 grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="rounded-3xl border border-border bg-bg-secondary p-6 sm:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">
                Signature moves
              </p>
              <h2 className="mt-2 text-2xl font-black text-text-primary sm:text-3xl">
                这些行为习惯，才会让这个 Builder 被别人一眼认出来。
              </h2>

              <div className="mt-6 space-y-4">
                {preview.signatureMoves.map((move) => (
                  <div
                    key={move.title}
                    className="rounded-2xl border border-border bg-bg-primary/55 p-4"
                  >
                    <div className="text-lg font-black text-text-primary">{move.title}</div>
                    <p className="mt-2 text-sm leading-6 text-text-secondary">{move.summary}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-bg-secondary p-6 sm:p-8">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">
                    What actually got built
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-text-primary sm:text-3xl">
                    作品应该去证明他的 taste，而不是打断它。
                  </h2>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {preview.projects.map((project) => (
                  <div
                    key={project.name}
                    className="rounded-3xl border border-border bg-bg-primary/60 p-5 transition-transform hover:-translate-y-0.5"
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-black text-text-primary">{project.name}</h3>
                        <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-text-muted">
                          {project.proof}
                        </p>
                      </div>
                      <span className="rounded-full border border-accent/25 bg-accent/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-accent">
                        {project.status}
                      </span>
                    </div>
                    <p className="text-sm leading-6 text-text-secondary">{project.summary}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {project.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-border px-2.5 py-1 text-[10px] text-text-secondary"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mb-10 grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="rounded-3xl border border-border bg-bg-secondary p-6 sm:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">
                How I Build
              </p>
              <h2 className="mt-2 text-2xl font-black text-text-primary sm:text-3xl">
                {preview.howIbuild.archetype}
              </h2>
              <p className="mt-4 text-sm leading-6 text-text-secondary">
                {preview.howIbuild.summary}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-bg-primary/55 p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-text-muted">
                    Prompt 风格
                  </div>
                  <div className="mt-2 text-lg font-black text-text-primary">
                    {preview.howIbuild.promptStyle}
                  </div>
                  <p className="mt-2 text-xs leading-5 text-text-secondary">
                    {preview.howIbuild.promptDetail}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-bg-primary/55 p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-text-muted">
                    会话节奏
                  </div>
                  <div className="mt-2 text-lg font-black text-text-primary">
                    {preview.howIbuild.sessionRhythm}
                  </div>
                  <p className="mt-2 text-xs leading-5 text-text-secondary">
                    {preview.howIbuild.sessionDetail}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-bg-primary/55 p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-text-muted">
                    工具偏好
                  </div>
                  <div className="mt-2 text-lg font-black text-text-primary">
                    {preview.howIbuild.toolPreference}
                  </div>
                  <p className="mt-2 text-xs leading-5 text-text-secondary">
                    {preview.howIbuild.toolDetail}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-bg-primary/55 p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-text-muted">
                    Agent 忠诚度
                  </div>
                  <div className="mt-2 text-lg font-black text-text-primary">
                    {preview.howIbuild.agentLoyalty}
                  </div>
                  <p className="mt-2 text-xs leading-5 text-text-secondary">
                    {preview.howIbuild.agentDetail}
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-border bg-bg-primary/60 p-4">
                <div className="mb-3 text-[11px] uppercase tracking-[0.18em] text-text-muted">
                  工具分布
                </div>
                <div className="flex h-4 overflow-hidden rounded-full bg-bg-primary">
                  {preview.howIbuild.toolTotals.map((tool) => {
                    const total = preview.howIbuild.toolTotals.reduce(
                      (sum, item) => sum + item.count,
                      0,
                    );
                    return (
                      <div
                        key={tool.label}
                        style={{
                          width: `${(tool.count / total) * 100}%`,
                          backgroundColor: tool.color,
                        }}
                        title={`${tool.label}: ${tool.count}`}
                      />
                    );
                  })}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {preview.howIbuild.toolTotals.map((tool) => (
                    <span
                      key={tool.label}
                      className="inline-flex items-center gap-2 rounded-full border border-border px-2.5 py-1 text-[10px] text-text-secondary"
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: tool.color }}
                      />
                      <span>
                        {tool.label} {formatNumber(tool.count)}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-bg-secondary p-6 sm:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">
                Agent Comparison
              </p>
              <h2 className="mt-2 text-2xl font-black text-text-primary sm:text-3xl">
                速度和深度之间的分工，应该一直被明确看见。
              </h2>
              <div className="mt-6 grid gap-4">
                {preview.comparison.map((agent) => {
                  const maxTool = Math.max(...agent.topTools.map((tool) => tool.count), 1);
                  return (
                    <div
                      key={agent.name}
                      className="rounded-2xl border border-border bg-bg-primary/60 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: agent.color }}
                          />
                          <div className="text-lg font-black text-text-primary">{agent.name}</div>
                        </div>
                        <span className="rounded-full border border-border px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-text-muted">
                          {agent.distribution}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-4">
                        <div className="rounded-xl border border-border bg-bg-secondary px-3 py-3 text-center">
                          <div className="text-xl font-black text-text-primary">{agent.sessions}</div>
                          <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-text-muted">
                            会话
                          </div>
                        </div>
                        <div className="rounded-xl border border-border bg-bg-secondary px-3 py-3 text-center">
                          <div className="text-xl font-black text-text-primary">
                            {formatNumber(agent.totalTurns)}
                          </div>
                          <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-text-muted">
                            轮对话
                          </div>
                        </div>
                        <div className="rounded-xl border border-border bg-bg-secondary px-3 py-3 text-center">
                          <div className="text-xl font-black text-text-primary">{agent.avgTurns}</div>
                          <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-text-muted">
                            平均 turns
                          </div>
                        </div>
                        <div className="rounded-xl border border-border bg-bg-secondary px-3 py-3 text-center">
                          <div className="text-xl font-black text-text-primary">
                            {formatNumber(agent.totalToolCalls)}
                          </div>
                          <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-text-muted">
                            工具调用
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 space-y-3">
                        {agent.topTools.map((tool) => (
                          <div key={`${agent.name}-${tool.label}`}>
                            <div className="mb-1 flex items-center justify-between gap-3 text-xs text-text-secondary">
                              <span>{tool.label}</span>
                              <span>{formatNumber(tool.count)}</span>
                            </div>
                            <div className="h-2 rounded-full bg-bg-secondary">
                              <div
                                className="h-2 rounded-full"
                                style={{
                                  width: `${Math.round((tool.count / maxTool) * 100)}%`,
                                  backgroundColor: tool.color,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="mb-10 rounded-3xl border border-border bg-bg-secondary p-6 sm:p-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">
              Agent roles
            </p>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
              <h2 className="text-2xl font-black text-text-primary sm:text-3xl">
                不同的 Agent 应该像不同的乐器，而不是同一把锤子。
              </h2>
              <p className="max-w-xl text-sm leading-6 text-text-secondary">
                这里要解释的是“这个 Builder 怎么和 AI 协作”，而不只是“谁的占比更高”。
              </p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {preview.agentRoles.map((agent) => (
                <div
                  key={agent.name}
                  className="rounded-2xl border border-border bg-bg-primary/60 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black text-text-primary">{agent.name}</h3>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-accent">
                        {agent.role}
                      </p>
                    </div>
                    <span className="rounded-full border border-border px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-text-muted">
                      看角色，不只看占比
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-text-secondary">{agent.summary}</p>
                  <div className="mt-3 rounded-xl border border-border bg-bg-secondary px-3 py-2 text-xs text-text-primary">
                    {agent.evidence}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-3xl border border-border bg-bg-secondary p-6 sm:p-8">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">
                    Builder eras
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-text-primary sm:text-3xl">
                    这份回顾仍然要看得出：这条轨迹是怎么一步步变化过来的。
                  </h2>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {preview.eras.map((era) => (
                  <div
                    key={era.title}
                    className="rounded-2xl border border-border bg-bg-primary/60 p-5"
                  >
                    <div className="flex flex-col gap-4">
                      <div className="min-w-0">
                        <h3 className="text-xl font-black text-text-primary">{era.title}</h3>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-text-muted">
                          {era.period}
                        </p>
                      </div>
                      <div className="flex h-14 items-end gap-1 self-start rounded-xl border border-border bg-bg-secondary px-3 py-2">
                        {era.bars.map((bar, index) => (
                          <span
                            key={`${era.title}-${index}`}
                            className="w-2.5 rounded-t bg-accent"
                            style={{ height: pct(bar) }}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-text-secondary">{era.summary}</p>
                    <div className="mt-4 rounded-xl border border-border bg-bg-secondary px-3 py-2 text-xs text-text-primary">
                      {era.cue}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-bg-secondary p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">
                    Evidence layer
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-text-primary sm:text-3xl">
                    信任感要能被看见，但不需要大声嚷出来。
                  </h2>
                </div>
                <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-bold text-accent">
                  {preview.evidence.coverage.status}
                </span>
              </div>

              <p className="mt-4 text-sm leading-6 text-text-secondary">
                {preview.evidence.coverage.summary}
              </p>
              <p className="mt-2 text-sm leading-6 text-text-primary/85">
                {preview.evidence.coverage.note}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {preview.evidence.receipts.map((receipt) => (
                  <div
                    key={receipt.label}
                    className="rounded-2xl border border-border bg-bg-primary/60 p-4"
                  >
                    <div className="text-[11px] uppercase tracking-[0.18em] text-text-muted">
                      {receipt.label}
                    </div>
                    <div className="mt-2 text-2xl font-black text-text-primary">{receipt.value}</div>
                    <p className="mt-2 text-xs leading-5 text-text-secondary">{receipt.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mb-10 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-border bg-bg-secondary p-6 sm:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">
                Tech fingerprint
              </p>
              <div className="mt-6 space-y-4">
                {preview.evidence.tech.map((item) => (
                  <div key={item.label}>
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                      <span className="text-text-secondary">{item.label}</span>
                      <span className="text-text-primary">{item.value}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-bg-primary">
                      <div
                        className="h-2 rounded-full bg-accent"
                        style={{ width: pct(item.value) }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-bg-secondary p-6 sm:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">
                When I Build
              </p>
              <h2 className="mt-2 text-2xl font-black text-text-primary sm:text-3xl">
                {preview.whenIbuild.builderType}
              </h2>
              <div className="mt-6">
                <div className="flex h-36 items-end gap-1 rounded-2xl border border-border bg-bg-primary/60 px-3 py-3">
                  {hourEntries.map((entry) => (
                    <div key={entry.hour} className="flex h-full min-w-0 flex-1 items-end">
                      <div
                        className="w-full rounded-t-[4px]"
                        style={{
                          height: `${Math.max(2, Math.round((entry.sessions / maxHourSessions) * 100))}%`,
                          background: hourColor(entry.hour),
                        }}
                        title={`${entry.hour}:00 — ${entry.sessions} sessions`}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-text-muted">
                  <span>0:00</span>
                  <span>6:00</span>
                  <span>12:00</span>
                  <span>18:00</span>
                  <span>23:00</span>
                </div>
                <div className="mt-5 rounded-2xl border border-border bg-bg-primary/60 p-4">
                  <div className="text-xl font-black text-text-primary">
                    {preview.whenIbuild.peakHour} 是最强高峰
                  </div>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">
                    最活跃的窗口是 {preview.whenIbuild.peakWindow}，一共出现了{" "}
                    {preview.whenIbuild.peakWindowSessions} 个 sessions。
                  </p>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {preview.whenIbuild.periods.map((period) => (
                    <div
                      key={period.label}
                      className="rounded-2xl border border-border bg-bg-primary/55 p-4"
                    >
                      <div className="text-sm font-bold text-text-primary">{period.label}</div>
                      <div className="mt-3 text-2xl font-black text-text-primary">
                        {period.sessions}
                      </div>
                      <div className="text-xs text-text-muted">会话</div>
                      <div className="mt-2 text-xs text-text-secondary">
                        {formatNumber(period.turns)} turns
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="mb-10 grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="rounded-3xl border border-border bg-bg-secondary p-6 sm:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">
                Activity
              </p>
              <h2 className="mt-2 text-2xl font-black text-text-primary sm:text-3xl">
                热力图依然是这张页面里最强的“努力痕迹”之一。
              </h2>
              <div className="mt-6 overflow-x-auto pb-2">
                <div className="grid min-w-max grid-flow-col grid-rows-7 gap-1">
                  {heatmapCells.map((cell) => (
                    <div
                      key={cell.key}
                      className={`h-3 w-3 rounded-[3px] ${heatmapLevel(cell.value)}`}
                      title={cell.empty ? undefined : `${cell.date}: ${cell.value} turns`}
                    />
                  ))}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-secondary">
                <span>
                  最长连续: <strong className="text-text-primary">{preview.activity.longestStreak} 天</strong>
                </span>
                <span>
                  当前连续: <strong className="text-text-primary">{preview.activity.currentStreak} 天</strong>
                </span>
                <span>
                  活跃:{" "}
                  <strong className="text-text-primary">
                    {preview.activity.activeDays}/{preview.activity.totalDays} 天
                  </strong>
                </span>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-text-muted">
                <span>少</span>
                <span className="h-3 w-3 rounded-[3px] bg-bg-primary" />
                <span className="h-3 w-3 rounded-[3px] bg-[#18362f]" />
                <span className="h-3 w-3 rounded-[3px] bg-[#1f6b58]" />
                <span className="h-3 w-3 rounded-[3px] bg-[#27a783]" />
                <span className="h-3 w-3 rounded-[3px] bg-[#34D399]" />
                <span>多</span>
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-bg-secondary p-6 sm:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">
                Log receipts
              </p>
              <h2 className="mt-2 text-2xl font-black text-text-primary sm:text-3xl">
                最值得被截图传播的事实，应该直接来自真实历史。
              </h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-bg-primary/55 p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-text-muted">
                    最大会话
                  </div>
                  <div className="mt-2 text-3xl font-black text-text-primary">
                    {formatNumber(preview.highlights.biggestSession.turns)}
                  </div>
                  <p className="mt-2 text-xs leading-5 text-text-secondary">
                    {preview.highlights.biggestSession.display}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-bg-primary/55 p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-text-muted">
                    最忙的一天
                  </div>
                  <div className="mt-2 text-2xl font-black text-text-primary">
                    {preview.highlights.busiestDay.date}
                  </div>
                  <p className="mt-2 text-xs leading-5 text-text-secondary">
                    {preview.highlights.busiestDay.sessions} 个 sessions ·{" "}
                    {formatNumber(preview.highlights.busiestDay.turns)} turns
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-bg-primary/55 p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-text-muted">
                    最长连续天数
                  </div>
                  <div className="mt-2 text-3xl font-black text-text-primary">
                    {preview.highlights.longestStreak} 天
                  </div>
                  <p className="mt-2 text-xs leading-5 text-text-secondary">
                    和 AI 连续协作，没有中断。
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-bg-primary/55 p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-text-muted">
                    换算一下
                  </div>
                  <div className="mt-2 text-3xl font-black text-text-primary">
                    {formatNumber(12711)}
                  </div>
                  <p className="mt-2 text-xs leading-5 text-text-secondary">
                    如果按每页 3 turns 来算，大概相当于一本 4,237 页的对话书。
                  </p>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-accent/18 bg-bg-primary/60 p-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
                  Featured prompt
                </div>
                <p className="mt-3 whitespace-pre-wrap break-words font-mono text-[12px] leading-6 text-text-secondary">
                  {preview.highlights.favoritePrompt}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-bg-secondary p-6 sm:p-8">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">
                  Make your own
                </p>
                <h2 className="mt-2 text-2xl font-black text-text-primary sm:text-3xl">
                  这页最后应该像一个邀请，而不只是一个报告。
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-text-secondary">
                可分享的页面当然重要，但更大的产品价值，其实是有人看完之后，第一次清楚地看见自己的 Builder 轨迹，并且也想拥有一页。
              </p>
            </div>

            <InstallCommandBox eyebrow="PASTE INTO YOUR CODING AGENT" align="left" />
          </section>
        </main>
      </div>
    </>
  );
}
