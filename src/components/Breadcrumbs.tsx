import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface BreadcrumbsProps {
  className?: string;
}

const routeNames: Record<string, string> = {
  "": "Home",
  "bookings": "Bookings",
  "profile": "Profile",
  "mentor": "Mentor",
  "admin": "Admin",
  "offers": "Offers",
  "help-center": "Help Center",
  "contact-support": "Contact Support",
  "about-us": "About Us",
  "instant-mentor": "Instant Mentor",
  "college-predictor": "College Predictor",
  "exam-portal": "Exam Portal",
  "sports-mentorship": "Sports Mentorship",
  "mental-health": "Mental Health",
  "financial-planning": "Financial Planning",
  "content-creation": "Content Creation",
  "astro-guru": "Astro Guru",
  "addiction-counselling": "Addiction Counselling",
  "college-counselling": "College Counselling",
  "video-call": "Video Call",
  "dashboard": "Dashboard",
  "sessions": "Sessions",
  "availability": "Availability",
  "earnings": "Earnings",
  "analytics": "Analytics",
  "users": "Users",
  "mentors": "Mentors",
  "payments": "Payments",
  "reviews": "Reviews",
  "settings": "Settings",
};

export const Breadcrumbs = ({ className }: BreadcrumbsProps) => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  // Don't show breadcrumbs on home page
  if (pathnames.length === 0) return null;

  const breadcrumbs = [
    { path: "/", label: "Home" },
    ...pathnames.map((segment, index) => {
      const path = `/${pathnames.slice(0, index + 1).join("/")}`;
      const label = routeNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      return { path, label };
    }),
  ];

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex items-center gap-2 text-sm text-muted-foreground mb-4",
        className
      )}
    >
      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1;
        const isFirst = index === 0;

        return (
          <div key={crumb.path} className="flex items-center gap-2">
            {index > 0 && <ChevronRight className="h-4 w-4" />}
            
            {isLast ? (
              <span className="text-foreground font-medium">{crumb.label}</span>
            ) : (
              <Link
                to={crumb.path}
                className="hover:text-foreground transition-colors flex items-center gap-1"
              >
                {isFirst && <Home className="h-4 w-4" />}
                {!isFirst && crumb.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
};
