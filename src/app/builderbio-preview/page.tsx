import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Titlebar from "@/components/Titlebar";
import InstallCommandBox from "@/components/InstallCommandBox";
import { loadPublicBuilderBioRecap } from "@/lib/builderbio-recap";
import PreviewModeSwitch from "./PreviewModeSwitch";

async function getBuilderBioSubdomainFromHost() {
  const headerStore = await headers();
  const injectedSubdomain = headerStore.get("x-builderbio-subdomain");
  if (injectedSubdomain) return injectedSubdomain;

  const host =
    (headerStore.get("x-builderbio-host") || headerStore.get("host") || "").split(":")[0];
  if (!host.endsWith(".builderbio.dev")) return null;
  const subdomain = host.replace(".builderbio.dev", "");
  if (!subdomain || subdomain.includes(".")) return null;
  return subdomain;
}

export async function generateMetadata(): Promise<Metadata> {
  const subdomain = await getBuilderBioSubdomainFromHost();

  if (subdomain === "gavin") {
    return {
      title: "Gavin's BuilderBio — What I Built with AI",
      description:
        "231 sessions, 25.1K turns, 60 active days of building with Codex and Claude Code since December 5, 2025. See how Gavin works with AI coding agents.",
      alternates: {
        canonical: "https://gavin.builderbio.dev",
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  }

  if (subdomain) {
    const loaded = await loadPublicBuilderBioRecap(subdomain);

    if (!loaded) {
      return {
        title: "BuilderBio Not Found",
        description: "This BuilderBio profile is not available.",
        alternates: {
          canonical: `https://${subdomain}.builderbio.dev`,
        },
        robots: {
          index: false,
          follow: false,
        },
      };
    }

    return {
      title: loaded.seo.title,
      description: loaded.seo.description,
      alternates: {
        canonical: loaded.seo.canonical,
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

const previewFallback = {
  label: "Local preview · not deployed",
  sectionLabel: "Gavin-based annual recap direction",
  lang: "zh",
  name: "Gavin",
  slug: "gavin.builderbio.dev",
  avatarUrl: "https://pbs.twimg.com/profile_images/1976103902102859776/uX5Cphif_400x400.jpg",
  avatarLetter: "G",
  title: "产品驱动型创作者 · AI Native Builder",
  thesis: "一个把 Agent 研究、产品策略和实际交付串成同一条工作流的 Builder。",
  recap:
    "从 2025 年 12 月到 2026 年 3 月，Gavin 先用 Codex 拉出高频执行节奏，再把 Claude Code 接进来处理长会话和结构整理，逐步把 Agent 研究、产品策略和实际交付压成同一条主线。",
  social: [
    { label: "X", href: "https://x.com/gavin0922" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/gavin-c-b271a492/" },
    { label: "网站", href: "https://builderbio.dev" },
  ],
  trust: {
    unfiltered: true,
    generatedAt: "2026-03-13",
    note: "这次重扫把 Gavin 的 Claude Code 活动痕迹拉回到 2025-12-05，Codex 仍从 2025-12-12 开始。只有当服务器里的校验哈希和 BuilderBio payload 完全一致时，才会显示 Unfiltered。",
  },
  dateRange: "2025-12-05 → 2026-03-13",
  stats: [
    { label: "会话", value: "231" },
    { label: "轮对话", value: "25.1K" },
    { label: "工具调用", value: "16.1K" },
    { label: "活跃天数", value: "60" },
  ],
  totalTokens: 1_636_815_058,
  agents: [
    { name: "Claude Code", role: "深度协作", sessions: 45, color: "#FF6B35" },
    { name: "Codex", role: "快速执行", sessions: 186, color: "#34D399" },
  ],
  tasteSignals: [
    "CLI 优先",
    "清晨启动，也会一路熬到深夜",
    "研究和交付并行",
    "把策略做成工具",
  ],
  keywordSignals: ["Agent", "Claude Code", "Codex", "MCP", "产品", "Skills"],
  managementStyle: {
    label: "AI management style",
    name: "导演型 × 冲刺型",
    summary:
      "从 2025-12-05 的 Claude Code 活动痕迹和 2025-12-12 的 Codex 会话开始，Gavin 一直在高频执行和深度重构之间来回切换：Codex 负责把事情快速往前推，Claude Code 负责把真正复杂的问题拉成长会话啃到底。",
    traits: [
      "Codex 承担高频执行、终端推进和问完就干的快循环",
      "Claude Code 留给长会话、结构整理和需要待久一点的问题",
      "上午是最稳定的高峰窗口，但真正的爆点会一路拖到凌晨",
    ],
  },
  howIbuild: {
    archetype: "委派型 × 冲刺型",
    summary:
      "从 2025 年 12 月开始，工作方式一直是一边快推一边深挖：短指令和 CLI 推进占大头，但真正复杂的问题会被拉成长会话慢慢收束。",
    promptStyle: "委派型",
    promptDetail: "更像下指令，而不是写长篇需求文档",
    sessionRhythm: "冲刺型",
    sessionDetail: "122 个短会话 · 72 个中会话 · 37 个长会话",
    toolPreference: "Commander",
    toolDetail: "66% 的工具调用直接发生在命令行里",
    agentLoyalty: "多 Agent 协作",
    agentDetail: "Codex 负责高频推进，Claude Code 负责长会话收束",
    toolTotals: [
      { label: "Bash", count: 6460, color: "#FF6B35" },
      { label: "shell_command", count: 4150, color: "#34D399" },
      { label: "Read", count: 1713, color: "#60a5fa" },
      { label: "Edit", count: 1036, color: "#fbbf24" },
      { label: "write_stdin", count: 887, color: "#f472b6" },
      { label: "Write", count: 347, color: "#a78bfa" },
      { label: "TaskUpdate", count: 298, color: "#2dd4bf" },
    ],
  },
  signatureBuild: {
    name: "Coding Agent Showcase",
    stage: "Signature build",
    summary:
      "BuilderBio 把 Gavin 自己的本地 agent 历史扫出来，再重组成一页能分享的 Builder 年度回顾。",
    why: "它把 Gavin 这段时间投入最深的三件事放到了一起：研究 Agent、推进产品，以及把自己的工作流做成可复用的工具。",
    proof: [
      "这次全量扫描把 Claude Code 的起点拉回到了 2025-12-05",
      "最大单次会话直接冲到了 4,160 turns",
      "BuilderBio 本身就是 Gavin 这段时间最密集迭代的主线之一",
    ],
  },
  signatureMoves: [
    {
      title: "先把事情推进，再回头收束结构",
      summary: "很多问题会先用 Codex 在终端里快速推到能跑，再换到 Claude Code 里把结构压稳。",
    },
    {
      title: "把不同 Agent 放在同一条主线里轮换使用",
      summary: "切工具更多是为了继续把事情做完，而不是把它们锁死成完全不同的职责。",
    },
    {
      title: "先在终端里推进，再整理成成品",
      summary: "先把安装链路、页面和发布流程顶到可用，再回头把它整理成别人能直接理解和转发的成品。",
    },
  ],
  highMoments: [
    {
      label: "最忙的一天",
      value: "2026-03-11",
      detail: "9 个 sessions、5,408 turns，把这次全量扫描里的日强度峰值直接拉满。",
    },
    {
      label: "最大会话",
      value: "4,160 turns",
      detail: "围绕 BuilderBio 安装链路和页面体验的一次超长会话，单次就啃掉了 1,565 次工具调用。",
    },
    {
      label: "高峰窗口",
      value: "06:00–12:00",
      detail: "上午是最稳定的高能窗口，但真正的单点峰值出现在凌晨 2 点。",
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
      role: "深度协作",
      summary:
        "当 Gavin 需要在一个问题里待得足够久，直到结构真正长出来时，就会切到 Claude Code。",
      evidence: "45 个 sessions · 17.4K turns · 平均每次 386 turns",
      color: "#FF6B35",
    },
    {
      name: "Codex",
      role: "快速执行",
      summary:
        "更适合高频执行、终端驱动的推进，以及问完就干的快循环。",
      evidence: "186 个 sessions · 7.8K turns · 平均每次 42 turns",
      color: "#34D399",
    },
  ],
  comparison: [
    {
      name: "Claude Code",
      color: "#FF6B35",
      sessions: 45,
      totalTurns: 17350,
      totalToolCalls: 6520,
      avgTurns: 386,
      topTools: [
        { label: "Bash", count: 2111, color: "#FF6B35" },
        { label: "Read", count: 1713, color: "#60a5fa" },
        { label: "Edit", count: 1036, color: "#34D399" },
        { label: "Write", count: 347, color: "#f472b6" },
      ],
      distribution: "9 短 · 14 中 · 22 长",
    },
    {
      name: "Codex",
      color: "#34D399",
      sessions: 186,
      totalTurns: 7751,
      totalToolCalls: 9569,
      avgTurns: 42,
      topTools: [
        { label: "Bash", count: 4349, color: "#FF6B35" },
        { label: "shell_command", count: 4150, color: "#34D399" },
        { label: "write_stdin", count: 887, color: "#fbbf24" },
        { label: "view_image", count: 68, color: "#a78bfa" },
      ],
      distribution: "113 短 · 58 中 · 15 长",
    },
  ],
  eras: [
    {
      title: "First traces",
      period: "12 月 5 日 → 1 月 18 日",
      summary:
        "最开始先出现的是 Claude Code 的 sidecar 活动痕迹，随后 Codex 会话在 12 月 12 日接进来，很多天是零散但持续的终端推进，BuilderBio 的底层节奏就是从这里开始积累起来的。",
      cue: "起点更早 · Codex 为主 · Claude 痕迹已出现",
      bars: [42, 58, 24],
    },
    {
      title: "Product build-up",
      period: "1 月 19 日 → 2 月 23 日",
      summary:
        "项目线开始密集起来，产品、研究和工具工作同时铺开，连续活跃日明显拉长，工作开始从零散推进变成有主线的堆高。",
      cue: "主线成形 · CLI 密集 · 活跃日爬升",
      bars: [74, 86, 52],
    },
    {
      title: "BuilderBio burst",
      period: "2 月 24 日 → 3 月 13 日",
      summary:
        "强度明显上了一个台阶，BuilderBio、页面体验和发布链路被持续压成高密度长会话，很多内部工作直接变成了公开可见的产物。",
      cue: "夜间爆发 · 长会话增多 · 输出公开化",
      bars: [100, 92, 96],
    },
  ],
  socialCurrency: {
    title: "Collaboration scale",
    summary:
      "1.64B tokens、231 个会话和 25.1K turns，把 Gavin 从 2025-12-05 到现在的 AI 协作强度完整拉了出来。",
    tokenLabel: "与 AI 协作产生的 tokens",
    coverageNote: "这些 tokens 来自当前扫描到的全部可计量来源。",
    partial: false,
    facts: [
      { label: "最大会话", value: "4,160 turns" },
      { label: "最忙的一天", value: "9 个 sessions · 5,408 turns" },
      { label: "最长连续天数", value: "18 天" },
    ],
  },
  whenIbuild: {
    builderType: "清晨启动，也会一路熬到深夜的 Builder",
    peakLead: "06:00–12:00",
    peakHour: "2 AM",
    peakWindow: "06:00–12:00",
    peakWindowSessions: 235,
    hourDistribution: {
      0: 8,
      1: 35,
      2: 50,
      3: 49,
      4: 31,
      5: 31,
      6: 42,
      7: 48,
      8: 38,
      9: 46,
      10: 27,
      11: 34,
      12: 28,
      13: 34,
      14: 15,
      15: 11,
      16: 13,
      17: 6,
      18: 6,
      19: 6,
      20: 6,
      21: 6,
      22: 6,
      23: 7,
    },
    periods: [
      { label: "深夜", emoji: "Moon", sessions: 204, turns: 5456, color: "#a78bfa" },
      { label: "上午", emoji: "Sun", sessions: 235, turns: 14615, color: "#fbbf24" },
      { label: "下午", emoji: "Bolt", sessions: 107, turns: 4901, color: "#fb923c" },
      { label: "晚上", emoji: "Owl", sessions: 37, turns: 129, color: "#FF6B35" },
    ],
  },
  activity: {
    longestStreak: 18,
    currentStreak: 18,
    activeDays: 60,
    totalDays: 99,
    heatmap: {
      "2025-12-05": 1,
      "2025-12-06": 0,
      "2025-12-07": 1,
      "2025-12-08": 1,
      "2025-12-09": 1,
      "2025-12-10": 0,
      "2025-12-11": 0,
      "2025-12-12": 16,
      "2025-12-13": 0,
      "2025-12-14": 0,
      "2025-12-15": 0,
      "2025-12-16": 0,
      "2025-12-17": 1,
      "2025-12-18": 1,
      "2025-12-19": 0,
      "2025-12-20": 0,
      "2025-12-21": 0,
      "2025-12-22": 0,
      "2025-12-23": 1,
      "2025-12-24": 0,
      "2025-12-25": 9,
      "2025-12-26": 8,
      "2025-12-27": 1,
      "2025-12-28": 1,
      "2025-12-29": 1,
      "2025-12-30": 0,
      "2025-12-31": 0,
      "2026-01-01": 0,
      "2026-01-02": 0,
      "2026-01-03": 0,
      "2026-01-04": 1,
      "2026-01-05": 0,
      "2026-01-06": 0,
      "2026-01-07": 4,
      "2026-01-08": 4,
      "2026-01-09": 3,
      "2026-01-10": 0,
      "2026-01-11": 0,
      "2026-01-12": 0,
      "2026-01-13": 0,
      "2026-01-14": 0,
      "2026-01-15": 0,
      "2026-01-16": 0,
      "2026-01-17": 0,
      "2026-01-18": 0,
      "2026-01-19": 86,
      "2026-01-20": 139,
      "2026-01-21": 295,
      "2026-01-22": 320,
      "2026-01-23": 509,
      "2026-01-24": 144,
      "2026-01-25": 60,
      "2026-01-26": 334,
      "2026-01-27": 190,
      "2026-01-28": 337,
      "2026-01-29": 150,
      "2026-01-30": 296,
      "2026-01-31": 123,
      "2026-02-01": 232,
      "2026-02-02": 251,
      "2026-02-03": 0,
      "2026-02-04": 116,
      "2026-02-05": 111,
      "2026-02-06": 0,
      "2026-02-07": 75,
      "2026-02-08": 69,
      "2026-02-09": 42,
      "2026-02-10": 304,
      "2026-02-11": 29,
      "2026-02-12": 25,
      "2026-02-13": 401,
      "2026-02-14": 0,
      "2026-02-15": 47,
      "2026-02-16": 0,
      "2026-02-17": 0,
      "2026-02-18": 0,
      "2026-02-19": 0,
      "2026-02-20": 0,
      "2026-02-21": 0,
      "2026-02-22": 0,
      "2026-02-23": 0,
      "2026-02-24": 46,
      "2026-02-25": 313,
      "2026-02-26": 160,
      "2026-02-27": 336,
      "2026-02-28": 382,
      "2026-03-01": 346,
      "2026-03-02": 711,
      "2026-03-03": 1326,
      "2026-03-04": 863,
      "2026-03-05": 1621,
      "2026-03-06": 1249,
      "2026-03-07": 284,
      "2026-03-08": 284,
      "2026-03-09": 336,
      "2026-03-10": 4869,
      "2026-03-11": 5408,
      "2026-03-12": 845,
      "2026-03-13": 993,
    },
  },
  highlights: {
    biggestSession: {
      turns: 4160,
      display:
        "围绕 BuilderBio 产品与页面迭代的一次超长会话，单次直接冲到了 4,160 turns。",
    },
    busiestDay: {
      date: "2026-03-11",
      sessions: 9,
      turns: 5408,
    },
    longestStreak: 18,
    favoritePrompt:
      "我想让来写一个微博用户的图片下载器，有个网页端，支持我输入微博主页，输入完你就定期下载这个主页的微博图片，到本地文件夹（所以你需要新建个文件夹）。我可以在本地文件夹里查看到这些图片。你会如何来考虑这个项目，你先思考下，等到我确定答复后你再开始写代码",
  },
  evidence: {
    coverage: {
      status: "全量历史重扫",
      summary: "这页顶部的统计、活跃图和高光，直接来自 2025-12-05 到 2026-03-13 的本地 agent session 日志，以及 Claude Code 的 todos / telemetry sidecar 痕迹。",
      note: "这次扫描把 Claude Code 的起点从 transcript 首次出现的 2026-02-13 回拉到了 2025-12-05；Codex 仍从 2025-12-12 开始。",
    },
    receipts: [
      { label: "高峰窗口", value: "06:00–12:00", detail: "真正的单点峰值出现在凌晨 2 点" },
      { label: "第一工具", value: "Bash", detail: "整个周期累计 6,460 次调用" },
      { label: "最大会话", value: "4,160 turns", detail: "单次会话里一共跑了 1,565 次工具调用" },
      { label: "Agent 分工", value: "186 / 45", detail: "Codex 负责高频推进，Claude Code 负责长会话" },
    ],
    tech: [
      { label: "Shell / CLI", value: 100 },
      { label: "AI Agent Ecosystem", value: 53 },
      { label: "HTML / CSS", value: 25 },
      { label: "Code Reading", value: 20 },
      { label: "Claude Code Skills", value: 18 },
      { label: "Code Generation", value: 13 },
    ],
    rhythm: [
      { label: "Morning", sessions: 235 },
      { label: "Late night", sessions: 204 },
      { label: "Afternoon", sessions: 107 },
      { label: "Evening", sessions: 37 },
    ],
  },
  presentation: {
    inferredMode: "builder",
    chosenMode: "builder",
    modeReason: "Project-backed sessions, tool usage, and file traces dominate the history.",
    inferredTheme: "night-shift",
    chosenTheme: "night-shift",
    themeReason: "The history clusters around late-day and night sessions, with visible burst intensity.",
    themeCandidates: [
      {
        theme: "night-shift",
        score: 4.97,
        reason: "The history clusters around late-day and night sessions, with visible burst intensity.",
      },
      {
        theme: "terminal-native",
        score: 3.0,
        reason: "High shell density and command-heavy sessions make terminal-native the strongest default.",
      },
      {
        theme: "product-operator",
        score: 2.9,
        reason: "Shipping-oriented product arcs and operator energy make product-operator a strong fit.",
      },
    ],
  },
  conversation: {
    signatureThread: {
      name: "Decision unwind loop",
      summary:
        "白天推进完项目后，晚上会回来把没想清楚的问题重新拆开，直到第二天的方向变得更清楚。",
      why: "它说明这里的 AI 关系不只是在执行任务，也在承担复盘和再组织判断的工作。",
      proof: ["25.1K turns", "60 个活跃日", "高峰窗口在 06:00–12:00 / 凌晨 2 点单点冲顶"],
    },
    recurringThreads: [
      {
        title: "Decision untangling",
        summary: "很多对话不是为了立即产出，而是为了把第二天要做的决定先讲清楚。",
      },
      {
        title: "Learning by dialogue",
        summary: "研究和理解会通过对话不断往回压，而不是只查一次资料就结束。",
      },
      {
        title: "Late-night reframing",
        summary: "晚上经常用 AI 把白天的问题重新命名，帮助第二天更快推进。",
      },
    ],
    aiRoles: [
      {
        name: "Claude Code",
        role: "Reflection partner",
        summary: "承担更长、更深的对话和结构整理。",
        evidence: "45 个 sessions · 17.3K turns · 6.5K 次工具调用",
        color: "#FF6B35",
      },
      {
        name: "Codex",
        role: "Research helper",
        summary: "承担高频执行，也会快速补充信息和事实。",
        evidence: "186 个 sessions · 7.7K turns · 9.5K 次工具调用",
        color: "#34D399",
      },
    ],
  },
  hybrid: {
    summary:
      "Gavin 这条 BuilderBio 里同时存在清楚的 build line 和思考 thread，只展示其中一边都会把人压扁。",
    threadBridge: {
      name: "Decision unwind loop",
      summary:
        "晚间会回来重新组织白天没想清楚的问题，让第二天的推进更稳。",
      why: "它把产品决策、复盘和实际执行重新扣到了一起。",
      proof: ["高峰日 2026-03-11", "最长连续 18 天", "持续回看和再组织"],
    },
  },
};

type PreviewData = typeof previewFallback;

function getChosenMode(preview: PreviewData) {
  return preview.presentation?.chosenMode || "builder";
}

function getChosenTheme(preview: PreviewData) {
  return preview.presentation?.chosenTheme || "product-operator";
}

function getModeBackdrop(mode: string, theme: string) {
  if (mode === "conversation-first") {
    return theme === "companion-journal"
      ? "bg-[radial-gradient(circle_at_top_left,rgba(198,123,85,0.16),transparent_32%),linear-gradient(180deg,#f7f2ea_0%,#fffdf8_52%,#f5efe6_100%)]"
      : "bg-[radial-gradient(circle_at_top_left,rgba(109,94,245,0.18),transparent_32%),linear-gradient(180deg,#f5f0ff_0%,#fffdff_52%,#f1ecff_100%)]";
  }
  if (mode === "hybrid") {
    return "bg-[radial-gradient(circle_at_top_left,rgba(91,108,255,0.16),transparent_30%),radial-gradient(circle_at_82%_0%,rgba(255,107,53,0.12),transparent_26%),linear-gradient(180deg,#f7f8fc_0%,#ffffff_48%,#f3f4fa_100%)]";
  }
  if (theme === "terminal-native") {
    return "bg-[radial-gradient(circle_at_top,rgba(0,230,118,0.12),transparent_36%),linear-gradient(180deg,#0b0f0d_0%,#0f1512_100%)]";
  }
  if (theme === "night-shift") {
    return "bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.18),transparent_34%),linear-gradient(180deg,#130b16_0%,#17111c_100%)]";
  }
  if (theme === "calm-craft") {
    return "bg-[radial-gradient(circle_at_top,rgba(217,168,108,0.12),transparent_34%),linear-gradient(180deg,#15171a_0%,#181b1f_100%)]";
  }
  return "bg-[radial-gradient(circle_at_top,rgba(255,107,53,0.18),transparent_38%),radial-gradient(circle_at_80%_20%,rgba(52,211,153,0.12),transparent_30%)]";
}

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

function getUiCopy(lang: "zh" | "en") {
  return lang === "zh"
    ? {
        generatedAt: "生成于",
        tokenLabel: "与 AI 协作产生的 tokens",
        signatureHeading: "这段时间最能代表他的作品",
        signatureWhy: "为什么它重要",
        promptStyle: "Prompt 风格",
        sessionRhythm: "会话节奏",
        toolPreference: "工具偏好",
        agentLoyalty: "Agent 忠诚度",
        toolDistribution: "工具分布",
        sessions: "会话",
        turns: "轮对话",
        avgTurns: "平均 turns",
        toolCalls: "工具调用",
        roleLens: "看角色，不只看占比",
        peakSentence: "是最强高峰",
        peakWindowSummary: "最活跃的窗口是",
        sessionsSuffix: "个 sessions。",
        activityLongest: "最长连续",
        activityCurrent: "当前连续",
        activityActive: "活跃",
        activityDays: "天",
        activityLess: "少",
        activityMore: "多",
        biggestSession: "最大会话",
        busiestDay: "最忙的一天",
        longestStreak: "最长连续天数",
        uninterrupted: "和 AI 连续协作，没有中断。",
        translateLabel: "换算一下",
        translateDesc: "如果按每页 3 turns 来算，大概相当于一本 4,237 页的对话书。",
      }
    : {
        generatedAt: "Generated",
        tokenLabel: "Tokens created through AI collaboration",
        signatureHeading: "The build that best represents this stretch",
        signatureWhy: "Why it matters",
        promptStyle: "Prompt style",
        sessionRhythm: "Session rhythm",
        toolPreference: "Tool preference",
        agentLoyalty: "Agent loyalty",
        toolDistribution: "Tool distribution",
        sessions: "Sessions",
        turns: "Turns",
        avgTurns: "Avg Turns",
        toolCalls: "Tool Calls",
        roleLens: "Read the roles, not just the split",
        peakSentence: "is the strongest peak",
        peakWindowSummary: "The busiest window is",
        sessionsSuffix: "sessions.",
        activityLongest: "Longest streak",
        activityCurrent: "Current streak",
        activityActive: "Active",
        activityDays: "days",
        activityLess: "Less",
        activityMore: "More",
        biggestSession: "Biggest session",
        busiestDay: "Busiest day",
        longestStreak: "Longest streak",
        uninterrupted: "Consecutive days of building with AI, without a break.",
        translateLabel: "Put it in perspective",
        translateDesc: "At roughly 3 turns per page, this works out to a 4,237-page conversation book.",
      };
}

function buildPageCopy(preview: typeof previewFallback, liveProfile: boolean) {
  const lang = preview.lang === "en" ? "en" : "zh";
  const busiestDay = preview.highlights.busiestDay;
  const biggestSession = preview.highlights.biggestSession;
  const hasBusiestDay =
    Boolean(busiestDay.date) && (busiestDay.sessions > 0 || busiestDay.turns > 0);
  const eraTitles = preview.eras
    .map((era) => era?.title)
    .filter(Boolean)
    .slice(0, 3)
    .join(lang === "zh" ? "、" : ", ");
  const fastAgent =
    preview.agentRoles.find((agent) => /快|执行|fast|execution|iter/i.test(agent.role)) ||
    preview.agentRoles[1] ||
    preview.agentRoles[0];
  const deepAgent =
    preview.agentRoles.find((agent) => /深|deep/i.test(agent.role)) ||
    preview.agentRoles[0] ||
    preview.agentRoles[1];
  const name = preview.name;
  const dateLabel = busiestDay.date || preview.dateRange || (lang === "zh" ? "这段时间" : "this period");
  const tokenLabel =
    preview.socialCurrency?.tokenLabel ||
    (lang === "zh" ? "与 AI 协作产生的 tokens" : "Tokens created through AI collaboration");
  const socialCurrencySummary =
    preview.socialCurrency.summary ||
    (lang === "zh"
      ? `${formatCompact(preview.totalTokens)} tokens、${preview.stats[0].value} 个会话和 ${preview.stats[1].value} turns，直接说明这已经是持续而深入的 AI 协作。`
      : `${formatCompact(preview.totalTokens)} tokens, ${preview.stats[0].value} sessions, and ${preview.stats[1].value} turns point to sustained, deep AI collaboration rather than occasional experimentation.`);

  return {
    badgeLabel: preview.label,
    sectionLabel: liveProfile ? preview.sectionLabel : preview.sectionLabel,
    recap: preview.recap,
    trustNote: preview.trust.note,
    socialCurrencySummary,
    tokenLabel,
    socialCurrencyBadge: lang === "zh" ? "协作强度" : "Collaboration scale",
    highMomentsHeading:
      lang === "zh"
        ? `${dateLabel} 是 ${name} 这段时间强度最高的一次高峰。`
        : `${dateLabel} marks the highest-intensity spike in this stretch of ${name}'s work.`,
    signatureMovesHeading:
      lang === "zh"
        ? `这些反复出现的习惯，能直接看出 ${name} 平时怎么推进工作。`
        : `These recurring habits are the clearest signature of how ${name} works with AI.`,
    projectsHeading:
      lang === "zh"
        ? `这些项目最能说明 ${name} 这段时间到底在持续构建什么。`
        : `These projects are the clearest proof of what ${name} kept building during this stretch.`,
    agentComparisonHeading:
      fastAgent && deepAgent && fastAgent.name !== deepAgent.name
        ? lang === "zh"
          ? `${fastAgent.name} 和 ${deepAgent.name} 的使用形态不一样，但它们仍然在同一条工作流里反复出现。`
          : `${fastAgent.name} and ${deepAgent.name} show different usage shapes, but they still keep returning inside the same overall workflow.`
        : lang === "zh"
          ? `这些 agent 使用轨迹，基本勾勒出了 ${name} 的协作方式。`
          : `These agent traces outline the way ${name} collaborates with AI.`,
    agentRolesHeading:
      lang === "zh"
        ? `这些 Agent 的会话形态不同，但不代表它们只负责完全不同的工作。`
        : `These agents show different session shapes, but that does not mean each one owns a completely separate job.`,
    agentRolesSummary:
      lang === "zh"
        ? `更关键的是 ${name} 会在多个 agent 之间轮换推进，切换更多是为了继续把事情做完。`
        : `What matters is that ${name} rotates across several agents to keep the work moving, not that each one is locked to a rigid specialty.`,
    erasHeading: eraTitles
      ? lang === "zh"
        ? `${eraTitles} 连在一起，能清楚看见 ${name} 这段时间的轨迹怎么一步步变化。`
        : `${eraTitles} together show how ${name}'s trajectory changed step by step across the period.`
      : lang === "zh"
        ? `这条时间线能清楚看见 ${name} 这段时间的轨迹怎么一步步变化。`
        : `This timeline shows how ${name}'s trajectory changed step by step across the period.`,
    evidenceHeading: lang === "zh" ? "下面这些结论，都能回到对应的日志和会话。" : "Each of these conclusions maps back to specific logs and sessions.",
    evidenceStatus: preview.evidence.coverage.status,
    evidenceSummary:
      preview.evidence.coverage.summary ||
      (lang === "zh"
        ? hasBusiestDay
          ? `从 ${preview.whenIbuild.peakLead || preview.whenIbuild.peakWindow} 这段时间高峰，到 ${busiestDay.date} 的忙碌峰值，再到不同 agent 的使用密度，这些结论都能在原始日志里找到对应证据。`
          : `从 ${preview.whenIbuild.peakLead || preview.whenIbuild.peakWindow} 这段时间高峰，到不同 agent 的使用密度，这些结论都能在原始日志里找到对应证据。`
        : hasBusiestDay
          ? `From the ${preview.whenIbuild.peakLead || preview.whenIbuild.peakWindow} time peak, to the busiest day on ${busiestDay.date}, to the relative density of each agent trace, each conclusion maps back to the raw logs.`
          : `From the ${preview.whenIbuild.peakLead || preview.whenIbuild.peakWindow} time peak to the relative density of each agent trace, each conclusion maps back to the raw logs.`),
    evidenceNote:
      preview.evidence.coverage.note ||
      (lang === "zh"
        ? `最大单次会话达到 ${formatNumber(biggestSession.turns)} turns，最长连续协作 ${preview.highlights.longestStreak} 天；从最大会话到连续协作天数，这些结论都能回到原始 sessions。`
        : `The biggest session reached ${formatNumber(biggestSession.turns)} turns and the longest streak lasted ${preview.highlights.longestStreak} days; from the biggest session to the streak count, these conclusions all trace back to real sessions.`),
    activityHeading:
      lang === "zh"
        ? `${preview.activity.activeDays} 个活跃日，把 ${name} 这段时间的构建节奏完整留了下来。`
        : `${preview.activity.activeDays} active days preserve the full rhythm of how ${name} built during this stretch.`,
    receiptsHeading:
      lang === "zh"
        ? "这些高光，都能直接回到对应的会话和日期。"
        : "Each of these standout moments can be traced back to a specific session or date.",
    ctaHeading: "Make your own BuilderBio.",
    ctaSummary:
      "Give BuilderBio the history of your local coding agents and it will turn your project arcs, collaboration patterns, and standout moments into a shareable builder profile.",
  };
}

function getTokenStat(preview: typeof previewFallback) {
  return {
    label: preview.socialCurrency?.tokenLabel || "Tokens",
    value: formatCompact(preview.totalTokens),
  };
}

function getHourEntries(preview: PreviewData) {
  return Array.from({ length: 24 }, (_, hour) => ({
    hour,
    sessions:
      preview.whenIbuild.hourDistribution[
        hour as keyof typeof preview.whenIbuild.hourDistribution
      ] ?? 0,
  }));
}

function getHeatmapCells(preview: PreviewData) {
  const heatmapDates = Object.keys(preview.activity.heatmap || {})
    .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))
    .sort();
  const firstHeatmapDate = heatmapDates.length
    ? new Date(`${heatmapDates[0]}T00:00:00`)
    : new Date();
  const heatmapPadBefore = heatmapDates.length ? (firstHeatmapDate.getDay() || 7) - 1 : 0;

  return [
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
}

function hasRenderableHeatmapCells(
  cells: Array<{ empty: boolean }>
): boolean {
  return cells.some((cell) => !cell.empty);
}

function hasRenderableRhythm(preview: PreviewData): boolean {
  const hourlyTotal = Object.values(preview.whenIbuild.hourDistribution).reduce(
    (sum, value) => sum + value,
    0
  );
  const periodTotal = preview.whenIbuild.periods.reduce(
    (sum, period) => sum + period.sessions + period.turns,
    0
  );

  return hourlyTotal > 0 || periodTotal > 0 || preview.whenIbuild.peakWindowSessions > 0;
}

function hasRenderableHourBars(preview: PreviewData): boolean {
  return (
    Object.values(preview.whenIbuild.hourDistribution).reduce((sum, value) => sum + value, 0) > 0
  );
}

function renderHeatmapFallback(lang: "zh" | "en", tone: "light" | "dark" = "light") {
  return (
    <div
      className={`rounded-2xl border px-4 py-4 text-sm leading-6 ${
        tone === "dark"
          ? "border-white/10 bg-black/10 text-white/72"
          : "border-border bg-bg-primary/55 text-text-secondary"
      }`}
    >
      {lang === "zh"
        ? "这份已发布数据没有带上可渲染的日级活跃热力图，所以这里先保留活跃天数和连续天数，不再硬画坏掉的网格。"
        : "This published payload did not include a renderable day-level activity heatmap, so BuilderBio keeps the streak and active-day stats here instead of drawing a broken grid."}
    </div>
  );
}

function renderRhythmFallback(lang: "zh" | "en", tone: "light" | "dark" = "light") {
  return (
    <div
      className={`rounded-2xl border px-4 py-4 text-sm leading-6 ${
        tone === "dark"
          ? "border-white/10 bg-black/10 text-white/72"
          : "border-border bg-bg-primary/55 text-text-secondary"
      }`}
    >
      {lang === "zh"
        ? "这份已发布数据没有带上可渲染的小时级时间分布，所以这里不再硬画全 0 的时间柱状图。"
        : "This published payload did not include a renderable hour-level rhythm, so BuilderBio skips the all-zero time bars here."}
    </div>
  );
}

type ThemePageProps = {
  preview: PreviewData;
  liveProfile: boolean;
  liveGavin: boolean;
  themeStyle: CSSProperties;
};

function ThemeCtaBlock({
  summary,
}: {
  summary: string;
}) {
  return (
    <section className="rounded-3xl border border-border bg-bg-secondary/82 p-5 sm:p-8">
      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">Make your own</p>
      <h2 className="mt-2 text-2xl font-black text-text-primary sm:text-3xl">
        Make your own BuilderBio.
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-text-secondary">{summary}</p>
      <div className="mt-6">
        <InstallCommandBox eyebrow="PASTE INTO YOUR CODING AGENT" align="left" />
      </div>
    </section>
  );
}

type CorePackSection =
  | "collaboration"
  | "high-moments"
  | "projects"
  | "comparison"
  | "rhythm"
  | "activity"
  | "receipts";

function BuilderCorePack({
  preview,
  liveProfile,
  tone,
  exclude = [],
}: {
  preview: PreviewData;
  liveProfile: boolean;
  tone: "light" | "dark";
  exclude?: CorePackSection[];
}) {
  const lang = preview.lang === "en" ? "en" : "zh";
  const ui = getUiCopy(lang);
  const pageCopy = buildPageCopy(preview, liveProfile);
  const hourEntries = getHourEntries(preview);
  const maxHourSessions = Math.max(...hourEntries.map((entry) => entry.sessions), 1);
  const heatmapCells = getHeatmapCells(preview);
  const hasHeatmap = hasRenderableHeatmapCells(heatmapCells);
  const hasRhythm = hasRenderableRhythm(preview);
  const hasHourBars = hasRenderableHourBars(preview);
  const peakHeadline =
    preview.whenIbuild.peakLead || preview.whenIbuild.peakHour || preview.whenIbuild.peakWindow;
  const peakHeadlineIsWindow =
    peakHeadline === preview.whenIbuild.peakWindow || /[-–]/.test(peakHeadline);
  const hidden = new Set(exclude);
  const sectionClass =
    tone === "dark"
      ? "rounded-[32px] border border-white/10 bg-black/15 p-5 text-white sm:p-8"
      : "rounded-[32px] border border-border bg-white/92 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.1)] sm:p-8";
  const cardClass =
    tone === "dark"
      ? "rounded-[24px] border border-white/10 bg-black/10 p-4"
      : "rounded-[24px] border border-border bg-bg-primary/55 p-4";
  const metricClass =
    tone === "dark"
      ? "rounded-[18px] border border-white/10 bg-black/10 px-4 py-3 text-sm"
      : "rounded-[18px] border border-border bg-bg-primary/55 px-4 py-3 text-sm";
  const titleClass = tone === "dark" ? "text-white" : "text-text-primary";
  const textClass = tone === "dark" ? "text-white/72" : "text-text-secondary";
  const strongTextClass = tone === "dark" ? "text-white/88" : "text-text-primary/90";
  const mutedClass = tone === "dark" ? "text-white/45" : "text-text-muted";

  return (
    <>
      {!hidden.has("collaboration") ? (
        <section className="mb-8 grid gap-5 lg:grid-cols-[0.96fr_1.04fr] sm:mb-10 sm:gap-6">
          <div className={sectionClass}>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">
              {preview.socialCurrency.title}
            </p>
            <h2 className={`mt-2 text-2xl font-black sm:text-3xl ${titleClass}`}>
              {pageCopy.socialCurrencyBadge}
            </h2>
            <p className={`mt-4 text-sm leading-7 ${textClass}`}>
              {pageCopy.socialCurrencySummary}
            </p>
            <p className={`mt-2 text-sm leading-6 ${strongTextClass}`}>
              {preview.socialCurrency.coverageNote}
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {preview.socialCurrency.facts.map((fact) => (
                <div key={fact.label} className={cardClass}>
                  <div className={`text-[10px] uppercase tracking-[0.18em] ${mutedClass}`}>
                    {fact.label}
                  </div>
                  <div className={`mt-2 text-sm font-bold ${titleClass}`}>{fact.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className={sectionClass}>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">
              Top-line facts
            </p>
            <div className="mt-5 grid gap-3">
              {[...preview.stats, getTokenStat(preview)].map((stat) => (
                <div key={stat.label} className={`flex items-center justify-between gap-4 ${metricClass}`}>
                  <span className={textClass}>{stat.label}</span>
                  <span className={`font-bold ${titleClass}`}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {!hidden.has("high-moments") ? (
        <section className={`mb-8 sm:mb-10 ${sectionClass}`}>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">
            High moments
          </p>
          <h2 className={`mt-2 text-2xl font-black sm:text-3xl ${titleClass}`}>
            {pageCopy.highMomentsHeading}
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {preview.highMoments.map((moment) => (
              <div key={moment.label} className={cardClass}>
                <div className={`text-[11px] uppercase tracking-[0.18em] ${mutedClass}`}>
                  {moment.label}
                </div>
                <div className={`mt-2 text-xl font-black ${titleClass}`}>{moment.value}</div>
                <p className={`mt-2 text-sm leading-6 ${textClass}`}>{moment.detail}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {!hidden.has("projects") ? (
        <section className={`mb-8 sm:mb-10 ${sectionClass}`}>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">
            What actually got built
          </p>
          <h2 className={`mt-2 text-2xl font-black sm:text-3xl ${titleClass}`}>
            {pageCopy.projectsHeading}
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {preview.projects.map((project) => (
              <div key={project.name} className={cardClass}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className={`text-lg font-black ${titleClass}`}>{project.name}</div>
                    <p className={`mt-1 text-[11px] uppercase tracking-[0.16em] ${mutedClass}`}>
                      {project.proof}
                    </p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.14em] ${tone === "dark" ? "border-white/10 text-white/45" : "border-border text-text-muted"}`}>
                    {project.status}
                  </span>
                </div>
                <p className={`mt-3 text-sm leading-6 ${textClass}`}>{project.summary}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`rounded-full border px-2.5 py-1 text-[10px] ${tone === "dark" ? "border-white/10 text-white/55" : "border-border text-text-secondary"}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {!hidden.has("comparison") && preview.comparison.length > 0 ? (
        <section className={`mb-8 sm:mb-10 ${sectionClass}`}>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">
            Agent Comparison
          </p>
          <h2 className={`mt-2 text-2xl font-black sm:text-3xl ${titleClass}`}>
            {pageCopy.agentComparisonHeading}
          </h2>
          <div className="mt-6 grid gap-4">
            {preview.comparison.map((agent) => {
              const maxTool = Math.max(...agent.topTools.map((tool) => tool.count), 1);
              return (
                <div key={agent.name} className={cardClass}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: agent.color }} />
                      <div className={`text-lg font-black ${titleClass}`}>{agent.name}</div>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.16em] ${tone === "dark" ? "border-white/10 text-white/45" : "border-border text-text-muted"}`}>
                      {agent.distribution}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className={metricClass}>
                      <div className={`text-xl font-black ${titleClass}`}>{agent.sessions}</div>
                      <div className={`mt-1 text-[10px] uppercase tracking-[0.16em] ${mutedClass}`}>{ui.sessions}</div>
                    </div>
                    <div className={metricClass}>
                      <div className={`text-xl font-black ${titleClass}`}>{formatNumber(agent.totalTurns)}</div>
                      <div className={`mt-1 text-[10px] uppercase tracking-[0.16em] ${mutedClass}`}>{ui.turns}</div>
                    </div>
                    <div className={metricClass}>
                      <div className={`text-xl font-black ${titleClass}`}>{agent.avgTurns}</div>
                      <div className={`mt-1 text-[10px] uppercase tracking-[0.16em] ${mutedClass}`}>{ui.avgTurns}</div>
                    </div>
                    <div className={metricClass}>
                      <div className={`text-xl font-black ${titleClass}`}>{formatNumber(agent.totalToolCalls)}</div>
                      <div className={`mt-1 text-[10px] uppercase tracking-[0.16em] ${mutedClass}`}>{ui.toolCalls}</div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {agent.topTools.map((tool) => (
                      <div key={`${agent.name}-${tool.label}`}>
                        <div className={`mb-1 flex items-center justify-between gap-3 text-xs ${textClass}`}>
                          <span>{tool.label}</span>
                          <span>{formatNumber(tool.count)}</span>
                        </div>
                        <div className={`h-2 rounded-full ${tone === "dark" ? "bg-black/15" : "bg-bg-secondary"}`}>
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
        </section>
      ) : null}

      {!hidden.has("rhythm") ? (
        <section className="mb-8 grid gap-5 lg:grid-cols-2 sm:mb-10 sm:gap-6">
          <div className={sectionClass}>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">
              Tech fingerprint
            </p>
            <div className="mt-6 space-y-4">
              {preview.evidence.tech.map((item) => (
                <div key={item.label}>
                  <div className={`mb-2 flex items-center justify-between gap-3 text-sm ${textClass}`}>
                    <span>{item.label}</span>
                    <span className={titleClass}>{item.value}%</span>
                  </div>
                  <div className={`h-2 rounded-full ${tone === "dark" ? "bg-black/15" : "bg-bg-primary"}`}>
                    <div className="h-2 rounded-full bg-accent" style={{ width: pct(item.value) }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={sectionClass}>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">
              When I Build
            </p>
            <h2 className={`mt-2 text-2xl font-black sm:text-3xl ${titleClass}`}>
              {preview.whenIbuild.builderType}
            </h2>
            <div className="mt-6">
              {hasRhythm ? (
                <>
                  {hasHourBars ? (
                  <div className="overflow-x-auto pb-2">
                    <div className="min-w-[420px]">
                      <div className={`flex h-36 items-end gap-1 rounded-2xl px-3 py-3 ${tone === "dark" ? "border border-white/10 bg-black/10" : "border border-border bg-bg-primary/60"}`}>
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
                      <div className={`mt-3 flex items-center justify-between text-[11px] ${mutedClass}`}>
                        <span>0:00</span>
                        <span>6:00</span>
                        <span>12:00</span>
                        <span>18:00</span>
                        <span>23:00</span>
                      </div>
                    </div>
                  </div>
                  ) : (
                    <div className="mb-5">{renderRhythmFallback(lang, tone)}</div>
                  )}
                  <div className={`mt-5 rounded-2xl ${tone === "dark" ? "border border-white/10 bg-black/10" : "border border-border bg-bg-primary/60"} p-4`}>
                    <div className={`text-xl font-black ${titleClass}`}>
                      {peakHeadlineIsWindow ? peakHeadline : `${peakHeadline} ${ui.peakSentence}`}
                    </div>
                    <p className={`mt-2 text-sm leading-6 ${textClass}`}>
                      {peakHeadlineIsWindow
                        ? lang === "zh"
                          ? `整个窗口内累计 ${preview.whenIbuild.peakWindowSessions} 个 sessions。`
                          : `${preview.whenIbuild.peakWindowSessions} sessions inside this window.`
                        : `${ui.peakWindowSummary} ${preview.whenIbuild.peakWindow}. ${preview.whenIbuild.peakWindowSessions} ${ui.sessionsSuffix}`}
                    </p>
                  </div>
                </>
              ) : (
                <div className="mt-1">{renderRhythmFallback(lang, tone)}</div>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {!hidden.has("activity") || !hidden.has("receipts") ? (
        <section
          className={`mb-8 grid gap-5 sm:mb-10 sm:gap-6 ${
            !hidden.has("activity") && !hidden.has("receipts")
              ? "lg:grid-cols-[1.08fr_0.92fr]"
              : ""
          }`}
        >
          {!hidden.has("activity") ? (
            <div className={sectionClass}>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">
                Activity
              </p>
              <h2 className={`mt-2 text-2xl font-black sm:text-3xl ${titleClass}`}>
                {pageCopy.activityHeading}
              </h2>
              {hasHeatmap ? (
                <div className="mt-6 overflow-x-auto pb-2">
                  <div className="grid min-w-max grid-flow-col grid-rows-7 gap-1">
                    {heatmapCells.map((cell) => (
                      <div
                        key={cell.key}
                        className={`h-3 w-3 rounded-[3px] ${cell.empty ? "bg-transparent" : heatmapLevel(cell.value)}`}
                        title={cell.empty ? undefined : `${cell.date}: ${cell.value} turns`}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-6">{renderHeatmapFallback(lang, tone)}</div>
              )}
              <div className={`mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm ${textClass}`}>
                <span>
                  {ui.activityLongest}: <strong className={titleClass}>{preview.activity.longestStreak} {ui.activityDays}</strong>
                </span>
                <span>
                  {ui.activityCurrent}: <strong className={titleClass}>{preview.activity.currentStreak} {ui.activityDays}</strong>
                </span>
                <span>
                  {ui.activityActive}: <strong className={titleClass}>{preview.activity.activeDays}/{preview.activity.totalDays} {ui.activityDays}</strong>
                </span>
              </div>
            </div>
          ) : null}

          {!hidden.has("receipts") ? (
            <div className={sectionClass}>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">
                Log receipts
              </p>
              <h2 className={`mt-2 text-2xl font-black sm:text-3xl ${titleClass}`}>
                {pageCopy.receiptsHeading}
              </h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {preview.evidence.receipts.map((receipt) => (
                  <div key={receipt.label} className={cardClass}>
                    <div className={`text-[11px] uppercase tracking-[0.18em] ${mutedClass}`}>
                      {receipt.label}
                    </div>
                    <div className={`mt-2 text-2xl font-black ${titleClass}`}>{receipt.value}</div>
                    <p className={`mt-2 text-xs leading-5 ${textClass}`}>{receipt.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
    </>
  );
}

function BuilderSharedStoryPack({
  preview,
  liveProfile,
  tone,
}: {
  preview: PreviewData;
  liveProfile: boolean;
  tone: "light" | "dark";
}) {
  const lang = preview.lang === "en" ? "en" : "zh";
  const ui = getUiCopy(lang);
  const pageCopy = buildPageCopy(preview, liveProfile);
  const sectionClass =
    tone === "dark"
      ? "rounded-[32px] border border-white/10 bg-black/15 p-5 text-white sm:p-8"
      : "rounded-3xl border border-border bg-bg-secondary p-5 sm:p-8";
  const cardClass =
    tone === "dark"
      ? "rounded-2xl border border-white/10 bg-black/10 p-4"
      : "rounded-2xl border border-border bg-bg-primary/60 p-4";
  const mutedClass = tone === "dark" ? "text-white/45" : "text-text-muted";
  const titleClass = tone === "dark" ? "text-white" : "text-text-primary";
  const textClass = tone === "dark" ? "text-white/72" : "text-text-secondary";
  const strongTextClass = tone === "dark" ? "text-white/88" : "text-text-primary/90";
  const accentChipClass =
    tone === "dark"
      ? "rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-white/55"
      : "rounded-full border border-accent/25 bg-accent/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-accent";

  return (
    <>
      <section className="mb-8 grid gap-5 lg:grid-cols-[1.08fr_0.92fr] sm:mb-10 sm:gap-6">
        <div className={sectionClass}>
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span className={accentChipClass}>{preview.signatureBuild.stage}</span>
            <span className={`text-xs uppercase tracking-[0.2em] ${mutedClass}`}>
              {ui.signatureHeading}
            </span>
          </div>

          <h2 className={`text-3xl font-black sm:text-4xl ${titleClass}`}>
            {preview.signatureBuild.name}
          </h2>
          <p className={`mt-4 max-w-2xl text-sm leading-7 sm:text-base ${textClass}`}>
            {preview.signatureBuild.summary}
          </p>
          <p className={`mt-4 max-w-2xl text-sm leading-7 ${strongTextClass}`}>
            {preview.signatureBuild.why}
          </p>

          <div className={`mt-6 rounded-2xl ${cardClass}`}>
            <p className={`mb-3 text-[11px] uppercase tracking-[0.18em] ${mutedClass}`}>
              {ui.signatureWhy}
            </p>
            <div className="space-y-3">
              {preview.signatureBuild.proof.map((item) => (
                <div key={item} className={`flex gap-3 text-sm ${textClass}`}>
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={sectionClass}>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">
            High moments
          </p>
          <h2 className={`mt-2 text-2xl font-black sm:text-3xl ${titleClass}`}>
            {pageCopy.highMomentsHeading}
          </h2>

          <div className="mt-6 space-y-4">
            {preview.highMoments.map((moment) => (
              <div key={moment.label} className={cardClass}>
                <div className="flex items-center justify-between gap-3">
                  <div className={`text-[11px] uppercase tracking-[0.18em] ${mutedClass}`}>
                    {moment.label}
                  </div>
                  <div className="text-sm font-bold text-accent">{moment.value}</div>
                </div>
                <p className={`mt-3 text-sm leading-6 ${textClass}`}>{moment.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mb-8 grid gap-5 lg:grid-cols-[0.92fr_1.08fr] sm:mb-10 sm:gap-6">
        <div className={sectionClass}>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">
            Signature moves
          </p>
          <h2 className={`mt-2 text-2xl font-black sm:text-3xl ${titleClass}`}>
            {pageCopy.signatureMovesHeading}
          </h2>

          <div className="mt-6 space-y-4">
            {preview.signatureMoves.map((move) => (
              <div key={move.title} className={cardClass}>
                <div className={`text-lg font-black ${titleClass}`}>{move.title}</div>
                <p className={`mt-2 text-sm leading-6 ${textClass}`}>{move.summary}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={sectionClass}>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">
                What actually got built
              </p>
              <h2 className={`mt-2 text-2xl font-black sm:text-3xl ${titleClass}`}>
                {pageCopy.projectsHeading}
              </h2>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {preview.projects.map((project) => (
              <div key={project.name} className={`${cardClass} transition-transform hover:-translate-y-0.5`}>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className={`text-lg font-black ${titleClass}`}>{project.name}</h3>
                    <p className={`mt-1 text-[11px] uppercase tracking-[0.18em] ${mutedClass}`}>
                      {project.proof}
                    </p>
                  </div>
                  <span className={accentChipClass}>{project.status}</span>
                </div>
                <p className={`text-sm leading-6 ${textClass}`}>{project.summary}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`rounded-full border px-2.5 py-1 text-[10px] ${
                        tone === "dark" ? "border-white/10 text-white/55" : "border-border text-text-secondary"
                      }`}
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

      <section className="mb-8 grid gap-5 lg:grid-cols-[0.92fr_1.08fr] sm:mb-10 sm:gap-6">
        <div className={sectionClass}>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">
            How I Build
          </p>
          <h2 className={`mt-2 text-2xl font-black sm:text-3xl ${titleClass}`}>
            {preview.howIbuild.archetype}
          </h2>
          <p className={`mt-4 text-sm leading-6 ${textClass}`}>{preview.howIbuild.summary}</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className={cardClass}>
              <div className={`text-[11px] uppercase tracking-[0.18em] ${mutedClass}`}>
                {ui.promptStyle}
              </div>
              <div className={`mt-2 text-lg font-black ${titleClass}`}>
                {preview.howIbuild.promptStyle}
              </div>
              <p className={`mt-2 text-xs leading-5 ${textClass}`}>{preview.howIbuild.promptDetail}</p>
            </div>
            <div className={cardClass}>
              <div className={`text-[11px] uppercase tracking-[0.18em] ${mutedClass}`}>
                {ui.sessionRhythm}
              </div>
              <div className={`mt-2 text-lg font-black ${titleClass}`}>
                {preview.howIbuild.sessionRhythm}
              </div>
              <p className={`mt-2 text-xs leading-5 ${textClass}`}>{preview.howIbuild.sessionDetail}</p>
            </div>
            <div className={cardClass}>
              <div className={`text-[11px] uppercase tracking-[0.18em] ${mutedClass}`}>
                {ui.toolPreference}
              </div>
              <div className={`mt-2 text-lg font-black ${titleClass}`}>
                {preview.howIbuild.toolPreference}
              </div>
              <p className={`mt-2 text-xs leading-5 ${textClass}`}>{preview.howIbuild.toolDetail}</p>
            </div>
            <div className={cardClass}>
              <div className={`text-[11px] uppercase tracking-[0.18em] ${mutedClass}`}>
                {ui.agentLoyalty}
              </div>
              <div className={`mt-2 text-lg font-black ${titleClass}`}>
                {preview.howIbuild.agentLoyalty}
              </div>
              <p className={`mt-2 text-xs leading-5 ${textClass}`}>{preview.howIbuild.agentDetail}</p>
            </div>
          </div>

          <div className={`mt-6 rounded-2xl ${cardClass}`}>
            <div className={`mb-3 text-[11px] uppercase tracking-[0.18em] ${mutedClass}`}>
              {ui.toolDistribution}
            </div>
            <div className={`flex h-4 overflow-hidden rounded-full ${tone === "dark" ? "bg-black/15" : "bg-bg-primary"}`}>
              {preview.howIbuild.toolTotals.map((tool) => {
                const total = preview.howIbuild.toolTotals.reduce((sum, item) => sum + item.count, 0);
                return (
                  <div
                    key={tool.label}
                    style={{
                      width: `${total > 0 ? (tool.count / total) * 100 : 0}%`,
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
                  className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] ${
                    tone === "dark" ? "border-white/10 text-white/72" : "border-border text-text-secondary"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tool.color }} />
                  <span>
                    {tool.label} {formatNumber(tool.count)}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {preview.comparison.length > 0 ? (
          <div className={sectionClass}>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">
              Agent Comparison
            </p>
            <h2 className={`mt-2 text-2xl font-black sm:text-3xl ${titleClass}`}>
              {pageCopy.agentComparisonHeading}
            </h2>
            <div className="mt-6 grid gap-4">
              {preview.comparison.map((agent) => {
                const maxTool = Math.max(...agent.topTools.map((tool) => tool.count), 1);
                return (
                  <div key={agent.name} className={cardClass}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: agent.color }} />
                        <div className={`text-lg font-black ${titleClass}`}>{agent.name}</div>
                      </div>
                      <span
                        className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.16em] ${
                          tone === "dark" ? "border-white/10 text-white/45" : "border-border text-text-muted"
                        }`}
                      >
                        {agent.distribution}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {[
                        { label: ui.sessions, value: `${agent.sessions}` },
                        { label: ui.turns, value: formatNumber(agent.totalTurns) },
                        { label: ui.avgTurns, value: `${agent.avgTurns}` },
                        { label: ui.toolCalls, value: formatNumber(agent.totalToolCalls) },
                      ].map((metric) => (
                        <div
                          key={`${agent.name}-${metric.label}`}
                          className={`rounded-xl border px-3 py-3 text-center ${
                            tone === "dark" ? "border-white/10 bg-black/10" : "border-border bg-bg-secondary"
                          }`}
                        >
                          <div className={`text-xl font-black ${titleClass}`}>{metric.value}</div>
                          <div className={`mt-1 text-[10px] uppercase tracking-[0.16em] ${mutedClass}`}>
                            {metric.label}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 space-y-3">
                      {agent.topTools.map((tool) => (
                        <div key={`${agent.name}-${tool.label}`}>
                          <div className={`mb-1 flex items-center justify-between gap-3 text-xs ${textClass}`}>
                            <span>{tool.label}</span>
                            <span>{formatNumber(tool.count)}</span>
                          </div>
                          <div className={`h-2 rounded-full ${tone === "dark" ? "bg-black/15" : "bg-bg-secondary"}`}>
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
        ) : null}
      </section>

      <section className={`mb-8 sm:mb-10 ${sectionClass}`}>
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">
          Agent roles
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <h2 className={`text-2xl font-black sm:text-3xl ${titleClass}`}>
            {pageCopy.agentRolesHeading}
          </h2>
          <p className={`max-w-xl text-sm leading-6 ${textClass}`}>
            {pageCopy.agentRolesSummary}
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {preview.agentRoles.map((agent) => (
            <div key={agent.name} className={cardClass}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className={`text-lg font-black ${titleClass}`}>{agent.name}</h3>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-accent">
                    {agent.role}
                  </p>
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.16em] ${
                    tone === "dark" ? "border-white/10 text-white/45" : "border-border text-text-muted"
                  }`}
                >
                  {ui.roleLens}
                </span>
              </div>
              <p className={`mt-3 text-sm leading-6 ${textClass}`}>{agent.summary}</p>
              <div
                className={`mt-3 rounded-xl border px-3 py-2 text-xs ${
                  tone === "dark" ? "border-white/10 bg-black/10 text-white/88" : "border-border bg-bg-secondary text-text-primary"
                }`}
              >
                {agent.evidence}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8 grid gap-5 lg:grid-cols-[1.05fr_0.95fr] sm:mb-10 sm:gap-6">
        <div className={sectionClass}>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">
                Builder eras
              </p>
              <h2 className={`mt-2 text-2xl font-black sm:text-3xl ${titleClass}`}>
                {pageCopy.erasHeading}
              </h2>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {preview.eras.map((era) => (
              <div key={era.title} className={`${cardClass} p-5`}>
                <div className="flex flex-col gap-4">
                  <div className="min-w-0">
                    <h3 className={`text-xl font-black ${titleClass}`}>{era.title}</h3>
                    <p className={`mt-1 text-xs uppercase tracking-[0.18em] ${mutedClass}`}>
                      {era.period}
                    </p>
                  </div>
                  <div
                    className={`flex h-14 items-end gap-1 self-start rounded-xl border px-3 py-2 ${
                      tone === "dark" ? "border-white/10 bg-black/10" : "border-border bg-bg-secondary"
                    }`}
                  >
                    {era.bars.map((bar, index) => (
                      <span
                        key={`${era.title}-${index}`}
                        className="w-2.5 rounded-t bg-accent"
                        style={{ height: pct(bar) }}
                      />
                    ))}
                  </div>
                </div>
                <p className={`mt-4 text-sm leading-6 ${textClass}`}>{era.summary}</p>
                <div
                  className={`mt-4 rounded-xl border px-3 py-2 text-xs ${
                    tone === "dark" ? "border-white/10 bg-black/10 text-white/88" : "border-border bg-bg-secondary text-text-primary"
                  }`}
                >
                  {era.cue}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={sectionClass}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">
                Evidence layer
              </p>
              <h2 className={`mt-2 text-2xl font-black sm:text-3xl ${titleClass}`}>
                {pageCopy.evidenceHeading}
              </h2>
            </div>
            <span className={accentChipClass}>{pageCopy.evidenceStatus}</span>
          </div>

          <p className={`mt-4 text-sm leading-6 ${textClass}`}>{pageCopy.evidenceSummary}</p>
          <p className={`mt-2 text-sm leading-6 ${strongTextClass}`}>{pageCopy.evidenceNote}</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {preview.evidence.receipts.map((receipt) => (
              <div key={receipt.label} className={cardClass}>
                <div className={`text-[11px] uppercase tracking-[0.18em] ${mutedClass}`}>
                  {receipt.label}
                </div>
                <div className={`mt-2 text-2xl font-black ${titleClass}`}>{receipt.value}</div>
                <p className={`mt-2 text-xs leading-5 ${textClass}`}>{receipt.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <BuilderCorePack
        preview={preview}
        liveProfile={liveProfile}
        tone={tone}
        exclude={["high-moments", "projects", "comparison"]}
      />
    </>
  );
}

function ConversationFirstRecapPage({
  preview,
  liveProfile,
  liveGavin,
  themeStyle,
}: {
  preview: PreviewData;
  liveProfile: boolean;
  liveGavin: boolean;
  themeStyle: CSSProperties;
}) {
  const hourEntries = getHourEntries(preview);
  const maxHourSessions = Math.max(...hourEntries.map((entry) => entry.sessions), 1);
  const heatmapCells = getHeatmapCells(preview);
  const hasHeatmap = hasRenderableHeatmapCells(heatmapCells);
  const hasRhythm = hasRenderableRhythm(preview);
  const hasHourBars = hasRenderableHourBars(preview);
  const chosenTheme = getChosenTheme(preview);

  return (
    <div className="builderbio-recap-shell">
      <Titlebar
        forceBuiltByActive={liveGavin}
        forceTasteBoardActive={liveProfile && !liveGavin}
        forceHomeInactive={liveProfile}
      />
      <div className={`relative overflow-hidden pt-12 ${getModeBackdrop("conversation-first", chosenTheme)}`} style={themeStyle}>
        <main className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-12">
          {!liveProfile ? <PreviewModeSwitch active="conversation-first" /> : null}

          <section className="mb-8 overflow-hidden rounded-[32px] border border-border bg-bg-secondary/80 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.1)] backdrop-blur sm:mb-10 sm:p-8">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-accent">
                {preview.label}
              </span>
              <span className="rounded-full border border-border px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-text-secondary">
                {preview.sectionLabel}
              </span>
              <span className="rounded-full border border-border px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-text-secondary">
                mode · conversation-first
              </span>
              <span className="rounded-full border border-border px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-text-secondary">
                theme · {chosenTheme}
              </span>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:gap-8">
              <div>
                <div className="mb-5 flex items-start gap-4 sm:mb-6">
                  <div
                    className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[28px] border border-accent/25 bg-accent/10 text-3xl font-black text-accent shadow-[0_14px_36px_rgba(0,0,0,0.12)]"
                    style={
                      preview.avatarUrl
                        ? {
                            backgroundImage: `linear-gradient(rgba(17,17,17,0.04), rgba(17,17,17,0.04)), url(${preview.avatarUrl})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }
                        : undefined
                    }
                  >
                    <span className="sr-only">{preview.avatarLetter}</span>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-text-muted">{preview.slug}</p>
                    <h1 className="mt-2 text-4xl font-black text-text-primary sm:text-5xl">{preview.name}</h1>
                    <p className="mt-2 text-sm text-text-secondary">{preview.title}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {preview.social.map((item) => (
                        <a
                          key={item.label}
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full border border-border px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-text-secondary transition-colors hover:border-accent/40 hover:text-accent"
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
                      Unfiltered
                    </span>
                  ) : null}
                  <span className="rounded-full border border-border px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-text-secondary">
                    Generated {preview.trust.generatedAt}
                  </span>
                </div>

                <h2 className="max-w-4xl text-[2.05rem] font-black leading-[1.05] text-text-primary sm:text-6xl sm:leading-[0.96]">
                  {preview.thesis}
                </h2>

                <div className="mt-5 flex flex-wrap gap-2">
                  {preview.tasteSignals.map((signal) => (
                    <span
                      key={signal}
                      className="rounded-full border border-border bg-bg-primary/55 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-primary sm:text-[11px]"
                    >
                      {signal}
                    </span>
                  ))}
                </div>

                <p className="mt-5 max-w-3xl text-sm leading-7 text-text-secondary sm:text-base">
                  {preview.recap}
                </p>
              </div>

              <div className="grid gap-4">
                <div className="rounded-[28px] border border-accent/20 bg-[linear-gradient(135deg,rgba(255,255,255,0.86),rgba(255,255,255,0.62))] p-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-accent">
                    {preview.socialCurrency.title}
                  </p>
                  <div className="mt-3 text-5xl font-black text-text-primary">{formatCompact(preview.totalTokens)}</div>
                  <p className="mt-2 text-sm font-semibold text-text-primary">
                    Tokens created through AI conversation
                  </p>
                  <p className="mt-4 text-sm leading-6 text-text-secondary">{preview.socialCurrency.summary}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {preview.stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-[24px] border border-border bg-bg-primary/60 p-4"
                    >
                      <div className="text-2xl font-black text-accent">{stat.value}</div>
                      <div className="mt-2 text-[11px] uppercase tracking-[0.2em] text-text-muted">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-[28px] border border-border bg-bg-primary/60 p-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-accent">
                    AI relationship style
                  </p>
                  <h3 className="mt-2 text-2xl font-black text-text-primary">
                    {preview.managementStyle.name}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-text-secondary">
                    {preview.managementStyle.summary}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-8 grid gap-5 lg:grid-cols-[1.06fr_0.94fr] sm:mb-10 sm:gap-6">
            <div className="rounded-[32px] border border-border bg-bg-secondary/82 p-5 sm:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">
                Signature Thread
              </p>
              <h2 className="mt-2 text-3xl font-black text-text-primary sm:text-4xl">
                {preview.conversation.signatureThread.name}
              </h2>
              <p className="mt-4 text-sm leading-7 text-text-secondary sm:text-base">
                {preview.conversation.signatureThread.summary}
              </p>
              <div className="mt-6 rounded-[24px] border border-border bg-bg-primary/55 p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-text-muted">
                  Why it matters
                </div>
                <p className="mt-3 text-sm leading-6 text-text-secondary">
                  {preview.conversation.signatureThread.why}
                </p>
                <div className="mt-4 space-y-3">
                  {preview.conversation.signatureThread.proof.map((item) => (
                    <div key={item} className="flex gap-3 text-sm text-text-secondary">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-border bg-bg-secondary/82 p-5 sm:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">
                Recurring Threads
              </p>
              <h2 className="mt-2 text-2xl font-black text-text-primary sm:text-3xl">
                These are the themes that keep returning.
              </h2>
              <div className="mt-6 space-y-4">
                {preview.conversation.recurringThreads.map((thread) => (
                  <div
                    key={thread.title}
                    className="rounded-[24px] border border-border bg-bg-primary/55 p-4"
                  >
                    <div className="text-lg font-black text-text-primary">{thread.title}</div>
                    <p className="mt-2 text-sm leading-6 text-text-secondary">{thread.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mb-8 grid gap-5 lg:grid-cols-2 sm:mb-10 sm:gap-6">
            <div className="rounded-[32px] border border-border bg-bg-secondary/82 p-5 sm:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">
                AI Roles
              </p>
              <h2 className="mt-2 text-2xl font-black text-text-primary sm:text-3xl">
                Here the agents feel more like different conversation partners than coding lanes.
              </h2>
              <div className="mt-6 grid gap-4">
                {preview.conversation.aiRoles.map((role) => (
                  <div
                    key={role.name}
                    className="rounded-[24px] border border-border bg-bg-primary/55 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-lg font-black text-text-primary">{role.name}</div>
                        <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-text-muted">
                          {role.role}
                        </div>
                      </div>
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: role.color }} />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-text-secondary">{role.summary}</p>
                    <p className="mt-3 text-xs uppercase tracking-[0.16em] text-text-muted">{role.evidence}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-border bg-bg-secondary/82 p-5 sm:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">
                When We Talk
              </p>
              <h2 className="mt-2 text-2xl font-black text-text-primary sm:text-3xl">
                {preview.whenIbuild.builderType}
              </h2>
              <div className="mt-6 rounded-[24px] border border-border bg-bg-primary/55 p-4">
                {hasRhythm ? (
                  <>
                    {hasHourBars ? (
                      <div className="flex h-28 items-end gap-2">
                        {hourEntries.map((entry) => (
                          <div key={entry.hour} className="flex-1">
                            <div
                              className="rounded-t-[6px] bg-accent"
                              style={{ height: `${Math.max(8, (entry.sessions / maxHourSessions) * 100)}%`, opacity: 0.25 + (entry.sessions / maxHourSessions) * 0.75 }}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      renderRhythmFallback(preview.lang === "en" ? "en" : "zh")
                    )}
                    <p className="mt-4 text-sm leading-6 text-text-secondary">
                      Peak window: {preview.whenIbuild.peakWindow} · {preview.whenIbuild.peakWindowSessions} sessions
                    </p>
                  </>
                ) : (
                  renderRhythmFallback(preview.lang === "en" ? "en" : "zh")
                )}
              </div>

              <div className="mt-5 rounded-[24px] border border-border bg-bg-primary/55 p-4">
                <div className="mb-3 text-[11px] uppercase tracking-[0.18em] text-text-muted">Conversation activity</div>
                {hasHeatmap ? (
                  <div className="grid grid-cols-7 gap-1.5">
                    {heatmapCells.map((cell) => (
                      <div
                        key={cell.key}
                        className={`aspect-square rounded-[6px] border border-border/60 ${cell.empty ? "bg-transparent" : heatmapLevel(cell.value)}`}
                        title={cell.date || undefined}
                      />
                    ))}
                  </div>
                ) : (
                  renderHeatmapFallback(preview.lang === "en" ? "en" : "zh")
                )}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-bg-secondary/82 p-5 sm:p-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">Make your own</p>
            <h2 className="mt-2 text-2xl font-black text-text-primary sm:text-3xl">
              Make your own BuilderBio.
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-text-secondary">
              Give BuilderBio the history of your local coding agents and it will turn your project arcs, conversation threads, and standout moments into a shareable AI profile.
            </p>
            <div className="mt-6">
              <InstallCommandBox eyebrow="PASTE INTO YOUR CODING AGENT" align="left" />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function HybridRecapPage({
  preview,
  liveProfile,
  liveGavin,
  themeStyle,
}: {
  preview: PreviewData;
  liveProfile: boolean;
  liveGavin: boolean;
  themeStyle: CSSProperties;
}) {
  const chosenTheme = getChosenTheme(preview);
  const hourEntries = getHourEntries(preview);
  const maxHourSessions = Math.max(...hourEntries.map((entry) => entry.sessions), 1);
  const hasRhythm = hasRenderableRhythm(preview);
  const hasHourBars = hasRenderableHourBars(preview);

  return (
    <div className="builderbio-recap-shell">
      <Titlebar
        forceBuiltByActive={liveGavin}
        forceTasteBoardActive={liveProfile && !liveGavin}
        forceHomeInactive={liveProfile}
      />
      <div className={`relative overflow-hidden pt-12 ${getModeBackdrop("hybrid", chosenTheme)}`} style={themeStyle}>
        <main className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-12">
          {!liveProfile ? <PreviewModeSwitch active="hybrid" /> : null}

          <section className="mb-8 overflow-hidden rounded-[32px] border border-border bg-bg-secondary/80 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.08)] backdrop-blur sm:mb-10 sm:p-8">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-accent">
                {preview.label}
              </span>
              <span className="rounded-full border border-border px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-text-secondary">
                {preview.sectionLabel}
              </span>
              <span className="rounded-full border border-border px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-text-secondary">
                mode · hybrid
              </span>
              <span className="rounded-full border border-border px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-text-secondary">
                theme · {chosenTheme}
              </span>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-text-muted">{preview.slug}</p>
                <h1 className="mt-2 text-4xl font-black text-text-primary sm:text-5xl">{preview.name}</h1>
                <p className="mt-2 text-sm text-text-secondary">{preview.title}</p>
                <h2 className="mt-5 max-w-4xl text-[2.05rem] font-black leading-[1.05] text-text-primary sm:text-6xl sm:leading-[0.96]">
                  {preview.thesis}
                </h2>
                <div className="mt-5 flex flex-wrap gap-2">
                  {preview.tasteSignals.map((signal) => (
                    <span
                      key={signal}
                      className="rounded-full border border-border bg-bg-primary/55 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-primary sm:text-[11px]"
                    >
                      {signal}
                    </span>
                  ))}
                </div>
                <p className="mt-5 max-w-3xl text-sm leading-7 text-text-secondary sm:text-base">
                  {preview.hybrid.summary}
                </p>
              </div>

              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-3">
                  {preview.stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-[24px] border border-border bg-bg-primary/60 p-4"
                    >
                      <div className="text-2xl font-black text-accent">{stat.value}</div>
                      <div className="mt-2 text-[11px] uppercase tracking-[0.2em] text-text-muted">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-[28px] border border-border bg-bg-primary/60 p-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-accent">
                    AI management style
                  </p>
                  <h3 className="mt-2 text-2xl font-black text-text-primary">
                    {preview.managementStyle.name}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-text-secondary">
                    {preview.managementStyle.summary}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-8 grid gap-5 lg:grid-cols-2 sm:mb-10 sm:gap-6">
            <div className="rounded-[32px] border border-border bg-bg-secondary/82 p-5 sm:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">
                Signature Build
              </p>
              <h2 className="mt-2 text-3xl font-black text-text-primary sm:text-4xl">
                {preview.signatureBuild.name}
              </h2>
              <p className="mt-4 text-sm leading-7 text-text-secondary sm:text-base">
                {preview.signatureBuild.summary}
              </p>
              <div className="mt-6 space-y-3">
                {preview.signatureBuild.proof.map((item) => (
                  <div key={item} className="flex gap-3 text-sm text-text-secondary">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-border bg-bg-secondary/82 p-5 sm:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">
                Signature Thread
              </p>
              <h2 className="mt-2 text-3xl font-black text-text-primary sm:text-4xl">
                {preview.hybrid.threadBridge.name}
              </h2>
              <p className="mt-4 text-sm leading-7 text-text-secondary sm:text-base">
                {preview.hybrid.threadBridge.summary}
              </p>
              <p className="mt-4 text-sm leading-7 text-text-primary/90">
                {preview.hybrid.threadBridge.why}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {preview.hybrid.threadBridge.proof.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-border bg-bg-primary/55 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-primary sm:text-[11px]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section className="mb-8 grid gap-5 lg:grid-cols-[1.02fr_0.98fr] sm:mb-10 sm:gap-6">
            <div className="rounded-[32px] border border-border bg-bg-secondary/82 p-5 sm:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">
                AI Roles
              </p>
              <h2 className="mt-2 text-2xl font-black text-text-primary sm:text-3xl">
                The same AI relationship is doing both execution and reflection.
              </h2>
              <div className="mt-6 grid gap-4">
                {preview.agentRoles.map((role) => (
                  <div
                    key={role.name}
                    className="rounded-[24px] border border-border bg-bg-primary/55 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-lg font-black text-text-primary">{role.name}</div>
                        <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-text-muted">
                          {role.role}
                        </div>
                      </div>
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: role.color }} />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-text-secondary">{role.summary}</p>
                    <p className="mt-3 text-xs uppercase tracking-[0.16em] text-text-muted">{role.evidence}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-border bg-bg-secondary/82 p-5 sm:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">
                Shared rhythm
              </p>
              <h2 className="mt-2 text-2xl font-black text-text-primary sm:text-3xl">
                Build by day, rethink by night.
              </h2>
              <div className="mt-6 rounded-[24px] border border-border bg-bg-primary/55 p-4">
                {hasRhythm ? (
                  <>
                    {hasHourBars ? (
                      <div className="flex h-28 items-end gap-2">
                        {hourEntries.map((entry) => (
                          <div key={entry.hour} className="flex-1">
                            <div
                              className="rounded-t-[6px] bg-accent"
                              style={{ height: `${Math.max(8, (entry.sessions / maxHourSessions) * 100)}%`, opacity: 0.25 + (entry.sessions / maxHourSessions) * 0.75 }}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      renderRhythmFallback(preview.lang === "en" ? "en" : "zh")
                    )}
                    <p className="mt-4 text-sm leading-6 text-text-secondary">
                      Peak window: {preview.whenIbuild.peakWindow} · {preview.whenIbuild.peakWindowSessions} sessions
                    </p>
                  </>
                ) : (
                  renderRhythmFallback(preview.lang === "en" ? "en" : "zh")
                )}
              </div>
              <div className="mt-5 rounded-[24px] border border-border bg-bg-primary/55 p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-text-muted">
                  Shared evidence
                </div>
                <p className="mt-3 text-sm leading-6 text-text-secondary">
                  {preview.hybrid.summary}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-bg-secondary/82 p-5 sm:p-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">Make your own</p>
            <h2 className="mt-2 text-2xl font-black text-text-primary sm:text-3xl">
              Make your own BuilderBio.
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-text-secondary">
              Give BuilderBio the history of your local coding agents and it will turn your build lines, recurring threads, and standout moments into a shareable AI profile.
            </p>
            <div className="mt-6">
              <InstallCommandBox eyebrow="PASTE INTO YOUR CODING AGENT" align="left" />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function TerminalNativeBuilderPage({
  preview,
  liveProfile,
  liveGavin,
  themeStyle,
}: ThemePageProps) {
  return (
    <div className="builderbio-recap-shell">
      <Titlebar
        forceBuiltByActive={liveGavin}
        forceTasteBoardActive={liveProfile && !liveGavin}
        forceHomeInactive={liveProfile}
      />
      <div className={`relative overflow-hidden pt-12 ${getModeBackdrop("builder", "terminal-native")}`} style={themeStyle}>
        <main className="relative mx-auto max-w-6xl px-4 py-6 font-mono sm:px-6 sm:py-12">
          <section className="mb-8 rounded-[32px] border border-[#164d33] bg-[#07160f]/96 p-5 text-[#d7ffe8] shadow-[0_24px_60px_rgba(0,0,0,0.28)] sm:mb-10 sm:p-8">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[#00e676]/25 bg-[#00e676]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#00e676]">
                {preview.label}
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#7eb89a]">
                mode · builder
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#7eb89a]">
                theme · terminal-native
              </span>
            </div>

            <div className="rounded-[28px] border border-[#164d33] bg-black/20 p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#164d33] pb-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.2em] text-[#7eb89a]">$ whoami</div>
                  <div className="mt-2 text-3xl font-black text-[#00e676] sm:text-4xl">{preview.name.toLowerCase()}</div>
                  <div className="mt-2 text-sm text-[#b9f5d4]">{preview.slug}</div>
                </div>
                <div className="rounded-xl border border-[#164d33] px-3 py-2 text-right">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[#7eb89a]">observed pattern</div>
                  <div className="mt-1 text-sm text-[#b9f5d4]">{preview.presentation.themeReason}</div>
                </div>
              </div>

              <div className="mt-5 space-y-3 text-sm leading-6 text-[#b9f5d4]">
                <p><span className="text-[#00e676]">$ thesis</span> {preview.thesis}</p>
                <p><span className="text-[#00e676]">$ recap</span> {preview.recap}</p>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[...preview.stats, getTokenStat(preview)].map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-[#164d33] bg-black/20 p-4">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[#7eb89a]">{stat.label}</div>
                    <div className="mt-2 text-2xl font-black text-[#00e676]">{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <BuilderSharedStoryPack
            preview={preview}
            liveProfile={liveProfile}
            tone="dark"
          />

          <ThemeCtaBlock summary="Give BuilderBio the history of your local coding agents and it will turn your build lines, command habits, and standout sessions into a shareable builder profile." />
        </main>
      </div>
    </div>
  );
}

function EditorialMakerBuilderPage({
  preview,
  liveProfile,
  liveGavin,
  themeStyle,
}: ThemePageProps) {
  return (
    <div className="builderbio-recap-shell">
      <Titlebar
        forceBuiltByActive={liveGavin}
        forceTasteBoardActive={liveProfile && !liveGavin}
        forceHomeInactive={liveProfile}
      />
      <div className={`relative overflow-hidden pt-12 ${getModeBackdrop("builder", "editorial-maker")}`} style={themeStyle}>
        <main className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-12">
          <section className="mb-8 rounded-[32px] border border-[#dde3ff] bg-white/92 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.14)] sm:mb-10 sm:p-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-accent">
                {preview.label}
              </span>
              <span className="rounded-full border border-border px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-text-secondary">
                theme · editorial-maker
              </span>
            </div>

            <p className="mt-5 text-[11px] uppercase tracking-[0.24em] text-text-muted">{preview.slug}</p>
            <h1 className="mt-3 text-5xl font-black text-text-primary [font-family:ui-serif,Georgia,Cambria,'Times_New_Roman',serif] sm:text-6xl">
              {preview.name}
            </h1>
            <h2 className="mt-6 max-w-4xl text-[2.25rem] font-black leading-[1.02] text-text-primary [font-family:ui-serif,Georgia,Cambria,'Times_New_Roman',serif] sm:text-[3.15rem]">
              {preview.thesis}
            </h2>
            <div className="mt-6 grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
              <div className="rounded-[24px] bg-bg-primary/60 p-5">
                <div className="text-[11px] uppercase tracking-[0.18em] text-text-muted">Observed pattern</div>
                <p className="mt-3 text-sm leading-7 text-text-secondary">{preview.presentation.themeReason}</p>
              </div>
              <div>
                <p className="text-sm leading-7 text-text-secondary">{preview.recap}</p>
                <blockquote className="mt-6 border-l-2 border-accent pl-4 text-lg font-bold leading-8 text-text-primary [font-family:ui-serif,Georgia,Cambria,'Times_New_Roman',serif]">
                  “{preview.signatureMoves[0]?.summary || preview.signatureBuild.why}”
                </blockquote>
              </div>
            </div>
          </section>

          <BuilderSharedStoryPack
            preview={preview}
            liveProfile={liveProfile}
            tone="light"
          />

          <ThemeCtaBlock summary="Give BuilderBio the history of your local coding agents and it will turn your projects, working style, and standout moments into a shareable builder portrait." />
        </main>
      </div>
    </div>
  );
}

function NightShiftBuilderPage({
  preview,
  liveProfile,
  liveGavin,
  themeStyle,
}: ThemePageProps) {
  const burstValues = preview.highMoments.map((_, index) => 42 + index * 18);

  return (
    <div className="builderbio-recap-shell">
      <Titlebar
        forceBuiltByActive={liveGavin}
        forceTasteBoardActive={liveProfile && !liveGavin}
        forceHomeInactive={liveProfile}
      />
      <div className={`relative overflow-hidden pt-12 ${getModeBackdrop("builder", "night-shift")}`} style={themeStyle}>
        <main className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-12">
          <section className="mb-8 rounded-[32px] border border-[#4b2852] bg-[#140915]/88 p-5 text-[#ffe8d9] shadow-[0_24px_60px_rgba(0,0,0,0.3)] sm:mb-10 sm:p-8">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[#f97316]/25 bg-[#f97316]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#ff9a53]">
                {preview.label}
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/55">
                theme · night-shift
              </span>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr] lg:gap-8">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">{preview.slug}</p>
                <h1 className="mt-2 text-4xl font-black text-white sm:text-5xl">{preview.name}</h1>
                <h2 className="mt-5 max-w-4xl text-[2.05rem] font-black leading-[1.03] text-white sm:text-6xl">
                  {preview.thesis}
                </h2>
                <p className="mt-5 max-w-3xl text-sm leading-7 text-white/72">{preview.recap}</p>
              </div>
              <div className="grid gap-4">
                <div className="rounded-[28px] border border-[#4b2852] bg-black/15 p-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#ff9a53]">Burst profile</p>
                  <div className="mt-4 flex h-24 items-end gap-2">
                    {burstValues.map((value, index) => (
                      <div key={index} className="flex-1">
                        <div
                          className="rounded-t-[6px] bg-[linear-gradient(180deg,#ffbe8f,#f97316)]"
                          style={{ height: `${value}%` }}
                        />
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-sm leading-6 text-white/72">{preview.presentation.themeReason}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[...preview.stats.slice(0, 3), getTokenStat(preview)].map((stat) => (
                    <div key={stat.label} className="rounded-[24px] border border-[#4b2852] bg-black/15 p-4">
                      <div className="text-2xl font-black text-[#ff9a53]">{stat.value}</div>
                      <div className="mt-2 text-[11px] uppercase tracking-[0.18em] text-white/45">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <BuilderSharedStoryPack
            preview={preview}
            liveProfile={liveProfile}
            tone="dark"
          />

          <ThemeCtaBlock summary="Give BuilderBio the history of your local coding agents and it will turn your spikes, relay moments, and strongest sessions into a shareable builder profile." />
        </main>
      </div>
    </div>
  );
}

function ResearchForgeBuilderPage({
  preview,
  liveProfile,
  liveGavin,
  themeStyle,
}: ThemePageProps) {
  return (
    <div className="builderbio-recap-shell">
      <Titlebar
        forceBuiltByActive={liveGavin}
        forceTasteBoardActive={liveProfile && !liveGavin}
        forceHomeInactive={liveProfile}
      />
      <div className={`relative overflow-hidden pt-12 ${getModeBackdrop("builder", "research-forge")}`} style={themeStyle}>
        <main className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-12">
          <section className="mb-8 rounded-[32px] border border-[#c8efea] bg-white/92 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.14)] sm:mb-10 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-accent">
                {preview.label}
              </span>
              <span className="rounded-full border border-border px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-text-secondary">
                theme · research-forge
              </span>
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-[24px] border border-[#c8efea] bg-bg-primary/60 p-5">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-text-muted">Profile record</div>
                <h1 className="mt-3 text-3xl font-black text-text-primary">{preview.name}</h1>
                <p className="mt-2 text-sm text-text-secondary">{preview.slug}</p>
                <div className="mt-5 space-y-3 text-sm text-text-secondary">
                  <div>mode: builder</div>
                  <div>theme: research-forge</div>
                  <div>reason: {preview.presentation.themeReason}</div>
                </div>
              </div>
              <div>
                <h2 className="text-[1.75rem] font-black leading-[1.08] text-text-primary sm:text-[2.2rem]">
                  {preview.thesis}
                </h2>
                <p className="mt-4 text-sm leading-7 text-text-secondary">{preview.recap}</p>
              </div>
            </div>
          </section>

          <BuilderSharedStoryPack
            preview={preview}
            liveProfile={liveProfile}
            tone="light"
          />

          <ThemeCtaBlock summary="Give BuilderBio the history of your local coding agents and it will turn your evidence clusters, project arcs, and AI roles into a shareable builder dossier." />
        </main>
      </div>
    </div>
  );
}

function CalmCraftBuilderPage({
  preview,
  liveProfile,
  liveGavin,
  themeStyle,
}: ThemePageProps) {
  return (
    <div className="builderbio-recap-shell">
      <Titlebar
        forceBuiltByActive={liveGavin}
        forceTasteBoardActive={liveProfile && !liveGavin}
        forceHomeInactive={liveProfile}
      />
      <div className={`relative overflow-hidden pt-12 ${getModeBackdrop("builder", "calm-craft")}`} style={themeStyle}>
        <main className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-12">
          <section className="mb-8 rounded-[32px] border border-[#3d342c] bg-[#1b1e22]/92 p-6 text-[#efe6dc] shadow-[0_24px_60px_rgba(0,0,0,0.28)] sm:mb-10 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[#d9a86c]/25 bg-[#d9a86c]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-[#e6bb84]">
                {preview.label}
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/55">
                theme · calm-craft
              </span>
            </div>

            <p className="mt-5 text-[11px] uppercase tracking-[0.24em] text-white/42">{preview.slug}</p>
            <h1 className="mt-3 text-4xl font-black text-white sm:text-5xl">{preview.name}</h1>
            <h2 className="mt-6 max-w-4xl text-[2rem] font-black leading-[1.06] text-white sm:text-[2.6rem]">
              {preview.thesis}
            </h2>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-white/68">{preview.recap}</p>

            <div className="mt-7 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="rounded-[24px] border border-[#3d342c] bg-black/10 p-5">
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/42">Signature build</div>
                <div className="mt-2 text-2xl font-black text-[#e6bb84]">{preview.signatureBuild.name}</div>
                <p className="mt-3 text-sm leading-6 text-white/68">{preview.signatureBuild.summary}</p>
              </div>
              <div className="grid gap-2">
                {preview.stats.slice(0, 3).map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-[#3d342c] bg-black/10 px-4 py-3 text-right">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-white/42">{stat.label}</div>
                    <div className="mt-1 text-lg font-black text-white">{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <BuilderSharedStoryPack
            preview={preview}
            liveProfile={liveProfile}
            tone="dark"
          />

          <ThemeCtaBlock summary="Give BuilderBio the history of your local coding agents and it will turn your compounding work, calmer build rhythm, and signature projects into a shareable builder profile." />
        </main>
      </div>
    </div>
  );
}

type SearchParams = Record<string, string | string[] | undefined>;

const VALID_PREVIEW_THEMES = new Set([
  "product-operator",
  "terminal-native",
  "editorial-maker",
  "night-shift",
  "research-forge",
  "calm-craft",
  "companion-journal",
  "idea-salon",
]);

export default async function BuilderBioPreviewPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const subdomain = await getBuilderBioSubdomainFromHost();
  const liveProfile = !!subdomain;
  const liveGavin = subdomain === "gavin";
  const loaded = !liveGavin && subdomain ? await loadPublicBuilderBioRecap(subdomain) : null;

  if (subdomain && !liveGavin && !loaded) {
    notFound();
  }

  const rawPreview = structuredClone((loaded?.recap ?? previewFallback) as typeof previewFallback);
  const params = (await searchParams) ?? {};
  const themeOverrideRaw = Array.isArray(params.theme) ? params.theme[0] : params.theme;
  const themeOverride =
    !liveProfile && themeOverrideRaw && VALID_PREVIEW_THEMES.has(themeOverrideRaw)
      ? themeOverrideRaw
      : null;

  if (themeOverride) {
    rawPreview.presentation.inferredTheme = themeOverride;
    rawPreview.presentation.chosenTheme = themeOverride;
  }

  const preview = rawPreview;
  const lang = preview.lang === "en" ? "en" : "zh";
  const ui = getUiCopy(lang);
  const themeStyle = (loaded?.themeStyle ?? {}) as CSSProperties;
  const pageCopy = buildPageCopy(preview, liveProfile);
  const chosenMode = getChosenMode(preview);

  if (chosenMode === "conversation-first") {
    return (
      <ConversationFirstRecapPage
        preview={preview}
        liveProfile={liveProfile}
        liveGavin={liveGavin}
        themeStyle={themeStyle}
      />
    );
  }

  if (chosenMode === "hybrid") {
    return (
      <HybridRecapPage
        preview={preview}
        liveProfile={liveProfile}
        liveGavin={liveGavin}
        themeStyle={themeStyle}
      />
    );
  }

  const chosenTheme = getChosenTheme(preview);
  if (chosenTheme === "terminal-native") {
    return (
      <TerminalNativeBuilderPage
        preview={preview}
        liveProfile={liveProfile}
        liveGavin={liveGavin}
        themeStyle={themeStyle}
      />
    );
  }
  if (chosenTheme === "editorial-maker") {
    return (
      <EditorialMakerBuilderPage
        preview={preview}
        liveProfile={liveProfile}
        liveGavin={liveGavin}
        themeStyle={themeStyle}
      />
    );
  }
  if (chosenTheme === "night-shift") {
    return (
      <NightShiftBuilderPage
        preview={preview}
        liveProfile={liveProfile}
        liveGavin={liveGavin}
        themeStyle={themeStyle}
      />
    );
  }
  if (chosenTheme === "research-forge") {
    return (
      <ResearchForgeBuilderPage
        preview={preview}
        liveProfile={liveProfile}
        liveGavin={liveGavin}
        themeStyle={themeStyle}
      />
    );
  }
  if (chosenTheme === "calm-craft") {
    return (
      <CalmCraftBuilderPage
        preview={preview}
        liveProfile={liveProfile}
        liveGavin={liveGavin}
        themeStyle={themeStyle}
      />
    );
  }

  return (
    <div className="builderbio-recap-shell">
      <Titlebar
        forceBuiltByActive={liveGavin}
        forceTasteBoardActive={liveProfile && !liveGavin}
        forceHomeInactive={liveProfile}
      />
      <div className={`relative overflow-hidden pt-12 ${getModeBackdrop("builder", chosenTheme)}`} style={themeStyle}>

        <main className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-12">
          {!liveProfile ? <PreviewModeSwitch active="builder" /> : null}

          <section className="mb-8 rounded-3xl border border-accent/20 bg-bg-secondary/70 p-5 shadow-[0_0_0_1px_rgba(255,107,53,0.06)] backdrop-blur sm:mb-10 sm:p-8">
            <div className="mb-5 flex flex-wrap items-center gap-2 sm:mb-6 sm:gap-3">
              <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-accent">
                {pageCopy.badgeLabel}
              </span>
              <span className="rounded-full border border-border px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-text-secondary">
                {pageCopy.sectionLabel}
              </span>
            </div>

            <div className="grid gap-6 sm:gap-8 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <div className="mb-5 flex flex-col items-start gap-4 sm:mb-6 sm:flex-row sm:items-center">
                  <div
                    className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-3xl border border-accent/25 bg-accent/10 text-3xl font-black text-accent shadow-[0_12px_40px_rgba(255,107,53,0.12)] sm:h-20 sm:w-20"
                    style={
                      preview.avatarUrl
                        ? {
                            backgroundImage: `linear-gradient(rgba(17,17,17,0.04), rgba(17,17,17,0.04)), url(${preview.avatarUrl})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }
                        : undefined
                    }
                  >
                    <span className="sr-only">{preview.avatarLetter}</span>
                  </div>
                  <div className="min-w-0">
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
                          className="rounded-full border border-border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-text-secondary transition-colors hover:border-accent/40 hover:text-accent sm:px-3 sm:text-[11px]"
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
                    {ui.generatedAt} {preview.trust.generatedAt}
                  </span>
                  {!liveProfile ? (
                    <>
                      <span className="rounded-full border border-border px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-text-secondary">
                        mode · builder
                      </span>
                      <span className="rounded-full border border-border px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-text-secondary">
                        theme · product-operator
                      </span>
                    </>
                  ) : null}
                </div>

                <h2 className="max-w-4xl text-[2rem] font-black leading-[1.06] text-text-primary sm:leading-[0.98] sm:text-6xl">
                  {preview.thesis}
                </h2>
                <div className="mt-5 flex flex-wrap items-center gap-2 text-[11px] text-text-secondary sm:mt-6 sm:gap-3 sm:text-xs">
                  {preview.agents.map((agent) => (
                    <span
                      key={agent.name}
                      className="inline-flex items-center gap-2 rounded-full border border-border px-2.5 py-1.5 sm:px-3"
                    >
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: agent.color }} />
                      <span className="text-text-primary">{agent.name}</span>
                      <span className="text-text-muted">{agent.role}</span>
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap gap-2 sm:mt-5">
                  {preview.tasteSignals.map((signal) => (
                    <span
                      key={signal}
                      className="rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-text-primary sm:px-3 sm:text-[11px]"
                    >
                      {signal}
                    </span>
                  ))}
                </div>

                <div className="mt-5 space-y-3 lg:hidden">
                  <div className="rounded-3xl border border-accent/25 bg-[linear-gradient(135deg,rgba(255,107,53,0.12),rgba(255,107,53,0.03))] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-accent">
                          {preview.socialCurrency.title}
                        </p>
                        <div className="mt-2 text-4xl font-black leading-none text-text-primary">
                          {formatCompact(preview.totalTokens)}
                        </div>
                        <p className="mt-2 text-sm font-semibold text-text-primary/90">{pageCopy.tokenLabel}</p>
                      </div>
                      <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
                        {pageCopy.socialCurrencyBadge}
                      </span>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-text-secondary">
                      {pageCopy.socialCurrencySummary}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {preview.stats.map((stat) => (
                      <div
                        key={`mobile-${stat.label}`}
                        className="rounded-2xl border border-border bg-bg-primary/55 p-4"
                      >
                        <div className="text-2xl font-black text-accent">{stat.value}</div>
                        <div className="mt-2 text-[11px] uppercase tracking-[0.22em] text-text-muted">
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-3xl border border-border bg-bg-primary/55 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-accent">
                      {preview.managementStyle.label}
                    </p>
                    <h3 className="mt-2 text-xl font-black text-text-primary">
                      {preview.managementStyle.name}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-text-secondary">
                      {preview.managementStyle.summary}
                    </p>
                  </div>
                </div>

                <p className="mt-5 max-w-3xl text-sm leading-7 text-text-secondary sm:text-base">
                  {pageCopy.recap}
                </p>
                <p className="mt-3 max-w-3xl text-xs leading-6 text-text-muted">
                  {pageCopy.trustNote}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-2 text-[11px] text-text-secondary sm:gap-3 sm:text-xs">
                  <span className="rounded-full border border-border px-3 py-1.5 text-text-primary">
                    {preview.dateRange}
                  </span>
                  {preview.keywordSignals.map((keyword) => (
                    <span
                      key={keyword}
                        className="rounded-full border border-border px-2.5 py-1.5 text-text-secondary sm:px-3"
                      >
                        {keyword}
                      </span>
                  ))}
                </div>

              </div>

              <div className="hidden gap-4 lg:grid">
                <div className="rounded-3xl border border-border bg-bg-primary/55 p-4 sm:p-5">
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
                      <div className="mt-2 text-3xl font-black leading-none text-text-primary sm:text-5xl">
                        {formatCompact(preview.totalTokens)}
                      </div>
                      <p className="mt-2 text-sm font-semibold text-text-primary/90">{pageCopy.tokenLabel}</p>
                    </div>
                    <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
                      {pageCopy.socialCurrencyBadge}
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-text-secondary">
                    {pageCopy.socialCurrencySummary}
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
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

                <div className="grid grid-cols-2 gap-3">
                  {preview.stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-2xl border border-border bg-bg-primary/55 p-4"
                    >
                      <div className="text-2xl font-black text-accent sm:text-4xl">{stat.value}</div>
                      <div className="mt-2 text-[11px] uppercase tracking-[0.22em] text-text-muted">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <BuilderSharedStoryPack preview={preview} liveProfile={liveProfile} tone="light" />

          <section className="rounded-3xl border border-border bg-bg-secondary p-5 sm:p-8">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">
                  Make your own
                </p>
                <h2 className="mt-2 text-2xl font-black text-text-primary sm:text-3xl">
                  {pageCopy.ctaHeading}
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-text-secondary">
                {pageCopy.ctaSummary}
              </p>
            </div>

            <InstallCommandBox eyebrow="PASTE INTO YOUR CODING AGENT" align="left" />
          </section>
        </main>
      </div>
    </div>
  );
}
