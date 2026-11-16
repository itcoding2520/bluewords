import { useState, type Dispatch, type SetStateAction } from "react";
import { useAdminAssessmentAssignment } from "@/hooks/useAdminAssessmentAssignment";
import { useAdminAssessmentsData } from "@/hooks/useAdminAssessmentsData";
import { useAdminAssessmentsView } from "@/hooks/useAdminAssessmentsView";

export type AssessmentAdminTab = "tests" | "assignments" | "results";
export function useAdminAssessmentsController() {
  const [activeTab, setActiveTab] = useState<AssessmentAdminTab>("tests");
  const [feedback, setFeedback] = useState({ error: "", notice: "" });
  const setError: Dispatch<SetStateAction<string>> = (value) => setFeedback((current) => ({
    ...current,
    error: typeof value === "function" ? value(current.error) : value,
  }));
  const setNotice: Dispatch<SetStateAction<string>> = (value) => setFeedback((current) => ({
    ...current,
    notice: typeof value === "function" ? value(current.notice) : value,
  }));
  const { users, assignments, attempts, loading, refresh } = useAdminAssessmentsData(setError);
  const { form, assign } = useAdminAssessmentAssignment({
    setActiveTab,
    setError,
    setNotice,
    refresh,
  });
  const assessmentView = useAdminAssessmentsView({ users, assignments, search: form.search });

  return {
    navigation: { activeTab, setActiveTab },
    data: { users, assignments, attempts, loading },
    form,
    feedback,
    view: assessmentView,
    actions: { refresh, assign },
  };
}
