type JsonObject = Record<string, unknown>;

export interface BuilderBioData {
  D: JsonObject;
  E: JsonObject;
}

function asObject(value: unknown): JsonObject | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as JsonObject;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

function hasKeys(value: unknown): value is JsonObject {
  return !!asObject(value) && Object.keys(value as JsonObject).length > 0;
}

function normalizeSocialLinks(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;

  const record = asObject(value);
  if (!record) return [];

  return Object.entries(record)
    .filter(([, url]) => typeof url === "string" && url.trim() !== "")
    .map(([platform, url]) => ({ platform, url }));
}

function normalizeHourDistribution(value: unknown): Record<string, number> {
  const normalized: Record<string, number> = {};

  if (Array.isArray(value)) {
    for (let hour = 0; hour < 24; hour += 1) {
      normalized[String(hour)] = asNumber(value[hour]) ?? 0;
    }
    return normalized;
  }

  const record = asObject(value);
  for (let hour = 0; hour < 24; hour += 1) {
    normalized[String(hour)] = asNumber(record?.[String(hour)]) ?? 0;
  }
  return normalized;
}

function normalizeTopTools(value: unknown): [string, number][] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (
        Array.isArray(item) &&
        typeof item[0] === "string" &&
        typeof asNumber(item[1]) === "number"
      ) {
        return [item[0], asNumber(item[1]) ?? 0] as [string, number];
      }

      const record = asObject(item);
      const name = asString(record?.name);
      const count = asNumber(record?.count);
      if (!name || count === null) return null;
      return [name, count] as [string, number];
    })
    .filter((item): item is [string, number] => item !== null);
}

function normalizeProjects(value: unknown): JsonObject[] {
  return asArray(value).map((entry) => {
    const project = asObject(entry) ?? {};
    const sessions = project.sessions;
    const sessionCount =
      typeof sessions === "number"
        ? sessions
        : Array.isArray(sessions)
          ? sessions.length
          : asNumber(project.total_sessions) ?? 0;

    if (!Array.isArray(project.tags)) {
      if (Array.isArray(project.tech_stack)) {
        project.tags = project.tech_stack;
      } else if (Array.isArray(project.tech_tags)) {
        project.tags = project.tech_tags;
      }
    }

    project.total_sessions = sessionCount;

    if (asNumber(project.total_turns) === null) {
      project.total_turns = asNumber(project.turns) ?? 0;
    }

    if (asNumber(project.total_tool_calls) === null) {
      project.total_tool_calls = asNumber(project.tool_calls) ?? 0;
    }

    if (project.status === "in-progress") {
      project.status = "in progress";
    }

    return project;
  });
}

