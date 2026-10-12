import { Outlet, useLocation, useSearchParams } from "react-router-dom";
import { DeepLinkingHandler } from "./DeepLinkingHandler";
import { PlayStoreCaptureListener } from "./PlayStoreCaptureListener";
import Footer from "./Footer";
import { useDevicePerformance } from "@/hooks/useDevicePerformance";

// Pages where footer should not be shown
const noFooterRoutes = ["/auth", "/", "/splash"];

export const AppLayout = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { prefersReducedMotion } = useDevicePerformance();

  // Capture mode for Play Store screenshots
  const isCaptureMode = searchParams.get("ps_capture") === "1";

  const showFooter = !isCaptureMode && !noFooterRoutes.some((route) => location.pathname === route);

  return (
    <>
      <DeepLinkingHandler />
      {isCaptureMode && <PlayStoreCaptureListener />}

      <div className="min-h-screen flex flex-col">
        <div className="flex-1">
          <Outlet />
        </div>
        {showFooter && <Footer />}
      </div>
    </>
  );
};
