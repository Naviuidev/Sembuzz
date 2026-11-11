import { useMemo, useState, type CSSProperties } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MasterAdminLayout } from '../components/MasterAdminLayout';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import {
  MasterAdminExternalPostRequestsPanel,
  MasterAdminPipelineRequestsPanel,
} from '../components/masterAdmin/MasterAdminExternalConfigPanels';
import { MasterAdminExternalConfigCreate } from '../components/masterAdmin/MasterAdminExternalConfigCreate';
import {
  masterAdminExternalConfigService,
  type ExternalContentKind,
} from '../services/master-admin-external-config.service';
type Section = 'admin-requests' | ExternalContentKind;

const CONTENT_OPTIONS: { id: ExternalContentKind; label: string }[] = [
  { id: 'job', label: 'Job share' },
  { id: 'offer', label: 'Offers' },
  { id: 'campaign', label: 'Campaigns' },
];

const SECTION_OPTIONS: { id: Section; label: string }[] = [
  { id: 'admin-requests', label: 'Admin request' },
  ...CONTENT_OPTIONS,
];

const CREATE_BUTTON_LABELS: Record<ExternalContentKind, string> = {
  job: 'Create job share',
  offer: 'Create offer',
  campaign: 'Create campaign',
};

type Phase = 'browse' | 'create';

const SECTION_SUBTITLES: Record<Section, string> = {
  'admin-requests':
    'External admin pipeline access requests for the selected school (approve, query, reject, or ban).',
  job: 'Jobs created by external admins for the selected school.',
  offer: 'Offers created by external admins for the selected school.',
  campaign: 'Campaigns created by external admins for the selected school.',
};

