import type { ContentBlock } from '../services/public-blogs.service';

export function colsToBootstrapClass(cols?: number): string {
  const n =
    cols == null || !Number.isFinite(Number(cols))
      ? 12
      : Math.min(12, Math.max(1, Math.round(Number(cols))));
  return `col-12 col-md-${n}`;
}

export function BlogBlockRenderer({
  block,
  imageSrcFn,
}: {
  block: ContentBlock;
  imageSrcFn: (url: string) => string;
}) {
  const colClass = colsToBootstrapClass(block.cols);
  return (
    <div className={colClass}>
      {block.type === 'heading' && (
        <h2 className="h4 fw-bold mb-3" style={{ color: '#1a1f2e' }}>
          {block.value}
        </h2>
      )}
      {block.type === 'paragraph' && (
        <p className="mb-4" style={{ color: '#2c3338', lineHeight: 1.75 }}>
          {block.value}
        </p>
      )}
      {block.type === 'image' && (
        <figure className="mb-4">
          <img
            src={imageSrcFn(block.imageUrl)}
            alt={block.alt || ''}
            className="w-100 rounded-3"
            style={{ objectFit: 'cover', maxHeight: 360 }}
          />
        </figure>
      )}
      {block.type === 'heading_para' && (
        <div className="mb-4">
          <h3 className="h5 fw-bold mb-2" style={{ color: '#1a1f2e' }}>
            {block.heading}
          </h3>
          <p className="mb-0" style={{ color: '#2c3338', lineHeight: 1.75 }}>
            {block.paragraph}
          </p>
        </div>
      )}
    </div>
  );
}
