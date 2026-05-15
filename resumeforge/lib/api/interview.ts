// lib/api/interview.ts  — Interview Service via API Gateway (/api/interview/*)
import apiClient from "./client";
import { API_ENDPOINTS } from "@/lib/config";
import type {
  StartInterviewRequest, InterviewSession, InterviewSummary,
  AnswerSubmitRequest, AnswerSubmitResponse, AudioUploadResponse,
  SessionEndResponse, QuestionFeedback,
} from "./types";

export async function listSessions(): Promise<InterviewSummary[]> {
  const res = await apiClient.get<InterviewSummary[]>(API_ENDPOINTS.interview.list);
  // Backend returns paginated: { data: [], total, page } — normalise to array
  if (Array.isArray(res.data)) return res.data;
  const paginated = res.data as unknown as { data: InterviewSummary[] };
  return paginated.data ?? [];
}

export async function startSession(data: StartInterviewRequest): Promise<InterviewSession> {
  const res = await apiClient.post<InterviewSession>(API_ENDPOINTS.interview.start, {
    session_type: data.type,       // backend field: session_type (technical|behavioral|hr)
    num_questions: data.questionCount, // backend field: num_questions
    difficulty: data.difficulty,
    category: data.jobDescription, // legacy fallback if no JD used properly
    job_description: data.jobDescription,
    profile_data: data.profileData,
  });
  return res.data;
}

export async function getInterviewReport(sessionId: string): Promise<InterviewSession> {
  const res = await apiClient.get<InterviewSession>(
    `${API_ENDPOINTS.interview.session(sessionId)}/report`
  );
  return res.data;
}

export async function getSession(sessionId: string): Promise<InterviewSession> {
  const res = await apiClient.get<InterviewSession>(
    API_ENDPOINTS.interview.session(sessionId)
  );
  return res.data;
}

export async function submitAnswer(
  sessionId: string,
  data: AnswerSubmitRequest
): Promise<AnswerSubmitResponse> {
  const res = await apiClient.post<AnswerSubmitResponse>(
    API_ENDPOINTS.interview.submitAnswer(sessionId),
    {
      question_id: data.questionId,
      answer_text: data.answerText,
    }
  );
  return res.data;
}

export async function uploadAnswerAudio(
  sessionId: string,
  responseId: string,
  audioBlob: Blob,
  mimeType = "audio/webm"
): Promise<AudioUploadResponse> {
  const form = new FormData();
  form.append("file", audioBlob, `answer.${mimeType.split("/")[1] || "webm"}`);
  const res = await apiClient.post<AudioUploadResponse>(
    API_ENDPOINTS.interview.uploadAudio(sessionId, responseId),
    form
  );

  return res.data;
}

export async function endSession(sessionId: string): Promise<SessionEndResponse> {
  const res = await apiClient.post<SessionEndResponse>(
    API_ENDPOINTS.interview.end(sessionId)
  );
  return res.data;
}

export async function deleteSession(sessionId: string): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.interview.session(sessionId));
}
