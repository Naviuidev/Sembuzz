import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SchoolAdminAuthProvider, useSchoolAdminAuth } from './contexts/SchoolAdminAuthContext';
import { CategoryAdminAuthProvider, useCategoryAdminAuth } from './contexts/CategoryAdminAuthContext';
import { SubCategoryAdminAuthProvider, useSubCategoryAdminAuth } from './contexts/SubCategoryAdminAuthContext';
import { AdsAdminAuthProvider, useAdsAdminAuth } from './contexts/AdsAdminAuthContext';
import { UserAuthProvider } from './contexts/UserAuthContext';
import { EventsFilterProvider } from './contexts/EventsFilterContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SchoolAdminProtectedRoute } from './components/SchoolAdminProtectedRoute';
import { CategoryAdminProtectedRoute } from './components/CategoryAdminProtectedRoute';
import { SubCategoryAdminProtectedRoute } from './components/SubCategoryAdminProtectedRoute';
import { AdsAdminProtectedRoute } from './components/AdsAdminProtectedRoute';
import { SuperAdminLogin } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { CreateSchool } from './pages/CreateSchool';
import { SchoolDetails } from './pages/SchoolDetails';
import { EditSchool } from './pages/EditSchool';
import { SchoolInfo } from './pages/SchoolInfo';
import { RaiseRequest } from './pages/RaiseRequest';
import { Queries } from './pages/Queries';
import { Features } from './pages/Features';
import { SchoolAdminLogin } from './pages/SchoolAdminLogin';
import { SchoolAdminDashboard } from './pages/SchoolAdminDashboard';
import { SchoolAdminCategories } from './pages/SchoolAdminCategories';
import { SchoolAdminPrivacy } from './pages/SchoolAdminPrivacy';
import { SchoolAdminPosts } from './pages/SchoolAdminPosts';
import { SchoolAdminQueries } from './pages/SchoolAdminQueries';
import { SchoolAdminSettingsQueries } from './pages/SchoolAdminSettingsQueries';
import { SchoolAdminRaiseRequest } from './pages/SchoolAdminRaiseRequest';
import { SchoolAdminUserRequests } from './pages/SchoolAdminUserRequests';
import { SchoolAdminUserHelp } from './pages/SchoolAdminUserHelp';
import { SchoolAdminApprovedUsers } from './pages/SchoolAdminApprovedUsers';
import { SchoolAdminAutomatedUsers } from './pages/SchoolAdminAutomatedUsers';
import { SchoolAdminApprovedPosts } from './pages/SchoolAdminApprovedPosts';
import { SchoolAdminTotalUsers } from './pages/SchoolAdminTotalUsers';
import { SchoolAdminForgotPassword } from './pages/SchoolAdminForgotPassword';
import { SchoolAdminVerifyOtp } from './pages/SchoolAdminVerifyOtp';
import { SchoolAdminResetPassword } from './pages/SchoolAdminResetPassword';
import { SchoolAdminSocialShare } from './pages/SchoolAdminSocialShare';
import { SchoolAdminUpcomingNews } from './pages/SchoolAdminUpcomingNews';
import { SchoolAdminAnalytics } from './pages/SchoolAdminAnalytics';
import { CategoryAdminLogin } from './pages/CategoryAdminLogin';
import { CategoryAdminForgotPassword } from './pages/CategoryAdminForgotPassword';
import { CategoryAdminVerifyOtp } from './pages/CategoryAdminVerifyOtp';
import { CategoryAdminResetPassword } from './pages/CategoryAdminResetPassword';
import { CategoryAdminChangePassword } from './pages/CategoryAdminChangePassword';
import { CategoryAdminDashboard } from './pages/CategoryAdminDashboard';
import { CategoryAdminQueries } from './pages/CategoryAdminQueries';
import { CategoryAdminRaiseRequest } from './pages/CategoryAdminRaiseRequest';
import { CategoryAdminPrivacy } from './pages/CategoryAdminPrivacy';
import { CategoryAdminPendingApprovals } from './pages/CategoryAdminPendingApprovals';
import { CategoryAdminBlogs } from './pages/CategoryAdminBlogs';
import { CategoryAdminApprovedPosts } from './pages/CategoryAdminApprovedPosts';
import { CategoryAdminAnalytics } from './pages/CategoryAdminAnalytics.tsx';
import { CategoryAdminAds } from './pages/CategoryAdminAds.tsx';
import { CategoryAdminAdsAnalytics } from './pages/CategoryAdminAdsAnalytics';
import { SubCategoryAdminLogin } from './pages/SubCategoryAdminLogin';
import { SubcategoryAdminForgotPassword } from './pages/SubcategoryAdminForgotPassword';
import { SubcategoryAdminVerifyOtp } from './pages/SubcategoryAdminVerifyOtp';
import { SubcategoryAdminResetPassword } from './pages/SubcategoryAdminResetPassword';
import { SubCategoryAdminChangePassword } from './pages/SubCategoryAdminChangePassword';
import { SubCategoryAdminDashboard } from './pages/SubCategoryAdminDashboard';
import { SubCategoryAdminPostEvent } from './pages/SubCategoryAdminPostEvent';
import { SubCategoryAdminApprovalsPending } from './pages/SubCategoryAdminApprovalsPending';
import { SubCategoryAdminApproved } from './pages/SubCategoryAdminApproved';
import { SubcategoryAdminAnalytics } from './pages/SubcategoryAdminAnalytics.tsx';
import { SubCategoryAdminRaiseRequest } from './pages/SubCategoryAdminRaiseRequest';
import { SubCategoryAdminQueries } from './pages/SubCategoryAdminQueries';
import { SubCategoryAdminReceivedCorrections } from './pages/SubCategoryAdminReceivedCorrections';
import { SubCategoryAdminPostBlog } from './pages/SubCategoryAdminPostBlog';
import { SubCategoryAdminBlogPending } from './pages/SubCategoryAdminBlogPending';
import { SubCategoryAdminBlogApproved } from './pages/SubCategoryAdminBlogApproved';
import { SubCategoryAdminBlogCorrections } from './pages/SubCategoryAdminBlogCorrections';
import { SubCategoryAdminBlogRejected } from './pages/SubCategoryAdminBlogRejected';
import { AdsAdminLogin } from './pages/AdsAdminLogin';
import { AdsAdminSetPassword } from './pages/AdsAdminSetPassword';
import { AdsAdminDashboard } from './pages/AdsAdminDashboard';
import { AdsAdminAds } from './pages/AdsAdminAds';
import { AdsAdminAdsAnalytics } from './pages/AdsAdminAdsAnalytics';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { FAQs } from './pages/FAQs';
import { Register } from './pages/Register';
import { UpdateVerificationDoc } from './pages/UpdateVerificationDoc';
import { VerifyApproval } from './pages/VerifyApproval';
import { Home } from './pages/Home';
import { PublicEvents } from './pages/PublicEvents';
import { PublicBlogs } from './pages/PublicBlogs';
import { PublicBlogDetail } from './pages/PublicBlogDetail';
import { SavedItems } from './pages/SavedItems';

