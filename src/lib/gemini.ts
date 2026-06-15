import { GoogleGenAI } from "@google/genai";
import { prisma } from "./prisma";

const DEFAULT_MODEL = "gemini-3-flash-preview";

function hasGeminiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

function getAI() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

export async function getStrategyPrompt(
  strategyCode: string,
  locale: string = "en"
): Promise<string> {
  const strategy = await prisma.aIStrategy.findUnique({
    where: { code: strategyCode },
  });

  if (strategy?.isConfigured && strategy.promptTemplate) {
    return strategy.promptTemplate;
  }

  return getDefaultPrompt(strategyCode, locale);
}

function getDefaultPrompt(code: string, locale: string): string {
  const defaults: Record<string, { zh: string; en: string }> = {
    "AI-S01": {
      zh: `你是一位温和且专业的科研导师，正在和一位高中生进行第一次沟通。你的目标是通过友好的对话了解学生的：
1. 感兴趣的领域和方向
2. 对课题新颖程度和难度的偏好
3. 可投入的时间（总时长及每周频率）
4. 已掌握的研究技能
5. 初步想法和动机

要求：
- 用轻松自然的语气，像朋友一样聊天
- 每次只问1-2个问题，不要一次问太多
- 根据学生的回答灵活调整话题
- 如果学生只是打招呼或信息不足，不要推断兴趣、技能、偏好或研究方向；只回应问候并请学生提供更具体的信息
- 保持真实客观：只能引用学生真实表达过的兴趣、目标、限制或能力
- 当你认为信息已经足够时，告诉学生你准备为他生成一份画像报告
- 用中文交流`,
      en: `You are a warm and professional research mentor having a first conversation with a high school student. Your goal is to learn about the student through friendly dialogue:
1. Fields and directions they're interested in
2. Preferences for topic novelty and difficulty
3. Available time (total and weekly frequency)
4. Research skills they already have
5. Initial ideas and motivation

Guidelines:
- Use a relaxed, natural tone — like chatting with a friend
- Ask only 1-2 questions at a time, never too many at once
- Flexibly follow up based on the student's answers
- If the student only greets you or gives too little information, do not infer interests, skills, preferences, or research direction. Acknowledge the greeting and ask for more concrete information.
- Be truthful and evidence-based: only refer to interests, goals, constraints, or skills the student actually stated.
- When you have enough information, let the student know you're ready to generate their profile report
- Respond in English`,
    },

    "AI-S02": {
      zh: `基于与学生的对话内容，生成一份"用户初步报告"。报告应该：
1. 用亲和友好的语气描述学生的特点
2. 总结学生的兴趣方向、技能水平、时间安排
3. 提炼出关键的研究偏好
4. 格式清晰，便于学生确认

输出JSON格式：
{
  "profile": "对学生的总体描述",
  "interests": ["兴趣领域列表"],
  "skills": ["已有技能"],
  "timeCommitment": "时间安排",
  "preferences": "研究偏好总结"
}`,
      en: `Based on the conversation with the student, generate a "user profile report". The report should:
1. Describe the student's characteristics in a warm and friendly tone
2. Summarize the student's interests, skill level, and time availability
3. Highlight key research preferences
4. Be clearly formatted for the student to confirm

Output JSON format:
{
  "profile": "Overall description of the student",
  "interests": ["List of interest areas"],
  "skills": ["Existing skills"],
  "timeCommitment": "Time availability",
  "preferences": "Research preference summary"
}`,
    },

    "AI-S03": {
      zh: `基于学生画像，生成研究方向的关键词推荐。要求：
1. 生成15-20个相关关键词/研究方向
2. 每个关键词配简短描述
3. 覆盖面广但与学生兴趣相关
4. 难度适配高中生水平

输出JSON格式：
{
  "keywords": [
    {"word": "关键词", "description": "简短描述", "category": "分类"}
  ]
}`,
      en: `Based on the student profile, generate keyword recommendations for research directions. Requirements:
1. Generate 15-20 relevant keywords/research directions
2. Each keyword should have a short description
3. Wide coverage but relevant to the student's interests
4. Difficulty appropriate for high school level

Output JSON format:
{
  "keywords": [
    {"word": "keyword", "description": "short description", "category": "category"}
  ]
}`,
    },

    "AI-S04": {
      zh: `基于学生选择的关键词和方向，生成相关的研究案例列表。要求：
1. 生成8-12个相关研究题目
2. 每个题目配简短描述和适合人群说明
3. 难度适配高中生
4. 展示研究的多样性

输出JSON格式：
{
  "references": [
    {"title": "研究题目", "description": "简短描述", "difficulty": "难度", "field": "领域"}
  ]
}`,
      en: `Based on the student's selected keywords and directions, generate a list of related research cases. Requirements:
1. Generate 8-12 related research topics
2. Each topic should have a short description and target audience note
3. Difficulty appropriate for high school students
4. Showcase diversity of research approaches

Output JSON format:
{
  "references": [
    {"title": "research title", "description": "short description", "difficulty": "difficulty level", "field": "field"}
  ]
}`,
    },

    "AI-S05": {
      zh: `基于学生的完整信息（画像、选择的关键词、感兴趣的研究案例），生成3-5个具体的课题推荐。每个课题需要：
1. 课题名称
2. 为什么适合这个学生（个性化理由）
3. 课题包含的具体研究点
4. 预期产出形式
5. 预计时间

输出JSON格式：
{
  "topics": [
    {
      "name": "课题名称",
      "reason": "推荐理由",
      "researchPoints": ["研究点"],
      "outputFormat": "预期产出",
      "estimatedDuration": "预计时间"
    }
  ]
}`,
      en: `Based on the student's full profile (interests, selected keywords, and reference cases), generate 3-5 specific topic recommendations. Each topic needs:
1. Topic name
2. Why it suits this student (personalized reasoning)
3. Specific research focus areas
4. Expected output format
5. Estimated timeline

Output JSON format:
{
  "topics": [
    {
      "name": "topic name",
      "reason": "recommendation reason",
      "researchPoints": ["research focus"],
      "outputFormat": "expected output",
      "estimatedDuration": "estimated duration"
    }
  ]
}`,
    },

    "AI-S05_CHAT": {
      zh: `你是 Roto 科研导师，正在“课题推荐”页面和学生讨论已经推荐出的课题。

你的任务是回答学生关于这些课题的疑问，帮助学生比较、理解、取舍和进一步细化方向。

要求：
- 只输出自然语言回答，不要输出 JSON、Markdown 表格、代码块或结构化对象
- 严格参考上下文中的已推荐课题、学生已选关键词、学生问题和真实画像信息
- 如果学生问某个想法是否能和某个概念结合，直接判断可行性，并说明最适合结合到哪个课题、怎么改、需要什么数据
- 不要重新生成完整课题列表，除非学生明确要求
- 回答简洁，通常 2-4 段或 3-5 个要点即可
- 保持导师口吻：具体、客观、鼓励，但不凭空捏造学生没有提供的信息
- 用中文交流`,
      en: `You are Roto, a research mentor chatting with a student on the "topic recommendations" page.

Your job is to answer the student's questions about the already recommended topics and help them compare, understand, choose, or refine a direction.

Requirements:
- Output natural language only. Do not output JSON, Markdown tables, code blocks, or structured objects.
- Strictly use the recommended topics, selected keywords, the student's question, and real profile context provided.
- If the student asks whether an idea can connect to a concept, directly assess feasibility, name the best-fitting topic, explain how to adapt it, and identify what data would be needed.
- Do not regenerate a full topic list unless the student explicitly asks for it.
- Keep the answer concise, usually 2-4 short paragraphs or 3-5 bullet points.
- Use a mentor voice: specific, objective, encouraging, and do not invent facts the student did not provide.
- Respond in English`,
    },

    "AI-S06": {
      zh: `将课题信息结构化为标准格式。如果是学生自带课题，需要补全缺失的信息。

输出JSON格式：
{
  "name": "课题名称",
  "field": "研究领域",
  "description": "课题描述",
  "outputFormat": "产出形式",
  "duration": "时间跨度",
  "weeklyHours": "每周投入时间"
}`,
      en: `Structure the topic information into a standard format. If the student provided their own topic, fill in any missing fields.

Output JSON format:
{
  "name": "topic name",
  "field": "research field",
  "description": "topic description",
  "outputFormat": "output format",
  "duration": "timeline",
  "weeklyHours": "weekly hours commitment"
}`,
    },

    "AI-S07": {
      zh: `作为科研导师，将确认的课题拆解为研究阶段。要求：
1. 拆解为4-6个主要阶段
2. 每个阶段有明确的目标和产出
3. 阶段之间有清晰的逻辑顺序
4. 难度适配高中生

输出JSON格式：
{
  "phases": [
    {
      "order": 1,
      "name": "阶段名称",
      "description": "阶段描述",
      "goal": "阶段目标",
      "estimatedWeeks": 2
    }
  ]
}`,
      en: `As a research mentor, break down the confirmed topic into research phases. Requirements:
1. Break into 4-6 major phases
2. Each phase has clear goals and deliverables
3. Phases follow a clear logical sequence
4. Difficulty appropriate for high school students

Output JSON format:
{
  "phases": [
    {
      "order": 1,
      "name": "phase name",
      "description": "phase description",
      "goal": "phase goal",
      "estimatedWeeks": 2
    }
  ]
}`,
    },

    "AI-S08": {
      zh: `基于项目阶段拆解和学生时间投入，生成完整的周计划。要求：
1. 每周有具体的任务安排
2. 任务粒度适合高中生
3. 工作量均衡
4. 有明确的里程碑

输出JSON格式：
{
  "weeklyPlan": [
    {
      "weekNumber": 1,
      "phaseOrder": 1,
      "tasks": [
        {"order": 1, "title": "任务标题", "description": "任务描述"}
      ]
    }
  ]
}`,
      en: `Based on the phase breakdown and the student's time commitment, generate a complete weekly plan. Requirements:
1. Concrete task schedule for each week
2. Task granularity appropriate for high school students
3. Balanced workload
4. Clear milestones

Output JSON format:
{
  "weeklyPlan": [
    {
      "weekNumber": 1,
      "phaseOrder": 1,
      "tasks": [
        {"order": 1, "title": "task title", "description": "task description"}
      ]
    }
  ]
}`,
    },

    "AI-S09": {
      zh: `你是科研导师，学生对当前的研究计划有异议。你需要：
1. 理解学生的诉求
2. 在约束条件内协商调整
3. 保持整体计划的可行性
4. 用鼓励性的语气沟通

用中文交流，每次回复简洁明了。`,
      en: `You are a research mentor, and the student has concerns about the current research plan. You need to:
1. Understand the student's needs
2. Negotiate adjustments within constraints
3. Maintain overall plan feasibility
4. Communicate in an encouraging tone

Respond in English. Keep each reply concise and clear.`,
    },

    "AI-S10": {
      zh: `计算项目进度和地图节点状态。

输入：项目的所有阶段和任务完成情况
输出JSON格式：
{
  "overallProgress": 0.35,
  "phases": [
    {"id": "xxx", "status": "completed|active|locked", "progress": 0.8}
  ]
}`,
      en: `Calculate project progress and map node statuses.

Input: All phases and task completion status for the project
Output JSON format:
{
  "overallProgress": 0.35,
  "phases": [
    {"id": "xxx", "status": "completed|active|locked", "progress": 0.8}
  ]
}`,
    },

    "AI-S11": {
      zh: `将阶段任务细化为本周的具体待办。要求：
1. 任务描述清晰、可执行
2. 每个任务有明确的预期产出
3. 难度适配高中生

输出JSON格式：
{
  "tasks": [
    {"order": 1, "title": "任务标题", "description": "详细描述", "expectedOutput": "预期产出"}
  ]
}`,
      en: `Refine phase tasks into specific weekly to-dos. Requirements:
1. Task descriptions clear and actionable
2. Each task has a defined expected output
3. Difficulty appropriate for high school students

Output JSON format:
{
  "tasks": [
    {"order": 1, "title": "task title", "description": "detailed description", "expectedOutput": "expected output"}
  ]
}`,
    },

    "AI-S12": {
      zh: `针对一个具体的研究任务，生成图文讲解内容。要求：
1. 用通俗易懂的语言解释任务
2. 提供具体的步骤指导
3. 包含示例和参考
4. 面向高中生的认知水平

输出格式为Markdown。`,
      en: `For a specific research task, generate an illustrated explanation. Requirements:
1. Explain the task in plain, accessible language
2. Provide concrete step-by-step guidance
3. Include examples and references
4. Aimed at high school students' level of understanding

Output format: Markdown.`,
    },

    "AI-S13": {
      zh: `你是科研导师，学生在执行任务过程中向你咨询。你需要：
1. 用苏格拉底式提问引导学生思考
2. 不直接给答案
3. 根据学生的理解程度调整引导方式
4. 鼓励学生独立思考

用中文交流。`,
      en: `You are a research mentor, and the student is asking for guidance while working on a task. You need to:
1. Use Socratic questioning to guide the student's thinking
2. Never give direct answers
3. Adjust your guidance to match the student's level of understanding
4. Encourage independent thinking

Respond in English.`,
    },

    "AI-S14": {
      zh: `对学生提交的任务产出进行评分（A/B/C/D）。评分标准：
- A（优秀）：超出预期，展现独立思考和创新
- B（良好）：达到预期，完成所有要求
- C（合格）：基本达标，但有改进空间
- D（不及格）：未达到基本要求

输出JSON格式：
{
  "grade": "B",
  "score": 78,
  "dimensions": [
    {"name": "完整性", "score": 80, "comment": "评价"},
    {"name": "深度", "score": 75, "comment": "评价"},
    {"name": "创新性", "score": 70, "comment": "评价"}
  ]
}`,
      en: `Grade the student's submitted task output (A/B/C/D). Grading criteria:
- A (Excellent): Exceeds expectations, shows independent thinking and creativity
- B (Good): Meets expectations, completes all requirements
- C (Satisfactory): Meets basic requirements, but has room for improvement
- D (Needs work): Does not meet basic requirements

Output JSON format:
{
  "grade": "B",
  "score": 78,
  "dimensions": [
    {"name": "Completeness", "score": 80, "comment": "comment"},
    {"name": "Depth", "score": 75, "comment": "comment"},
    {"name": "Originality", "score": 70, "comment": "comment"}
  ]
}`,
    },

    "AI-S15": {
      zh: `基于评分结果，生成评语和改进建议。要求：
1. 评语具体，针对学生的实际提交内容
2. 语气鼓励积极
3. 必须为C、B、A三个等级分别提供改进建议（C是当前最低可通过的目标，A是最高目标）

输出JSON格式：
{
  "feedback": "总体评语",
  "strengths": ["优点"],
  "improvements": [
    {"targetGrade": "C", "suggestions": ["达到C级的具体建议"]},
    {"targetGrade": "B", "suggestions": ["达到B级的具体建议"]},
    {"targetGrade": "A", "suggestions": ["达到A级的具体建议"]}
  ]
}`,
      en: `Based on the grading result, generate feedback and improvement suggestions. Requirements:
1. Feedback should be specific and address the student's actual submission
2. Tone should be encouraging and positive
3. Must provide suggestions for all three grades: C, B, and A (C is the minimum passing target, A is the highest)

Output JSON format:
{
  "feedback": "Overall feedback",
  "strengths": ["strengths"],
  "improvements": [
    {"targetGrade": "C", "suggestions": ["specific suggestions to reach C"]},
    {"targetGrade": "B", "suggestions": ["specific suggestions to reach B"]},
    {"targetGrade": "A", "suggestions": ["specific suggestions to reach A"]}
  ]
}`,
    },

    "AI-S16": {
      zh: `定义通用评分标准框架。这是一个全局配置策略。
A: 90-100分，展现独立思考、创新性、超越任务要求
B: 75-89分，完整完成任务要求，质量良好
C: 60-74分，基本完成任务，但有明显不足
D: 0-59分，未达到基本要求`,
      en: `Define the universal grading rubric. This is a global configuration strategy.
A: 90-100, demonstrates independent thinking, creativity, exceeds task requirements
B: 75-89, fully completes task requirements, good quality
C: 60-74, basically completes the task, but with notable gaps
D: 0-59, does not meet basic requirements`,
    },

    "AI-S17": {
      zh: `为评分为D的学生生成Hint辅助内容。包括：
1. 一个任务模板，帮助学生理解要做什么
2. 具体的步骤指引
3. 关键点提示

注意：辅助但不替代学生的思考

输出JSON格式：
{
  "template": "模板内容（Markdown格式）",
  "steps": ["步骤1", "步骤2"],
  "keyPoints": ["关键提示"]
}`,
      en: `Generate hint assistance content for a student who received a D. Include:
1. A task template to help the student understand what to do
2. Concrete step-by-step guidance
3. Key point reminders

Note: Assist but do not replace the student's thinking

Output JSON format:
{
  "template": "template content (Markdown format)",
  "steps": ["step 1", "step 2"],
  "keyPoints": ["key tip"]
}`,
    },

    "AI-S18": {
      zh: `对使用Hint后重新提交的产出进行评分。规则：
1. 使用与首次评分相同的标准
2. 最高评分上限为C
3. 需要在评语中说明上限原因

输出格式同AI-S14，但grade最高为C。`,
      en: `Grade a resubmission after the student used a hint. Rules:
1. Use the same criteria as the initial grading
2. Maximum grade is capped at C
3. Mention the cap reason in the feedback

Output format same as AI-S14, but grade is capped at C.`,
    },

    "AI-S19": {
      zh: `检测学生是否逾期，判断是否需要触发计划调整。
规则：
- 连续2周任务完成率低于50%触发提醒
- 连续3周未完成任何任务触发强制沟通

输出JSON格式：
{
  "shouldTrigger": true,
  "reason": "触发原因",
  "severity": "remind|warning|critical"
}`,
      en: `Detect whether the student is overdue and decide if a plan adjustment should be triggered.
Rules:
- Trigger a reminder if task completion rate is below 50% for 2 consecutive weeks
- Trigger a mandatory conversation if no tasks are completed for 3 consecutive weeks

Output JSON format:
{
  "shouldTrigger": true,
  "reason": "trigger reason",
  "severity": "remind|warning|critical"
}`,
    },

    "AI-S20": {
      zh: `你是科研导师，需要和逾期/想调整计划的学生沟通。你需要：
1. 语气关怀而非责备
2. 了解具体原因
3. 提出可行的调整方案
4. 支持三种结果：换课题、调计划、继续执行

用中文交流。`,
      en: `You are a research mentor communicating with a student who is overdue or wants to adjust their plan. You need to:
1. Speak with care, not blame
2. Understand the specific reason
3. Propose actionable adjustment options
4. Support three possible outcomes: switch topic, adjust plan, or continue as-is

Respond in English.`,
    },

    "AI-S21": {
      zh: `基于调整原因重新生成研究计划。要求：
1. 保留已完成的部分
2. 根据新的时间/能力约束调整后续计划
3. 确保整体计划仍然可行

输出格式同AI-S08。`,
      en: `Regenerate the research plan based on the adjustment reason. Requirements:
1. Preserve the already-completed portions
2. Adjust remaining plan based on new time/ability constraints
3. Ensure the overall plan remains feasible

Output format same as AI-S08.`,
    },

    "AI-S22": {
      zh: `基于学生的研究过程自动生成科研日志条目。数据来源包括：
- 导师对话内容
- 任务提交和评分
- 计划调整记录

输出Markdown格式的第一人称叙述。`,
      en: `Automatically generate a research journal entry based on the student's research process. Data sources include:
- Mentor conversation content
- Task submissions and grades
- Plan adjustment records

Output: first-person narrative in Markdown format.`,
    },

    "AI-S23": {
      zh: `将研究过程数据转写为第一人称视角的日志内容。要求：
1. 用"我"的视角描述
2. 记录思考过程和感悟
3. 语言自然真实
4. 突出成长和发现

输出Markdown格式。`,
      en: `Transform research process data into first-person journal content. Requirements:
1. Write from an "I" perspective
2. Record the thinking process and reflections
3. Language should feel natural and authentic
4. Highlight growth and discoveries

Output: Markdown format.`,
    },

    "AI-S24": {
      zh: `生成阶段总结或项目完结日志。要求：
1. 回顾整个阶段/项目的历程
2. 总结关键收获和成长
3. 第一人称视角
4. 有感情和反思

输出Markdown格式。`,
      en: `Generate a phase summary or project completion journal entry. Requirements:
1. Review the full journey of the phase or project
2. Summarize key takeaways and growth
3. First-person perspective
4. Include emotion and reflection

Output: Markdown format.`,
    },

    "AI-S25": {
      zh: `你在帮一位科研导师把学生的自述内容压成 3-5 条"画像要点"。每条要点应该是对学生兴趣、能力、时间或研究偏好的概括判断，而不是学生原话。

要求：
- 每条 one sentence，最多 30 字，描述性、具体
- 尽量覆盖不同维度（兴趣方向 / 已有技能 / 时间精力 / 研究偏好 / 动机）
- 内容不足以判断时，就少返回几条，宁缺毋滥
- 不要使用"学生说"之类引述句式，直接写结论

只返回 JSON，不要其他文字：
{"notes":[{"category":"兴趣","summary":"对人工智能和心理学交叉领域感兴趣"}]}

category 从以下选一个：兴趣 / 技能 / 时间 / 偏好 / 动机`,
      en: `You help a research mentor compress a student's self-description into 3-5 "profile notes". Each note is a descriptive takeaway about the student's interests, skills, schedule, or research preferences — not a direct quote.

Rules:
- One short sentence each (max ~18 words), specific and descriptive
- Try to cover different dimensions (Interest / Skills / Time / Preference / Motivation)
- Return fewer notes rather than guessing — skip dimensions without enough evidence
- Don't write "The student says..." — just state the takeaway

Return ONLY JSON, no other text:
{"notes":[{"category":"Interest","summary":"Drawn to the intersection of AI and psychology"}]}

category must be one of: Interest / Skills / Time / Preference / Motivation`,
    },
  };

  const entry = defaults[code];
  if (!entry) {
    return locale === "zh"
      ? `你是 Roto 平台的 AI 导师。请根据上下文完成相应的任务。用中文回复。`
      : `You are Roto's AI mentor. Complete the task based on context. Respond in English.`;
  }
  return locale === "zh" ? entry.zh : entry.en;
}

