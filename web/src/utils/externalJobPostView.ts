import type { ExternalPostRequestRow } from '../services/external-admin-post-requests.service';

export const JOB_DESCRIPTION_PREVIEW_WORDS = 15;

export type ExternalJobPreviewModel = {
  jobTitle: string;
  companyName: string;
  companyLogoUrl: string;
  jobType: string;
  workMode: string;
  location: string;
  jobDescription: string;
  eligibilityRequirements: string;
  skillsRequired: string;
  experienceRequired: string;
  salaryStipend: string;
  applicationDeadline: string;
  applicationMethod: string;
  applicationTarget: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  postedByOrganization: string;
  applyButtonEnabled: boolean;
  saveJobButtonEnabled: boolean;
  applyButtonUrl: string;
  categoryName: string;
};

export function externalPostRowToJobPreview(row: ExternalPostRequestRow): ExternalJobPreviewModel {
  const r = row as ExternalPostRequestRow & {
    companyName?: string | null;
    companyLogoUrl?: string | null;
    jobType?: string | null;
    workMode?: string | null;
    jobLocation?: string | null;
    eligibilityRequirements?: string | null;
    skillsRequired?: string | null;
    experienceRequired?: string | null;
    salaryStipend?: string | null;
    applicationDeadline?: string | null;
    applicationMethod?: string | null;
    applicationTarget?: string | null;
    contactPerson?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    postedByOrganization?: string | null;
    jobPublishStatus?: string | null;
    applyButtonEnabled?: boolean;
    saveJobButtonEnabled?: boolean;
    applyButtonUrl?: string | null;
  };

  let deadline = '';
  if (r.applicationDeadline) {
    try {
      deadline = new Date(r.applicationDeadline).toISOString().slice(0, 10);
    } catch {
      deadline = String(r.applicationDeadline).slice(0, 10);
    }
  }

  return {
    jobTitle: row.title,
    companyName: r.companyName ?? '',
    companyLogoUrl: r.companyLogoUrl ?? '',
    jobType: r.jobType ?? '',
    workMode: r.workMode ?? '',
    location: r.jobLocation ?? row.eventLocation ?? '',
    jobDescription: row.description ?? '',
    eligibilityRequirements: r.eligibilityRequirements ?? '',
    skillsRequired: r.skillsRequired ?? '',
    experienceRequired: r.experienceRequired ?? '',
    salaryStipend: r.salaryStipend ?? '',
    applicationDeadline: deadline,
    applicationMethod: r.applicationMethod ?? 'external_url',
    applicationTarget: r.applicationTarget ?? '',
    contactPerson: r.contactPerson ?? '',
    contactEmail: r.contactEmail ?? '',
    contactPhone: r.contactPhone ?? '',
    postedByOrganization: r.postedByOrganization ?? '',
    applyButtonEnabled: Boolean(r.applyButtonEnabled),
    saveJobButtonEnabled: r.saveJobButtonEnabled !== false,
    applyButtonUrl: (r.applyButtonUrl ?? r.applicationTarget ?? '').trim(),
    categoryName: row.externalCategory.name,
  };
}

export function isExternalJobPost(row: ExternalPostRequestRow): boolean {
  return row.contentType === 'job';
}
