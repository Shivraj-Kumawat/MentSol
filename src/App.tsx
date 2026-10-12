import React, { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createHashRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import { MentorRoute } from "./components/MentorRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { SessionExpiryWarning } from "./components/SessionExpiryWarning";
import { AppLayout } from "./components/AppLayout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WifiOff } from "lucide-react";

/* Pages */
import Splash from "./pages/Splash";
import RoleSelection from "./pages/RoleSelection";
import MentorInfo from "./pages/MentorInfo";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import CategoryMentors from "./pages/CategoryMentors";
import MentorProfile from "./pages/MentorProfile";
import BookSession from "./pages/BookSession";
import CollegePredictor from "./pages/CollegePredictor";
import CollegeResults from "./pages/CollegeResults";
import CollegeCounselling from "./pages/CollegeCounselling";
import AddictionCounselling from "./pages/AddictionCounselling";
import MentalHealth from "./pages/MentalHealth";
import FamilyRelationships from "./pages/FamilyRelationships";
import FinancialPlanning from "./pages/FinancialPlanning";
import SearchResults from "./pages/SearchResults";
import ExamPortal from "./pages/ExamPortal";
import ExamDetail from "./pages/ExamDetail";
import BoardSelection from "./pages/BoardSelection";
import ContentCreation from "./pages/ContentCreation";
import ContentPlatformDetail from "./pages/ContentPlatformDetail";
import Profile from "./pages/Profile";
import Bookings from "./pages/Bookings";
import Offers from "./pages/Offers";
import NotificationSettings from "./pages/NotificationSettings";
import HelpCenter from "./pages/HelpCenter";
import MyTickets from "./pages/MyTickets";
import ContactSupport from "./pages/ContactSupport";
import AboutUs from "./pages/AboutUs";
import TermsConditions from "./pages/TermsConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import RefundPolicy from "./pages/RefundPolicy";
import DataDeletion from "./pages/DataDeletion";
import JeeAnalyzer from "./pages/JeeAnalyzer";
import NeetAnalyzer from "./pages/NeetAnalyzer";
import StreamSelection from "./pages/StreamSelection";
import InstantMentor from "./pages/InstantMentor";
import SportsMentorship from "./pages/SportsMentorship";
import SportDetail from "./pages/SportDetail";
import ReviewSession from "./pages/ReviewSession";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import ReferralRedirect from "./pages/ReferralRedirect";

/* Admin */
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminMentors from "./pages/admin/AdminMentors";
import AdminSessions from "./pages/admin/AdminSessions";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminModeration from "./pages/admin/AdminModeration";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminPromoters from "./pages/admin/AdminPromoters";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements";
import AdminSettings from "./pages/admin/AdminSettings";
import MigrateMentorCategories from "./pages/admin/MigrateMentorCategories";
import AdminEditMentorCategories from "./pages/admin/AdminEditMentorCategories";
import AdminSupport from "./pages/admin/AdminSupport";
import AdminMentorEarnings from "./pages/admin/AdminMentorEarnings";
import AdminMentorSessions from "./pages/admin/AdminMentorSessions";
import AdminPayoutRequests from "./pages/admin/AdminPayoutRequests";

/* Mentor */
import MentorDashboard from "./pages/mentor/MentorDashboard";
import MentorProfileSettings from "./pages/mentor/MentorProfile";
import MentorAvailability from "./pages/mentor/MentorAvailability";
import MentorSessions from "./pages/mentor/MentorSessions";
import MentorEarnings from "./pages/mentor/MentorEarnings";
import MentorOnboarding from "./pages/mentor/MentorOnboarding";

/* Plans */
import JeePlans from "./pages/JeePlans";
import NeetPlans from "./pages/NeetPlans";
import PlanMentorSelect from "./pages/PlanMentorSelect";
import ManualBookSession from "./pages/ManualBookSession";
import AdminPlanManagement from "./pages/admin/AdminPlanManagement";

/* Coaching */
import CoachingIntro from "./pages/CoachingIntro";
import CoachingRegister from "./pages/CoachingRegister";
import CoachingSuccess from "./pages/CoachingSuccess";
import AdminCoachingRequests from "./pages/admin/AdminCoachingRequests";

/* Misc */
import DebugSettings from "./pages/DebugSettings";
import SecurityTests from "./pages/SecurityTests";
import PromoterDashboard from "./pages/promoter/Dashboard";
import PlayStoreScreenshots from "./pages/PlayStoreScreenshots";
import { captureRefFromUrl } from "./utils/referral";

/* -------------------- SAFE ONLINE CHECK -------------------- */
const isOnline = () =>
  typeof navigator !== "undefined" && typeof navigator.onLine === "boolean" ? navigator.onLine : true;

/* -------------------- REACT QUERY -------------------- */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (count) => isOnline() && count < 3,
      networkMode: "online",
      refetchOnReconnect: true,
      staleTime: 1000 * 60 * 5,
    },
    mutations: {
      retry: (count) => isOnline() && count < 2,
      networkMode: "online",
    },
  },
});

