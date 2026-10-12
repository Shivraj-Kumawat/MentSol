import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Upload, X, FileText, Info, Camera } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { mentorCategoryStructure } from "@/data/mentorCategories";
import { exams as examsList } from "@/data/exams";
import * as LucideIcons from "lucide-react";

export default function MentorProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [mentorId, setMentorId] = useState<string | null>(null);
  const [originalCategories, setOriginalCategories] = useState<string[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    nickname: "",
    bio: "",
    specialization: "",
    fixed_rate_per_15m: "",
    allow_rate_edit: false,
    qualifications: "",
    mentor_types: [] as string[],
    exams: [] as string[],
    exam_mentor_types: [] as string[],
    documents: [] as File[],
    existingDocUrls: [] as string[],
    reschedule_policy: {
      free_reschedule_hours: 24,
      last_minute_fee_percentage: 20,
      allow_reschedule: true,
    },
  });

  // Get icon component dynamically
  const getIconComponent = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || LucideIcons.HelpCircle;
    return Icon;
  };

  useEffect(() => {
    loadMentorProfile();
  }, [user]);

  const loadMentorProfile = async () => {
    if (!user) return;

    try {
      const { data: mentor, error } = await supabase.from("mentors").select("*").eq("user_id", user.id).maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      // Load avatar from profiles table
      const { data: profileData } = await supabase.from("profiles").select("avatar_url").eq("id", user.id).single();
      if (profileData?.avatar_url) {
        setAvatarUrl(profileData.avatar_url);
      }

      if (mentor) {
        setMentorId(mentor.id);
        setOriginalCategories(mentor.mentor_types || []);

        // Parse reschedule policy with proper type handling
        const defaultPolicy = {
          free_reschedule_hours: 24,
          last_minute_fee_percentage: 20,
          allow_reschedule: true,
        };

        let reschedulePolicy = defaultPolicy;
        if (mentor.reschedule_policy && typeof mentor.reschedule_policy === "object") {
          reschedulePolicy = {
            free_reschedule_hours: (mentor.reschedule_policy as any).free_reschedule_hours ?? 24,
            last_minute_fee_percentage: (mentor.reschedule_policy as any).last_minute_fee_percentage ?? 20,
            allow_reschedule: (mentor.reschedule_policy as any).allow_reschedule ?? true,
          };
        }

        setFormData({
          nickname: mentor.nickname || "",
          bio: mentor.bio || "",
          specialization: mentor.specialization || "",
          fixed_rate_per_15m: mentor.fixed_rate_per_15m?.toString() || "",
          allow_rate_edit: mentor.allow_rate_edit || false,
          qualifications: mentor.qualifications?.join(", ") || "",
          mentor_types: mentor.mentor_types || [],
          exams: mentor.exams || [],
          exam_mentor_types: mentor.mentor_types || [],
          documents: [],
          existingDocUrls: mentor.documents_urls || [],
          reschedule_policy: reschedulePolicy,
        });
      }
    } catch (error: any) {
      console.error("Error loading profile:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.bio || !formData.specialization || !formData.fixed_rate_per_15m) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Validate reschedule policy
    if (formData.reschedule_policy.allow_reschedule) {
      if (
        formData.reschedule_policy.free_reschedule_hours < 1 ||
        formData.reschedule_policy.free_reschedule_hours > 168
      ) {
        toast({
          title: "Invalid Policy",
          description: "Free reschedule hours must be between 1 and 168 (1 week)",
          variant: "destructive",
        });
        return;
      }

      if (
        formData.reschedule_policy.last_minute_fee_percentage < 0 ||
        formData.reschedule_policy.last_minute_fee_percentage > 100
      ) {
        toast({
          title: "Invalid Policy",
          description: "Late reschedule fee must be between 0% and 100%",
          variant: "destructive",
        });
        return;
      }
    }

    if (formData.mentor_types.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one mentorship category",
        variant: "destructive",
      });
      return;
    }

    if (formData.documents.length === 0 && formData.existingDocUrls.length === 0) {
      toast({
        title: "Error",
        description: "Please upload at least one verification document (degree, certificate, etc.)",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Upload new documents to storage
      const uploadedUrls: string[] = [];

      for (const file of formData.documents) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError, data } = await supabase.storage.from("mentor-documents").upload(fileName, file);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("mentor-documents").getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }

      const allDocUrls = [...formData.existingDocUrls, ...uploadedUrls];

      const qualificationsArray = formData.qualifications
        .split(",")
        .map((q) => q.trim())
        .filter((q) => q);

      const mentorData = {
        user_id: user.id,
        nickname: formData.nickname || null,
        bio: formData.bio,
        specialization: formData.specialization,
        fixed_rate_per_15m: parseInt(formData.fixed_rate_per_15m),
        allow_rate_edit: formData.allow_rate_edit,
        qualifications: qualificationsArray,
        mentor_types: [...new Set(formData.mentor_types)],
        exams: [...new Set(formData.exams)],
        documents_urls: allDocUrls,
        status: "pending_request",
        reschedule_policy: formData.reschedule_policy,
      };

      let createdMentorId = mentorId;

      if (mentorId) {
        // Check if only categories changed (not core verification data)
        const { data: existingMentor } = await supabase
          .from("mentors")
          .select("mentor_types, status, bio, qualifications, documents_urls")
          .eq("id", mentorId)
          .single();

        if (!existingMentor) throw new Error("Mentor profile not found");

        // Only reset status if verification documents or qualifications changed (NOT bio)
        const coreDataChanged =
          JSON.stringify(existingMentor.qualifications) !== JSON.stringify(qualificationsArray) ||
          JSON.stringify(existingMentor.documents_urls) !== JSON.stringify(allDocUrls);

        const updateData = {
          ...mentorData,
          // Keep existing status if only categories changed
          status: coreDataChanged ? "pending_request" : existingMentor.status,
        };

        // Update existing profile
        const { error } = await supabase.from("mentors").update(updateData).eq("id", mentorId);

        if (error) throw error;

        toast({
          title: "Success",
          description: coreDataChanged
            ? "Profile updated. Admin will review your changes."
            : "Categories updated successfully! Your profile is still active.",
        });
      } else {
        // Create new profile
        const { data: newMentor, error } = await supabase.from("mentors").insert([mentorData]).select().single();

        if (error) throw error;
        createdMentorId = newMentor.id;

        // Send verification email to founders
        const { error: emailError } = await supabase.functions.invoke("send-mentor-verification-email", {
          body: {
            mentorId: createdMentorId,
            userId: user.id,
          },
        });

        if (emailError) {
          console.error("Error sending verification email:", emailError);
        }

        toast({
          title: "Success",
          description: "Profile created! Founders will review your application and notify you via email.",
        });
      }

      navigate("/mentor/dashboard");
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => {
      const validTypes = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a valid file type. Please upload PDF, JPG, PNG, or DOC files.`,
          variant: "destructive",
        });
        return false;
      }

      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 5MB limit.`,
          variant: "destructive",
        });
        return false;
      }

      return true;
    });

    setFormData((prev) => ({
      ...prev,
      documents: [...prev.documents, ...validFiles],
    }));
  };

  const removeDocument = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index),
    }));
  };

  const removeExistingDocument = (url: string) => {
    setFormData((prev) => ({
      ...prev,
      existingDocUrls: prev.existingDocUrls.filter((u) => u !== url),
    }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast({ title: "Invalid file", description: "Please upload a JPG, PNG, or WebP image.", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Profile photo must be under 2MB.", variant: "destructive" });
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Upload (upsert) to avatars bucket
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);

      // Add cache buster to force refresh
      const urlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;

      // Update profiles table
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: urlWithCacheBuster })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setAvatarUrl(urlWithCacheBuster);
      toast({ title: "Success", description: "Profile photo updated successfully!" });
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploadingAvatar(false);
      // Reset input so same file can be re-selected
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const toggleMentorType = (path: string) => {
    setFormData((prev) => ({
      ...prev,
      mentor_types: prev.mentor_types.includes(path)
        ? prev.mentor_types.filter((t) => t !== path)
        : [...prev.mentor_types, path],
    }));
  };

  const isTypeSelected = (mainCategory: string, subcategory: string, typeLabel: string) => {
    const path = `${mainCategory} > ${subcategory} > ${typeLabel}`;
    return formData.mentor_types.includes(path);
  };

  const getCategorySelectionCount = (mainCategory: string) => {
    return formData.mentor_types.filter((path) => path.startsWith(`${mainCategory} >`)).length;
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/mentor/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>{mentorId ? "Edit" : "Create"} Mentor Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {mentorId && (
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">Editing Mode</Badge>
                    {formData.mentor_types.length > 0 && (
                      <span className="text-sm text-muted-foreground">
                        Current: {formData.mentor_types.length} categories selected
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-foreground">✅ You can add or remove mentorship categories anytime</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Note: Category changes won't affect your active status. Only document/qualification changes need
                    re-approval.
                  </p>
                </div>
              )}

              {!mentorId && (
                <div className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/30 rounded-lg">
                  <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                    🎯 First, Choose What You'll Mentor
                  </h3>
                  <p className="text-sm text-foreground mb-1">
                    Select your expertise areas - you can pick multiple categories!
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Example: If you're an IITian, select <strong>Exam Preparation → JEE → IITian</strong>
                  </p>
                </div>
              )}

              <div>
                <Label className="text-base font-semibold">Select Your Mentorship Categories *</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose your expertise areas: Main Category → Subcategory → Specific Type
                </p>

                <Accordion type="multiple" className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {Object.entries(mentorCategoryStructure).map(([mainCategory, mainData]) => {
                    const MainIcon = getIconComponent(mainData.icon);
                    const selectionCount = getCategorySelectionCount(mainCategory);

                    return (
                      <AccordionItem key={mainCategory} value={mainCategory} className="border rounded-lg px-4 bg-card">
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-3 flex-1">
                            <MainIcon className="h-5 w-5 text-primary" />
                            <div className="text-left">
                              <div className="font-semibold text-foreground">{mainCategory}</div>
                              <div className="text-xs text-muted-foreground">{mainData.description}</div>
                            </div>
                            {selectionCount > 0 && (
                              <Badge variant="secondary" className="ml-auto mr-2">
                                {selectionCount} selected
                              </Badge>
                            )}
                          </div>
                        </AccordionTrigger>

                        <AccordionContent className="pt-3 space-y-4">
                          {Object.entries(mainData.subcategories).map(([subcategory, subData]) => {
                            const SubIcon = getIconComponent(subData.icon);

                            return (
                              <div key={subcategory} className="pl-3 space-y-2">
                                <div className="flex items-center gap-2 pb-2 border-b">
                                  <SubIcon className="h-4 w-4 text-primary/70" />
                                  <Label className="text-sm font-medium text-foreground">{subcategory}</Label>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-6">
                                  {subData.types.map((type) => {
                                    const path = `${mainCategory} > ${subcategory} > ${type.label}`;
                                    const isSelected = formData.mentor_types.includes(path);

                                    return (
                                      <div
                                        key={type.label}
                                        className="flex items-start space-x-2 p-2 rounded hover:bg-accent/50 transition-colors"
                                      >
                                        <Checkbox
                                          id={`type-${path}`}
                                          checked={isSelected}
                                          onCheckedChange={() => toggleMentorType(path)}
                                          className="mt-0.5"
                                        />
                                        <div className="flex-1">
                                          <Label
                                            htmlFor={`type-${path}`}
                                            className="text-sm cursor-pointer font-medium text-foreground"
                                          >
                                            {type.label}
                                          </Label>
                                          {type.description && (
                                            <p className="text-xs text-muted-foreground mt-0.5">{type.description}</p>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>

                {formData.mentor_types.length > 0 && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium text-foreground mb-2">
                      ✅ Selected Categories ({formData.mentor_types.length}):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[...new Set(formData.mentor_types)].map((type, index) => (
                        <Badge key={`${type}-${index}`} variant="secondary" className="text-xs">
                          {type.split(" > ").pop()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Exam Categories Section */}
              <div className="border-t pt-6">
                <Label className="text-base font-semibold">Exam-Based Categories (Optional)</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Select competitive exams you can mentor for. Students can find you through exam-specific searches.
                </p>

                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {examsList.map((exam) => {
                    const isExamSelected = formData.exams.includes(exam.id);

                    return (
                      <div key={exam.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id={`exam-${exam.id}`}
                            checked={isExamSelected}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData((prev) => ({
                                  ...prev,
                                  exams: [...prev.exams, exam.id],
                                }));
                              } else {
                                // Remove exam and its mentor types
                                const examMentorTypeIds = exam.mentorTypes.map((mt) => mt.id);
                                setFormData((prev) => ({
                                  ...prev,
                                  exams: prev.exams.filter((e) => e !== exam.id),
                                  exam_mentor_types: prev.exam_mentor_types.filter(
                                    (mt) => !examMentorTypeIds.includes(mt),
                                  ),
                                }));
                              }
                            }}
                          />
                          <Label htmlFor={`exam-${exam.id}`} className="flex items-center gap-2 cursor-pointer flex-1">
                            <div>
                              <p className="font-medium">{exam.name}</p>
                              <p className="text-xs text-muted-foreground">{exam.description}</p>
                            </div>
                          </Label>
                        </div>

                        {isExamSelected && (
                          <div className="ml-6 space-y-2">
                            <Label className="text-sm">Select your qualification(s):</Label>
                            <div className="grid grid-cols-1 gap-2">
                              {exam.mentorTypes.map((type) => (
                                <div key={type.id} className="flex items-center gap-2">
                                  <Checkbox
                                    id={`exam-type-${exam.id}-${type.id}`}
                                    checked={formData.exam_mentor_types.includes(type.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setFormData((prev) => ({
                                          ...prev,
                                          exam_mentor_types: [...prev.exam_mentor_types, type.id],
                                        }));
                                      } else {
                                        setFormData((prev) => ({
                                          ...prev,
                                          exam_mentor_types: prev.exam_mentor_types.filter((mt) => mt !== type.id),
                                        }));
                                      }
                                    }}
                                  />
                                  <Label htmlFor={`exam-type-${exam.id}-${type.id}`} className="text-sm cursor-pointer">
                                    {type.label}
                                    <span className="text-xs text-muted-foreground block">{type.description}</span>
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {formData.exams.length > 0 && (
                  <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                    <p className="text-sm font-medium mb-2">Selected Exams:</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.exams.map((examId) => {
                        const exam = examsList.find((e) => e.id === examId);
                        return exam ? (
                          <Badge key={examId} variant="default">
                            {exam.name}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                    {formData.exam_mentor_types.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Qualifications: {formData.exam_mentor_types.join(", ")}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Profile Photo Section */}
              <div>
                <Label className="text-base font-semibold">Profile Photo</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  This photo is visible to students on your profile and mentor cards.
                </p>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="w-20 h-20 border-2 border-border">
                      <AvatarImage src={avatarUrl || undefined} alt="Profile" />
                      <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                        {user?.email?.[0]?.toUpperCase() || "M"}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {uploadingAvatar ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Camera className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                  <div className="flex-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={uploadingAvatar}
                    >
                      {uploadingAvatar ? "Uploading..." : "Change Photo"}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG or WebP. Max 2MB.</p>
                  </div>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="nickname">Display Nickname (Optional)</Label>
                <Input
                  id="nickname"
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value.slice(0, 50) })}
                  placeholder="e.g., Physics Guru, Career Coach, Amit Sir"
                  maxLength={50}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  ⚠️ Important: This nickname will be shown to students instead of your real name. Leave blank to show
                  "Mentor". Students will see your photo but not your full name. {formData.nickname.length}/50
                  characters
                </p>
              </div>

              <div>
                <Label htmlFor="bio">Bio *</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell students about yourself..."
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label htmlFor="specialization">Specialization *</Label>
                <Input
                  id="specialization"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  placeholder="e.g., Mathematics, Physics"
                  required
                />
              </div>

              <div>
                <Label htmlFor="rate">Rate per 15 minutes (₹) *</Label>
                <Input
                  id="rate"
                  type="number"
                  value={formData.fixed_rate_per_15m}
                  onChange={(e) => setFormData({ ...formData, fixed_rate_per_15m: e.target.value })}
                  placeholder="e.g., 500"
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allow_rate_edit"
                  checked={formData.allow_rate_edit}
                  onCheckedChange={(checked) => setFormData({ ...formData, allow_rate_edit: checked as boolean })}
                />
                <Label htmlFor="allow_rate_edit" className="cursor-pointer">
                  Allow students to negotiate rate
                </Label>
              </div>

              {/* Reschedule Policy Settings */}
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Reschedule Policy Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="allow_reschedule">Allow Session Rescheduling</Label>
                      <p className="text-xs text-muted-foreground">Let students reschedule their booked sessions</p>
                    </div>
                    <Switch
                      id="allow_reschedule"
                      checked={formData.reschedule_policy.allow_reschedule}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          reschedule_policy: {
                            ...formData.reschedule_policy,
                            allow_reschedule: checked,
                          },
                        })
                      }
                    />
                  </div>

                  {formData.reschedule_policy.allow_reschedule && (
                    <>
                      <div>
                        <Label htmlFor="free_reschedule_hours">Free Reschedule Window (hours before session)</Label>
                        <p className="text-xs text-muted-foreground mb-2">
                          Students can reschedule for free if done this many hours before the session
                        </p>
                        <Input
                          id="free_reschedule_hours"
                          type="number"
                          min="1"
                          max="168"
                          value={formData.reschedule_policy.free_reschedule_hours}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              reschedule_policy: {
                                ...formData.reschedule_policy,
                                free_reschedule_hours: parseInt(e.target.value) || 24,
                              },
                            })
                          }
                          placeholder="24"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Recommended: 24 hours (Default: 24)</p>
                      </div>

                      <div>
                        <Label htmlFor="last_minute_fee_percentage">Late Reschedule Fee (% of session cost)</Label>
                        <p className="text-xs text-muted-foreground mb-2">
                          Fee charged for rescheduling within the free window
                        </p>
                        <Input
                          id="last_minute_fee_percentage"
                          type="number"
                          min="0"
                          max="100"
                          value={formData.reschedule_policy.last_minute_fee_percentage}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              reschedule_policy: {
                                ...formData.reschedule_policy,
                                last_minute_fee_percentage: parseInt(e.target.value) || 0,
                              },
                            })
                          }
                          placeholder="20"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Recommended: 10-30% (Default: 20%)</p>
                      </div>

                      <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                        <p className="text-sm font-medium">Policy Preview:</p>
                        <p className="text-xs text-muted-foreground">
                          • Free reschedule: {formData.reschedule_policy.free_reschedule_hours}+ hours before session
                        </p>
                        <p className="text-xs text-muted-foreground">
                          • Late fee: {formData.reschedule_policy.last_minute_fee_percentage}% of session cost
                        </p>
                        <p className="text-xs text-muted-foreground">
                          • Example: ₹{formData.fixed_rate_per_15m || "500"} session = ₹
                          {Math.round(
                            ((parseInt(formData.fixed_rate_per_15m) || 500) *
                              formData.reschedule_policy.last_minute_fee_percentage) /
                              100,
                          )}{" "}
                          late reschedule fee
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <div>
                <Label htmlFor="qualifications">Qualifications (comma separated)</Label>
                <Input
                  id="qualifications"
                  value={formData.qualifications}
                  onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                  placeholder="e.g., B.Tech IIT Delhi, MBA IIM"
                />
              </div>

              <div>
                <Label htmlFor="documents">Verification Documents (Degree, Certificates, etc.) *</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Upload documents to verify your qualifications (PDF, JPG, PNG, DOC - Max 5MB each)
                </p>

                {formData.existingDocUrls.length > 0 && (
                  <div className="mb-4 space-y-2">
                    <p className="text-sm font-medium">Existing Documents:</p>
                    {formData.existingDocUrls.map((url, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            Document {index + 1}
                          </a>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeExistingDocument(url)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Input
                    id="documents"
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Label htmlFor="documents" className="cursor-pointer flex flex-col items-center">
                    <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Click to upload documents</span>
                  </Label>
                </div>

                {formData.documents.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {formData.documents.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeDocument(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Changes Preview */}
              {mentorId &&
                JSON.stringify(formData.mentor_types.sort()) !== JSON.stringify(originalCategories.sort()) && (
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <p className="font-medium text-sm">📋 Changes Preview:</p>

                    {/* New additions */}
                    {formData.mentor_types
                      .filter((cat) => !originalCategories.includes(cat))
                      .map((cat) => (
                        <div key={cat} className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                          <span>✅</span>
                          <span>{cat.split(" > ").pop()}</span>
                        </div>
                      ))}

                    {/* Removals */}
                    {originalCategories
                      .filter((cat) => !formData.mentor_types.includes(cat))
                      .map((cat) => (
                        <div key={cat} className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                          <span>❌</span>
                          <span>{cat.split(" > ").pop()}</span>
                        </div>
                      ))}
                  </div>
                )}

              {/* Reset Button */}
              {mentorId &&
                JSON.stringify(formData.mentor_types.sort()) !== JSON.stringify(originalCategories.sort()) && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setFormData({ ...formData, mentor_types: originalCategories })}
                  >
                    Reset to Original Categories
                  </Button>
                )}

              <Button type="submit" disabled={loading} className="w-full">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mentorId
                  ? JSON.stringify(formData.mentor_types.sort()) !== JSON.stringify(originalCategories.sort())
                    ? "Update Categories & Profile"
                    : "Save Changes"
                  : "Create Mentor Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
