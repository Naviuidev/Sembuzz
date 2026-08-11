import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

const TEXT_DARK = '#1a1f2e';
const TEXT_MUTED = '#6c757d';

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

export function CategoryAdminPrivacyOverview() {
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
      void queryClient.invalidateQueries({ queryKey: ['school-admin', 'action-items'] });
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
          Subcategory admin emails under your categories. Your own email is managed by the school admin.
        </p>
      </div>

      {categories.length > 0 ? (
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 0 }}>
          <div className="card-body p-4">
            <h2 className="h5 mb-3" style={{ color: TEXT_DARK, fontWeight: 500 }}>
              Your categories
            </h2>
            <div className="d-flex flex-wrap gap-2">
              {categories.map((cat) => (
                <span
                  key={cat.id}
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
                  {cat.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <p className="text-muted">Loading subcategory admins…</p>
      ) : subcategoryAdmins.length === 0 ? (
        <p className="text-muted mb-0">No subcategory admins in your categories yet.</p>
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
    </>
  );
}
