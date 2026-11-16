import { useState } from "react";
import { useAdminAssessmentAssignment } from "@/hooks/useAdminAssessmentAssignment";
import { useAdminAssessmentsData } from "@/hooks/useAdminAssessmentsData";
import { useAdminAssessmentsView } from "@/hooks/useAdminAssessmentsView";

export type AssessmentAdminTab = "tests" | "assignments" | "results";
export function useAdminAssessmentsController() {
  const [activeTab, setActiveTab] = useState<AssessmentAdminTab>("tests");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
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
    feedback: { error, notice },
    view: assessmentView,
    actions: { refresh, assign },
  };
}