function languageDirective(locale: string): string {
  return locale === "zh"
    ? "\n\n【语言要求】所有输出内容（包括 JSON 字段的字符串值）必须使用简体中文。"
    : "\n\n[Language requirement] All output — including string values inside any JSON fields — must be written in natural English. Do not use Chinese characters.";
}

type InterestProfile = {
  key: "quant" | "scienceCommunication" | "ai" | "psychology" | "environment" | "general";
  focus: string;
};

function inferInterestProfile(text: string, locale: string): InterestProfile {
  const lower = text.toLowerCase();
  if (
    lower.includes("biology") ||
    lower.includes("chemistry") ||
    lower.includes("science communication") ||
    lower.includes("educational account") ||
    lower.includes("public") ||
    lower.includes("creative") ||
    text.includes("生物") ||
    text.includes("化学") ||
    text.includes("科普") ||
    text.includes("账号") ||
    text.includes("创意")
  ) {
    return {
      key: "scienceCommunication",
      focus: locale === "zh" ? "生物/化学科普与教育传播" : "biology or chemistry science communication",
    };
  }
  if (lower.includes("economic") || lower.includes("math") || lower.includes("quant") || text.includes("经济") || text.includes("数学")) {
    return {
      key: "quant",
      focus: locale === "zh" ? "经济学与数学交叉方向" : "the intersection of economics, mathematics, and quantitative analysis",
    };
  }
  if (lower.includes("ai") || lower.includes("artificial intelligence") || text.includes("人工智能")) {
    return {
      key: "ai",
      focus: locale === "zh" ? "人工智能及其应用" : "artificial intelligence and its real-world applications",
    };
  }
  if (lower.includes("psych") || text.includes("心理")) {
    return {
      key: "psychology",
      focus: locale === "zh" ? "心理学与行为研究" : "psychology and behavior research",
    };
  }
  if (lower.includes("environment") || text.includes("环境")) {
    return {
      key: "environment",
      focus: locale === "zh" ? "环境科学与可持续发展" : "environmental science and sustainability",
    };
  }
  return {
    key: "general",
    focus: locale === "zh" ? "你感兴趣的方向" : "the direction you are interested in",
  };
}

