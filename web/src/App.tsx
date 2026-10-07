import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SchoolAdminAuthProvider, useSchoolAdminAuth } from './contexts/SchoolAdminAuthContext';
import { CategoryAdminAuthProvider, useCategoryAdminAuth } from './contexts/CategoryAdminAuthContext';
import { SubCategoryAdminAuthProvider, useSubCategoryAdminAuth } from './contexts/SubCategoryAdminAuthContext';
import { AdsAdminAuthProvider, useAdsAdminAuth } from './contexts/AdsAdminAuthContext';
import { ExternalAdminAuthProvider, useExternalAdminAuth } from './contexts/ExternalAdminAuthContext';
import { UserAuthProvider } from './contexts/UserAuthContext';
import { ChatPopupProvider } from './contexts/ChatPopupContext';
import { StudentChatGroupsWidget } from './components/StudentChatGroupsWidget';
import { EventsFilterProvider } from './contexts/EventsFilterContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SchoolAdminProtectedRoute } from './components/SchoolAdminProtectedRoute';
import { CategoryAdminProtectedRoute } from './components/CategoryAdminProtectedRoute';
import { SubCategoryAdminProtectedRoute } from './components/SubCategoryAdminProtectedRoute';
import { AdsAdminProtectedRoute } from './components/AdsAdminProtectedRoute';
import { SuperAdminLogin } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { CreateSchool } from './pages/CreateSchool';
import { SuperAdminExternal } from './pages/SuperAdminExternal';
import { CreateExternalAdmin } from './pages/CreateExternalAdmin';
import { SchoolDetails } from './pages/SchoolDetails';
import { RaiseRequest } from './pages/RaiseRequest';
import { Queries } from './pages/Queries';
import { Features } from './pages/Features';
import { SuperAdminEventSync } from './pages/SuperAdminEventSync';
import { SuperAdminJsonUpload } from './pages/SuperAdminJsonUpload';
import { SchoolAdminLogin } from './pages/SchoolAdminLogin';
import { SchoolAdminDashboard } from './pages/SchoolAdminDashboard';
import { SchoolAdminCategories } from './pages/SchoolAdminCategories';
import { SchoolAdminPrivacy } from './pages/SchoolAdminPrivacy';
import { SchoolAdminPosts } from './pages/SchoolAdminPosts';
import { SchoolAdminQueries } from './pages/SchoolAdminQueries';
import { SchoolAdminSettingsQueries } from './pages/SchoolAdminSettingsQueries';
import { SchoolAdminRaiseRequest } from './pages/SchoolAdminRaiseRequest';
import { SchoolAdminUsers } from './pages/SchoolAdminUsers';
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
import { CategoryAdminPosts } from './pages/CategoryAdminPosts';
import { CategoryAdminBlogs } from './pages/CategoryAdminBlogs';
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
import { SubCategoryAdminPosts } from './pages/SubCategoryAdminPosts';
import { SubcategoryAdminAnalytics } from './pages/SubcategoryAdminAnalytics.tsx';
import { SubCategoryAdminRaiseRequest } from './pages/SubCategoryAdminRaiseRequest';
import { SubCategoryAdminQueries } from './pages/SubCategoryAdminQueries';
import { SubCategoryAdminPrivacy } from './pages/SubCategoryAdminPrivacy';
import { SubCategoryAdminExternalConfig } from './pages/SubCategoryAdminExternalConfig';
import { SubCategoryAdminBlogs } from './pages/SubCategoryAdminBlogs';
import { AdsAdminLogin } from './pages/AdsAdminLogin';
import { AdsAdminSetPassword } from './pages/AdsAdminSetPassword';
import { AdsAdminDashboard } from './pages/AdsAdminDashboard';
import { AdsAdminAds } from './pages/AdsAdminAds';
import { AdsAdminAdsAnalytics } from './pages/AdsAdminAdsAnalytics';
import { ExternalAdminLogin } from './pages/ExternalAdminLogin';
import { ExternalAdminSetPassword } from './pages/ExternalAdminSetPassword';
import { ExternalAdminDashboard } from './pages/ExternalAdminDashboard';
import { ExternalAdminProfile } from './pages/ExternalAdminProfile';
import { ExternalAdminPrivacy } from './pages/ExternalAdminPrivacy';
import { ExternalAdminPosts } from './pages/ExternalAdminPosts';
import { SchoolAdminExternalConfig } from './pages/SchoolAdminExternalConfig';
import { ExternalAdminProtectedRoute } from './components/ExternalAdminProtectedRoute';
import { Contact } from './pages/Contact';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { FAQs } from './pages/FAQs';
import { Register } from './pages/Register';
import { UpdateVerificationDoc } from './pages/UpdateVerificationDoc';
import { VerifyApproval } from './pages/VerifyApproval';
import { Home } from './pages/Home';
import { PublicEvents } from './pages/PublicEvents';
import { PublicBlogs } from './pages/PublicBlogs';
import { PublicUniversities } from './pages/PublicUniversities';
import { PublicUniversityEvents } from './pages/PublicUniversityEvents';
import { PublicAllUniversityEvents } from './pages/PublicAllUniversityEvents';
import { PublicBlogDetail } from './pages/PublicBlogDetail';
import { SavedItems } from './pages/SavedItems';
import { Notifications } from './pages/Notifications';
import Messages from './pages/Messages';
import { AccountProfile } from './pages/AccountProfile';
import { EditProfile } from './pages/EditProfile';
import { ViewProfile } from './pages/ViewProfile';

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
        path="external"
        element={
          <ProtectedRoute>
            <SuperAdminExternal />
          </ProtectedRoute>
        }
      />
      <Route
        path="external/admins/new"
        element={
          <ProtectedRoute>
            <CreateExternalAdmin />
          </ProtectedRoute>
        }
      />
      <Route path="schools/edit" element={<Navigate to="/super-admin/dashboard?tab=edit" replace />} />
      <Route path="schools/info" element={<Navigate to="/super-admin/dashboard?tab=info" replace />} />
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
      <Route
        path="event-sync"
        element={
          <ProtectedRoute>
            <SuperAdminEventSync />
          </ProtectedRoute>
        }
      />
      <Route
        path="json-upload"
        element={
          <ProtectedRoute>
            <SuperAdminJsonUpload />
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
        path="messages"
        element={<Navigate to="/school-admin/privacy?tab=message-config" replace />}
      />
      <Route path="user-requests" element={<Navigate to="/school-admin/users" replace />} />
      <Route
        path="users"
        element={
          <SchoolAdminProtectedRoute>
            <SchoolAdminUsers />
          </SchoolAdminProtectedRoute>
        }
      />
      <Route path="user-help" element={<Navigate to="/school-admin/users?tab=help" replace />} />
      <Route path="approved-users" element={<Navigate to="/school-admin/users?tab=approved" replace />} />
      <Route path="automated-users" element={<Navigate to="/school-admin/users?tab=automated" replace />} />
      <Route path="total-users" element={<Navigate to="/school-admin/users?tab=total" replace />} />
      <Route path="approved-posts" element={<Navigate to="/school-admin/posts?tab=approved" replace />} />
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
        path="external-config"
        element={
          <SchoolAdminProtectedRoute>
            <SchoolAdminExternalConfig />
          </SchoolAdminProtectedRoute>
        }
      />
      <Route path="create-post" element={<Navigate to="/school-admin/posts" replace />} />
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
        path="posts"
        element={
          <CategoryAdminProtectedRoute>
            <CategoryAdminPosts />
          </CategoryAdminProtectedRoute>
        }
      />
      <Route
        path="pending-approvals"
        element={<Navigate to="/category-admin/posts" replace />}
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
        element={<Navigate to="/category-admin/posts?tab=approved" replace />}
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
        path="messages"
        element={<Navigate to="/category-admin/privacy?tab=message-config" replace />}
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
        path="posts"
        element={
          <SubCategoryAdminProtectedRoute>
            <SubCategoryAdminPosts />
          </SubCategoryAdminProtectedRoute>
        }
      />
      <Route
        path="external-config"
        element={
          <SubCategoryAdminProtectedRoute>
            <SubCategoryAdminExternalConfig />
          </SubCategoryAdminProtectedRoute>
        }
      />
      <Route path="post-event" element={<SubCategoryAdminPostEvent />} />
      <Route
        path="blogs"
        element={
          <SubCategoryAdminProtectedRoute>
            <SubCategoryAdminBlogs />
          </SubCategoryAdminProtectedRoute>
        }
      />
      <Route path="post-blog" element={<Navigate to="/subcategory-admin/blogs?tab=post-blog" replace />} />
      <Route path="blog-pending" element={<Navigate to="/subcategory-admin/blogs?tab=blog-pending" replace />} />
      <Route path="blog-approved" element={<Navigate to="/subcategory-admin/blogs?tab=blog-approved" replace />} />
      <Route
        path="blog-corrections"
        element={<Navigate to="/subcategory-admin/blogs?tab=blog-suggestions" replace />}
      />
      <Route path="blog-rejected" element={<Navigate to="/subcategory-admin/blogs?tab=blog-rejected" replace />} />
      <Route
        path="approvals-pending"
        element={<Navigate to="/subcategory-admin/posts?tab=pending" replace />}
      />
      <Route
        path="approvals-rejected"
        element={<Navigate to="/subcategory-admin/received-corrections" replace />}
      />
      <Route
        path="approved"
        element={<Navigate to="/subcategory-admin/posts?tab=approved" replace />}
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
        path="privacy"
        element={
          <SubCategoryAdminProtectedRoute>
            <SubCategoryAdminPrivacy />
          </SubCategoryAdminProtectedRoute>
        }
      />
      <Route
        path="messages"
        element={<Navigate to="/subcategory-admin/privacy?tab=messages" replace />}
      />
      <Route
        path="received-corrections"
        element={<Navigate to="/subcategory-admin/posts?tab=corrections" replace />}
      />
    </Routes>
  );
};

