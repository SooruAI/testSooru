import React, { useState, useEffect, ReactNode } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import Home from "./pages/Home";
import Project from "./pages/Project";
import NewProject from "./pages/NewProject";
import Plans from "./pages/Plans";
import Contact from "./pages/Contact";
import LoginPage from "./pages/LoginPage";
import Features from "./pages/Features";
import About from "./pages/AboutUs";
import Playground from "./pages/Playground";
import Profile from "./pages/Profile";
import View3D from "./pages/Playground/3D/View3D";
import Proposals from "./pages/Proposals";
import ThankYou from "./pages/ThankYou";
import TermsConditions from "./pages/TermsConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CancellationRefund from "./pages/CancellationRefund";
import { NavbarProvider } from "./components/NavbarContext";
import RequirePlaygroundEntry from './components/RequirePlaygroundEntry';
import "./App.css";
import SupportAndFeedback from "./pages/SupportAndFeedback";
import { logEvent } from "./Utility/UserJourney";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const isAuthenticated = localStorage.getItem("access_token") !== null;
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/LoginPage" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const PublicOnlyRoute = ({ children }: ProtectedRouteProps) => {
  const isAuthenticated = localStorage.getItem("access_token") !== null;

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    localStorage.getItem("access_token") !== null
  );
  
  useEffect(() => {
    logEvent("page_view");

    function handleClick(e: MouseEvent) {
      const el = e.target as HTMLElement | null;
      if (!el) return;
      const btn = el.closest('button');
      if (!btn) {
        return;
      }
      logEvent("button_click", {
        buttonId: btn.id,
        text: btn.innerText,
      });
    }

    document.addEventListener("click", handleClick);
    window.addEventListener("beforeunload", () => logEvent("page_exit"));

    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, []);

  useEffect(() => {
    const checkAuthStatus = () => {
      setIsAuthenticated(localStorage.getItem("access_token") !== null);
    };

    checkAuthStatus();
    window.addEventListener("storage", checkAuthStatus);

    return () => {
      window.removeEventListener("storage", checkAuthStatus);
    };
  }, []);

  // Component to conditionally render Footer
  const ConditionalFooter = () => {
    const location = useLocation();
    const noFooterRoutes = [
      '/projects',
      '/projects/new',
      '/projects/:projectId/plans',
      '/view/projects/:projectId/plans'
    ];
    
    // Check if current path matches any no-footer routes
    const shouldHideFooter = noFooterRoutes.some(route => {
      if (route.includes(':projectId')) {
        const pattern = route.replace(':projectId', '[^/]+');
        const regex = new RegExp(`^${pattern}$`);
        return regex.test(location.pathname);
      }
      return location.pathname === route;
    });

    return shouldHideFooter ? null : <Footer />;
  };

  return (
    <NavbarProvider>
      <Router>
        <Routes>
          {/* Playground route now requires projectId and planId as URL parameters */}
          <Route
            path="/playground/:projectId/ai-create"
            element={
              <ProtectedRoute>
                <Playground aiMode={true} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/playground/:projectId/:planId"
            element={
              <ProtectedRoute>
                <Playground />
              </ProtectedRoute>
            }
          />
          {/* Redirect old playground route to projects */}
          <Route
            path="/playground"
            element={<Navigate to="/projects" replace />}
          />
          <Route
            path="/3D/:projectId/:planId"
            element={
              <ProtectedRoute>
                <View3D />
              </ProtectedRoute>
            }
          />
          <Route
            path="/view/playground/:projectId/:planId"
            element={
              <Playground viewOnly={true}/>
            }
          />
          <Route
            path="/view/3D/:projectId/:planId"
            element={
              <View3D viewOnly={true} />
            }
          />
          {/* Redirect old 3D route to projects */}
          <Route
            path="/3D"
            element={<Navigate to="/projects" replace />}
          />
          <Route
            path="/proposals"
            element={
              <ProtectedRoute>
                <Proposals />
              </ProtectedRoute>
            }
          />
          <Route
            path="*"
            element={
              <div>
                <Navbar />
                <div style={{ paddingTop: "80px" }}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/about" element={<About />} />
                    
                    {/* New routes from the updated design */}
                    <Route path="/thank-you" element={<ThankYou />} />
                    <Route path="/terms-conditions" element={<TermsConditions />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/cancellation-refund" element={<CancellationRefund />} />

                    <Route
                      path="/features"
                      element={<Features />}
                    />
                    <Route
                      path="/projects"
                      element={
                        <ProtectedRoute>
                          <Project />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="support-and-feedback"
                      element={
                        <ProtectedRoute>
                          <SupportAndFeedback/>
                        </ProtectedRoute>
                      }
                    />
                    {/* New Project Route - Protected and nested under projects */}
                    <Route
                      path="/projects/new"
                      element={
                        <ProtectedRoute>
                          <NewProject />
                        </ProtectedRoute>
                      }
                    />

                    {/* Plans Route - Protected and nested under projects */}
                    <Route
                      path="/projects/:projectId/plans"
                      element={
                        <ProtectedRoute>
                          <Plans />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/view/projects/:projectId/plans"
                      element={
                        <Plans viewOnly={true}/>
                      }
                    />

                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/LoginPage"
                      element={
                        <PublicOnlyRoute>
                          <LoginPage />
                        </PublicOnlyRoute>
                      }
                    />

                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </div>
                <ConditionalFooter />
              </div>
            }
          />
        </Routes>
      </Router>
    </NavbarProvider>
  );
};

export default App;