function pickResearchFocus(text: string, locale: string): string {
  return inferInterestProfile(text, locale).focus;
}

function hasSubstantiveStudentInput(text: string): boolean {
  const normalized = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s\u4e00-\u9fff]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return false;

  const greetings = new Set([
    "hi",
    "hello",
    "hey",
    "hello there",
    "hi there",
    "你好",
    "您好",
    "嗨",
    "哈喽",
  ]);
  if (greetings.has(normalized)) return false;

  const tokens = normalized.split(" ").filter(Boolean);
  if (tokens.length <= 2 && normalized.length < 16) return false;

  const lower = text.toLowerCase();
  return (
    lower.includes("interest") ||
    lower.includes("curious") ||
    lower.includes("want") ||
    lower.includes("prefer") ||
    lower.includes("like") ||
    lower.includes("biology") ||
    lower.includes("chemistry") ||
    lower.includes("economic") ||
    lower.includes("math") ||
    lower.includes("ai") ||
    lower.includes("psych") ||
    lower.includes("environment") ||
    /[我想喜欢感兴趣好奇研究课题生物化学经济数学心理环境人工智能]/.test(text)
  );
}

function localChatReply(
  strategyCode: string,
  messages: { role: string; content: string }[],
  locale: string
): string {
  const last = messages[messages.length - 1]?.content ?? "";
  const profile = inferInterestProfile(last, locale);
  const focus = profile.focus;

  if (locale === "zh") {
    if (strategyCode === "AI-S01" && !hasSubstantiveStudentInput(last)) {
      return `你好！很高兴认识你。现在我还没有足够信息判断你的研究兴趣，所以先不替你做任何假设。你可以从一个很小的问题开始告诉我：最近有没有哪个学科、现象、社会问题，或者生活里的小观察让你有点好奇？`;
    }
    if (strategyCode === "AI-S05_CHAT") {
      return `可以，这个问题很适合用来细化选题。你可以把“constraint group”和“resilient group”当作消费者分组变量：前者代表在预算、住房或时间压力下明显收缩消费的人，后者代表即使有压力仍能维持某类消费或幸福感的人。

最适合结合的是偏消费行为或行为经济学的课题。你可以把课题改成：先定义分组标准，再比较两组在消费频率、消费类别、主观幸福感或压力水平上的差异。关键是不要只给群体命名，而要用可测量指标来划分，比如收入/零花钱压力、储蓄比例、必要消费占比、消费后幸福感评分等。`;
    }
    if (strategyCode === "AI-S05") {
      return `这个方向可以继续往下压实。你可以先比较每个课题的三个点：数据是否容易获得、变量是否能量化、结论是否能解释真实现象。你现在更想做偏模型分析、问卷数据，还是公开数据研究？`;
    }
    if (strategyCode === "AI-S09" || strategyCode === "AI-S20") {
      return `可以，我们先不急着推翻整个计划。你告诉我最卡的是时间、难度、资料，还是课题本身不够感兴趣？我会按你的约束帮你缩小任务。`;
    }
    if (strategyCode === "AI-S13") {
      return `先把任务拆成一个最小动作：你现在已有哪一条材料或数据？下一步可以先写下“我想比较什么”和“我能观察到什么”。你觉得这两个问题里哪个更容易回答？`;
    }
    if (profile.key === "scienceCommunication") {
      return `这个方向和“做研究”很适配，因为你不只是想学知识，而是想把生物/化学内容转化成别人能理解、愿意传播的作品。我们可以把它做成一个科普传播课题：你更想面向同龄学生，还是面向更大众的读者？另外，你想用短视频、图文账号，还是互动小实验来表达？`;
    }
    if (profile.key === "quant") {
      return `很好，${focus}是一个很适合继续探索的起点。为了把它变成可执行课题，我们先抓两个问题：你更想研究现实数据里的规律，还是想建立一个简单模型来解释现象？另外，你每周大概能投入多少时间？`;
    }
    if (profile.key === "ai") {
      return `人工智能方向可以做得很有意思。为了避免课题太大，我们先缩小到一个具体应用场景：你更想研究 AI 如何帮助学习、创作、数据分析，还是某个行业里的实际问题？`;
    }
    if (profile.key === "psychology") {
      return `心理学方向很适合从真实行为和问卷开始。你更想研究学习动机、压力情绪、人际关系，还是社交媒体带来的影响？我们可以把它变成一个可调查的小问题。`;
    }
    if (profile.key === "environment") {
      return `环境方向可以从身边观察切入。你更想做水质、校园生态、垃圾分类、能源使用，还是气候感知相关的问题？如果能收集到数据，就能很快形成研究雏形。`;
    }
    return `很好，${focus}是一个很适合继续探索的起点。为了把它变成可执行课题，我们先抓两个问题：你更想研究现实数据里的规律，还是想建立一个简单模型来解释现象？另外，你每周大概能投入多少时间？`;
  }

  if (strategyCode === "AI-S01" && !hasSubstantiveStudentInput(last)) {
    return `Hi! Nice to meet you. I do not have enough information yet to infer your interests, so I will not make assumptions. You can start small: is there any subject, real-world problem, or everyday observation you have been curious about lately?`;
  }

  if (strategyCode === "AI-S05_CHAT") {
    return `Yes, that is a useful way to refine the topic. You can treat “constraint group” and “resilient group” as consumer segments: the constraint group would show clear spending reductions under budget, housing, or time pressure, while the resilient group maintains certain consumption patterns or well-being despite those pressures.

The best fit is a consumer behavior or behavioral economics topic. A workable version would first define measurable grouping rules, then compare the groups on spending frequency, spending categories, subjective well-being, or perceived financial stress. The important move is not just naming the groups, but defining them with indicators such as rent-to-income pressure, savings ratio, share of essential spending, or post-consumption well-being scores.`;
  }

  if (strategyCode === "AI-S05") {
    return `That direction has a solid research shape. To choose among the topics, compare three things: whether the data is accessible, whether the variables can be measured, and whether the result explains a real pattern. Are you leaning toward model-based analysis, survey data, or public datasets?`;
  }
  if (strategyCode === "AI-S09" || strategyCode === "AI-S20") {
    return `We can adjust this without throwing away the whole plan. Tell me what is hardest right now: time, difficulty, finding sources, or staying interested in the topic? Then we can narrow the next step.`;
  }
  if (strategyCode === "AI-S13") {
    return `Start with the smallest useful move: what material, observation, or data do you already have? Then write one sentence for “what I want to compare” and one for “what I can actually measure.” Which of those feels easier to answer first?`;
  }
  if (profile.key === "scienceCommunication") {
    return `That is a different and really promising direction: you are not just interested in biology or chemistry, you want to turn that knowledge into something useful for other people. We could shape this as a science communication research project. Who would you most want to reach first: younger students, classmates, or the general public? And would you rather build this through short videos, written posts, or interactive mini-experiments?`;
  }
  if (profile.key === "quant") {
    return `Great, ${focus} is a strong starting point. To turn it into a workable research topic, let’s narrow two things: do you want to study patterns in real data, or build a simple model to explain a phenomenon? And roughly how much time can you spend each week?`;
  }
  if (profile.key === "ai") {
    return `AI is broad, so the next useful move is choosing a concrete use case. Are you more interested in AI for learning, creative work, data analysis, or solving a specific real-world problem?`;
  }
  if (profile.key === "psychology") {
    return `Psychology can become a strong student research topic if we connect it to observable behavior. Are you more curious about motivation, stress, relationships, or social media effects?`;
  }
  if (profile.key === "environment") {
    return `Environmental topics work well when you can observe or measure something nearby. Are you drawn more to water quality, campus ecology, waste sorting, energy use, or climate awareness?`;
  }
  return `Great, ${focus} is a strong starting point. To turn it into a workable research topic, let’s narrow two things: do you want to study patterns in real data, or build a simple model to explain a phenomenon? And roughly how much time can you spend each week?`;
}

