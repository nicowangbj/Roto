import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "./prisma";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const DEFAULT_MODEL = "gemini-2.5-flash-preview-04-17";

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
3. 分级提供改进建议

输出JSON格式：
{
  "feedback": "总体评语",
  "strengths": ["优点"],
  "improvements": [
    {"targetGrade": "A", "suggestions": ["具体建议"]},
    {"targetGrade": "B", "suggestions": ["具体建议"]}
  ]
}`,
      en: `Based on the grading result, generate feedback and improvement suggestions. Requirements:
1. Feedback should be specific and address the student's actual submission
2. Tone should be encouraging and positive
3. Provide tiered improvement suggestions

Output JSON format:
{
  "feedback": "Overall feedback",
  "strengths": ["strengths"],
  "improvements": [
    {"targetGrade": "A", "suggestions": ["specific suggestion"]},
    {"targetGrade": "B", "suggestions": ["specific suggestion"]}
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
  };

  const entry = defaults[code];
  if (!entry) {
    return locale === "zh"
      ? `你是 Rota 平台的 AI 导师。请根据上下文完成相应的任务。用中文回复。`
      : `You are Rota's AI mentor. Complete the task based on context. Respond in English.`;
  }
  return locale === "zh" ? entry.zh : entry.en;
}

export async function chatWithAI(
  strategyCode: string,
  messages: { role: string; content: string }[],
  context?: string,
  locale: string = "en"
): Promise<string> {
  const systemPrompt = await getStrategyPrompt(strategyCode, locale);

  const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL });

  const contextLabel = locale === "zh" ? "上下文信息：" : "Context:";
  const fullPrompt = context
    ? `${systemPrompt}\n\n${contextLabel}\n${context}`
    : systemPrompt;

  const chat = model.startChat({
    history: messages.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    systemInstruction: { parts: [{ text: fullPrompt }] },
  });

  const lastMessage = messages[messages.length - 1];
  const result = await chat.sendMessage(lastMessage.content);
  return result.response.text();
}

export async function generateWithAI(
  strategyCode: string,
  input: string,
  context?: string,
  locale: string = "en"
): Promise<string> {
  const systemPrompt = await getStrategyPrompt(strategyCode, locale);

  const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL });

  const contextLabel = locale === "zh" ? "上下文信息：" : "Context:";
  const fullPrompt = context
    ? `${systemPrompt}\n\n${contextLabel}\n${context}\n\n${input}`
    : `${systemPrompt}\n\n${input}`;

  const result = await model.generateContent(fullPrompt);
  return result.response.text();
}

export async function streamChatWithAI(
  strategyCode: string,
  messages: { role: string; content: string }[],
  context?: string,
  locale: string = "en"
) {
  const systemPrompt = await getStrategyPrompt(strategyCode, locale);

  const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL });

  const contextLabel = locale === "zh" ? "上下文信息：" : "Context:";
  const fullPrompt = context
    ? `${systemPrompt}\n\n${contextLabel}\n${context}`
    : systemPrompt;

  const chat = model.startChat({
    history: messages.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    systemInstruction: { parts: [{ text: fullPrompt }] },
  });

  const lastMessage = messages[messages.length - 1];
  const result = await chat.sendMessageStream(lastMessage.content);
  return result.stream;
}
