import { NextRequest, NextResponse } from "next/server";
import { createAssessmentAdminClient, getRequestUser, isAssessmentAdmin, shuffled, type AssessmentQuestion } from "@/lib/assessments/server";

export async function GET() {
  const { client, user } = await getRequestUser();
  if (!user || !(await isAssessmentAdmin(client, user.id))) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const admin = createAssessmentAdminClient();
  if (!admin) return NextResponse.json({ error: "Assessment service is not configured." }, { status: 503 });
  const [{ data: assignments, error }, { data: attempts, error: attemptsError }, { data: users, error: usersError }] = await Promise.all([
    admin.from("assessments").select("id,title,difficulty,due_at,created_at,assessment_recipients(id,user_id,status,assigned_at)").order("created_at", { ascending: false }).limit(100),
    admin.from("assessment_attempts").select("id,user_id,recipient_id,score,correct_count,elapsed_seconds,result,completed_at,attempt_number").not("completed_at", "is", null).order("completed_at", { ascending: false }).limit(100),
    admin.auth.admin.listUsers({ page: 1, perPage: 500 }),
  ]);
  if (error || attemptsError || usersError) return NextResponse.json({ error: error?.message ?? attemptsError?.message ?? usersError?.message }, { status: 400 });
  return NextResponse.json({ assignments: assignments ?? [], attempts: attempts ?? [], users: users?.users.map(({ id, email, user_metadata }) => ({ id, email, nickname: typeof user_metadata?.nickname === "string" ? user_metadata.nickname : "" })) ?? [] });
}

