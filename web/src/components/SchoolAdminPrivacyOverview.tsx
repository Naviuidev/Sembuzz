import { useMemo, useState, type CSSProperties } from 'react';
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
import { invalidateAdminActionItems } from '../services/admin-action-items.service';

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

export function SchoolAdminPrivacyOverview({ panelStyle }: { panelStyle: CSSProperties }) {
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
    void invalidateAdminActionItems(queryClient, 'school-admin');
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
  ) => initiateMutation.mutateAsync({ targetRole, targetAdminId, reason });

  const handleConfirmOtp = async (requestId: string, otp: string) => {
    await confirmOtpMutation.mutateAsync({ requestId, otp });
  };

  const roleContent = useMemo(() => {
    const targetRole = TAB_TO_TARGET_ROLE[roleTab];

    if (roleTab === 'category-admin') {
      if (categoryLoading) return <div className="admin-loading-state">Loading category admins…</div>;
      if (categoryAdmins.length === 0) {
        return <p className="admin-form-hint mb-0">No category admins for this school yet.</p>;
      }
      return categoryAdmins.map((admin) => (
        <AdminIdentityCard
          key={admin.id}
          title={admin.name}
          adminRole="Category admin"
          subtitle={
            admin.categories?.map((c) => c.category.name).join(', ') || admin.category?.name || undefined
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
      if (adsLoading) return <div className="admin-loading-state">Loading ads admins…</div>;
      if (adsAdmins.length === 0) {
        return (
          <p className="admin-form-hint mb-0">
            No ads admin is configured for this school. Ads admins are created when the Ads feature is enabled.
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

    if (subcategoryLoading) return <div className="admin-loading-state">Loading subcategory admins…</div>;
    if (subcategoryAdmins.length === 0) {
      return <p className="admin-form-hint mb-0">No subcategory admins for this school yet.</p>;
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
  ]);

  return (
    <>
      <SchoolAdminEmailChangeRequestsPanel
        panelStyle={panelStyle}
        requests={emailChangeRequests}
        isLoading={requestsLoading}
      />

      <section className="admin-panel mb-4" style={panelStyle}>
        <div className="admin-panel__header">
          <h2 className="admin-panel__title">Enabled features</h2>
        </div>
        <div className="admin-panel__body">
          <p className="admin-form-hint mb-3">
            Features turned on for <strong>{user?.schoolName || 'your school'}</strong> by the super admin.
          </p>
          <div className="d-flex flex-wrap gap-2">
            {features.length > 0 ? (
              features.map((feature) => (
                <span key={feature.code} className="admin-pill admin-pill--neutral">
                  {feature.name}
                </span>
              ))
            ) : (
              <span className="admin-form-hint mb-0">No features enabled</span>
            )}
          </div>
        </div>
      </section>

      <section className="admin-panel" style={panelStyle}>
        <div className="admin-panel__header">
          <h2 className="admin-panel__title">Admin identities</h2>
          <nav className="admin-dashboard-badges mb-0" aria-label="Admin role type" style={panelStyle}>
            {ROLE_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`admin-dashboard-badge${roleTab === tab.id ? ' is-active' : ''}`}
                onClick={() => setRoleTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="admin-panel__body">{roleContent}</div>
      </section>
    </>
  );
}
