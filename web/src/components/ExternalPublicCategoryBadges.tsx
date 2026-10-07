import type { ExternalCategoryPublic } from '../services/public-events.service';

const BADGE_BACKGROUNDS = [
  '#e0e7ff',
  '#dcfce7',
  '#fef3c7',
  '#e0f2fe',
  '#fce7f3',
  '#f3e8ff',
  '#ffedd5',
  '#ecfccb',
];

type Props = {
  categories: ExternalCategoryPublic[];
  categoriesLoading: boolean;
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  compact?: boolean;
};

export function ExternalPublicCategoryBadges({
  categories,
  categoriesLoading,
  selectedCategoryId,
  onSelectCategory,
  compact = false,
}: Props) {
  if (!categoriesLoading && categories.length === 0) return null;

  return (
    <div className={`external-public-feed__badges-wrap${compact ? ' external-public-feed__badges-wrap--compact' : ''}`}>
      <p className="external-public-feed__badges-heading">Approved pipeline categories</p>
      <div className="external-public-feed__badges content-categories-scroll">
        <button
          type="button"
          className={`external-public-feed__badge${selectedCategoryId === null ? ' is-active' : ''}`}
          style={{
            backgroundColor: selectedCategoryId === null ? '#1a1f2e' : '#f3f4f6',
            color: selectedCategoryId === null ? '#fff' : '#374151',
          }}
          onClick={() => onSelectCategory(null)}
        >
          All
        </button>
        {categoriesLoading ? (
          <span className="small text-muted align-self-center px-1">Loading…</span>
        ) : (
          categories.map((cat, index) => {
            const bg = BADGE_BACKGROUNDS[index % BADGE_BACKGROUNDS.length];
            const active = selectedCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                className={`external-public-feed__badge${active ? ' is-active' : ''}`}
                style={{
                  backgroundColor: active ? '#1a1f2e' : bg,
                  color: active ? '#fff' : '#1a1f2e',
                }}
                onClick={() => onSelectCategory(selectedCategoryId === cat.id ? null : cat.id)}
                title={cat.description ?? undefined}
              >
                {cat.name}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
