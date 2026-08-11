import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { SubCategoryAdminLayout } from '../components/SubCategoryAdminLayout';
import { SubCategoryAdminBlogApprovedPanel } from '../components/SubCategoryAdminBlogApprovedPanel';
import { SubCategoryAdminBlogPendingPanel } from '../components/SubCategoryAdminBlogPendingPanel';
import { SubCategoryAdminBlogRejectedPanel } from '../components/SubCategoryAdminBlogRejectedPanel';
import { SubCategoryAdminBlogSuggestionsPanel } from '../components/SubCategoryAdminBlogSuggestionsPanel';
import {
  SubCategoryAdminPostBlogPanel,
  type ResubmitBlog,
} from './SubCategoryAdminPostBlog';
import type { BlogRow } from '../services/subcategory-admin-blogs.service';

type BlogsPageTab =
  | 'post-blog'
  | 'blog-pending'
  | 'blog-approved'
  | 'blog-suggestions'
  | 'blog-rejected';

const TEXT_DARK = '#1a1f2e';
const TEXT_MUTED = '#6c757d';

const BLOG_TABS: { id: BlogsPageTab; label: string }[] = [
  { id: 'post-blog', label: 'Post blog' },
  { id: 'blog-pending', label: 'Blog pending' },
  { id: 'blog-approved', label: 'Blog approved' },
  { id: 'blog-suggestions', label: 'Blog suggestions' },
  { id: 'blog-rejected', label: 'Blog rejected' },
];

function toResubmitBlog(blog: BlogRow): ResubmitBlog {
  return {
    title: blog.title,
    content: blog.content,
    coverImageUrl: blog.coverImageUrl,
    subCategory: blog.subCategory,
  };
}

export const SubCategoryAdminBlogs = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<BlogsPageTab>('post-blog');
  const [resubmitBlog, setResubmitBlog] = useState<ResubmitBlog | undefined>();
  const hasAppliedResubmit = useRef(false);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (
      tab === 'post-blog' ||
      tab === 'blog-pending' ||
      tab === 'blog-approved' ||
      tab === 'blog-suggestions' ||
      tab === 'blog-rejected'
    ) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    const fromState = (location.state as { resubmitBlog?: ResubmitBlog })?.resubmitBlog;
    if (fromState && !hasAppliedResubmit.current) {
      hasAppliedResubmit.current = true;
      setResubmitBlog(fromState);
      setActiveTab('post-blog');
    }
  }, [location.state]);

  const handleReviseAndResubmit = useCallback((blog: BlogRow) => {
    setResubmitBlog(toResubmitBlog(blog));
    setActiveTab('post-blog');
  }, []);

  return (
    <SubCategoryAdminLayout>
      <div className="mb-4">
        <h1 style={{ fontSize: '2rem', fontWeight: 'normal', color: TEXT_DARK, marginBottom: '0.5rem' }}>
          Blogs
        </h1>
        <p style={{ color: TEXT_MUTED, fontSize: '1rem', marginBottom: 0 }}>
          Create, track, and manage blog posts for category admin approval
        </p>
      </div>

      <ul className="nav nav-tabs mb-4" style={{ borderBottom: '1px solid #dee2e6' }}>
        {BLOG_TABS.map((tab) => (
          <li key={tab.id} className="nav-item">
            <button
              type="button"
              className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
              style={{
                borderRadius: 0,
                color: activeTab === tab.id ? TEXT_DARK : TEXT_MUTED,
                fontWeight: activeTab === tab.id ? 600 : 400,
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? `2px solid ${TEXT_DARK}` : '2px solid transparent',
              }}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          </li>
        ))}
      </ul>

      {activeTab === 'post-blog' ? (
        <>
          <p style={{ color: TEXT_MUTED, fontSize: '1rem', marginBottom: '1.5rem' }}>
            Build your article with blocks, set column width per block (12 = full width), then
            preview before submitting for approval.
          </p>
          <SubCategoryAdminPostBlogPanel
            resubmitBlog={resubmitBlog}
            onSubmitted={() => setActiveTab('blog-pending')}
          />
        </>
      ) : activeTab === 'blog-pending' ? (
        <SubCategoryAdminBlogPendingPanel />
      ) : activeTab === 'blog-approved' ? (
        <SubCategoryAdminBlogApprovedPanel />
      ) : activeTab === 'blog-suggestions' ? (
        <SubCategoryAdminBlogSuggestionsPanel onReviseAndResubmit={handleReviseAndResubmit} />
      ) : (
        <SubCategoryAdminBlogRejectedPanel />
      )}
    </SubCategoryAdminLayout>
  );
};
