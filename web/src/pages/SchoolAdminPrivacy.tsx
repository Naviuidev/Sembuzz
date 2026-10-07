import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SchoolAdminLayout } from '../components/SchoolAdminLayout';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import { SchoolAdminPrivacyTabs, type SchoolAdminPrivacyTab } from '../components/SchoolAdminPrivacyTabs';
import { SchoolAdminPrivacyOverview } from '../components/SchoolAdminPrivacyOverview';
import { SchoolAdminManageCategoryAdminsPanel } from '../components/SchoolAdminManageCategoryAdminsPanel';
import { ClubGroupChatRequestReviewPanel } from '../components/ClubGroupChatRequestReviewPanel';
import { SchoolAdminDirectMessagingPanel } from '../components/SchoolAdminDirectMessagingPanel';
import { SchoolAdminClubGroupChatConfigPanel } from '../components/SchoolAdminClubGroupChatConfigPanel';
import { StudentChatGroupRequestReviewPanel } from '../components/StudentChatGroupRequestReviewPanel';
import { MessagingDeleteRequestReviewPanel } from '../components/MessagingDeleteRequestReviewPanel';
import { schoolAdminClubGroupChatRequestsService } from '../services/school-admin-club-group-chat-requests.service';
import { schoolAdminStudentChatGroupRequestsService } from '../services/school-admin-student-chat-group-requests.service';
import {
  schoolAdminClubGroupChatDeleteRequestsService,
  type ClubGroupChatDeleteRequestItem,
} from '../services/club-group-chat-delete-requests.service';
import {
  schoolAdminStudentChatGroupDeleteRequestsService,
  type StudentChatGroupDeleteRequestItem,
} from '../services/student-chat-group-delete-requests.service';

function schoolPrivacyTabFromParam(tab: string | null): SchoolAdminPrivacyTab {
  if (tab === 'message-config') return tab;
  if (tab === 'manage-admins' || tab === 'admins') return 'manage-admins';
  return 'privacy';
}

const TAB_SUBTITLES: Record<SchoolAdminPrivacyTab, string> = {
  privacy: 'School features, admin identities, and pending email change requests.',
  'manage-admins': 'Create category admins or grant additional category access to existing admins.',
  'message-config': '1:1 messaging, club chats, group requests, and delete approvals.',
};

export const SchoolAdminPrivacy = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [privacyTab, setPrivacyTab] = useState<SchoolAdminPrivacyTab>(() =>
    schoolPrivacyTabFromParam(searchParams.get('tab')),
  );
  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.school } as CSSProperties;

  useEffect(() => {
    setPrivacyTab(schoolPrivacyTabFromParam(searchParams.get('tab')));
  }, [searchParams]);

  const handlePrivacyTabChange = (tab: SchoolAdminPrivacyTab) => {
    setPrivacyTab(tab);
    const next = new URLSearchParams(searchParams);
    if (tab === 'privacy') {
      next.delete('tab');
    } else {
      next.set('tab', tab);
    }
    setSearchParams(next, { replace: true });
  };

  const messageConfigPanels = useMemo(
    () => (
      <div className="admin-privacy-stack">
        <SchoolAdminDirectMessagingPanel panelStyle={panelStyle} />
        <SchoolAdminClubGroupChatConfigPanel panelStyle={panelStyle} />
        <section className="admin-panel" style={panelStyle}>
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">Club group chat requests</h2>
          </div>
          <div className="admin-panel__body">
            <ClubGroupChatRequestReviewPanel
              service={schoolAdminClubGroupChatRequestsService}
              queryKeyPrefix="school-admin"
            />
          </div>
        </section>
        <section className="admin-panel" style={panelStyle}>
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">Student group chat requests</h2>
          </div>
          <div className="admin-panel__body">
            <StudentChatGroupRequestReviewPanel
              service={schoolAdminStudentChatGroupRequestsService}
              queryKeyPrefix="school-admin"
            />
          </div>
        </section>
        <MessagingDeleteRequestReviewPanel
          panelStyle={panelStyle}
          title="Group chat delete requests"
          description="Sub-category admins can request removal of club group chats. Approve to disable the chat for members."
          queryKeyPrefix="school-admin"
          queryKey="club-group-chat-delete-requests"
          service={schoolAdminClubGroupChatDeleteRequestsService}
          renderTargetName={(row) =>
            (row as ClubGroupChatDeleteRequestItem).clubGroupChat.pageName || 'Club group chat'
          }
          approveSuccessMessage="Group chat deleted (disabled)."
        />
        <MessagingDeleteRequestReviewPanel
          panelStyle={panelStyle}
          title="Student group delete requests"
          description="Sub-category admins can request removal of student chat groups. Approve to deactivate the group."
          queryKeyPrefix="school-admin"
          queryKey="student-chat-group-delete-requests"
          service={schoolAdminStudentChatGroupDeleteRequestsService}
          renderTargetName={(row) => (row as StudentChatGroupDeleteRequestItem).studentChatGroup.name}
          renderTargetMeta={(row) => (row as StudentChatGroupDeleteRequestItem).studentChatGroup.visibility}
          approveSuccessMessage="Student group deleted (deactivated)."
        />
      </div>
    ),
    [panelStyle],
  );

  return (
    <SchoolAdminLayout>
      <div className="admin-privacy-page">
        <header className="admin-page-header" style={panelStyle}>
          <h1 className="admin-page-title">Privacy</h1>
          <p className="admin-page-subtitle">{TAB_SUBTITLES[privacyTab]}</p>
          <SchoolAdminPrivacyTabs
            activeTab={privacyTab}
            onChange={handlePrivacyTabChange}
            style={panelStyle}
          />
        </header>

        {privacyTab === 'message-config' ? (
          messageConfigPanels
        ) : privacyTab === 'privacy' ? (
          <SchoolAdminPrivacyOverview panelStyle={panelStyle} />
        ) : (
          <SchoolAdminManageCategoryAdminsPanel panelStyle={panelStyle} />
        )}
      </div>
    </SchoolAdminLayout>
  );
};
