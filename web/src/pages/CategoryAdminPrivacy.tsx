import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CategoryAdminLayout } from '../components/CategoryAdminLayout';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import { CategoryAdminPrivacyTabs, type CategoryAdminPrivacyTab } from '../components/CategoryAdminPrivacyTabs';
import { CategoryAdminPrivacyOverview } from '../components/CategoryAdminPrivacyOverview';
import { CategoryAdminManageSubcategoryAdminsPanel } from '../components/CategoryAdminManageSubcategoryAdminsPanel';
import { ClubGroupChatRequestReviewPanel } from '../components/ClubGroupChatRequestReviewPanel';
import { StudentChatGroupRequestReviewPanel } from '../components/StudentChatGroupRequestReviewPanel';
import { MessagingDeleteRequestReviewPanel } from '../components/MessagingDeleteRequestReviewPanel';
import { categoryAdminClubGroupChatRequestsService } from '../services/category-admin-club-group-chat-requests.service';
import { categoryAdminStudentChatGroupRequestsService } from '../services/category-admin-student-chat-group-requests.service';
import {
  categoryAdminClubGroupChatDeleteRequestsService,
  type ClubGroupChatDeleteRequestItem,
} from '../services/club-group-chat-delete-requests.service';
import {
  categoryAdminStudentChatGroupDeleteRequestsService,
  type StudentChatGroupDeleteRequestItem,
} from '../services/student-chat-group-delete-requests.service';

function privacyTabFromParam(tab: string | null): CategoryAdminPrivacyTab {
  if (tab === 'message-config') return tab;
  if (tab === 'manage-admins' || tab === 'admins') return 'manage-admins';
  return 'privacy';
}

const TAB_SUBTITLES: Record<CategoryAdminPrivacyTab, string> = {
  privacy: 'Subcategory admin emails under your categories. Your own email is managed by the school admin.',
  'manage-admins': 'Create subcategory admins or grant additional subcategory access to existing admins.',
  'message-config': 'Club and student group chat requests and delete approvals from subcategory admins.',
};

export const CategoryAdminPrivacy = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [privacyTab, setPrivacyTab] = useState<CategoryAdminPrivacyTab>(() =>
    privacyTabFromParam(searchParams.get('tab')),
  );
  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.category } as CSSProperties;

  useEffect(() => {
    setPrivacyTab(privacyTabFromParam(searchParams.get('tab')));
  }, [searchParams]);

  const handlePrivacyTabChange = (tab: CategoryAdminPrivacyTab) => {
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
        <section className="admin-panel" style={panelStyle}>
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">Club group chat requests</h2>
          </div>
          <div className="admin-panel__body">
            <ClubGroupChatRequestReviewPanel
              service={categoryAdminClubGroupChatRequestsService}
              queryKeyPrefix="category-admin"
            />
          </div>
        </section>
        <section className="admin-panel" style={panelStyle}>
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">Student group chat requests</h2>
          </div>
          <div className="admin-panel__body">
            <StudentChatGroupRequestReviewPanel
              service={categoryAdminStudentChatGroupRequestsService}
              queryKeyPrefix="category-admin"
            />
          </div>
        </section>
        <MessagingDeleteRequestReviewPanel
          panelStyle={panelStyle}
          title="Group chat delete requests"
          description="Sub-category admins can request removal of club group chats. Approve to disable the chat for members."
          queryKeyPrefix="category-admin"
          queryKey="club-group-chat-delete-requests"
          service={categoryAdminClubGroupChatDeleteRequestsService}
          renderTargetName={(row) =>
            (row as ClubGroupChatDeleteRequestItem).clubGroupChat.pageName || 'Club group chat'
          }
          approveSuccessMessage="Group chat deleted (disabled)."
        />
        <MessagingDeleteRequestReviewPanel
          panelStyle={panelStyle}
          title="Student group delete requests"
          description="Sub-category admins can request removal of student chat groups. Approve to deactivate the group."
          queryKeyPrefix="category-admin"
          queryKey="student-chat-group-delete-requests"
          service={categoryAdminStudentChatGroupDeleteRequestsService}
          renderTargetName={(row) => (row as StudentChatGroupDeleteRequestItem).studentChatGroup.name}
          renderTargetMeta={(row) => (row as StudentChatGroupDeleteRequestItem).studentChatGroup.visibility}
          approveSuccessMessage="Student group deleted (deactivated)."
        />
      </div>
    ),
    [panelStyle],
  );

  return (
    <CategoryAdminLayout>
      <div className="admin-privacy-page">
        <header className="admin-page-header" style={panelStyle}>
          <h1 className="admin-page-title">Privacy</h1>
          <p className="admin-page-subtitle">{TAB_SUBTITLES[privacyTab]}</p>
          <CategoryAdminPrivacyTabs
            activeTab={privacyTab}
            onChange={handlePrivacyTabChange}
            style={panelStyle}
          />
        </header>

        {privacyTab === 'message-config' ? (
          messageConfigPanels
        ) : privacyTab === 'privacy' ? (
          <CategoryAdminPrivacyOverview panelStyle={panelStyle} />
        ) : (
          <CategoryAdminManageSubcategoryAdminsPanel panelStyle={panelStyle} />
        )}
      </div>
    </CategoryAdminLayout>
  );
};
