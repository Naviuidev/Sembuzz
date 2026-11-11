import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { masterAdminSchoolsService } from '../../services/master-admin-schools.service';

export type MasterAdminSocialSchoolTarget = {
  schoolId: string;
  schoolName: string;
};

type Props = {
  heading?: string;
  submitLabel?: string;
  initialSchoolId?: string;
  onCancel?: () => void;
  onSubmit: (target: MasterAdminSocialSchoolTarget) => void;
};

export function MasterAdminSocialSchoolPicker({
  heading = 'Select school',
  submitLabel = 'Process',
  initialSchoolId,
  onCancel,
  onSubmit,
}: Props) {
  const { data: schools = [], isLoading } = useQuery({
    queryKey: ['master-admin', 'schools'],
    queryFn: () => masterAdminSchoolsService.list(),
  });

  const [schoolId, setSchoolId] = useState(initialSchoolId ?? '');

  const schoolOptions = useMemo(() => schools.filter((s) => s.isActive), [schools]);
  const selected = schoolOptions.find((s) => s.id === schoolId);

  const handleSubmit = () => {
    if (!selected) return;
    onSubmit({ schoolId: selected.id, schoolName: selected.name });
  };

  return (
    <div className="master-admin-post-target-picker master-admin-post-target-picker--progressive">
      {heading ? <h2 className="master-admin-post-target-picker__title">{heading}</h2> : null}
      <div className="master-admin-post-target-picker__steps">
        <label className="admin-form-label" htmlFor="ma-social-school">
          Select school
        </label>
        <select
          id="ma-social-school"
          className="form-select admin-form-control"
          value={schoolId}
          onChange={(e) => setSchoolId(e.target.value)}
          disabled={isLoading}
        >
          <option value="">Choose school…</option>
          {schoolOptions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div className="master-admin-post-target-picker__actions">
        {onCancel ? (
          <button type="button" className="admin-btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
        <button type="button" className="admin-btn-primary" disabled={!schoolId} onClick={handleSubmit}>
          {submitLabel}
        </button>
      </div>
    </div>
  );
}

export function MasterAdminSocialSchoolBreadcrumb({ schoolName }: { schoolName: string }) {
  return (
    <nav className="master-admin-post-breadcrumb" aria-label="Social share target">
      <span className="master-admin-post-breadcrumb__item master-admin-post-breadcrumb__item--current">
        {schoolName}
      </span>
    </nav>
  );
}