export function normalizeBuilderBioData(data: BuilderBioData): BuilderBioData {
  const normalized = structuredClone(data) as BuilderBioData;
  const D = asObject(normalized.D) ?? {};
  const E = asObject(normalized.E) ?? {};
  normalized.D = D;
  normalized.E = E;

  const profile = asObject(D.profile) ?? {};
  D.profile = profile;

  if (!hasKeys(profile.agents_used)) {
    const agentsUsed: JsonObject = {};
    const agents = asObject(profile.agents);

    if (agents) {
      for (const [agent, rawStats] of Object.entries(agents)) {
        const stats = asObject(rawStats);
        agentsUsed[agent] = {
          sessions: asNumber(stats?.sessions) ?? 0,
          first_session: asString(stats?.first_session) ?? "",
        };
      }
    } else if (Array.isArray(profile.agent_badges)) {
      for (const badge of profile.agent_badges) {
        const item = asObject(badge);
        const agent = asString(item?.agent);
        if (!agent) continue;
        agentsUsed[agent] = {
          sessions: asNumber(item?.sessions) ?? 0,
          first_session: asString(item?.first_session) ?? "",
        };
      }
    }

    profile.agents_used = agentsUsed;
  }

  if (!asString(profile.avatar_url) && asString(profile.avatar)) {
    profile.avatar_url = profile.avatar;
  }

  profile.social_links = normalizeSocialLinks(profile.social_links);

  D.projects = normalizeProjects(D.projects);

  if (!hasKeys(E.tech)) {
    const techStack = D.tech_stack;

    if (Array.isArray(techStack)) {
      const tech: Record<string, number> = {};
      for (const item of techStack) {
        const entry = asObject(item);
        const name = asString(entry?.name);
        const score = asNumber(entry?.score);
        if (name && score !== null) tech[name] = score;
      }
      E.tech = tech;
    } else {
      const techRecord = asObject(techStack);
      if (Array.isArray(techRecord?.areas)) {
        const tech: Record<string, number> = {};
        for (const item of techRecord.areas) {
          const entry = asObject(item);
          const name = asString(entry?.name);
          const score = asNumber(entry?.score);
          if (name && score !== null) tech[name] = score;
        }
        E.tech = tech;
      } else if (techRecord) {
        const tech: Record<string, number> = {};
        for (const [name, score] of Object.entries(techRecord)) {
          const numericScore = asNumber(score);
          if (numericScore !== null) tech[name] = numericScore;
        }
        E.tech = tech;
      }
    }
  }

  if (!Array.isArray(E.keywords) || E.keywords.length === 0) {
    const keywords = asArray(D.keywords)
      .map((item) => {
        if (
          Array.isArray(item) &&
          typeof item[0] === "string" &&
          asNumber(item[1]) !== null
        ) {
          return [item[0], asNumber(item[1]) ?? 0];
        }

        const record = asObject(item);
        const word = asString(record?.word);
        const count = asNumber(record?.count);
        if (!word || count === null) return null;
        return [word, count];
      })
      .filter((item): item is [string, number] => item !== null);

    E.keywords = keywords;
  }

  if (!Array.isArray(E.evolution) || E.evolution.length === 0) {
    const source = Array.isArray(D.evolution)
      ? D.evolution
      : Array.isArray(D.collaboration_curve)
        ? D.collaboration_curve
        : [];

    E.evolution = source.map((item) => {
      const entry = asObject(item) ?? {};
      return {
        week: asString(entry.week) ?? "",
        sessions: asNumber(entry.sessions) ?? 0,
        turns: asNumber(entry.turns) ?? 0,
        avg_turns: asNumber(entry.avg_turns) ?? asNumber(entry.avg) ?? 0,
      };
    });
  }

  const time = asObject(D.time);
  const timeDetail = asObject(E.time_detail);
  if (!hasKeys(E.time) && time) {
    E.time = {
      hour_distribution: normalizeHourDistribution(time.hour_distribution),
      period_data: asObject(time.period_data) ?? asObject(time.periods) ?? {},
      builder_type: asString(time.builder_type) ?? "",
      peak_hour: asNumber(time.peak_hour) ?? 0,
      peak_text: asString(time.peak_text) ?? asString(timeDetail?.peak_text) ?? "",
      peak_detail:
        asString(time.peak_detail) ?? asString(timeDetail?.peak_detail) ?? "",
    };
  } else {
    const normalizedTime = asObject(E.time);
    if (normalizedTime) {
      normalizedTime.hour_distribution = normalizeHourDistribution(
        normalizedTime.hour_distribution
      );
      if (!hasKeys(normalizedTime.period_data) && time) {
        normalizedTime.period_data =
          asObject(time.period_data) ?? asObject(time.periods) ?? {};
      }
      if (!asString(normalizedTime.peak_text) && asString(timeDetail?.peak_text)) {
        normalizedTime.peak_text = timeDetail?.peak_text;
      }
      if (
        !asString(normalizedTime.peak_detail) &&
        asString(timeDetail?.peak_detail)
      ) {
        normalizedTime.peak_detail = timeDetail?.peak_detail;
      }
    }
  }

  if (!hasKeys(E.comparison) && hasKeys(E.agent_comparison)) {
    const comparison: JsonObject = {};
    const agentComparison = asObject(E.agent_comparison) ?? {};

    for (const [agent, rawStats] of Object.entries(agentComparison)) {
      const stats = asObject(rawStats) ?? {};
      comparison[agent] = {
        sessions: asNumber(stats.sessions) ?? 0,
        total_turns: asNumber(stats.total_turns) ?? asNumber(stats.turns) ?? 0,
        avg_turns: asNumber(stats.avg_turns) ?? 0,
        total_tool_calls:
          asNumber(stats.total_tool_calls) ?? asNumber(stats.tool_calls) ?? 0,
        top_tools: normalizeTopTools(stats.top_tools),
        distribution: asObject(stats.distribution) ?? asObject(stats.length_dist) ?? {},
      };
    }

    E.comparison = comparison;
  }

  const style = asObject(D.style) ?? {};
  D.style = style;
  if (!asString(style.style_label)) {
    const promptType = asString(style.prompt_type);
    const rhythm = asString(style.session_rhythm);
    if (promptType || rhythm) {
      style.style_label = [promptType, rhythm].filter(Boolean).join(" × ");
    }
  }
  if (!asString(style.style_sub)) {
    style.style_sub =
      asString(style.rhythm_desc) ?? asString(style.tool_pref_desc) ?? "";
  }
  if (!asString(style.prompt_type_label) && asString(style.prompt_type)) {
    style.prompt_type_label = style.prompt_type;
  }
  if (!asString(style.rhythm_label) && asString(style.session_rhythm)) {
    style.rhythm_label = style.session_rhythm;
  }
  if (!asString(style.tool_pref_label) && asString(style.tool_preference)) {
    style.tool_pref_label = style.tool_preference;
  }
  if (!asString(style.loyalty_label) && asString(style.agent_loyalty)) {
    style.loyalty_label = style.agent_loyalty;
  }

  const highlights = asObject(D.highlights) ?? {};
  D.highlights = highlights;
  const biggestSession = asObject(highlights.biggest_session);
  if (
    biggestSession &&
    !asString(biggestSession.display) &&
    asString(biggestSession.project)
  ) {
    biggestSession.display = biggestSession.project;
  }
  const marathonSession = asObject(highlights.marathon_session);
  if (
    marathonSession &&
    !asString(marathonSession.display) &&
    asString(marathonSession.project)
  ) {
    marathonSession.display = marathonSession.project;
  }
  if (
    !asString(highlights.favorite_prompt) &&
    asString(asObject(E.featured_prompt)?.content)
  ) {
    highlights.favorite_prompt = asObject(E.featured_prompt)?.content;
  }

  return normalized;
}