export async function POST(request: NextRequest) {
  const { client, user } = await getRequestUser();
  if (!user || !(await isAssessmentAdmin(client, user.id))) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const admin = createAssessmentAdminClient();
  if (!admin) return NextResponse.json({ error: "Assessment service is not configured." }, { status: 503 });
  let input: unknown;
  try { input = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  if (!input || typeof input !== "object") return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const body = input as { title?: unknown; difficulty?: unknown; recipientIds?: unknown; allUsers?: unknown; dueAt?: unknown };
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const difficulty = body.difficulty;
  if (!title || title.length > 120 || !["easy", "medium", "hard"].includes(String(difficulty))) return NextResponse.json({ error: "Enter a title and select a difficulty." }, { status: 400 });

  const [{ data: defaultKeys, error: keyError }, { data: wordsData, error: wordError }, { data: sharedData, error: sharedError }, { data: sentencesData, error: sentenceError }] = await Promise.all([
    admin.from("default_vocabulary_keys").select("normalized_word"),
    admin.from("vocabulary_words").select("word,meaning,category,image_path,type").limit(5000),
    admin.from("community_words").select("word,meaning,image_path,community_categories!inner(name)").eq("status", "published").eq("community_categories.status", "published").limit(1000),
    admin.from("sentence_builder_questions").select("difficulty,category,prompt_vi,answer_sentence,answer_tokens,distractor_tokens,image_keyword,is_active").eq("difficulty", difficulty).eq("is_active", true).limit(1000),
  ]);
  const sourceError = keyError ?? wordError ?? sharedError ?? sentenceError;
  if (sourceError) return NextResponse.json({ error: sourceError.message }, { status: 400 });
  const defaultSet = new Set((defaultKeys ?? []).map((item) => item.normalized_word));
  const wordMap = new Map<string, { word: string; meaning: string; category: string; imagePath: string | null }>();
  for (const row of wordsData ?? []) {
    const normalized = row.word.trim().toLowerCase().replace(/\s+/g, " ");
    if (row.type === "word" && row.meaning.trim() && defaultSet.has(normalized)) wordMap.set(normalized, { word: row.word, meaning: row.meaning, category: row.category, imagePath: row.image_path });
  }
  for (const row of sharedData ?? []) {
    const normalized = row.word.trim().toLowerCase().replace(/\s+/g, " ");
    const category = Array.isArray(row.community_categories) ? row.community_categories[0]?.name : (row.community_categories as { name?: string } | null)?.name;
    if (row.meaning.trim()) wordMap.set(normalized, { word: row.word, meaning: row.meaning, category: category ?? "Community", imagePath: row.image_path });
  }
  const wordPool = shuffled([...wordMap.values()].filter(({ word }) => difficulty === "easy" ? word.length <= 5 : difficulty === "medium" ? word.length >= 6 && word.length <= 8 : word.length >= 9));
  const sentencePool = shuffled(sentencesData ?? []);
  if (wordPool.length < 5 || sentencePool.length < 5) return NextResponse.json({ error: "This difficulty needs at least 5 public vocabulary words and 5 active sentence questions." }, { status: 422 });

  const vocabularyQuestions: AssessmentQuestion[] = wordPool.slice(0, 5).map((word) => {
    const distractors = shuffled(wordPool.filter((candidate) => candidate.word !== word.word && candidate.meaning !== word.meaning)).slice(0, 3).map((candidate) => candidate.meaning);
    const choices = shuffled([word.meaning, ...distractors]);
    return { type: "vocabulary", prompt: `Choose the correct meaning of “${word.word}”.`, word: word.word, meaning: word.meaning, category: word.category, imagePath: word.imagePath, choices, answer: word.meaning };
  });
  const sentenceQuestions: AssessmentQuestion[] = sentencePool.slice(0, 5).map((question) => {
    const answerTokens = Array.isArray(question.answer_tokens) ? question.answer_tokens.map(String) : [];
    const distractors = Array.isArray(question.distractor_tokens) ? question.distractor_tokens.map(String) : [];
    return { type: "sentence", prompt: question.prompt_vi, category: question.category, imageKeyword: question.image_keyword, tiles: shuffled([...answerTokens, ...distractors]), answer: question.answer_sentence };
  });
  const questions = shuffled([...vocabularyQuestions, ...sentenceQuestions]);

  let recipientIds: string[] = [];
  if (body.allUsers === true) {
    let page = 1;
    while (true) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 500 });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      recipientIds.push(...data.users.map((entry) => entry.id));
      if (data.users.length < 500) break;
      page++;
    }
  } else if (Array.isArray(body.recipientIds)) recipientIds = [...new Set(body.recipientIds.filter((id): id is string => typeof id === "string"))];
  if (!recipientIds.length) return NextResponse.json({ error: "Select at least one learner (your own account is excluded)." }, { status: 400 });

  const dueAtValue = typeof body.dueAt === "string" && body.dueAt ? body.dueAt : null;
  let dueAt: Date | null = null;
  if (dueAtValue) {
    const dueDateOnly = dueAtValue.slice(0, 10);
    const dateParts = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(dueDateOnly);
    if (!dateParts) return NextResponse.json({ error: "Invalid due date." }, { status: 400 });
    const [, year, month, day] = dateParts;
    const checkDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    if (checkDate.getUTCFullYear() !== Number(year) || checkDate.getUTCMonth() + 1 !== Number(month) || checkDate.getUTCDate() !== Number(day)) {
      return NextResponse.json({ error: "Invalid due date." }, { status: 400 });
    }
    const todayInVietnam = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    if (dueDateOnly < todayInVietnam) return NextResponse.json({ error: "Due date must be today or a future date." }, { status: 400 });
    // Keep the assignment available through the selected date in Vietnam time (UTC+7).
    dueAt = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 16, 59, 59, 999));
  }
  const { data: assessment, error: createError } = await admin.from("assessments").insert({ title, difficulty, questions, due_at: dueAt?.toISOString() ?? null, created_by: user.id }).select("id,title,difficulty,due_at").single();
  if (createError || !assessment) return NextResponse.json({ error: createError?.message ?? "Could not create assignment." }, { status: 400 });
  const recipientRows = recipientIds.map((userId) => ({ assessment_id: assessment.id, user_id: userId }));
  const { data: recipients, error: recipientError } = await admin.from("assessment_recipients").insert(recipientRows).select("id,user_id");
  if (recipientError || !recipients) {
    await admin.from("assessments").delete().eq("id", assessment.id);
    return NextResponse.json({ error: recipientError.message }, { status: 400 });
  }
  return NextResponse.json({ assignment: assessment, recipients: recipientIds.length });
}
