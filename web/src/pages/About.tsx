import { Navbar } from '../components/Navbar';

export const About = () => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f9fa' }}>
      <Navbar />
      
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <h1 className="text-center mb-5" style={{ 
              fontSize: '2.5rem', 
              fontWeight: '700',
              color: '#1a1f2e'
            }}>
              About SemBuzz
            </h1>
            
            <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
              <div className="card-body p-5">
                <p className="lead mb-4" style={{ color: '#6c757d' }}>
                  SemBuzz is a comprehensive school management system designed to streamline 
                  educational operations and enhance communication between schools, students, and parents.
                </p>
                
                <h2 className="h4 mb-3" style={{ fontWeight: '600', color: '#1a1f2e' }}>Our Mission</h2>
                <p className="mb-4" style={{ color: '#6c757d' }}>
                  To provide schools with a modern, efficient, and user-friendly platform that 
                  simplifies administrative tasks and improves the educational experience for everyone.
                </p>
                
                <h2 className="h4 mb-3" style={{ fontWeight: '600', color: '#1a1f2e' }}>Features</h2>
                <ul className="list-unstyled" style={{ color: '#6c757d' }}>
                  <li className="mb-2">✓ Student and teacher management</li>
                  <li className="mb-2">✓ Attendance tracking</li>
                  <li className="mb-2">✓ Homework and assignments</li>
                  <li className="mb-2">✓ Fee management</li>
                  <li className="mb-2">✓ Parent-teacher communication</li>
                  <li className="mb-2">✓ Announcements and notifications</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
