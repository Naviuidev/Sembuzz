import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminIdentityCard, resolvePlatformUserId } from './AdminIdentityCard';
import { SchoolAdminEmailChangeRequestsPanel } from './SchoolAdminEmailChangeRequestsPanel';
import { useSchoolAdminAuth } from '../contexts/SchoolAdminAuthContext';
import { categoryAdminsService } from '../services/category-admins.service';
import {
  schoolAdminSubcategoryAdminsService,
  type SchoolAdminSubCategoryAdmin,
} from '../services/school-admin-subcategory-admins.service';
import {
  schoolAdminAdsAdminsService,
  type SchoolAdminIdentityRow,
} from '../services/school-admin-ads-admins.service';
import {
  schoolAdminEmailChangeRequestsService,
  type AdminEmailChangeTargetRole,
} from '../services/admin-email-change-requests.service';

const TEXT_DARK = '#1a1f2e';
const TEXT_MUTED = '#6c757d';

type AdminRoleTab = 'category-admin' | 'ads-admin' | 'subcategory-admin';

const ROLE_TABS: { id: AdminRoleTab; label: string }[] = [
  { id: 'category-admin', label: 'Category admin' },
  { id: 'ads-admin', label: 'Ads admin' },
  { id: 'subcategory-admin', label: 'Subcategory admin' },
];

const TAB_TO_TARGET_ROLE: Record<AdminRoleTab, AdminEmailChangeTargetRole> = {
  'category-admin': 'category_admin',
  'ads-admin': 'ads_admin',
  'subcategory-admin': 'subcategory_admin',
};