function extractTopicName(input: string, locale: string): string {
  const patterns = locale === "zh"
    ? [/课题名称[:：]\s*(.+)/, /课题[:：]\s*(.+)/]
    : [/Topic name:\s*(.+)/i, /Topic:\s*(.+)/i];
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match?.[1]?.trim()) return match[1].trim().split("\n")[0];
  }
  return pickResearchFocus(input, locale);
}

function localGenerate(strategyCode: string, input: string, locale: string): string {
  const profile = inferInterestProfile(input, locale);
  const focus = profile.focus;
  const topicName = extractTopicName(input, locale);
  const hasEnoughInput = hasSubstantiveStudentInput(input) && profile.key !== "general";

  if (locale === "zh") {
    switch (strategyCode) {
      case "AI-S02":
        if (!hasEnoughInput) {
          return JSON.stringify({
            profile: "目前对话信息不足，暂时无法形成真实画像。请继续补充兴趣、经历、目标或时间安排。",
            interests: [],
            skills: [],
            timeCommitment: "",
            preferences: "",
          });
        }
        return JSON.stringify({
          profile: `这位学生对${focus}表现出明确兴趣，适合从可量化、可验证的小问题开始进入科研。`,
          interests: [focus, "数据分析", "现实问题建模"],
          skills: ["逻辑推理", "定量思维", "资料检索"],
          timeCommitment: "每周 3-5 小时，可根据项目节奏调整",
          preferences: "偏好有数据、有变量、能解释现实现象的研究题目",
        });
      case "AI-S03":
        if (!hasEnoughInput) {
          return JSON.stringify({ keywords: [] });
        }
        if (profile.key === "scienceCommunication") {
          return JSON.stringify({
            keywords: [
              { word: "生物科普", description: "把生命科学知识转化为公众能理解的内容", category: "Biology" },
              { word: "化学实验传播", description: "用安全小实验解释化学原理", category: "Natural Science" },
              { word: "科学传播", description: "研究不同表达方式对理解和兴趣的影响", category: "Humanities" },
              { word: "教育内容设计", description: "设计适合同龄人的学习型内容", category: "Social Science" },
              { word: "公众科学素养", description: "评估科普内容是否提升理解", category: "Social Science" },
              { word: "短视频科普", description: "比较短视频脚本、视觉和传播效果", category: "Technology" },
              { word: "互动学习", description: "通过问答或小实验增强参与感", category: "Education" },
              { word: "健康与生活科学", description: "连接生化知识和日常生活问题", category: "Biology" },
            ],
          });
        }
        return JSON.stringify({
          keywords: [
            { word: "计量经济学", description: "用统计方法分析经济变量关系", category: "Social Science" },
            { word: "数据建模", description: "建立变量之间的可解释模型", category: "Technology" },
            { word: "市场行为", description: "研究价格、选择和激励机制", category: "Social Science" },
            { word: "博弈论", description: "分析不同参与者之间的策略互动", category: "Mathematics" },
            { word: "概率统计", description: "用数据估计规律和不确定性", category: "Mathematics" },
            { word: "公共政策", description: "评估政策对群体行为的影响", category: "Social Science" },
            { word: "金融数据", description: "分析资产价格、风险和收益", category: "Social Science" },
            { word: "教育经济学", description: "研究学习投入和结果之间的关系", category: "Social Science" },
          ],
        });
      case "AI-S04":
        if (!hasEnoughInput) {
          return JSON.stringify({ references: [] });
        }
        if (profile.key === "scienceCommunication") {
          return JSON.stringify({
            references: [
              { title: "短视频科普对高中生生物概念理解的影响", description: "比较观看科普短视频前后，学生对核心概念的理解变化", difficulty: "入门", field: "科学传播" },
              { title: "化学安全小实验的教育传播设计", description: "设计安全演示内容并评估观众兴趣和理解度", difficulty: "入门", field: "化学教育" },
              { title: "校园科学账号内容主题与互动效果分析", description: "分析不同科普主题的阅读、评论和收藏差异", difficulty: "中等", field: "教育传播" },
              { title: "生活中的生物化学误区调查", description: "收集常见误区并制作纠偏科普内容", difficulty: "中等", field: "生物化学" },
              { title: "图文与视频科普形式的学习效果比较", description: "用问卷和小测比较不同形式的学习效果", difficulty: "进阶", field: "科学教育" },
            ],
          });
        }
        return JSON.stringify({
          references: [
            { title: "通勤时间与学生学习效率的关系", description: "收集问卷数据，分析时间成本与学习状态之间的关系", difficulty: "入门", field: "经济学" },
            { title: "零花钱预算与消费决策研究", description: "用简单模型解释学生消费选择和约束", difficulty: "入门", field: "行为经济学" },
            { title: "校园二手交易价格影响因素分析", description: "整理交易数据，研究价格与商品特征的关系", difficulty: "中等", field: "计量经济学" },
            { title: "社团参与对时间分配的影响", description: "用定量数据比较活动参与和学习投入", difficulty: "中等", field: "教育经济学" },
            { title: "公共数据中的收入与教育变量分析", description: "使用公开数据做相关性和回归探索", difficulty: "进阶", field: "数据分析" },
          ],
        });
      case "AI-S05":
        if (!hasEnoughInput) {
          return JSON.stringify({ topics: [] });
        }
        if (profile.key === "scienceCommunication") {
          return JSON.stringify({
            topics: [
              {
                name: "面向高中生的生物/化学科普账号内容设计与效果研究",
                reason: "这个课题把你的创意表达、公共影响力和生化兴趣结合起来，既能产出作品，也能评估传播效果。",
                researchPoints: ["目标受众分析", "科普脚本设计", "互动数据记录", "理解度问卷评估"],
                outputFormat: "科普账号作品集 + 研究报告",
                estimatedDuration: "8-10周",
              },
              {
                name: "短视频与图文科普对生物概念理解的影响比较",
                reason: "适合研究不同表达形式是否真的帮助同龄人理解科学概念。",
                researchPoints: ["内容形式设计", "前后测问卷", "观看反馈分析", "传播效果比较"],
                outputFormat: "实验报告",
                estimatedDuration: "8周",
              },
              {
                name: "生活中的化学误区科普内容创作与反馈研究",
                reason: "能把化学知识和公共教育结合，主题贴近生活，也容易收集反馈。",
                researchPoints: ["误区收集", "科普内容制作", "反馈问卷", "内容迭代"],
                outputFormat: "科普内容包 + 调研报告",
                estimatedDuration: "6-8周",
              },
            ],
          });
        }
        return JSON.stringify({
          topics: [
            {
              name: "高中生时间分配与学习效率的定量研究",
              reason: "这个课题结合经济学中的资源分配思想和数学统计方法，数据容易通过问卷获得。",
              researchPoints: ["问卷设计", "时间投入变量量化", "相关性分析", "可视化解释"],
              outputFormat: "研究报告",
              estimatedDuration: "8-10周",
            },
            {
              name: "校园二手交易价格的影响因素分析",
              reason: "课题贴近校园生活，能用价格、成色、品牌等变量做清晰建模。",
              researchPoints: ["数据采集", "变量编码", "价格模型", "结果解释"],
              outputFormat: "数据分析报告",
              estimatedDuration: "8周",
            },
            {
              name: "零花钱预算约束下的学生消费决策研究",
              reason: "适合把经济学概念转化为可观察行为，并用数学方式做分类和比较。",
              researchPoints: ["消费类别设计", "预算约束分析", "群体差异比较"],
              outputFormat: "调研报告",
              estimatedDuration: "6-8周",
            },
          ],
        });
      case "AI-S07":
        return JSON.stringify({
          phases: [
            { order: 1, name: "问题界定与背景调研", description: "明确研究问题，阅读相关资料", goal: "形成清晰的研究问题", estimatedWeeks: 2 },
            { order: 2, name: "变量设计与数据方案", description: "确定变量、样本和采集方式", goal: "完成可执行的数据收集方案", estimatedWeeks: 2 },
            { order: 3, name: "数据收集与整理", description: "收集、清洗并整理数据表", goal: "获得可分析的数据集", estimatedWeeks: 3 },
            { order: 4, name: "分析与报告撰写", description: "进行图表和统计分析，完成报告", goal: "形成最终研究产出", estimatedWeeks: 3 },
          ],
        });
      case "AI-S11":
        return JSON.stringify({
          tasks: [
            { order: 1, title: "明确本阶段核心问题", description: "写下本阶段要回答的1-2个关键问题。", expectedOutput: "问题清单" },
            { order: 2, title: "收集并整理材料", description: "找到至少3个相关资料或数据来源，并记录来源。", expectedOutput: "资料表" },
            { order: 3, title: "完成阶段小结", description: "用300-500字总结本阶段发现和下一步计划。", expectedOutput: "阶段小结" },
          ],
        });
      case "AI-S12":
        return `# ${topicName}\n\n## 任务目标\n把当前任务拆成可执行的小步骤，并留下可检查的产出。\n\n## 建议步骤\n1. 先写下这个任务要回答的问题。\n2. 列出你已有的资料或数据。\n3. 选择一个最小可行方法开始处理。\n4. 用表格或短文记录结果。\n\n## 小提醒\n不要追求一步到位，先完成一个可验证版本。`;
      case "AI-S14":
      case "AI-S18":
        return JSON.stringify({ grade: strategyCode === "AI-S18" ? "C" : "B", score: strategyCode === "AI-S18" ? 72 : 82, dimensions: [
          { name: "完整性", score: 82, comment: "基本覆盖任务要求" },
          { name: "深度", score: 78, comment: "可以进一步解释原因" },
          { name: "表达", score: 84, comment: "结构较清楚" },
        ] });
      case "AI-S15":
        return JSON.stringify({ feedback: "你已经完成了任务的主体部分，思路清楚。下一步可以补充数据依据，并把结论和研究问题联系得更紧。", strengths: ["结构清楚", "能回应任务要求"], improvements: [
          { targetGrade: "C", suggestions: ["补齐基本背景和结论"] },
          { targetGrade: "B", suggestions: ["加入更具体的数据或例子"] },
          { targetGrade: "A", suggestions: ["解释变量之间的关系，并提出自己的判断"] },
        ] });
      case "AI-S17":
        return JSON.stringify({ template: "## 任务模板\n\n- 研究问题：\n- 已有资料：\n- 我的分析：\n- 初步结论：", steps: ["重新阅读任务要求", "列出已有资料", "完成一个最小版本", "检查并提交"], keyPoints: ["先保证完整，再追求深入", "用具体证据支持判断"] });
      case "AI-S22":
      case "AI-S23":
      case "AI-S24":
        return `# ${strategyCode === "AI-S24" ? "阶段总结" : "研究日志"}\n\n我今天推进了研究中的一个关键步骤。通过整理任务和反馈，我更清楚自己已经完成了什么，也看到了下一步需要补强的地方。\n\n接下来我会把问题继续缩小，用更具体的数据或材料支持判断。`;
      case "AI-S25":
        return JSON.stringify({
          notes: [
            { category: "兴趣", summary: `关注${focus}` },
          ],
        });
      default:
        return "我已经根据当前信息生成了一个可继续推进的版本。";
    }
  }

  switch (strategyCode) {
    case "AI-S02":
      if (!hasEnoughInput) {
        return JSON.stringify({
          profile: "There is not enough conversation information yet to form a truthful profile. Please add interests, experiences, goals, or time availability.",
          interests: [],
          skills: [],
          timeCommitment: "",
          preferences: "",
        });
      }
      if (profile.key === "scienceCommunication") {
        return JSON.stringify({
          profile: `This student is interested in turning biology or chemistry knowledge into creative educational content that can help other people. They are well suited to a project that combines science learning, communication design, and audience feedback.`,
          interests: [focus, "science education", "creative public impact"],
          skills: ["content planning", "clear explanation", "audience awareness"],
          timeCommitment: "Around 3-5 hours per week, adjustable by content production schedule",
          preferences: "Prefers creative, public-facing projects with visible impact and feedback",
        });
      }
      return JSON.stringify({
        profile: `This student shows a clear interest in ${focus}. They are well suited to research questions that can be narrowed into measurable variables and explored with data.`,
        interests: [focus, "data analysis", "real-world modeling"],
        skills: ["quantitative reasoning", "logical thinking", "source gathering"],
        timeCommitment: "Around 3-5 hours per week, adjustable by project stage",
        preferences: "Prefers measurable questions with data, variables, and clear explanations",
      });
    case "AI-S03":
      if (!hasEnoughInput) {
        return JSON.stringify({ keywords: [] });
      }
      if (profile.key === "scienceCommunication") {
        return JSON.stringify({
          keywords: [
            { word: "Science communication", description: "Turn scientific knowledge into public-friendly content", category: "Humanities" },
            { word: "Biology education", description: "Explain life science concepts to student audiences", category: "Biology" },
            { word: "Chemistry demonstrations", description: "Use safe examples or mini-experiments to explain chemistry", category: "Natural Science" },
            { word: "Educational content design", description: "Plan posts, scripts, and visuals for learning", category: "Social Science" },
            { word: "Public science literacy", description: "Measure whether content improves understanding", category: "Social Science" },
            { word: "Short-form science video", description: "Compare scripts, visuals, and engagement patterns", category: "Technology" },
            { word: "Interactive learning", description: "Use questions or activities to increase participation", category: "Education" },
            { word: "Everyday biochemistry", description: "Connect biology and chemistry to daily life topics", category: "Biology" },
          ],
        });
      }
      return JSON.stringify({
        keywords: [
          { word: "Econometrics", description: "Use statistical tools to study economic relationships", category: "Social Science" },
          { word: "Data modeling", description: "Build explainable models from measurable variables", category: "Technology" },
          { word: "Market behavior", description: "Study how prices, choices, and incentives interact", category: "Social Science" },
          { word: "Game theory", description: "Analyze strategic decisions between participants", category: "Mathematics" },
          { word: "Probability and statistics", description: "Estimate patterns and uncertainty from data", category: "Mathematics" },
          { word: "Public policy", description: "Evaluate how policy affects behavior or outcomes", category: "Social Science" },
          { word: "Financial data", description: "Analyze price, risk, and return patterns", category: "Social Science" },
          { word: "Education economics", description: "Study learning inputs and academic outcomes", category: "Social Science" },
        ],
      });
    case "AI-S04":
      if (!hasEnoughInput) {
        return JSON.stringify({ references: [] });
      }
      if (profile.key === "scienceCommunication") {
        return JSON.stringify({
          references: [
            { title: "How short science videos affect biology concept understanding", description: "Compare student understanding before and after watching short educational videos", difficulty: "Beginner", field: "Science communication" },
            { title: "Designing safe chemistry demonstrations for public learning", description: "Create safe demonstration content and evaluate interest and comprehension", difficulty: "Beginner", field: "Chemistry education" },
            { title: "Campus science account topics and audience engagement", description: "Analyze how different biology or chemistry topics affect views, comments, and saves", difficulty: "Intermediate", field: "Educational media" },
            { title: "Common misconceptions in everyday biochemistry", description: "Identify misconceptions and create corrective science communication content", difficulty: "Intermediate", field: "Biochemistry" },
            { title: "Text posts versus videos for science learning", description: "Compare learning effects using surveys and short quizzes", difficulty: "Advanced", field: "Science education" },
          ],
        });
      }
      return JSON.stringify({
        references: [
          { title: "Commute time and student study efficiency", description: "Collect survey data to analyze time cost and learning state", difficulty: "Beginner", field: "Economics" },
          { title: "Allowance budgets and student spending choices", description: "Use a simple model to explain choices under constraints", difficulty: "Beginner", field: "Behavioral economics" },
          { title: "Pricing factors in campus second-hand trading", description: "Study how condition, brand, and timing affect prices", difficulty: "Intermediate", field: "Econometrics" },
          { title: "Club participation and student time allocation", description: "Compare extracurricular involvement with study time patterns", difficulty: "Intermediate", field: "Education economics" },
          { title: "Education and income variables in public datasets", description: "Explore correlations and simple regression with open data", difficulty: "Advanced", field: "Data analysis" },
        ],
      });
    case "AI-S05":
      if (!hasEnoughInput) {
        return JSON.stringify({ topics: [] });
      }
      if (profile.key === "scienceCommunication") {
        return JSON.stringify({
          topics: [
            {
              name: "Designing a biology/chemistry science account for student audiences",
              reason: "This combines your wish to create something impactful with your interest in sharing biology or chemistry knowledge publicly.",
              researchPoints: ["Audience analysis", "Content script design", "Engagement tracking", "Comprehension survey"],
              outputFormat: "Science account portfolio + research report",
              estimatedDuration: "8-10 weeks",
            },
            {
              name: "Short videos versus text posts for explaining biology concepts",
              reason: "It lets you test whether different creative formats actually help people understand science better.",
              researchPoints: ["Content format design", "Pre/post quiz", "Viewer feedback", "Learning outcome comparison"],
              outputFormat: "Experimental report",
              estimatedDuration: "8 weeks",
            },
            {
              name: "Correcting everyday chemistry misconceptions through educational content",
              reason: "This is public-facing, practical, and easy to connect to real audiences and feedback.",
              researchPoints: ["Misconception collection", "Content creation", "Feedback survey", "Content revision"],
              outputFormat: "Content package + survey report",
              estimatedDuration: "6-8 weeks",
            },
          ],
        });
      }
      return JSON.stringify({
        topics: [
          {
            name: "A quantitative study of student time allocation and study efficiency",
            reason: "It combines economic thinking about scarce time with mathematical analysis, and the data can be collected through a manageable survey.",
            researchPoints: ["Survey design", "Variable measurement", "Correlation analysis", "Visual explanation"],
            outputFormat: "Research report",
            estimatedDuration: "8-10 weeks",
          },
          {
            name: "Factors that influence prices in campus second-hand trading",
            reason: "It is close to everyday school life and can be modeled with clear variables such as condition, brand, demand, and timing.",
            researchPoints: ["Data collection", "Variable coding", "Price modeling", "Result interpretation"],
            outputFormat: "Data analysis report",
            estimatedDuration: "8 weeks",
          },
          {
            name: "Student spending decisions under allowance budget constraints",
            reason: "It turns core economics ideas into observable behavior and is suitable for structured quantitative comparison.",
            researchPoints: ["Spending category design", "Budget constraint analysis", "Group comparison"],
            outputFormat: "Survey report",
            estimatedDuration: "6-8 weeks",
          },
        ],
      });
    case "AI-S07":
      return JSON.stringify({
        phases: [
          { order: 1, name: "Define the question and review background", description: "Clarify the research question and read relevant sources", goal: "Form a focused research question", estimatedWeeks: 2 },
          { order: 2, name: "Design variables and data plan", description: "Decide what to measure and how to collect data", goal: "Build a feasible data collection plan", estimatedWeeks: 2 },
          { order: 3, name: "Collect and organize data", description: "Gather, clean, and structure the dataset", goal: "Create usable evidence for analysis", estimatedWeeks: 3 },
          { order: 4, name: "Analyze and write the report", description: "Create charts, interpret results, and write the final report", goal: "Complete the research output", estimatedWeeks: 3 },
        ],
      });
    case "AI-S11":
      return JSON.stringify({
        tasks: [
          { order: 1, title: "Clarify the stage question", description: "Write 1-2 specific questions this stage needs to answer.", expectedOutput: "Question list" },
          { order: 2, title: "Gather and organize evidence", description: "Find at least three relevant sources or data points and record them.", expectedOutput: "Source/data table" },
          { order: 3, title: "Write a stage summary", description: "Summarize what you found and what the next step should be.", expectedOutput: "Short stage summary" },
        ],
      });
    case "AI-S12":
      return `# ${topicName}\n\n## Goal\nTurn this task into a concrete research move with a checkable output.\n\n## Steps\n1. Write the exact question this task should answer.\n2. List the sources, observations, or data you already have.\n3. Choose the smallest method that can produce a useful result.\n4. Record your finding in a short paragraph or table.\n\n## Tip\nAim for a testable first version before trying to make it perfect.`;
    case "AI-S14":
    case "AI-S18":
      return JSON.stringify({ grade: strategyCode === "AI-S18" ? "C" : "B", score: strategyCode === "AI-S18" ? 72 : 82, dimensions: [
        { name: "Completeness", score: 82, comment: "Covers the main task requirements" },
        { name: "Depth", score: 78, comment: "Could explain the reasoning more fully" },
        { name: "Clarity", score: 84, comment: "Organized and understandable" },
      ] });
    case "AI-S15":
      return JSON.stringify({ feedback: "You completed the main part of the task with a clear structure. To improve, add more specific evidence and connect your conclusion more directly to the research question.", strengths: ["Clear structure", "Addresses the task"], improvements: [
        { targetGrade: "C", suggestions: ["Include the basic background and a conclusion"] },
        { targetGrade: "B", suggestions: ["Add concrete data, examples, or sources"] },
        { targetGrade: "A", suggestions: ["Explain relationships between variables and add your own interpretation"] },
      ] });
    case "AI-S17":
      return JSON.stringify({ template: "## Task template\n\n- Research question:\n- Evidence I have:\n- My analysis:\n- Initial conclusion:", steps: ["Re-read the task", "List available evidence", "Complete a first version", "Review and submit"], keyPoints: ["Finish the core structure first", "Use specific evidence for claims"] });
    case "AI-S22":
    case "AI-S23":
    case "AI-S24":
      return `# ${strategyCode === "AI-S24" ? "Phase reflection" : "Research journal"}\n\nToday I moved one important step forward in my research. By organizing the task and feedback, I can see what I have completed and what needs more evidence.\n\nNext, I will narrow the question further and support my ideas with clearer data or sources.`;
    case "AI-S25":
      return JSON.stringify({
        notes: [
          { category: "Interest", summary: `Interested in ${focus}` },
        ],
      });
    default:
      return "I generated a usable next step based on the current information.";
  }
}

