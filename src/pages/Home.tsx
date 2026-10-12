import { useState, useEffect, useRef } from "react";
import {
  Menu,
  GraduationCap,
  Heart,
  TrendingUp,
  Video,
  Users as UsersIcon,
  LogOut,
  Shield,
  Home as HomeIcon,
  MessageCircle,
  Briefcase,
  ChevronRight,
  Search,
  Calendar,
  User,
  Bell,
  CreditCard,
  LayoutDashboard,
  BarChart,
  Clock,
  HelpCircle,
  Mail,
  Info,
  FileText,
  Sparkles,
  Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import NotificationBell from "@/components/NotificationBell";
import AISupportChat from "@/components/AISupportChat";
import { RotatingTagline } from "@/components/RotatingTagline";
import { LiveStats } from "@/components/LiveStats";
import { FloatingOrbs } from "@/components/FloatingOrbs";
import { AnimatedGradientText } from "@/components/AnimatedGradientText";
import { AIMentorCard } from "@/components/AIMentorCard";
import { AdminChatCard } from "@/components/AdminChatCard";
import { motion } from "framer-motion";
import { Premium3DCard } from "@/components/motion/Premium3DCard";
import { EntranceAnimation } from "@/components/motion/EntranceAnimation";
import { premiumStagger, premiumStaggerItem } from "@/lib/motion";
import { useDevicePerformance } from "@/hooks/useDevicePerformance";
import { cn } from "@/lib/utils";

/* -------------------- CATEGORIES -------------------- */
const categories = [
  {
    id: "jee",
    title: "JEE",
    icon: GraduationCap,
    color: "from-blue-500 to-indigo-500",
    description: "JEE Mains & Advanced",
    featured: true,
    route: "/category/jee",
    active: true,
  },
  {
    id: "neet",
    title: "NEET",
    icon: Heart,
    color: "from-red-500 to-rose-500",
    description: "Medical entrance prep",
    featured: true,
    route: "/category/neet",
    active: true,
  },
];

/* -------------------- MENU ITEMS -------------------- */
const navigationItems = [
  { icon: HomeIcon, label: "Home", path: "/home" },
  { icon: Search, label: "Browse All Mentors", path: "/category/all" },
  { icon: Calendar, label: "My Bookings", path: "/bookings" },
];

const settingsItems = [
  { icon: User, label: "Edit Profile", path: "/profile" },
  { icon: Bell, label: "Notification Settings", path: "/notification-settings" },
  { icon: CreditCard, label: "Payment Methods", path: "/profile" },
];

const mentorToolsItems = [
  { icon: LayoutDashboard, label: "Mentor Dashboard", path: "/mentor/dashboard" },
  { icon: Calendar, label: "My Sessions", path: "/mentor/sessions" },
  { icon: BarChart, label: "Earnings", path: "/mentor/earnings" },
  { icon: Clock, label: "Availability", path: "/mentor/availability" },
];

const supportItems = [
  { icon: HelpCircle, label: "Help Center", path: "/help" },
  { icon: Mail, label: "Contact Support", path: "/contact" },
  { icon: Info, label: "About Us", path: "/about" },
  { icon: FileText, label: "Terms & Conditions", path: "/terms" },
];

/* -------------------- HOME -------------------- */
const Home = () => {
  // 1. ALL HOOKS AT TOP LEVEL - UNCONDITIONALLY
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMentor, setIsMentor] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [userProfile, setUserProfile] = useState<{
    id: string;
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(true);

  const navigate = useNavigate();
  const location = useLocation();
  const { session, signOut } = useAuth();
  const { toast } = useToast();
  const { prefersReducedMotion } = useDevicePerformance();

  // 2. ALL useEffect HOOKS
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (isMountedRef.current) {
      setIsGuestMode(params.get("mode") === "guest");
    }

    const loadRoles = async () => {
      if (!session?.user?.id) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .eq("id", session.user.id)
        .single();

      if (isMountedRef.current && profile) {
        setUserProfile(profile);
      }

      const { data: admin } = await supabase.rpc("has_role", {
        _user_id: session.user.id,
        _role: "admin",
      });

      const { data: mentor } = await supabase.rpc("has_role", {
        _user_id: session.user.id,
        _role: "mentor",
      });

      if (isMountedRef.current) {
        setIsAdmin(admin === true);
        setIsMentor(mentor === true);
      }
    };

    loadRoles();
  }, [session]);

  // 3. HELPER FUNCTIONS
  const handleLogout = async () => {
    setIsSheetOpen(false);
    await signOut();
    toast({
      title: "Logged out",
      description: "You've been successfully logged out",
    });
    navigate("/auth", { replace: true });
  };

  const handleNavigation = (path: string) => {
    setIsSheetOpen(false);
    navigate(path, { replace: false });
  };

  const getInitials = (name: string | null) =>
    name
      ? name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : "U";

  const isCurrentPath = (path: string) => location.pathname === path;

  // 4. NO EARLY RETURNS - render everything

  // 5. JSX RETURN
  return (
    <div className="min-h-screen bg-background pb-24 relative overflow-hidden">
      <FloatingOrbs variant="hero" />

      {/* -------------------- TOP BAR -------------------- */}
      <div className="sticky top-0 z-50 glass-premium border-b border-border/30">
        <div className="flex items-center gap-3 p-4">
          {/* Hamburger Menu */}
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>

            <SheetContent side="left" className="w-80 p-0 overflow-y-auto">
              {/* User Profile Section */}
              <div className="p-6 bg-gradient-to-br from-primary/10 to-primary/5">
                {!isGuestMode && userProfile ? (
                  <div className="flex flex-col items-center text-center">
                    <Avatar className="h-20 w-20 border-2 border-primary/20">
                      {userProfile.avatar_url ? (
                        <AvatarImage src={userProfile.avatar_url} alt={userProfile.full_name || "User"} />
                      ) : null}
                      <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                        {getInitials(userProfile.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="mt-3 font-semibold text-foreground">{userProfile.full_name || "User"}</p>
                    <p className="text-sm text-muted-foreground">{userProfile.email}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => handleNavigation("/profile")}
                    >
                      View Profile
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center">
                    <Avatar className="h-20 w-20">
                      <AvatarFallback className="bg-muted text-muted-foreground">
                        <User className="h-8 w-8" />
                      </AvatarFallback>
                    </Avatar>
                    <p className="mt-3 font-semibold text-foreground">Welcome to MentSol</p>
                    <Button
                      className="mt-3"
                      onClick={() => {
                        setIsSheetOpen(false);
                        navigate("/auth", { replace: true });
                      }}
                    >
                      Login / Sign Up
                    </Button>
                  </div>
                )}
              </div>

              <Separator />

              {/* Navigation Section */}
              <div className="p-4">
                <div className="space-y-1">
                  {navigationItems.map((item) => (
                    <Button
                      key={item.path}
                      variant={isCurrentPath(item.path) ? "secondary" : "ghost"}
                      className="w-full justify-between"
                      onClick={() => handleNavigation(item.path)}
                    >
                      <span className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Settings Section */}
              <div className="p-4">
                <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Settings
                </p>
                <div className="space-y-1">
                  {settingsItems.map((item) => (
                    <Button
                      key={item.path + item.label}
                      variant="ghost"
                      className="w-full justify-between"
                      onClick={() => handleNavigation(item.path)}
                    >
                      <span className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  ))}
                </div>
              </div>

              {/* Mentor Tools Section - Only for mentors */}
              {isMentor && (
                <>
                  <Separator />
                  <div className="p-4">
                    <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Mentor Tools
                    </p>
                    <div className="space-y-1">
                      {mentorToolsItems.map((item) => (
                        <Button
                          key={item.path}
                          variant="ghost"
                          className="w-full justify-between"
                          onClick={() => handleNavigation(item.path)}
                        >
                          <span className="flex items-center gap-3">
                            <item.icon className="h-4 w-4" />
                            {item.label}
                          </span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Admin Section - Only for admins */}
              {isAdmin && (
                <>
                  <Separator />
                  <div className="p-4">
                    <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Admin
                    </p>
                    <Button
                      variant="ghost"
                      className="w-full justify-between"
                      onClick={() => handleNavigation("/admin")}
                    >
                      <span className="flex items-center gap-3">
                        <Shield className="h-4 w-4" />
                        Admin Dashboard
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </>
              )}

              <Separator />

              {/* Help & Support Section */}
              <div className="p-4">
                <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Help & Support
                </p>
                <div className="space-y-1">
                  {supportItems.map((item) => (
                    <Button
                      key={item.path}
                      variant="ghost"
                      className="w-full justify-between"
                      onClick={() => handleNavigation(item.path)}
                    >
                      <span className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  ))}
                </div>
              </div>

              {/* Logout Button */}
              {!isGuestMode && session && (
                <>
                  <Separator />
                  <div className="p-4">
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                  </div>
                </>
              )}
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <div className="font-bold text-xl text-primary">MentSol</div>

          <div className="flex-1" />

          {/* Right side icons */}
          {!isGuestMode && session && (
            <>
              <NotificationBell />
              <Button variant="ghost" size="icon" onClick={() => setIsChatOpen(true)}>
                <MessageCircle className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Search mentors, topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && navigate(`/search?q=${encodeURIComponent(searchQuery)}`)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* -------------------- HERO -------------------- */}
      <EntranceAnimation direction="up" distance={8} className="text-center py-10">
        <AnimatedGradientText className="text-4xl font-bold">Starts Here</AnimatedGradientText>
        <RotatingTagline />
        <LiveStats />
      </EntranceAnimation>

      {/* -------------------- AI MENTOR CARD -------------------- */}
      <div className="px-4 mb-4">
        <AIMentorCard onOpenChat={() => setIsChatOpen(true)} />
      </div>

      {/* -------------------- ADMIN CHAT CARD -------------------- */}
      <div className="px-4 mb-6">
        <AdminChatCard />
      </div>

      {/* -------------------- CATEGORIES -------------------- */}
      <div className="px-4 mb-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-foreground">Choose Your Path</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Explore our strategy programs for JEE & NEET
          </p>
        </div>
        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 gap-3"
          variants={prefersReducedMotion ? undefined : premiumStagger}
          initial="hidden"
          animate="visible"
        >
          {categories.map((c) => (
            <motion.div key={c.id} variants={premiumStaggerItem}>
              <Premium3DCard
                onClick={() => c.active && navigate(c.route!)}
                disabled={!c.active}
                className={cn("card-glow-border ripple-effect h-full", !c.active && "opacity-70")}
              >
                <div className="p-4 text-center h-full flex flex-col items-center justify-center gap-2 relative">
                  {/* Popular badge for active exams */}
                  {c.active && c.id === "exams" && (
                    <Badge className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 bg-primary/90">
                      Popular
                    </Badge>
                  )}
                  {/* Launching Soon badge for inactive categories */}
                  {!c.active && (
                    <Badge 
                      variant="secondary" 
                      className="absolute top-2 right-2 text-[9px] px-1.5 py-0.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 flex items-center gap-0.5"
                    >
                      <Sparkles className="h-2.5 w-2.5" />
                      Soon
                    </Badge>
                  )}
                  {/* Premium icon container */}
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      "bg-gradient-to-br shadow-md",
                      c.color,
                      !c.active && "grayscale"
                    )}
                  >
                    <c.icon className="w-6 h-6 text-white" />
                  </div>
                  <p className={cn("font-semibold text-sm", c.active ? "text-foreground" : "text-muted-foreground")}>{c.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{c.description}</p>
                </div>
              </Premium3DCard>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* -------------------- BOTTOM NAVIGATION -------------------- */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border/50 safe-area-bottom">
        <div className="flex items-center justify-around py-2 px-2">
          {/* Home */}
          <button
            onClick={() => navigate("/home", { replace: false })}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[64px]",
              isCurrentPath("/home") ? "text-primary" : "text-muted-foreground"
            )}
          >
            <HomeIcon className={cn("h-5 w-5", isCurrentPath("/home") && "fill-primary")} />
            <span className="text-[10px] font-medium">Home</span>
          </button>

          {/* Bookings */}
          <button
            onClick={() => navigate("/bookings", { replace: false })}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[64px]",
              isCurrentPath("/bookings") ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Calendar className="h-5 w-5" />
            <span className="text-[10px] font-medium">Bookings</span>
          </button>

          {/* AI Help - Center elevated button */}
          <button
            onClick={() => setIsChatOpen(true)}
            className="flex flex-col items-center gap-1 -mt-4"
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30">
              <MessageCircle className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-[10px] font-medium text-primary">AI Help</span>
          </button>

          {/* Offers */}
          <button
            onClick={() => navigate("/offers", { replace: false })}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[64px] relative",
              isCurrentPath("/offers") ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Sparkles className="h-5 w-5" />
            <span className="text-[10px] font-medium">Offers</span>
            {/* Badge indicator */}
            <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-red-500" />
          </button>

          {/* Profile */}
          <button
            onClick={() => navigate("/profile", { replace: false })}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[64px]",
              isCurrentPath("/profile") ? "text-primary" : "text-muted-foreground"
            )}
          >
            <User className="h-5 w-5" />
            <span className="text-[10px] font-medium">Profile</span>
          </button>
        </div>
      </div>

      <AISupportChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
};

export default Home;
