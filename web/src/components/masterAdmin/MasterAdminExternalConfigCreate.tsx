import { useQuery } from '@tanstack/react-query';
import { ExternalAdminCreateJobPanel } from '../ExternalAdminCreateJobPanel';
import { ExternalAdminCreateOfferPanel } from '../ExternalAdminCreateOfferPanel';
import { ExternalAdminCreateCampaignPanel } from '../ExternalAdminCreateCampaignPanel';
import {
  masterAdminExternalConfigService,
  type ExternalContentKind,
} from '../../services/master-admin-external-config.service';
import type { ExternalAdminComposeMasterOptions } from '../../types/externalCreateMaster';

type Props = {
  schoolId: string;
  schoolName: string;
  contentKind: ExternalContentKind;
  onSaved: () => void;
  onCancel: () => void;
};

export function MasterAdminExternalConfigCreate({ schoolId, schoolName, contentKind, onSaved, onCancel }: Props) {
  const { data: context, isLoading } = useQuery({
    queryKey: ['master-admin', 'external-config', schoolId, 'content-context', contentKind],
    queryFn: () => masterAdminExternalConfigService.getContentContext(schoolId, contentKind),
  });

  if (isLoading) {
    return <p className="master-admin-detail-muted mb-0">Loading posting setup…</p>;
  }

  if (!context?.canPost || !context.externalCategoryId || !context.categoryName) {
    return (
      <div className="admin-empty-state">
        <p className="mb-2">
          This school does not have an approved external admin pipeline for{' '}
          {contentKind === 'job' ? 'Job share' : contentKind === 'offer' ? 'Offers' : 'Campaigns'} yet.
        </p>
        <button type="button" className="admin-btn-secondary" onClick={onCancel}>
          Back to list
        </button>
      </div>
    );
  }

  const categoryId = context.externalCategoryId;
  const categoryName = context.categoryName;

  const invalidateQueryKeys = [
    ['master-admin', 'external-config', schoolId],
    ['master-admin', 'external-config', schoolId, 'posts', 'requests'],
  ];

  const baseMaster: Omit<ExternalAdminComposeMasterOptions, 'submitRequest'> = {
    schoolId,
    schoolName,
    onSaved,
    uploadImage: (file) => masterAdminExternalConfigService.uploadImage(file),
    invalidateQueryKeys,
  };

  if (contentKind === 'job') {
    const master: ExternalAdminComposeMasterOptions = {
      ...baseMaster,
      submitRequest: (payload) => masterAdminExternalConfigService.createJob(schoolId, categoryId, payload as never),
    };
    return (
      <ExternalAdminCreateJobPanel
        categoryId={categoryId}
        categoryName={categoryName}
        master={master}
        onCancel={onCancel}
      />
    );
  }

  if (contentKind === 'offer') {
    const master: ExternalAdminComposeMasterOptions = {
      ...baseMaster,
      submitRequest: (payload) => masterAdminExternalConfigService.createOffer(schoolId, categoryId, payload as never),
    };
    return (
      <ExternalAdminCreateOfferPanel
        categoryId={categoryId}
        categoryName={categoryName}
        master={master}
        onCancel={onCancel}
      />
    );
  }

  const master: ExternalAdminComposeMasterOptions = {
    ...baseMaster,
    submitRequest: (payload) => masterAdminExternalConfigService.createCampaign(schoolId, categoryId, payload as never),
  };
  return (
    <ExternalAdminCreateCampaignPanel
      categoryId={categoryId}
      categoryName={categoryName}
      master={master}
      onCancel={onCancel}
    />
  );
}
