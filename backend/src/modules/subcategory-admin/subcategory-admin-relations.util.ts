import type { PrismaService } from '../../prisma/prisma.service';

export type SubCategoryAssignment = {
  id: string;
  name: string;
  categoryId: string;
  category: { id: string; name: string };
};

/** Load subcategories for an admin without joining orphaned FK rows (Prisma would throw). */
export async function findSubCategoryAssignments(
  prisma: PrismaService,
  adminId: string,
  primarySubCategoryId: string,
): Promise<SubCategoryAssignment[]> {
  const linkRows = await prisma.subCategoryAdminSubCategory.findMany({
    where: { subCategoryAdminId: adminId },
    select: { subCategoryId: true },
  });
  const ids = [...new Set([primarySubCategoryId, ...linkRows.map((r) => r.subCategoryId)])].filter(Boolean);
  if (ids.length === 0) return [];

  return prisma.subCategory.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      name: true,
      categoryId: true,
      category: { select: { id: true, name: true } },
    },
  });
}

export function pickPrimarySubCategory(
  subs: SubCategoryAssignment[],
  primarySubCategoryId: string,
): SubCategoryAssignment | null {
  return subs.find((s) => s.id === primarySubCategoryId) ?? subs[0] ?? null;
}
