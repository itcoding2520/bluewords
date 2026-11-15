import { NextRequest, NextResponse } from "next/server";
import { createAssessmentAdminClient, getRequestUser, isAssessmentAdmin } from "@/lib/assessments/server";
import { generateAssessmentQuestions } from "@/lib/assessments/question-generation";
import { validateAssessmentAssignmentInput } from "@/lib/assessments/assignment-input";
import type { AssessmentDifficulty } from "@/lib/assessments/assignment-input";

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
  const validation = validateAssessmentAssignmentInput(input);
  if (!validation.ok) return NextResponse.json({ error: validation.message }, { status: 400 });
  const body = input as { title?: unknown; difficulty?: unknown; recipientIds?: unknown; allUsers?: unknown; dueAt?: unknown };
  const { title, difficulty, dueAt } = validation.value;

  const [{ data: defaultKeys, error: keyError }, { data: wordsData, error: wordError }, { data: sharedData, error: sharedError }, { data: sentencesData, error: sentenceError }] = await Promise.all([
    admin.from("default_vocabulary_keys").select("normalized_word"),
    admin.from("vocabulary_words").select("word,meaning,category,image_path,type").limit(5000),
    admin.from("community_words").select("word,meaning,image_path,community_categories!inner(name)").eq("status", "published").eq("community_categories.status", "published").limit(1000),
    admin.from("sentence_builder_questions").select("difficulty,category,prompt_vi,answer_sentence,answer_tokens,distractor_tokens,image_keyword,is_active").eq("difficulty", difficulty).eq("is_active", true).limit(1000),
  ]);
  const sourceError = keyError ?? wordError ?? sharedError ?? sentenceError;
  if (sourceError) return NextResponse.json({ error: sourceError.message }, { status: 400 });
  const questions = generateAssessmentQuestions({
    defaultKeys,
    vocabularyRows: wordsData,
    communityWords: sharedData,
    sentenceQuestions: sentencesData,
    difficulty: difficulty as AssessmentDifficulty,
  });
  if (!questions) return NextResponse.json({ error: "This difficulty needs at least 5 public vocabulary words and 5 active sentence questions." }, { status: 422 });

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
