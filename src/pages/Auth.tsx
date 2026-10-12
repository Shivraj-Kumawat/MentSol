import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FloatingOrbs } from "@/components/FloatingOrbs";
import {
  Eye,
  EyeOff,
  ArrowLeft,
  GraduationCap,
  Users,
  Handshake,
  Upload,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Mail,
  KeyRound,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { getStoredRef, clearStoredRef } from "@/utils/referral";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

type AuthView =
  | "landing"
  | "role-selection"
  | "student-signup"
  | "mentor-signup"
  | "partner-signup"
  | "login"
  | "forgot-password"
  | "reset-password"
  | "otp-verification";
type Role = "student" | "mentor" | "partner";

interface PendingSignupData {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  role: Role;
  academicCategory?: string;
  board?: string;
  bio?: string;
  mentorCategories?: string[];
  profilePhoto?: File | null;
  verificationDoc?: File | null;
}

// Academic categories
const ACADEMIC_CATEGORIES = [
  { value: "jee", label: "JEE", active: true },
  { value: "neet", label: "NEET", active: true },
  { value: "tenth", label: "10th Board", active: true },
  { value: "twelfth", label: "12th Board", active: true },
  { value: "mhtcet", label: "MHT-CET", active: false },
  { value: "cuet", label: "CUET", active: false },
];

const BOARDS = [
  { value: "cbse", label: "CBSE" },
  { value: "icse", label: "ICSE" },
  { value: "state", label: "State Board" },
];

const MENTOR_CATEGORIES = [
  { value: "jee", label: "JEE" },
  { value: "neet", label: "NEET" },
  { value: "tenth", label: "10th Board" },
  { value: "twelfth", label: "12th Board" },
  { value: "mhtcet", label: "MHT-CET" },
  { value: "cuet", label: "CUET" },
];

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // Auth view state
  const [authView, setAuthView] = useState<AuthView>("landing");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Common form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Student specific
  const [academicCategory, setAcademicCategory] = useState("");
  const [board, setBoard] = useState("");

  // Mentor specific
  const [bio, setBio] = useState("");
  const [mentorCategories, setMentorCategories] = useState<string[]>([]);
  const [verificationDoc, setVerificationDoc] = useState<File | null>(null);

  // Photo upload
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Email verification and password reset
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // OTP verification state
  const [otpCode, setOtpCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [pendingSignupData, setPendingSignupData] = useState<PendingSignupData | null>(null);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          await redirectByRole(session.user.id);
        }
      } catch (error) {
        console.error("Session check error:", error);
      } finally {
        setCheckingSession(false);
      }
    };
    checkSession();
  }, []);

  // Handle URL parameters (role, view for password reset)
  useEffect(() => {
    const roleParam = searchParams.get("role");
    const viewParam = searchParams.get("view");

    if (viewParam === "reset-password") {
      setAuthView("reset-password");
    } else if (roleParam === "student" || roleParam === "mentor" || roleParam === "partner") {
      setSelectedRole(roleParam);
      setAuthView(`${roleParam}-signup` as AuthView);
    }
  }, [searchParams]);

  // Handle auth events (password recovery)
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[Auth] Auth event:", event);
      if (event === "PASSWORD_RECOVERY") {
        setAuthView("reset-password");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle session expiry message from navigation state
  useEffect(() => {
    const state = location.state as { sessionExpired?: boolean } | null;
    if (state?.sessionExpired) {
      toast({
        title: "Session Expired",
        description: "Please log in again to continue.",
        variant: "destructive",
      });
      window.history.replaceState({}, document.title);
    }
  }, [location.state, toast]);

  const redirectByRole = async (userId: string) => {
    try {
      // Check user roles
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);

      const roleList = roles?.map((r: any) => r.role) || [];

      if (roleList.includes("admin")) {
        navigate("/admin", { replace: true });
      } else if (roleList.includes("partner") && !roleList.includes("student") && !roleList.includes("mentor")) {
        // Only go to promoter dashboard if partner is the ONLY role
        navigate("/promoter/dashboard", { replace: true });
      } else if (roleList.includes("mentor")) {
        navigate("/mentor/dashboard", { replace: true });
      } else {
        // Default: students and everyone else go to home
        navigate("/home", { replace: true });
      }
    } catch (error) {
      console.error("Role check error:", error);
      navigate("/home", { replace: true });
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVerificationDoc(file);
    }
  };

  const uploadFile = async (file: File, bucket: string, userId: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
      return data.publicUrl;
    } catch (error) {
      console.error("Upload error:", error);
      return null;
    }
  };

  const validatePassword = (pass: string): boolean => {
    return pass.length >= 8;
  };

  // ============ LOGIN HANDLER ============
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Missing Fields", description: "Please enter email and password", variant: "destructive" });
      return;
    }

    setLoading(true);
    setShowResendVerification(false);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        // Check if error is due to unverified email
        if (
          error.message.includes("Email not confirmed") ||
          error.message.toLowerCase().includes("email_not_confirmed") ||
          error.message.includes("not confirmed")
        ) {
          setShowResendVerification(true);
          toast({
            title: "Email Not Verified",
            description: "Please verify your email before logging in.",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      if (data.user) {
        toast({ title: "Welcome back!", description: "Login successful" });
        await redirectByRole(data.user.id);
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ============ RESEND VERIFICATION EMAIL ============
  const handleResendVerification = async () => {
    if (!email) {
      toast({ title: "Email Required", description: "Please enter your email address", variant: "destructive" });
      return;
    }

    setResendingVerification(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
        },
      });

      if (error) throw error;

      toast({
        title: "Verification Email Sent",
        description: "Please check your inbox and click the verification link.",
      });
      setShowResendVerification(false);
    } catch (error: any) {
      console.error("Resend verification error:", error);
      toast({
        title: "Failed to Resend",
        description: error.message || "Could not send verification email",
        variant: "destructive",
      });
    } finally {
      setResendingVerification(false);
    }
  };

  // ============ FORGOT PASSWORD HANDLER ============
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast({ title: "Email Required", description: "Please enter your email address", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/auth?view=reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Password Reset Email Sent",
        description: "Please check your inbox for the password reset link.",
      });
      setAuthView("login");
      setResetEmail("");
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast({
        title: "Failed to Send Reset Email",
        description: error.message || "Could not send password reset email",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ============ RESET PASSWORD HANDLER ============
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmNewPassword) {
      toast({ title: "Missing Fields", description: "Please enter your new password", variant: "destructive" });
      return;
    }

    if (!validatePassword(newPassword)) {
      toast({ title: "Weak Password", description: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast({ title: "Password Mismatch", description: "Passwords do not match", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      // Sign out after password reset to force re-login
      await supabase.auth.signOut();

      toast({
        title: "Password Reset Successful",
        description: "Please login with your new password.",
      });
      setAuthView("login");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error: any) {
      console.error("Password update error:", error);
      toast({
        title: "Password Reset Failed",
        description: error.message || "Could not reset password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ============ SEND OTP FOR SIGNUP ============
  const sendSignupOtp = async (emailToSend: string) => {
    const { data, error } = await supabase.functions.invoke("send-signup-otp", {
      body: { email: emailToSend.trim().toLowerCase() },
    });

    if (error) {
      const errorBody = typeof error === 'object' && 'message' in error ? error.message : String(error);
      throw new Error(errorBody || "Failed to send OTP");
    }

    // Handle non-2xx responses from the edge function
    if (data?.error) {
      throw new Error(data.error);
    }

    return data;
  };

  // ============ STUDENT SIGNUP ============
  const handleStudentSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !email || !phone || !password || !confirmPassword) {
      toast({ title: "Missing Fields", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    if (!academicCategory) {
      toast({ title: "Select Category", description: "Please select your academic category", variant: "destructive" });
      return;
    }

    if ((academicCategory === "tenth" || academicCategory === "twelfth") && !board) {
      toast({ title: "Select Board", description: "Please select your board", variant: "destructive" });
      return;
    }

    if (!validatePassword(password)) {
      toast({ title: "Weak Password", description: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: "Password Mismatch", description: "Passwords do not match", variant: "destructive" });
      return;
    }

    if (!agreedToTerms) {
      toast({ title: "Terms Required", description: "Please agree to Terms & Conditions", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await sendSignupOtp(email);

      setPendingSignupData({
        email: email.trim().toLowerCase(),
        password,
        fullName,
        phone,
        role: "student",
        academicCategory,
        board: (academicCategory === "tenth" || academicCategory === "twelfth") ? board : undefined,
        profilePhoto,
      });

      setOtpCode("");
      setResendCooldown(30);
      setAuthView("otp-verification");

      toast({
        title: "OTP Sent!",
        description: "Please check your email for the 6-digit verification code.",
      });
    } catch (error: any) {
      console.error("Student signup OTP error:", error);
      toast({
        title: "Failed to Send OTP",
        description: error.message || "Could not send verification code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ============ MENTOR SIGNUP ============
  const handleMentorSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !email || !phone || !password || !confirmPassword) {
      toast({ title: "Missing Fields", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    if (!bio || bio.length < 20) {
      toast({
        title: "Bio Required",
        description: "Please write a short bio (at least 20 characters)",
        variant: "destructive",
      });
      return;
    }

    if (mentorCategories.length === 0) {
      toast({
        title: "Select Categories",
        description: "Please select at least one mentorship category",
        variant: "destructive",
      });
      return;
    }

    if (!verificationDoc) {
      toast({
        title: "Document Required",
        description: "Please upload a verification document",
        variant: "destructive",
      });
      return;
    }

    if (!validatePassword(password)) {
      toast({ title: "Weak Password", description: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: "Password Mismatch", description: "Passwords do not match", variant: "destructive" });
      return;
    }

    if (!agreedToTerms) {
      toast({ title: "Terms Required", description: "Please agree to Terms & Conditions", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await sendSignupOtp(email);

      setPendingSignupData({
        email: email.trim().toLowerCase(),
        password,
        fullName,
        phone,
        role: "mentor",
        bio,
        mentorCategories: [...mentorCategories],
        profilePhoto,
        verificationDoc,
      });

      setOtpCode("");
      setResendCooldown(30);
      setAuthView("otp-verification");

      toast({
        title: "OTP Sent!",
        description: "Please check your email for the 6-digit verification code.",
      });
    } catch (error: any) {
      console.error("Mentor signup OTP error:", error);
      toast({
        title: "Failed to Send OTP",
        description: error.message || "Could not send verification code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ============ PARTNER SIGNUP ============
  const handlePartnerSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !email || !phone || !password || !confirmPassword) {
      toast({ title: "Missing Fields", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    if (!validatePassword(password)) {
      toast({ title: "Weak Password", description: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: "Password Mismatch", description: "Passwords do not match", variant: "destructive" });
      return;
    }

    if (!agreedToTerms) {
      toast({ title: "Terms Required", description: "Please agree to Terms & Conditions", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await sendSignupOtp(email);

      setPendingSignupData({
        email: email.trim().toLowerCase(),
        password,
        fullName,
        phone,
        role: "partner",
        profilePhoto,
      });

      setOtpCode("");
      setResendCooldown(30);
      setAuthView("otp-verification");

      toast({
        title: "OTP Sent!",
        description: "Please check your email for the 6-digit verification code.",
      });
    } catch (error: any) {
      console.error("Partner signup OTP error:", error);
      toast({
        title: "Failed to Send OTP",
        description: error.message || "Could not send verification code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ============ VERIFY OTP & CREATE ACCOUNT ============
  const handleVerifyOtp = async () => {
    if (!pendingSignupData) {
      toast({ title: "Error", description: "No signup data found. Please try again.", variant: "destructive" });
      setAuthView("role-selection");
      return;
    }

    if (otpCode.length !== 6) {
      toast({ title: "Invalid OTP", description: "Please enter the 6-digit code", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Verify OTP and create user
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke("verify-signup-otp", {
        body: {
          email: pendingSignupData.email,
          otp: otpCode,
          password: pendingSignupData.password,
          fullName: pendingSignupData.fullName,
          role: pendingSignupData.role,
          phone: pendingSignupData.phone,
        },
      });

      if (verifyError) {
        throw new Error(verifyError.message || "OTP verification failed");
      }

      if (verifyData?.error) {
        throw new Error(verifyData.error);
      }

      if (!verifyData?.success || !verifyData?.userId) {
        throw new Error("Account creation failed");
      }

      const userId = verifyData.userId;

      // Log in with the new credentials
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: pendingSignupData.email,
        password: pendingSignupData.password,
      });

      if (loginError) throw loginError;

      // Upload profile photo if provided
      let avatarUrl = null;
      if (pendingSignupData.profilePhoto) {
        avatarUrl = await uploadFile(pendingSignupData.profilePhoto, "avatars", userId);
      }

      // Update profile based on role
      const profileUpdate: Record<string, any> = {
        full_name: pendingSignupData.fullName,
        phone: pendingSignupData.phone,
        avatar_url: avatarUrl,
      };

      if (pendingSignupData.role === "student") {
        profileUpdate.academic_category = pendingSignupData.academicCategory;
        profileUpdate.board = pendingSignupData.board || null;
      }

      await supabase.from("profiles").update(profileUpdate).eq("id", userId);

      // Role-specific post-signup logic
      if (pendingSignupData.role === "mentor") {
        // Upload verification document
        let docUrl = null;
        if (pendingSignupData.verificationDoc) {
          docUrl = await uploadFile(pendingSignupData.verificationDoc, "mentor-documents", userId);
        }

        // Update user role to mentor
        await supabase.from("user_roles").upsert(
          { user_id: userId, role: "mentor" },
          { onConflict: "user_id" }
        );

        // Create/update mentor record (upsert to handle trigger-created record)
        await supabase.from("mentors").upsert({
          user_id: userId,
          bio: pendingSignupData.bio || "",
          mentor_types: pendingSignupData.mentorCategories || [],
          documents_urls: docUrl ? [docUrl] : [],
          status: "pending_request",
          fixed_rate_per_15m: 0,
        }, { onConflict: "user_id" });
      }

      // Handle partner referral attribution (for student signups)
      if (pendingSignupData.role === "student") {
        const storedRef = getStoredRef();
        if (storedRef) {
          try {
            await supabase.functions.invoke("attribute-referral", {
              body: { student_user_id: userId, short_ref: storedRef },
            });
          } catch (refError) {
            console.error("Failed to attribute referral:", refError);
          } finally {
            clearStoredRef();
          }
        }
      }

      toast({
        title: "Account Created Successfully! 🎉",
        description: pendingSignupData.role === "mentor"
          ? "Your mentor profile is under review."
          : "Welcome to MentSol!",
      });

      setPendingSignupData(null);
      setOtpCode("");
      resetForm();
      await redirectByRole(userId);
    } catch (error: any) {
      console.error("OTP verification error:", error);
      toast({
        title: "Verification Failed",
        description: error.message || "Could not verify OTP",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ============ RESEND OTP ============
  const handleResendOtp = async () => {
    if (!pendingSignupData || resendCooldown > 0) return;

    setLoading(true);
    try {
      await sendSignupOtp(pendingSignupData.email);
      setResendCooldown(30);
      setOtpCode("");
      toast({
        title: "OTP Resent",
        description: "A new verification code has been sent to your email.",
      });
    } catch (error: any) {
      console.error("Resend OTP error:", error);
      toast({
        title: "Failed to Resend",
        description: error.message || "Could not resend OTP",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMentorCategoryToggle = (category: string) => {
    setMentorCategories((prev) => (prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]));
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFullName("");
    setPhone("");
    setBio("");
    setAcademicCategory("");
    setBoard("");
    setMentorCategories([]);
    setProfilePhoto(null);
    setPhotoPreview(null);
    setVerificationDoc(null);
    setAgreedToTerms(false);
  };

  const goBack = () => {
    resetForm();
    setShowResendVerification(false);
    if (authView === "otp-verification" && pendingSignupData) {
      // Go back to the signup form for the role they were signing up as
      setAuthView(`${pendingSignupData.role}-signup` as AuthView);
      // Restore form data
      setEmail(pendingSignupData.email);
      setFullName(pendingSignupData.fullName);
      setPhone(pendingSignupData.phone);
      if (pendingSignupData.bio) setBio(pendingSignupData.bio);
      if (pendingSignupData.mentorCategories) setMentorCategories(pendingSignupData.mentorCategories);
      if (pendingSignupData.academicCategory) setAcademicCategory(pendingSignupData.academicCategory);
      if (pendingSignupData.board) setBoard(pendingSignupData.board);
      setPendingSignupData(null);
      setOtpCode("");
    } else if (authView === "login") {
      setAuthView("landing");
    } else if (authView === "forgot-password") {
      setAuthView("login");
    } else if (authView.includes("signup")) {
      setAuthView("role-selection");
      setSelectedRole(null);
    } else if (authView === "role-selection") {
      setAuthView("landing");
    }
  };

  // Show loading while checking session
  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // ============ OTP VERIFICATION VIEW ============
  if (authView === "otp-verification" && pendingSignupData) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <FloatingOrbs />
        <div className="relative z-10 flex flex-col min-h-screen p-6">
          <Button variant="ghost" onClick={goBack} className="self-start mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Change Email
          </Button>

          <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
            <div className="p-4 rounded-full bg-primary/10 mb-6">
              <Mail className="w-8 h-8 text-primary" />
            </div>

            <h2 className="text-2xl font-bold text-center mb-2">Verify Your Email</h2>
            <p className="text-muted-foreground text-center mb-2">
              We've sent a 6-digit code to
            </p>
            <p className="text-foreground font-medium text-center mb-8">
              {pendingSignupData.email}
            </p>

            <div className="w-full space-y-6">
              {/* OTP Input */}
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otpCode}
                  onChange={(value) => setOtpCode(value)}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <p className="text-sm text-muted-foreground text-center">
                Code expires in 5 minutes
              </p>

              {/* Verify Button */}
              <Button
                onClick={handleVerifyOtp}
                className="w-full h-12"
                disabled={loading || otpCode.length !== 6}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                {loading ? "Verifying..." : "Verify & Create Account"}
              </Button>

              {/* Resend OTP */}
              <div className="text-center">
                <Button
                  variant="ghost"
                  onClick={handleResendOtp}
                  disabled={loading || resendCooldown > 0}
                  className="text-sm"
                >
                  {resendCooldown > 0 ? (
                    `Resend OTP in ${resendCooldown}s`
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Resend OTP
                    </>
                  )}
                </Button>
              </div>

              {/* Warning */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-muted border border-border">
                <AlertTriangle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Do not share this code with anyone. MentSol will never ask for your OTP.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============ LANDING VIEW ============
  if (authView === "landing") {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <FloatingOrbs />
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-4">
              MentSol
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Connect with expert mentors for JEE, NEET, Board exams and more
            </p>
          </div>

          <div className="w-full max-w-sm space-y-4">
            <Button onClick={() => setAuthView("role-selection")} className="w-full h-14 text-lg" size="lg">
              Get Started
            </Button>

            <Button onClick={() => setAuthView("login")} variant="outline" className="w-full h-14 text-lg" size="lg">
              Already have an account? Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ============ ROLE SELECTION VIEW ============
  if (authView === "role-selection") {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <FloatingOrbs />
        <div className="relative z-10 flex flex-col min-h-screen p-6">
          <Button variant="ghost" onClick={goBack} className="self-start mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
            <h2 className="text-2xl font-bold text-center mb-2">Join MentSol</h2>
            <p className="text-muted-foreground text-center mb-8">Choose how you'd like to use MentSol</p>

            <div className="w-full space-y-4">
              {/* Student */}
              <button
                onClick={() => {
                  setSelectedRole("student");
                  setAuthView("student-signup");
                }}
                className="w-full p-6 rounded-xl border-2 border-border hover:border-primary/50 bg-card hover:bg-accent/50 transition-all text-left group"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-blue-500/10 text-blue-500">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">Student</h3>
                    <p className="text-sm text-muted-foreground">Book sessions with expert mentors</p>
                  </div>
                </div>
              </button>

              {/* Mentor */}
              <button
                onClick={() => {
                  setSelectedRole("mentor");
                  setAuthView("mentor-signup");
                }}
                className="w-full p-6 rounded-xl border-2 border-border hover:border-primary/50 bg-card hover:bg-accent/50 transition-all text-left group"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-500">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">Mentor</h3>
                    <p className="text-sm text-muted-foreground">Share your knowledge and earn</p>
                  </div>
                </div>
              </button>

              {/* Partner */}
              <button
                onClick={() => {
                  setSelectedRole("partner");
                  setAuthView("partner-signup");
                }}
                className="w-full p-6 rounded-xl border-2 border-border hover:border-primary/50 bg-card hover:bg-accent/50 transition-all text-left group"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-amber-500/10 text-amber-500">
                    <Handshake className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">Partner</h3>
                    <p className="text-sm text-muted-foreground">Refer students and earn commissions</p>
                  </div>
                </div>
              </button>
            </div>

            <p className="text-sm text-muted-foreground mt-8">
              Already have an account?{" "}
              <button onClick={() => setAuthView("login")} className="text-primary hover:underline">
                Login
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============ FORGOT PASSWORD VIEW ============
  if (authView === "forgot-password") {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <FloatingOrbs />
        <div className="relative z-10 flex flex-col min-h-screen p-6">
          <Button variant="ghost" onClick={() => setAuthView("login")} className="self-start mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Button>

          <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
            <div className="p-3 rounded-full bg-primary/10 mb-6">
              <KeyRound className="w-8 h-8 text-primary" />
            </div>

            <h2 className="text-2xl font-bold text-center mb-2">Forgot Password?</h2>
            <p className="text-muted-foreground text-center mb-8">
              Enter your email and we'll send you a link to reset your password.
            </p>

            <form onSubmit={handleForgotPassword} className="w-full space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="your@email.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full h-12" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Reset Link"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ============ RESET PASSWORD VIEW ============
  if (authView === "reset-password") {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <FloatingOrbs />
        <div className="relative z-10 flex flex-col min-h-screen p-6">
          <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
            <div className="p-3 rounded-full bg-primary/10 mb-6">
              <KeyRound className="w-8 h-8 text-primary" />
            </div>

            <h2 className="text-2xl font-bold text-center mb-2">Reset Your Password</h2>
            <p className="text-muted-foreground text-center mb-8">Enter your new password below.</p>

            <form onSubmit={handleResetPassword} className="w-full space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-new-password"
                    type={showConfirmNewPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">Password must be at least 8 characters.</p>

              <Button type="submit" className="w-full h-12" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reset Password"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ============ LOGIN VIEW ============
  if (authView === "login") {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <FloatingOrbs />
        <div className="relative z-10 flex flex-col min-h-screen p-6">
          <Button variant="ghost" onClick={goBack} className="self-start mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
            <h2 className="text-2xl font-bold text-center mb-2">Welcome Back</h2>
            <p className="text-muted-foreground text-center mb-8">Login to your account</p>

            <form onSubmit={handleLogin} className="w-full space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Email Verification Error + Resend Button */}
              {showResendVerification && (
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Email Not Verified</p>
                      <p className="text-sm text-muted-foreground mt-1">Please verify your email before logging in.</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleResendVerification}
                    disabled={resendingVerification}
                  >
                    {resendingVerification ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Mail className="w-4 h-4 mr-2" />
                    )}
                    Resend Verification Email
                  </Button>
                </div>
              )}

              {/* Forgot Password Link */}
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    setAuthView("forgot-password");
                  }}
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <Button type="submit" className="w-full h-12" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Login"}
              </Button>
            </form>

            <p className="text-sm text-muted-foreground mt-6">
              Don't have an account?{" "}
              <button onClick={() => setAuthView("role-selection")} className="text-primary hover:underline">
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============ STUDENT SIGNUP VIEW ============
  if (authView === "student-signup") {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <FloatingOrbs />
        <div className="relative z-10 flex flex-col min-h-screen p-6">
          <Button variant="ghost" onClick={goBack} className="self-start mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex-1 max-w-md mx-auto w-full pb-8">
            <div className="text-center mb-6">
              <div className="inline-flex p-3 rounded-lg bg-blue-500/10 text-blue-500 mb-3">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold">Student Signup</h2>
              <p className="text-muted-foreground text-sm">Create your student account</p>
            </div>

            <form onSubmit={handleStudentSignup} className="space-y-4">
              {/* Profile Photo */}
              <div className="flex justify-center">
                <label className="cursor-pointer">
                  <div className="w-24 h-24 rounded-full border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center overflow-hidden bg-muted/50 transition-colors">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <Upload className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  <p className="text-xs text-center text-muted-foreground mt-2">Upload Photo</p>
                </label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  placeholder="Your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Academic Category *</Label>
                <Select value={academicCategory} onValueChange={setAcademicCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your exam/class" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACADEMIC_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value} disabled={!cat.active}>
                        <span className="flex items-center gap-2">
                          {cat.label}
                          {!cat.active && (
                            <Badge variant="secondary" className="text-xs">
                              Coming Soon
                            </Badge>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(academicCategory === "tenth" || academicCategory === "twelfth") && (
                <div className="space-y-2">
                  <Label htmlFor="board">Board *</Label>
                  <Select value={board} onValueChange={setBoard}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your board" />
                    </SelectTrigger>
                    <SelectContent>
                      {BOARDS.map((b) => (
                        <SelectItem key={b.value} value={b.value}>
                          {b.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password Warning */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  Please remember your password. Password recovery is not available at this time.
                </p>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                />
                <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight">
                  I agree to the{" "}
                  <a href="/terms" className="text-primary hover:underline">
                    Terms & Conditions
                  </a>{" "}
                  and{" "}
                  <a href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </a>
                </label>
              </div>

              <Button type="submit" className="w-full h-12" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
              </Button>
            </form>

            <p className="text-sm text-muted-foreground mt-6 text-center">
              Already have an account?{" "}
              <button onClick={() => setAuthView("login")} className="text-primary hover:underline">
                Login
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============ MENTOR SIGNUP VIEW ============
  if (authView === "mentor-signup") {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <FloatingOrbs />
        <div className="relative z-10 flex flex-col min-h-screen p-6">
          <Button variant="ghost" onClick={goBack} className="self-start mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex-1 max-w-md mx-auto w-full pb-8">
            <div className="text-center mb-6">
              <div className="inline-flex p-3 rounded-lg bg-emerald-500/10 text-emerald-500 mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold">Mentor Signup</h2>
              <p className="text-muted-foreground text-sm">Apply to become a mentor</p>
            </div>

            <form onSubmit={handleMentorSignup} className="space-y-4">
              {/* Profile Photo */}
              <div className="flex justify-center">
                <label className="cursor-pointer">
                  <div className="w-24 h-24 rounded-full border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center overflow-hidden bg-muted/50 transition-colors">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <Upload className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  <p className="text-xs text-center text-muted-foreground mt-2">Upload Photo</p>
                </label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  placeholder="Your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Short Bio *</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell students about your experience and expertise..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  required
                />
                <p className="text-xs text-muted-foreground">Minimum 20 characters</p>
              </div>

              <div className="space-y-2">
                <Label>Mentorship Categories *</Label>
                <p className="text-xs text-muted-foreground mb-2">Select all that apply</p>
                <div className="grid grid-cols-2 gap-2">
                  {MENTOR_CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => handleMentorCategoryToggle(cat.value)}
                      className={`p-3 rounded-lg border text-sm transition-all ${
                        mentorCategories.includes(cat.value)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {mentorCategories.includes(cat.value) && <CheckCircle2 className="w-4 h-4" />}
                        {cat.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Verification Document *</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Upload College ID, JEE/NEET result, or any proof of qualification
                </p>
                <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                  <div className="text-center">
                    <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {verificationDoc ? verificationDoc.name : "Click to upload document"}
                    </p>
                  </div>
                  <input type="file" accept="image/*,.pdf" onChange={handleDocumentChange} className="hidden" />
                </label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                />
                <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight">
                  I agree to the{" "}
                  <a href="/terms" className="text-primary hover:underline">
                    Terms & Conditions
                  </a>{" "}
                  and{" "}
                  <a href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </a>
                </label>
              </div>

              <Button type="submit" className="w-full h-12" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Application"}
              </Button>
            </form>

            <p className="text-sm text-muted-foreground mt-6 text-center">
              Already have an account?{" "}
              <button onClick={() => setAuthView("login")} className="text-primary hover:underline">
                Login
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============ PARTNER SIGNUP VIEW ============
  if (authView === "partner-signup") {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <FloatingOrbs />
        <div className="relative z-10 flex flex-col min-h-screen p-6">
          <Button variant="ghost" onClick={goBack} className="self-start mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex-1 max-w-md mx-auto w-full pb-8">
            <div className="text-center mb-6">
              <div className="inline-flex p-3 rounded-lg bg-amber-500/10 text-amber-500 mb-3">
                <Handshake className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold">Partner Signup</h2>
              <p className="text-muted-foreground text-sm">Join the MentSol Partner Program</p>
            </div>

            {/* Partner Benefits */}
            <div className="p-4 rounded-lg bg-muted/50 mb-6">
              <h3 className="font-medium mb-2">Partner Benefits:</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Earn 10% commission on first 5 sessions per referred student</li>
                <li>• Get a unique referral link to share</li>
                <li>• Track all your referrals and earnings</li>
              </ul>
            </div>

            <form onSubmit={handlePartnerSignup} className="space-y-4">
              {/* Profile Photo */}
              <div className="flex justify-center">
                <label className="cursor-pointer">
                  <div className="w-24 h-24 rounded-full border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center overflow-hidden bg-muted/50 transition-colors">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <Upload className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  <p className="text-xs text-center text-muted-foreground mt-2">Upload Photo</p>
                </label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  placeholder="Your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                />
                <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight">
                  I agree to the{" "}
                  <a href="/terms" className="text-primary hover:underline">
                    Terms & Conditions
                  </a>{" "}
                  and{" "}
                  <a href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </a>
                </label>
              </div>

              <Button type="submit" className="w-full h-12" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Partner Account"}
              </Button>
            </form>

            <p className="text-sm text-muted-foreground mt-6 text-center">
              Already have an account?{" "}
              <button onClick={() => setAuthView("login")} className="text-primary hover:underline">
                Login
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