export async function chatWithAI(
  strategyCode: string,
  messages: { role: string; content: string }[],
  context?: string,
  locale: string = "en"
): Promise<string> {
  const ai = getAI();
  if (!hasGeminiKey() || !ai) {
    return localChatReply(strategyCode, messages, locale);
  }

  const systemPrompt = await getStrategyPrompt(strategyCode, locale);

  const contextLabel = locale === "zh" ? "上下文信息：" : "Context:";
  const systemInstruction =
    (context
      ? `${systemPrompt}\n\n${contextLabel}\n${context}`
      : systemPrompt) + languageDirective(locale);

  const chat = ai.chats.create({
    model: DEFAULT_MODEL,
    config: { systemInstruction },
    history: messages.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
  });

  const lastMessage = messages[messages.length - 1];
  const result = await chat.sendMessage({ message: lastMessage.content });
  return result.text ?? "";
}

export async function generateWithAI(
  strategyCode: string,
  input: string,
  context?: string,
  locale: string = "en"
): Promise<string> {
  const ai = getAI();
  if (!hasGeminiKey() || !ai) {
    return localGenerate(strategyCode, input || "", locale);
  }

  const systemPrompt = await getStrategyPrompt(strategyCode, locale);

  const contextLabel = locale === "zh" ? "上下文信息：" : "Context:";
  const base = context
    ? `${systemPrompt}\n\n${contextLabel}\n${context}\n\n${input}`
    : `${systemPrompt}\n\n${input}`;
  const contents = base + languageDirective(locale);

  const result = await ai.models.generateContent({
    model: DEFAULT_MODEL,
    contents,
  });
  return result.text ?? "";
}

export async function streamChatWithAI(
  strategyCode: string,
  messages: { role: string; content: string }[],
  context?: string,
  locale: string = "en"
) {
  const ai = getAI();
  if (!hasGeminiKey() || !ai) {
    const reply = localChatReply(strategyCode, messages, locale);
    return (async function* () {
      yield { text: reply };
    })();
  }

  const systemPrompt = await getStrategyPrompt(strategyCode, locale);

  const contextLabel = locale === "zh" ? "上下文信息：" : "Context:";
  const systemInstruction =
    (context
      ? `${systemPrompt}\n\n${contextLabel}\n${context}`
      : systemPrompt) + languageDirective(locale);

  const chat = ai.chats.create({
    model: DEFAULT_MODEL,
    config: { systemInstruction },
    history: messages.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
  });

  const lastMessage = messages[messages.length - 1];
  const stream = await chat.sendMessageStream({ message: lastMessage.content });
  return stream;
}
