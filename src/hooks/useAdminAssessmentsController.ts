import { useState } from "react";
import { useFeedbackMessages } from "@/hooks/useFeedbackMessages";
import { useAdminAssessmentAssignment } from "@/hooks/useAdminAssessmentAssignment";
import { useAdminAssessmentsData } from "@/hooks/useAdminAssessmentsData";
import { useAdminAssessmentsView } from "@/hooks/useAdminAssessmentsView";

export type AssessmentAdminTab = "tests" | "assignments" | "results";
export function useAdminAssessmentsController() {
  const [activeTab, setActiveTab] = useState<AssessmentAdminTab>("tests");
  const feedback = useFeedbackMessages();
  const { users, assignments, attempts, loading, refresh } = useAdminAssessmentsData(feedback.setError);
  const { form, assign } = useAdminAssessmentAssignment({
    setActiveTab,
    setError: feedback.setError,
    setNotice: feedback.setNotice,
    refresh,
  });
  const assessmentView = useAdminAssessmentsView({ users, assignments, search: form.search });

  return {
    navigation: { activeTab, setActiveTab },
    data: { users, assignments, attempts, loading },
    form,
    feedback: { error: feedback.error, notice: feedback.notice },
    view: assessmentView,
    actions: { refresh, assign },
  };
}
