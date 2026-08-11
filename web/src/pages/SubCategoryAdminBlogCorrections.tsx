import { useNavigate } from 'react-router-dom';
import { SubCategoryAdminLayout } from '../components/SubCategoryAdminLayout';
import { SubCategoryAdminBlogSuggestionsPanel } from '../components/SubCategoryAdminBlogSuggestionsPanel';
import type { BlogRow } from '../services/subcategory-admin-blogs.service';

export const SubCategoryAdminBlogCorrections = () => {
  const navigate = useNavigate();

  const handleReviseAndResubmit = (blog: BlogRow) => {
    navigate('/subcategory-admin/blogs', {
      state: {
        resubmitBlog: {
          title: blog.title,
          content: blog.content,
          coverImageUrl: blog.coverImageUrl,
          subCategory: blog.subCategory,
        },
      },
    });
  };

  return (
    <SubCategoryAdminLayout>
      <h1 className="mb-4" style={{ fontSize: '2rem', fontWeight: 'normal', color: '#1a1f2e' }}>
        Blog — suggestions
      </h1>
      <SubCategoryAdminBlogSuggestionsPanel onReviseAndResubmit={handleReviseAndResubmit} />
    </SubCategoryAdminLayout>
  );
};