/* -------------------- ROUTES -------------------- */
const router = createHashRouter(
  [
    {
      element: <AppLayout />,
      children: [
        { path: "/", element: <RoleSelection /> },
        { path: "/auth", element: <Auth /> },
        { path: "/ref/:code", element: <ReferralRedirect /> },
        { path: "/splash", element: <Splash /> },
        { path: "/home", element: <Home /> },
        { path: "/mentor-info", element: <MentorInfo /> },
        { path: "/stream-selection", element: <StreamSelection /> },
        { path: "/college-counselling", element: <CollegeCounselling /> },
        { path: "/coaching", element: <CoachingIntro /> },
        { path: "/coaching/register", element: <CoachingRegister /> },
        { path: "/coaching/success", element: <CoachingSuccess /> },
        { path: "/addiction-counselling", element: <AddictionCounselling /> },
        { path: "/mental-health", element: <MentalHealth /> },
        { path: "/family-relationships", element: <FamilyRelationships /> },
        { path: "/financial-planning", element: <FinancialPlanning /> },

        { path: "/category/:categoryId", element: <CategoryMentors /> },
        { path: "/mentor/:mentorId", element: <MentorProfile /> },
        {
          path: "/mentor/:mentorId/book",
          element: (
            <ProtectedRoute>
              <BookSession />
            </ProtectedRoute>
          ),
        },

        { path: "/exams", element: <ExamPortal /> },
        { path: "/exams/:examId", element: <ExamDetail /> },
        { path: "/exams/:examId/board", element: <BoardSelection /> },

        { path: "/jee-analyzer", element: <JeeAnalyzer /> },
        { path: "/neet-analyzer", element: <NeetAnalyzer /> },
        { path: "/college-predictor", element: <CollegePredictor /> },
        { path: "/college-results", element: <CollegeResults /> },

        /* Strategy Plans */
        { path: "/jee-plans", element: <JeePlans /> },
        { path: "/neet-plans", element: <NeetPlans /> },
        { path: "/plan/:planId/mentors", element: <PlanMentorSelect /> },
        {
          path: "/plan/:planId/mentor/:mentorId/book",
          element: (
            <ProtectedRoute>
              <ManualBookSession />
            </ProtectedRoute>
          ),
        },

        { path: "/search", element: <SearchResults /> },
        { path: "/instant-mentor", element: <InstantMentor /> },
        { path: "/content-creation", element: <ContentCreation /> },
        { path: "/content-creation/:platform", element: <ContentPlatformDetail /> },

        { path: "/profile", element: <Profile /> },
        {
          path: "/bookings",
          element: (
            <ProtectedRoute>
              <Bookings />
            </ProtectedRoute>
          ),
        },
        {
          path: "/review/:sessionId",
          element: (
            <ProtectedRoute>
              <ReviewSession />
            </ProtectedRoute>
          ),
        },
        { path: "/offers", element: <Offers /> },
        {
          path: "/my-tickets",
          element: (
            <ProtectedRoute>
              <MyTickets />
            </ProtectedRoute>
          ),
        },

        /* Mentor */
        {
          path: "/mentor/onboarding",
          element: (
            <ProtectedRoute>
              <MentorOnboarding />
            </ProtectedRoute>
          ),
        },
        {
          path: "/mentor/dashboard",
          element: (
            <MentorRoute>
              <MentorDashboard />
            </MentorRoute>
          ),
        },
        {
          path: "/mentor/profile",
          element: (
            <MentorRoute>
              <MentorProfileSettings />
            </MentorRoute>
          ),
        },
        {
          path: "/mentor/availability",
          element: (
            <MentorRoute>
              <MentorAvailability />
            </MentorRoute>
          ),
        },
        {
          path: "/mentor/sessions",
          element: (
            <MentorRoute>
              <MentorSessions />
            </MentorRoute>
          ),
        },
        {
          path: "/mentor/earnings",
          element: (
            <MentorRoute>
              <MentorEarnings />
            </MentorRoute>
          ),
        },

        /* Admin */
        {
          path: "/admin",
          element: (
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          ),
        },
        {
          path: "/admin/mentors",
          element: (
            <AdminRoute>
              <AdminMentors />
            </AdminRoute>
          ),
        },
        {
          path: "/admin/sessions",
          element: (
            <AdminRoute>
              <AdminSessions />
            </AdminRoute>
          ),
        },
        {
          path: "/admin/payments",
          element: (
            <AdminRoute>
              <AdminPayments />
            </AdminRoute>
          ),
        },
        {
          path: "/admin/users",
          element: (
            <AdminRoute>
              <AdminUsers />
            </AdminRoute>
          ),
        },
        {
          path: "/admin/moderation",
          element: (
            <AdminRoute>
              <AdminModeration />
            </AdminRoute>
          ),
        },
        {
          path: "/admin/analytics",
          element: (
            <AdminRoute>
              <AdminAnalytics />
            </AdminRoute>
          ),
        },
        {
          path: "/admin/settings",
          element: (
            <AdminRoute>
              <AdminSettings />
            </AdminRoute>
          ),
        },
        {
          path: "/admin/support",
          element: (
            <AdminRoute>
              <AdminSupport />
            </AdminRoute>
          ),
        },
        {
          path: "/admin/migrate-categories",
          element: (
            <AdminRoute>
              <MigrateMentorCategories />
            </AdminRoute>
          ),
        },
        {
          path: "/admin/mentors/:mentorId/categories",
          element: (
            <AdminRoute>
              <AdminEditMentorCategories />
            </AdminRoute>
          ),
        },

        /* Help & Support - PUBLIC PAGES */
        { path: "/help", element: <HelpCenter /> },
        { path: "/contact", element: <ContactSupport /> },
        { path: "/about", element: <AboutUs /> },
        { path: "/terms", element: <TermsConditions /> },
        { path: "/privacy", element: <PrivacyPolicy /> },
        { path: "/refund", element: <RefundPolicy /> },
        { path: "/data-deletion", element: <DataDeletion /> },

        /* User Settings */
        { path: "/notification-settings", element: <NotificationSettings /> },

        /* Sports Mentorship */
        { path: "/sports-mentorship", element: <SportsMentorship /> },
        { path: "/sports/:sport", element: <SportDetail /> },

        /* Promoter Portal */
        {
          path: "/promoter/dashboard",
          element: (
            <ProtectedRoute>
              <PromoterDashboard />
            </ProtectedRoute>
          ),
        },

        /* Admin - Additional Routes */
        {
          path: "/admin/promoters",
          element: (
            <AdminRoute>
              <AdminPromoters />
            </AdminRoute>
          ),
        },
        {
          path: "/admin/reviews",
          element: (
            <AdminRoute>
              <AdminReviews />
            </AdminRoute>
          ),
        },
        {
          path: "/admin/mentor-earnings",
          element: (
            <AdminRoute>
              <AdminMentorEarnings />
            </AdminRoute>
          ),
        },
        {
          path: "/admin/mentor-sessions",
          element: (
            <AdminRoute>
              <AdminMentorSessions />
            </AdminRoute>
          ),
        },
        {
          path: "/admin/announcements",
          element: (
            <AdminRoute>
              <AdminAnnouncements />
            </AdminRoute>
          ),
        },
        {
          path: "/admin/payout-requests",
          element: (
            <AdminRoute>
              <AdminPayoutRequests />
            </AdminRoute>
          ),
        },
        {
          path: "/admin/plans",
          element: (
            <AdminRoute>
              <AdminPlanManagement />
            </AdminRoute>
          ),
        },
        {
          path: "/admin/coaching",
          element: (
            <AdminRoute>
              <AdminCoachingRequests />
            </AdminRoute>
          ),
        },

        /* Dev */
        { path: "/debug-settings", element: <DebugSettings /> },
        { path: "/security-tests", element: <SecurityTests /> },
        { path: "/playstore-screenshots", element: <PlayStoreScreenshots /> },

        { path: "/unauthorized", element: <Unauthorized /> },

        { path: "*", element: <NotFound /> },
      ],
    },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
    },
  },
);

/* -------------------- OFFLINE BANNER -------------------- */
const OnlineStatusBanner = () => {
  const [online, setOnline] = useState(isOnline());

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (online) return null;

  return (
    <Alert className="rounded-none border-x-0 border-t-0">
      <WifiOff className="h-4 w-4" />
      <AlertDescription>You are offline.</AlertDescription>
    </Alert>
  );
};

/* -------------------- APP -------------------- */
const App = () => {
  useEffect(() => {
    captureRefFromUrl();
    window.history.scrollRestoration = "manual";
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <OnlineStatusBanner />
            <Toaster />
            <Sonner />
            <SessionExpiryWarning />

            {/* 🔥 DO NOT WRAP RouterProvider - No dynamic key to prevent remount on navigation */}
            <RouterProvider router={router} />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
