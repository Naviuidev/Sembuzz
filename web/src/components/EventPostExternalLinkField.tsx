type Props = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

/** Optional URL shown as a “Know more” button on the public post. */
export function EventPostExternalLinkField({ id = 'post-external-link', value, onChange, className }: Props) {
  return (
    <div className={className ?? 'mt-3'}>
      <label className="admin-form-label" htmlFor={id}>
        Know more link (optional)
      </label>
      <p className="admin-form-hint mb-2">
        When you add a URL, students see a &ldquo;Know more&rdquo; button on the post that opens this link. Leave
        blank to hide the button.
      </p>
      <input
        id={id}
        type="url"
        className="form-control admin-form-control"
        placeholder="https://"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
