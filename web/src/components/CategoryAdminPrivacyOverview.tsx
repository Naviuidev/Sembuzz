import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CSSProperties } from 'react';
import { AdminIdentityCard, resolvePlatformUserId } from './AdminIdentityCard';
import { useCategoryAdminAuth } from '../contexts/CategoryAdminAuthContext';
import { categoryAdminCategoriesService } from '../services/category-admin-categories.service';
import {
  subCategoryAdminsService,
  type SubCategoryAdmin,
} from '../services/subcategory-admins.service';
import {
  categoryAdminEmailChangeRequestsService,
  type AdminEmailChangeTargetRole,
} from '../services/admin-email-change-requests.service';
import { invalidateAdminActionItems } from '../services/admin-action-items.service';

function subcategoryNames(admin: SubCategoryAdmin): string {
  const names: string[] = [];
  if (admin.subCategory?.name) names.push(admin.subCategory.name);
  admin.subCategories?.forEach((sc) => {
    if (sc.subCategory?.name && !names.includes(sc.subCategory.name)) {
      names.push(sc.subCategory.name);
    }
  });
  return names.join(', ');
}

export function CategoryAdminPrivacyOverview({ panelStyle }: { panelStyle: CSSProperties }) {
  const queryClient = useQueryClient();
  const { user, token } = useCategoryAdminAuth();

  const { data: categories = [] } = useQuery({
    queryKey: ['category-admin-categories', user?.id],
    queryFn: async () => {
      try {
        const list = await categoryAdminCategoriesService.getMyCategories();
        if (list?.length) return list;
      } catch {
        /* fall back */
      }
      const primary = await categoryAdminCategoriesService.getMyCategory();
      return primary ? [primary] : [];
    },
    enabled: !!user?.categoryId,
  });

  const { data: subcategoryAdmins = [], isLoading } = useQuery({
    queryKey: ['category-admin', 'subcategory-admins', user?.id],
    queryFn: subCategoryAdminsService.getAll,
    enabled: !!token,
  });

  const initiateMutation = useMutation({
    mutationFn: ({
      targetAdminId,
      reason,
    }: {
      targetAdminId: string;
      reason: string;
    }) =>
      categoryAdminEmailChangeRequestsService.initiate('subcategory_admin', targetAdminId, reason),
  });

  const confirmOtpMutation = useMutation({
    mutationFn: ({ requestId, otp }: { requestId: string; otp: string }) =>
      categoryAdminEmailChangeRequestsService.confirmOtp(requestId, otp),
    onSuccess: () => {
      void invalidateAdminActionItems(queryClient, 'category-admin');
      void invalidateAdminActionItems(queryClient, 'school-admin');
    },
  });

  const handleInitiate = async (
    targetRole: AdminEmailChangeTargetRole,
    targetAdminId: string,
    reason: string,
  ) => {
    if (targetRole !== 'subcategory_admin') {
      throw new Error('Unsupported target role');
    }
    return initiateMutation.mutateAsync({ targetAdminId, reason });
  };

  const handleConfirmOtp = async (requestId: string, otp: string) => {
    await confirmOtpMutation.mutateAsync({ requestId, otp });
  };

  return (
    <>
      {categories.length > 0 ? (
        <section className="admin-panel mb-4" style={panelStyle}>
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">Your categories</h2>
          </div>
          <div className="admin-panel__body">
            <div className="d-flex flex-wrap gap-2">
              {categories.map((cat) => (
                <span key={cat.id} className="admin-pill admin-pill--neutral">
                  {cat.name}
                </span>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="admin-panel" style={panelStyle}>
        <div className="admin-panel__header">
          <h2 className="admin-panel__title">Subcategory admin identities</h2>
        </div>
        <div className="admin-panel__body">
          <p className="admin-form-hint mb-4">
            Request email changes for subcategory admins in your categories. Your own email is managed by the school
            admin.
          </p>
          {isLoading ? (
            <div className="admin-loading-state">Loading subcategory admins…</div>
          ) : subcategoryAdmins.length === 0 ? (
            <p className="admin-form-hint mb-0">No subcategory admins in your categories yet.</p>
          ) : (
            subcategoryAdmins.map((admin) => (
              <AdminIdentityCard
                key={admin.id}
                title={admin.name}
                adminRole="Subcategory admin"
                subtitle={subcategoryNames(admin) || admin.category?.name}
                userId={resolvePlatformUserId(admin)}
                email={admin.email}
                targetRole="subcategory_admin"
                targetAdminId={admin.id}
                onInitiateEmailRequest={handleInitiate}
                onConfirmEmailRequestOtp={handleConfirmOtp}
              />
            ))
          )}
        </div>
      </section>
    </>
  );
}