const queryClient = new QueryClient();

const SuperAdminRoutes = () => {
  const { isAuthenticated, loading, token } = useAuth();

  // Check localStorage directly as a fallback
  const hasToken = !!token || !!localStorage.getItem('token');

  if (loading) {
    return <div className="d-flex align-items-center justify-content-center min-h-screen">Loading...</div>;
  }

  // If authenticated or has token, redirect to dashboard
  const shouldRedirect = isAuthenticated || hasToken;

  return (
    <Routes>
      {/* Super Admin Routes (Hidden from public) */}
      <Route
        path=""
        element={shouldRedirect ? <Navigate to="/super-admin/dashboard" replace /> : <SuperAdminLogin />}
      />
      <Route
        path="dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="schools/new"
        element={
          <ProtectedRoute>
            <CreateSchool />
          </ProtectedRoute>
        }
      />
      <Route
        path="schools/:id"
        element={
          <ProtectedRoute>
            <SchoolDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="schools/edit"
        element={
          <ProtectedRoute>
            <EditSchool />
          </ProtectedRoute>
        }
      />
      <Route
        path="schools/info"
        element={
          <ProtectedRoute>
            <SchoolInfo />
          </ProtectedRoute>
        }
      />
      <Route
        path="raise-request"
        element={
          <ProtectedRoute>
            <RaiseRequest />
          </ProtectedRoute>
        }
      />
      <Route
        path="queries"
        element={
          <ProtectedRoute>
            <Queries />
          </ProtectedRoute>
        }
      />
      <Route
        path="features"
        element={
          <ProtectedRoute>
            <Features />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

const SchoolAdminRoutes = () => {
  const { isAuthenticated, loading } = useSchoolAdminAuth();

  if (loading) {
    return <div className="d-flex align-items-center justify-content-center min-h-screen">Loading...</div>;
  }

  return (
    <Routes>
      <Route
        path="login"
        element={isAuthenticated ? <Navigate to="/school-admin/dashboard" replace /> : <SchoolAdminLogin />}
      />
      <Route
        path="forgot-password"
        element={<SchoolAdminForgotPassword />}
      />
      <Route
        path="forgot-password/verify-otp"
        element={<SchoolAdminVerifyOtp />}
      />
      <Route
        path="forgot-password/reset"
        element={<SchoolAdminResetPassword />}
      />
      <Route
        path="dashboard"
        element={
          <SchoolAdminProtectedRoute>
            <SchoolAdminDashboard />
          </SchoolAdminProtectedRoute>
        }
      />
      <Route
        path="user-requests"
        element={
          <SchoolAdminProtectedRoute>
            <SchoolAdminUserRequests />
          </SchoolAdminProtectedRoute>
        }
      />
      <Route
        path="user-help"
        element={<SchoolAdminUserHelp />}
      />
      <Route
        path="approved-users"
        element={
          <SchoolAdminProtectedRoute>
            <SchoolAdminApprovedUsers />
          </SchoolAdminProtectedRoute>
        }
      />
      <Route
        path="automated-users"
        element={
          <SchoolAdminProtectedRoute>
            <SchoolAdminAutomatedUsers />
          </SchoolAdminProtectedRoute>
        }
      />
      <Route
        path="total-users"
        element={
          <SchoolAdminProtectedRoute>
            <SchoolAdminTotalUsers />
          </SchoolAdminProtectedRoute>
        }
      />
      <Route
        path="approved-posts"
        element={
          <SchoolAdminProtectedRoute>
            <SchoolAdminApprovedPosts />
          </SchoolAdminProtectedRoute>
        }
      />
      <Route
        path="categories"
        element={
          <SchoolAdminProtectedRoute>
            <SchoolAdminCategories />
          </SchoolAdminProtectedRoute>
        }
      />
      <Route
        path="privacy"
        element={
          <SchoolAdminProtectedRoute>
            <SchoolAdminPrivacy />
          </SchoolAdminProtectedRoute>
        }
      />
      <Route
        path="posts"
        element={
          <SchoolAdminProtectedRoute>
            <SchoolAdminPosts />
          </SchoolAdminProtectedRoute>
        }
      />
      <Route
        path="raise-request"
        element={
          <SchoolAdminProtectedRoute>
            <SchoolAdminRaiseRequest />
          </SchoolAdminProtectedRoute>
        }
      />
      <Route
        path="queries"
        element={
          <SchoolAdminProtectedRoute>
            <SchoolAdminQueries />
          </SchoolAdminProtectedRoute>
        }
      />
      <Route
        path="settings/queries"
        element={
          <SchoolAdminProtectedRoute>
            <SchoolAdminSettingsQueries />
          </SchoolAdminProtectedRoute>
        }
      />
      <Route
        path="social-share"
        element={
          <SchoolAdminProtectedRoute>
            <SchoolAdminSocialShare />
          </SchoolAdminProtectedRoute>
        }
      />
      <Route
        path="upcoming-news"
        element={
          <SchoolAdminProtectedRoute>
            <SchoolAdminUpcomingNews />
          </SchoolAdminProtectedRoute>
        }
      />
      <Route
        path="analytics"
        element={
          <SchoolAdminProtectedRoute>
            <SchoolAdminAnalytics />
          </SchoolAdminProtectedRoute>
        }
      />
    </Routes>
  );
};

const CategoryAdminRoutes = () => {
  const { isAuthenticated, loading } = useCategoryAdminAuth();

  if (loading) {
    return <div className="d-flex align-items-center justify-content-center min-h-screen">Loading...</div>;
  }

  return (
    <Routes>
      <Route
        path="login"
        element={isAuthenticated ? <Navigate to="/category-admin/dashboard" replace /> : <CategoryAdminLogin />}
      />
      <Route path="forgot-password" element={<CategoryAdminForgotPassword />} />
      <Route path="forgot-password/verify-otp" element={<CategoryAdminVerifyOtp />} />
      <Route path="forgot-password/reset" element={<CategoryAdminResetPassword />} />
      <Route
        path="change-password"
        element={
          <CategoryAdminProtectedRoute>
            <CategoryAdminChangePassword />
          </CategoryAdminProtectedRoute>
        }
      />
      <Route
        path="dashboard"
        element={
          <CategoryAdminProtectedRoute>
            <CategoryAdminDashboard />
          </CategoryAdminProtectedRoute>
        }
      />
      <Route
        path="pending-approvals"
        element={
          <CategoryAdminProtectedRoute>
            <CategoryAdminPendingApprovals />
          </CategoryAdminProtectedRoute>
        }
      />
      <Route
        path="blogs"
        element={
          <CategoryAdminProtectedRoute>
            <CategoryAdminBlogs />
          </CategoryAdminProtectedRoute>
        }
      />
      <Route
        path="approved-posts"
        element={
          <CategoryAdminProtectedRoute>
            <CategoryAdminApprovedPosts />
          </CategoryAdminProtectedRoute>
        }
      />
      <Route
        path="analytics"
        element={
          <CategoryAdminProtectedRoute>
            <CategoryAdminAnalytics />
          </CategoryAdminProtectedRoute>
        }
      />
      <Route
        path="ads"
        element={
          <CategoryAdminProtectedRoute>
            <CategoryAdminAds />
          </CategoryAdminProtectedRoute>
        }
      />
      <Route
        path="ads-analytics"
        element={
          <CategoryAdminProtectedRoute>
            <CategoryAdminAdsAnalytics />
          </CategoryAdminProtectedRoute>
        }
      />
      <Route
        path="category"
        element={<Navigate to="/category-admin/dashboard" replace />}
      />
      <Route
        path="raise-request"
        element={
          <CategoryAdminProtectedRoute>
            <CategoryAdminRaiseRequest />
          </CategoryAdminProtectedRoute>
        }
      />
      <Route
        path="queries"
        element={
          <CategoryAdminProtectedRoute>
            <CategoryAdminQueries />
          </CategoryAdminProtectedRoute>
        }
      />
      <Route
        path="privacy"
        element={
          <CategoryAdminProtectedRoute>
            <CategoryAdminPrivacy />
          </CategoryAdminProtectedRoute>
        }
      />
    </Routes>
  );
};

const SubCategoryAdminRoutes = () => {
  const { isAuthenticated, loading } = useSubCategoryAdminAuth();

  if (loading) {
    return <div className="d-flex align-items-center justify-content-center min-h-screen">Loading...</div>;
  }

  return (
    <Routes>
      <Route
        path="login"
        element={isAuthenticated ? <Navigate to="/subcategory-admin/dashboard" replace /> : <SubCategoryAdminLogin />}
      />
      <Route path="forgot-password" element={<SubcategoryAdminForgotPassword />} />
      <Route path="forgot-password/verify-otp" element={<SubcategoryAdminVerifyOtp />} />
      <Route path="forgot-password/reset" element={<SubcategoryAdminResetPassword />} />
      <Route
        path="change-password"
        element={
          <SubCategoryAdminProtectedRoute>
            <SubCategoryAdminChangePassword />
          </SubCategoryAdminProtectedRoute>
        }
      />
      <Route
        path="dashboard"
        element={
          <SubCategoryAdminProtectedRoute>
            <SubCategoryAdminDashboard />
          </SubCategoryAdminProtectedRoute>
        }
      />
      <Route
        path="post-event"
        element={
          <SubCategoryAdminProtectedRoute>
            <SubCategoryAdminPostEvent />
          </SubCategoryAdminProtectedRoute>
        }
      />
      <Route
        path="post-blog"
        element={
          <SubCategoryAdminProtectedRoute>
            <SubCategoryAdminPostBlog />
          </SubCategoryAdminProtectedRoute>
        }
      />
      <Route
        path="blog-pending"
        element={
          <SubCategoryAdminProtectedRoute>
            <SubCategoryAdminBlogPending />
          </SubCategoryAdminProtectedRoute>
        }
      />
      <Route
        path="blog-approved"
        element={
          <SubCategoryAdminProtectedRoute>
            <SubCategoryAdminBlogApproved />
          </SubCategoryAdminProtectedRoute>
        }
      />
      <Route
        path="blog-corrections"
        element={
          <SubCategoryAdminProtectedRoute>
            <SubCategoryAdminBlogCorrections />
          </SubCategoryAdminProtectedRoute>
        }
      />
      <Route
        path="blog-rejected"
        element={
          <SubCategoryAdminProtectedRoute>
            <SubCategoryAdminBlogRejected />
          </SubCategoryAdminProtectedRoute>
        }
      />
      <Route
        path="approvals-pending"
        element={
          <SubCategoryAdminProtectedRoute>
            <SubCategoryAdminApprovalsPending />
          </SubCategoryAdminProtectedRoute>
        }
      />
      <Route
        path="approvals-rejected"
        element={<Navigate to="/subcategory-admin/received-corrections" replace />}
      />
      <Route
        path="approved"
        element={
          <SubCategoryAdminProtectedRoute>
            <SubCategoryAdminApproved />
          </SubCategoryAdminProtectedRoute>
        }
      />
      <Route
        path="analytics"
        element={
          <SubCategoryAdminProtectedRoute>
            <SubcategoryAdminAnalytics />
          </SubCategoryAdminProtectedRoute>
        }
      />
      <Route
        path="raise-query"
        element={
          <SubCategoryAdminProtectedRoute>
            <SubCategoryAdminRaiseRequest />
          </SubCategoryAdminProtectedRoute>
        }
      />
      <Route
        path="queries"
        element={
          <SubCategoryAdminProtectedRoute>
            <SubCategoryAdminQueries />
          </SubCategoryAdminProtectedRoute>
        }
      />
      <Route
        path="received-corrections"
        element={
          <SubCategoryAdminProtectedRoute>
            <SubCategoryAdminReceivedCorrections />
          </SubCategoryAdminProtectedRoute>
        }
      />
    </Routes>
  );
};

const AdsAdminRoutes = () => {
  const { isAuthenticated, user, loading } = useAdsAdminAuth();

  if (loading) {
    return <div className="d-flex align-items-center justify-content-center min-h-screen">Loading...</div>;
  }

  const loginRedirect = isAuthenticated
    ? (user?.isFirstLogin ? '/ads-admin/set-password' : '/ads-admin/dashboard')
    : null;

  return (
    <Routes>
      <Route path="login" element={loginRedirect ? <Navigate to={loginRedirect} replace /> : <AdsAdminLogin />} />
      <Route
        path="set-password"
        element={
          !isAuthenticated ? (
            <Navigate to="/ads-admin/login" replace />
          ) : user?.isFirstLogin ? (
            <AdsAdminSetPassword />
          ) : (
            <Navigate to="/ads-admin/dashboard" replace />
          )
        }
      />
      <Route path="dashboard" element={<AdsAdminProtectedRoute><AdsAdminDashboard /></AdsAdminProtectedRoute>} />
      <Route path="ads" element={<AdsAdminProtectedRoute><AdsAdminAds /></AdsAdminProtectedRoute>} />
      <Route path="ads-analytics" element={<AdsAdminProtectedRoute><AdsAdminAdsAnalytics /></AdsAdminProtectedRoute>} />
    </Routes>
  );
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes — Home is placeholder; Events at /events */}
      <Route path="/" element={<Home />} />
      <Route path="/events" element={<PublicEvents />} />
      <Route path="/blogs" element={<PublicBlogs />} />
      <Route path="/blogs/:id" element={<PublicBlogDetail />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/faqs" element={<FAQs />} />
      <Route path="/register" element={<Register />} />
      <Route path="/update-verification-doc" element={<UpdateVerificationDoc />} />
      <Route path="/verify-approval" element={<VerifyApproval />} />
      <Route path="/login" element={<Navigate to="/events" state={{ openAuth: 'login' }} replace />} />
      <Route path="/saved" element={<SavedItems />} />
      
      {/* Super Admin Routes */}
      <Route path="/super-admin/*" element={<SuperAdminRoutes />} />
      
      {/* School Admin Routes */}
      <Route path="/school-admin/*" element={<SchoolAdminRoutes />} />
      
      {/* Category Admin Routes */}
      <Route path="/category-admin/*" element={<CategoryAdminRoutes />} />
      
      {/* Subcategory Admin Routes */}
      <Route path="/subcategory-admin/*" element={<SubCategoryAdminRoutes />} />

      {/* Ads Admin Routes */}
      <Route path="/ads-admin/*" element={<AdsAdminRoutes />} />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SchoolAdminAuthProvider>
          <CategoryAdminAuthProvider>
            <SubCategoryAdminAuthProvider>
              <AdsAdminAuthProvider>
                <UserAuthProvider>
                <BrowserRouter>
                  <EventsFilterProvider>
                    <AppRoutes />
                  </EventsFilterProvider>
                </BrowserRouter>
                </UserAuthProvider>
              </AdsAdminAuthProvider>
            </SubCategoryAdminAuthProvider>
          </CategoryAdminAuthProvider>
        </SchoolAdminAuthProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