const ExternalAdminRoutes = () => {
  const { isAuthenticated, user, loading } = useExternalAdminAuth();

  if (loading) {
    return <div className="d-flex align-items-center justify-content-center min-h-screen">Loading...</div>;
  }

  const loginRedirect = isAuthenticated
    ? user?.isFirstLogin
      ? '/external-admin/set-password'
      : '/external-admin/dashboard'
    : null;

  return (
    <Routes>
      <Route
        path="login"
        element={loginRedirect ? <Navigate to={loginRedirect} replace /> : <ExternalAdminLogin />}
      />
      <Route
        path="set-password"
        element={
          !isAuthenticated ? (
            <Navigate to="/external-admin/login" replace />
          ) : user?.isFirstLogin ? (
            <ExternalAdminSetPassword />
          ) : (
            <Navigate to="/external-admin/dashboard" replace />
          )
        }
      />
      <Route
        path="dashboard"
        element={
          <ExternalAdminProtectedRoute>
            <ExternalAdminDashboard />
          </ExternalAdminProtectedRoute>
        }
      />
      <Route
        path="profile"
        element={
          <ExternalAdminProtectedRoute>
            <ExternalAdminProfile />
          </ExternalAdminProtectedRoute>
        }
      />
      <Route
        path="privacy"
        element={
          <ExternalAdminProtectedRoute>
            <ExternalAdminPrivacy />
          </ExternalAdminProtectedRoute>
        }
      />
      <Route
        path="posts"
        element={
          <ExternalAdminProtectedRoute>
            <ExternalAdminPosts />
          </ExternalAdminProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/external-admin/dashboard" replace />} />
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

function EventsLegacyRedirect() {
  const location = useLocation();
  return (
    <Navigate
      to={{ pathname: '/', search: location.search, hash: location.hash }}
      replace
      state={location.state}
    />
  );
}

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes — events feed at /; marketing home at /about */}
      <Route path="/" element={<PublicEvents />} />
      <Route path="/events" element={<EventsLegacyRedirect />} />
      <Route path="/blogs" element={<PublicBlogs />} />
      <Route path="/blogs/:id" element={<PublicBlogDetail />} />
      <Route path="/universities" element={<PublicUniversities />} />
      <Route path="/university-events" element={<PublicAllUniversityEvents />} />
      <Route path="/universities/:id" element={<PublicUniversityEvents />} />
      <Route path="/about" element={<Home />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/faqs" element={<FAQs />} />
      <Route path="/register" element={<Register />} />
      <Route path="/update-verification-doc" element={<UpdateVerificationDoc />} />
      <Route path="/verify-approval" element={<VerifyApproval />} />
      <Route path="/login" element={<Navigate to="/" state={{ openAuth: 'login' }} replace />} />
      <Route path="/saved" element={<SavedItems />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/messages" element={<Messages />} />
      <Route path="/profile" element={<AccountProfile />} />
      <Route path="/profile/edit" element={<EditProfile />} />
      <Route path="/profile/view" element={<ViewProfile />} />

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

      {/* External Admin Routes */}
      <Route path="/external-admin/*" element={<ExternalAdminRoutes />} />
      
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
              <ExternalAdminAuthProvider>
                <UserAuthProvider>
                <BrowserRouter>
                  <ChatPopupProvider>
                  <EventsFilterProvider>
                    <AppRoutes />
                    <StudentChatGroupsWidget />
                  </EventsFilterProvider>
                  </ChatPopupProvider>
                </BrowserRouter>
                </UserAuthProvider>
              </ExternalAdminAuthProvider>
              </AdsAdminAuthProvider>
            </SubCategoryAdminAuthProvider>
          </CategoryAdminAuthProvider>
        </SchoolAdminAuthProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
