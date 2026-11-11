import { useMemo, type CSSProperties } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ADMIN_PORTAL_ACCENTS } from '../../constants/adminPortalTheme';
import {
  SubCategoryAdminPostBlogPanel,
  type MasterBlogComposerConfig,
} from '../../pages/SubCategoryAdminPostBlog';
import { masterAdminBlogsService, type MasterAdminBlogDetail } from '../../services/master-admin-blogs.service';
import { masterAdminPostsService } from '../../services/master-admin-posts.service';
import type { CreateBlogDto } from '../../services/subcategory-admin-blogs.service';

type Props = {
  schoolId: string;
  blogId?: string;
  initialBlog?: MasterAdminBlogDetail | null;
  onSaved: () => void;
};

export function MasterAdminCreateBlogForm({ schoolId, blogId, initialBlog, onSaved }: Props) {
  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.master } as CSSProperties;

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['master-admin', 'blog-subcategories', schoolId],
    queryFn: () => masterAdminPostsService.getCategoriesForSchool(schoolId),
    enabled: Boolean(schoolId),
  });

  const subCategoryOptions = useMemo(
    () => categories.flatMap((cat) => cat.subcategories.map((sub) => ({ id: sub.id, name: sub.name }))),
    [categories],
  );

  const masterComposer = useMemo((): MasterBlogComposerConfig | null => {
    if (categoriesLoading) return null;

    const initial = initialBlog
      ? {
          subCategoryId: initialBlog.subCategoryId,
          title: initialBlog.title,
          content: initialBlog.content,
          coverImageUrl: initialBlog.coverImageUrl,
          heroTitle: initialBlog.heroTitle,
          heroParagraph: initialBlog.heroParagraph,
          heroButtonText: initialBlog.heroButtonText,
          heroButtonLink: initialBlog.heroButtonLink,
          contentBlocks: initialBlog.contentBlocks,
        }
      : undefined;

    return {
      panelStyle,
      subCategoryOptions,
      emptySubcategoryHint: 'No subcategories for this school. Add categories first.',
      uploadImage: (file) => masterAdminBlogsService.uploadImage(file),
      initial,
      onSubmit: async (payload: CreateBlogDto, _publish: boolean) => {
        if (blogId) {
          await masterAdminBlogsService.update(schoolId, blogId, payload);
        } else {
          await masterAdminBlogsService.create(schoolId, { ...payload, publish: false });
        }
        onSaved();
      },
    };
  }, [schoolId, blogId, initialBlog, onSaved, panelStyle, subCategoryOptions, categoriesLoading]);

  if (categoriesLoading || !masterComposer) {
    return <p className="master-admin-detail-muted mb-0 px-1">Loading composer…</p>;
  }

  return <SubCategoryAdminPostBlogPanel embedded masterComposer={masterComposer} onSubmitted={onSaved} />;
}
