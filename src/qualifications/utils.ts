import { MILESTONE_STATUS, PROCESS_STATUS } from './constants';
import { QualificationCredit } from './qualification.schema';

export const getQualificationMilestoneAndProcessStatusByVerbalConsent = (
  qualificationCredit: QualificationCredit,
): {
  milestone: MILESTONE_STATUS;
  processStatus: PROCESS_STATUS;
} => {
  const { hasCoApplicant, hasApplicantConsent, hasCoApplicantConsent, milestone, processStatus } = qualificationCredit;

  if (hasApplicantConsent === true && hasCoApplicant === false) {
    return {
      milestone: MILESTONE_STATUS.VERBAL_CONSENT,
      processStatus: PROCESS_STATUS.VERBAL_CONSENT_ACCEPTED,
    };
  }

  if (hasApplicantConsent === false && hasCoApplicant === false) {
    return {
      milestone,
      processStatus: PROCESS_STATUS.VERBAL_CONSENT_DECLINED,
    };
  }

  if (hasApplicantConsent === true && hasCoApplicant === true && hasCoApplicantConsent !== undefined) {
    return {
      milestone: MILESTONE_STATUS.VERBAL_CONSENT,
      processStatus: PROCESS_STATUS.VERBAL_CONSENT_ACCEPTED,
    };
  }

  if (hasApplicantConsent === false && hasCoApplicant === true && hasCoApplicantConsent === false) {
    return {
      milestone,
      processStatus: PROCESS_STATUS.COMPLETE_APPLICANT_DECLINED_VERBAL_CONSENT,
    };
  }

  return { milestone, processStatus };
};