export function MasterAdminExternalConfigPage() {
  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.master } as CSSProperties;
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [section, setSection] = useState<Section>('job');
  const [pipelineConversationId, setPipelineConversationId] = useState<string | null>(null);
  const [postConversationId, setPostConversationId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('browse');

  const { data: schools = [], isLoading: schoolsLoading } = useQuery({
    queryKey: ['master-admin', 'external-config', 'schools'],
    queryFn: () => masterAdminExternalConfigService.listSchoolsWithExternalActivity(),
  });

  const schoolOptions = useMemo(() => schools, [schools]);
  const selectedSchool = schoolOptions.find((s) => s.id === selectedSchoolId);

  const { data: pipelinePending } = useQuery({
    queryKey: ['master-admin', 'external-config', selectedSchoolId, 'pipeline', 'pending-count'],
    queryFn: () => masterAdminExternalConfigService.pipelinePendingCount(selectedSchoolId),
    enabled: Boolean(selectedSchoolId),
  });

  const { data: postRows = [] } = useQuery({
    queryKey: ['master-admin', 'external-config', selectedSchoolId, 'posts', 'requests'],
    queryFn: () => masterAdminExternalConfigService.listPostRequests(selectedSchoolId),
    enabled: Boolean(selectedSchoolId),
  });

  const pendingByContent = useMemo(() => {
    const isPending = (status: string) => status === 'pending' || status === 'query';
    const count = (kind: ExternalContentKind) =>
      postRows.filter((r) => r.contentType === kind && isPending(r.status)).length;
    return { job: count('job'), offer: count('offer'), campaign: count('campaign') };
  }, [postRows]);

  const inConversation = Boolean(pipelineConversationId || postConversationId);
  const isContentSection = section !== 'admin-requests';
  const isComposer = phase === 'create' && isContentSection && Boolean(selectedSchoolId);

  return (
    <MasterAdminLayout>
      <div
        className={`admin-posts-page master-admin-posts-hub${isComposer ? ' admin-posts-page--create' : ''}`}
      >
        <header className="admin-page-header master-admin-posts-page__header" style={panelStyle}>
          <div className="master-admin-posts-page__header-row">
            <div>
              <h1 className="admin-page-title mb-1">External config</h1>
              <p className="admin-page-subtitle mb-0">
                {selectedSchoolId
                  ? isComposer
                    ? `Compose a new ${section === 'job' ? 'job share' : section === 'offer' ? 'offer' : 'campaign'} for ${selectedSchool?.name ?? 'this school'}.`
                    : SECTION_SUBTITLES[section]
                  : 'Select a school that uses external admins, then choose Job share, Offers, or Campaigns to browse submissions.'}
              </p>
            </div>
          </div>
        </header>

        {!isComposer ? (
        <section className="admin-panel master-admin-posts-school-filter" style={panelStyle}>
          <div className="admin-panel__body">
            <label className="admin-form-label" htmlFor="ma-ext-filter-school">
              School (with external admin)
            </label>
            <select
              id="ma-ext-filter-school"
              className="form-select admin-form-control master-admin-posts-school-filter__select"
              value={selectedSchoolId}
              onChange={(e) => {
                setSelectedSchoolId(e.target.value);
                setPipelineConversationId(null);
                setPostConversationId(null);
                setSection('job');
                setPhase('browse');
              }}
              disabled={schoolsLoading}
            >
              <option value="">Choose school…</option>
              {schoolOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {!schoolsLoading && schoolOptions.length === 0 ? (
              <p className="admin-form-hint mb-0 mt-2">No schools have external admin activity yet.</p>
            ) : null}
            {selectedSchoolId ? (
              <>
                <label className="admin-form-label mt-3" htmlFor="ma-ext-filter-section">
                  Section
                </label>
                <select
                  id="ma-ext-filter-section"
                  className="form-select admin-form-control master-admin-posts-school-filter__select"
                  value={section}
                  onChange={(e) => {
                    setSection(e.target.value as Section);
                    setPipelineConversationId(null);
                    setPostConversationId(null);
                    setPhase('browse');
                  }}
                >
                  {SECTION_OPTIONS.map(({ id, label }) => {
                    const pending =
                      id === 'admin-requests'
                        ? pipelinePending?.pending
                        : pendingByContent[id as ExternalContentKind];
                    return (
                      <option key={id} value={id}>
                        {label}
                        {pending && pending > 0 ? ` (${pending})` : ''}
                      </option>
                    );
                  })}
                </select>
              </>
            ) : null}
            {selectedSchool ? (
              <p className="admin-form-hint mb-0 mt-2">
                Viewing: <strong>{selectedSchool.name}</strong>
              </p>
            ) : null}
          </div>
        </section>
        ) : null}

        {isComposer ? (
          <MasterAdminExternalConfigCreate
            schoolId={selectedSchoolId}
            schoolName={selectedSchool?.name ?? ''}
            contentKind={section}
            onCancel={() => setPhase('browse')}
            onSaved={() => setPhase('browse')}
          />
        ) : null}

        {selectedSchoolId && !isComposer ? (
          <section
            className={`admin-panel${inConversation ? ' admin-panel--pipeline-conversation' : ''}`}
            style={panelStyle}
          >
            <div className={inConversation ? 'admin-panel__body' : 'admin-panel__body admin-panel__body--flush-top'}>
              {section === 'admin-requests' ? (
                <MasterAdminPipelineRequestsPanel
                  schoolId={selectedSchoolId}
                  conversationId={pipelineConversationId}
                  onOpenConversation={setPipelineConversationId}
                  onCloseConversation={() => setPipelineConversationId(null)}
                />
              ) : null}
              {isContentSection ? (
                <MasterAdminExternalPostRequestsPanel
                  schoolId={selectedSchoolId}
                  schoolName={selectedSchool?.name ?? ''}
                  contentType={section}
                  conversationId={postConversationId}
                  createButtonLabel={CREATE_BUTTON_LABELS[section]}
                  onStartCreate={() => setPhase('create')}
                  onOpenConversation={setPostConversationId}
                  onCloseConversation={() => setPostConversationId(null)}
                />
              ) : null}
            </div>
          </section>
        ) : (
          <section className="admin-panel" style={panelStyle}>
            <div className="admin-panel__body">
              <p className="master-admin-detail-muted mb-0">
                Choose a school with external admin activity to browse Job share, Offers, and Campaigns.
              </p>
            </div>
          </section>
        )}
      </div>
    </MasterAdminLayout>
  );
}
