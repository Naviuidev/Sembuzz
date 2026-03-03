import { useState, useEffect } from 'react';
import { useUserAuth } from '../contexts/UserAuthContext';
import { imageSrc } from '../utils/image';

export const SchoolNavbar = () => {
  const { user } = useUserAuth();
  const [schoolLogoError, setSchoolLogoError] = useState(false);
  useEffect(() => setSchoolLogoError(false), [user?.schoolImage]);

  if (!user) return null;

  return (
    <div
      className="d-flex justify-content-center align-items-center py-3"
      style={{
        backgroundColor: '#fff',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      }}
    >
      {user.schoolImage && imageSrc(user.schoolImage) && !schoolLogoError ? (
        <img
          src={imageSrc(user.schoolImage)}
          alt={user.schoolName}
          style={{
            width: 48,
            height: 48,
            objectFit: 'contain',
            borderRadius: '8px',
          }}
          onError={() => setSchoolLogoError(true)}
        />
      ) : (
        <span style={{ fontWeight: 600, color: '#1a1f2e', fontSize: '1.25rem' }}>
          {user.schoolName}
        </span>
      )}
    </div>
  );
};