export function SchoolAdminPrivacyOverview() {
  const queryClient = useQueryClient();
  const { user } = useSchoolAdminAuth();
  const [roleTab, setRoleTab] = useState<AdminRoleTab>('category-admin');

  const { data: categoryAdmins = [], isLoading: categoryLoading } = useQuery({
    queryKey: ['category-admins'],
    queryFn: categoryAdminsService.getAll,
  });

  const { data: subcategoryAdmins = [], isLoading: subcategoryLoading } = useQuery({
    queryKey: ['school-admin', 'subcategory-admins'],
    queryFn: schoolAdminSubcategoryAdminsService.getAll,
  });

  const { data: adsAdmins = [], isLoading: adsLoading } = useQuery({
    queryKey: ['school-admin', 'ads-admins'],
    queryFn: schoolAdminAdsAdminsService.getAll,
  });

  const { data: emailChangeRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ['school-admin', 'email-change-requests'],
    queryFn: schoolAdminEmailChangeRequestsService.listPending,
  });

  const invalidateAfterRequest = () => {
    void queryClient.invalidateQueries({ queryKey: ['school-admin', 'email-change-requests'] });
    void queryClient.invalidateQueries({ queryKey: ['school-admin', 'action-items'] });
  };

  const initiateMutation = useMutation({
    mutationFn: ({
      targetRole,
      targetAdminId,
      reason,
    }: {
      targetRole: AdminEmailChangeTargetRole;
      targetAdminId: string;
      reason: string;
    }) => schoolAdminEmailChangeRequestsService.initiate(targetRole, targetAdminId, reason),
  });

  const confirmOtpMutation = useMutation({
    mutationFn: ({ requestId, otp }: { requestId: string; otp: string }) =>
      schoolAdminEmailChangeRequestsService.confirmOtp(requestId, otp),
    onSuccess: () => invalidateAfterRequest(),
  });

  const features = user?.features ?? [];

  const subcategorySubtitle = (row: SchoolAdminSubCategoryAdmin) => {
    const parts = [row.category?.name, row.subCategory?.name].filter(Boolean);
    return parts.length > 0 ? parts.join(' · ') : undefined;
  };

  const handleInitiate = async (
    targetRole: AdminEmailChangeTargetRole,
    targetAdminId: string,
    reason: string,
  ) => {
    return initiateMutation.mutateAsync({ targetRole, targetAdminId, reason });
  };

  const handleConfirmOtp = async (requestId: string, otp: string) => {
    await confirmOtpMutation.mutateAsync({ requestId, otp });
  };

  const roleContent = useMemo(() => {
    const targetRole = TAB_TO_TARGET_ROLE[roleTab];

    if (roleTab === 'category-admin') {
      if (categoryLoading) return <p className="text-muted">Loading category admins…</p>;
      if (categoryAdmins.length === 0) {
        return <p className="text-muted mb-0">No category admins for this school yet.</p>;
      }
      return categoryAdmins.map((admin) => (
        <AdminIdentityCard
          key={admin.id}
          title={admin.name}
          adminRole="Category admin"
          subtitle={
            admin.categories?.map((c) => c.category.name).join(', ') ||
            admin.category?.name ||
            undefined
          }
          userId={resolvePlatformUserId(admin)}
          email={admin.email}
          targetRole={targetRole}
          targetAdminId={admin.id}
          onInitiateEmailRequest={handleInitiate}
          onConfirmEmailRequestOtp={handleConfirmOtp}
        />
      ));
    }

    if (roleTab === 'ads-admin') {
      if (adsLoading) return <p className="text-muted">Loading ads admins…</p>;
      if (adsAdmins.length === 0) {
        return (
          <p className="text-muted mb-0">
            No ads admin is configured for this school. Ads admins are created when the Ads feature is
            enabled.
          </p>
        );
      }
      return adsAdmins.map((admin: SchoolAdminIdentityRow) => (
        <AdminIdentityCard
          key={admin.id}
          title={admin.name}
          adminRole="Ads admin"
          subtitle={admin.isActive ? 'Active' : 'Inactive'}
          userId={admin.userId}
          email={admin.email}
          targetRole={targetRole}
          targetAdminId={admin.id}
          onInitiateEmailRequest={handleInitiate}
          onConfirmEmailRequestOtp={handleConfirmOtp}
        />
      ));
    }

    if (subcategoryLoading) return <p className="text-muted">Loading subcategory admins…</p>;
    if (subcategoryAdmins.length === 0) {
      return <p className="text-muted mb-0">No subcategory admins for this school yet.</p>;
    }
    return subcategoryAdmins.map((admin) => (
      <AdminIdentityCard
        key={admin.id}
        title={admin.name}
        adminRole="Subcategory admin"
        subtitle={subcategorySubtitle(admin)}
        userId={resolvePlatformUserId(admin)}
        email={admin.email}
        targetRole={targetRole}
        targetAdminId={admin.id}
        onInitiateEmailRequest={handleInitiate}
        onConfirmEmailRequestOtp={handleConfirmOtp}
      />
    ));
  }, [
    roleTab,
    categoryAdmins,
    categoryLoading,
    adsAdmins,
    adsLoading,
    subcategoryAdmins,
    subcategoryLoading,
    initiateMutation.mutateAsync,
    confirmOtpMutation.mutateAsync,
  ]);

  return (
    <>
      <div className="mb-4">
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 'normal',
            color: TEXT_DARK,
            margin: 0,
            marginBottom: '0.5rem',
          }}
        >
          Privacy
        </h1>
        <p style={{ color: TEXT_MUTED, fontSize: '1rem', margin: 0 }}>
          School features and admin account emails you manage for your organization.
        </p>
      </div>

      <SchoolAdminEmailChangeRequestsPanel requests={emailChangeRequests} isLoading={requestsLoading} />

      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 0 }}>
        <div className="card-body p-4">
          <h2 className="h5 mb-3" style={{ color: TEXT_DARK, fontWeight: 500 }}>
            Enabled features
          </h2>
          <p className="small text-muted mb-3">
            Features turned on for <strong>{user?.schoolName || 'your school'}</strong> by the super
            admin.
          </p>
          <div className="d-flex flex-wrap gap-2">
            {features.length > 0 ? (
              features.map((feature) => (
                <span
                  key={feature.code}
                  className="badge rounded-pill"
                  style={{
                    backgroundColor: '#e7f3ff',
                    color: TEXT_DARK,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    padding: '0.4rem 0.85rem',
                    border: '1px solid #dee2e6',
                  }}
                >
                  {feature.name}
                </span>
              ))
            ) : (
              <span style={{ color: TEXT_MUTED, fontSize: '0.875rem' }}>No features enabled</span>
            )}
          </div>
        </div>
      </div>

      <div className="d-flex gap-2 mb-4 flex-wrap">
        {ROLE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setRoleTab(tab.id)}
            className="btn btn-sm"
            style={{
              borderRadius: 50,
              padding: '0.45rem 1.1rem',
              backgroundColor: roleTab === tab.id ? TEXT_DARK : '#fff',
              color: roleTab === tab.id ? '#fff' : TEXT_DARK,
              border: `1px solid ${TEXT_DARK}`,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>{roleContent}</div>
    </>
  );
}
