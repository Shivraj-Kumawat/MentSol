import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  Upload, 
  FileText, 
  User, 
  Award, 
  DollarSign,
  ArrowLeft,
  ArrowRight,
  GraduationCap
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { exams as examsList } from '@/data/exams';
import { Checkbox } from '@/components/ui/checkbox';

interface OnboardingData {
  nickname: string;
  bio: string;
  specialization: string;
  qualifications: string[];
  exams: string[];
  mentor_types: string[];
  documents: File[];
  fixed_rate_per_15m: number;
}

export default function MentorOnboarding() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<string[]>([]);
  
  const [formData, setFormData] = useState<OnboardingData>({
    nickname: '',
    bio: '',
    specialization: '',
    qualifications: [''],
    exams: [],
    mentor_types: [],
    documents: [],
    fixed_rate_per_15m: 500,
  });

  const totalSteps = 6;
  const progressPercentage = (currentStep / totalSteps) * 100;

  const steps = [
    { id: 1, title: 'Basic Info', icon: User, description: 'Tell us about yourself' },
    { id: 2, title: 'Specialization', icon: Award, description: 'Your expertise areas' },
    { id: 3, title: 'Categories', icon: GraduationCap, description: 'Select exam categories' },
    { id: 4, title: 'Documents', icon: FileText, description: 'Upload verification documents' },
    { id: 5, title: 'Pricing', icon: DollarSign, description: 'Set your consultation rate' },
    { id: 6, title: 'Review', icon: CheckCircle, description: 'Review and submit' },
  ];

  const addQualification = () => {
    setFormData(prev => ({
      ...prev,
      qualifications: [...prev.qualifications, '']
    }));
  };

  const updateQualification = (index: number, value: string) => {
    const newQualifications = [...formData.qualifications];
    newQualifications[index] = value;
    setFormData(prev => ({ ...prev, qualifications: newQualifications }));
  };

  const removeQualification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      qualifications: prev.qualifications.filter((_, i) => i !== index)
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setFormData(prev => ({ ...prev, documents: [...prev.documents, ...files] }));
    }
  };

  const removeDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const uploadDocuments = async () => {
    const urls: string[] = [];
    
    for (const file of formData.documents) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${session?.user?.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('mentor-documents')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('mentor-documents')
        .getPublicUrl(fileName);

      urls.push(publicUrl);
    }

    return urls;
  };

  const handleSubmit = async () => {
    if (!session?.user?.id) {
      toast({
        title: 'Error',
        description: 'You must be logged in',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      // Upload documents
      let documentUrls: string[] = [];
      if (formData.documents.length > 0) {
        documentUrls = await uploadDocuments();
      }

      // Filter out empty qualifications
      const validQualifications = formData.qualifications.filter(q => q.trim() !== '');

      // Check if mentor record exists
      const { data: existingMentor } = await supabase
        .from('mentors')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (existingMentor) {
        // Update existing mentor
        const { error } = await supabase
          .from('mentors')
          .update({
            bio: formData.bio,
            specialization: formData.specialization,
            qualifications: validQualifications,
            exams: [...new Set(formData.exams)],
            mentor_types: [...new Set(formData.mentor_types)],
            documents_urls: documentUrls,
            fixed_rate_per_15m: formData.fixed_rate_per_15m,
            status: 'pending_request',
          })
          .eq('user_id', session.user.id);

        if (error) throw error;
      } else {
        // Create new mentor record
        const { error } = await supabase
          .from('mentors')
          .insert({
            user_id: session.user.id,
            nickname: formData.nickname || null,
            bio: formData.bio,
            specialization: formData.specialization,
            qualifications: validQualifications,
            exams: [...new Set(formData.exams)],
            mentor_types: [...new Set(formData.mentor_types)],
            documents_urls: documentUrls,
            fixed_rate_per_15m: formData.fixed_rate_per_15m,
            status: 'pending_request',
          });

        if (error) throw error;
      }

      toast({
        title: 'Application Submitted!',
        description: 'Your application is under review. You will be notified once approved.',
      });

      navigate('/mentor/dashboard');
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit application',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return formData.bio.trim().length > 20;
      case 2:
        return formData.specialization.trim().length > 0;
      case 3:
        return formData.exams.length > 0 && formData.mentor_types.length > 0;
      case 4:
        return formData.documents.length > 0;
      case 5:
        return formData.fixed_rate_per_15m >= 100;
      default:
        return true;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="nickname">Display Nickname (Optional)</Label>
              <Input
                id="nickname"
                placeholder="e.g., Physics Guru, Career Coach, Amit Sir"
                value={formData.nickname}
                onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value.slice(0, 50) }))}
                className="mt-2"
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground mt-1">
                ⚠️ This nickname will be shown to students instead of your real name for privacy. 
                Leave blank to show "Mentor". {formData.nickname.length}/50 characters
              </p>
            </div>

            <div>
              <Label htmlFor="bio">Professional Bio *</Label>
              <Textarea
                id="bio"
                placeholder="Write a compelling bio that highlights your experience and expertise (minimum 20 characters)..."
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                rows={6}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.bio.length} characters
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="specialization">Primary Specialization *</Label>
              <Input
                id="specialization"
                placeholder="e.g., JEE Advanced Physics Expert, Mental Health Counselor"
                value={formData.specialization}
                onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Qualifications & Achievements</Label>
              <div className="space-y-2 mt-2">
                {formData.qualifications.map((qual, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="e.g., B.Tech from IIT Delhi, AIR 234 in JEE Advanced"
                      value={qual}
                      onChange={(e) => updateQualification(index, e.target.value)}
                    />
                    {formData.qualifications.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeQualification(index)}
                      >
                        ✕
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addQualification}
                  className="w-full"
                >
                  + Add Another Qualification
                </Button>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <Label>Select Exam Categories *</Label>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Choose the exams you can mentor for and your qualifications
              </p>
              
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {examsList.map((exam) => {
                  const isExamSelected = formData.exams.includes(exam.id);
                  
                  return (
                    <div key={exam.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id={exam.id}
                          checked={isExamSelected}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData(prev => ({
                                ...prev,
                                exams: [...prev.exams, exam.id]
                              }));
                            } else {
                              // Remove exam and its mentor types
                              const examMentorTypeIds = exam.mentorTypes.map(mt => mt.id);
                              setFormData(prev => ({
                                ...prev,
                                exams: prev.exams.filter(e => e !== exam.id),
                                mentor_types: prev.mentor_types.filter(mt => !examMentorTypeIds.includes(mt))
                              }));
                            }
                          }}
                        />
                        <Label htmlFor={exam.id} className="flex items-center gap-2 cursor-pointer flex-1">
                          <div>
                            <p className="font-medium">{exam.name}</p>
                            <p className="text-xs text-muted-foreground">{exam.description}</p>
                          </div>
                        </Label>
                      </div>
                      
                      {isExamSelected && (
                        <div className="ml-6 space-y-2">
                          <Label className="text-sm">Select your mentor type(s):</Label>
                          <div className="grid grid-cols-1 gap-2">
                            {exam.mentorTypes.map((type) => (
                              <div key={type.id} className="flex items-center gap-2">
                                <Checkbox
                                  id={`${exam.id}-${type.id}`}
                                  checked={formData.mentor_types.includes(type.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setFormData(prev => ({
                                        ...prev,
                                        mentor_types: [...prev.mentor_types, type.id]
                                      }));
                                    } else {
                                      setFormData(prev => ({
                                        ...prev,
                                        mentor_types: prev.mentor_types.filter(mt => mt !== type.id)
                                      }));
                                    }
                                  }}
                                />
                                <Label
                                  htmlFor={`${exam.id}-${type.id}`}
                                  className="text-sm cursor-pointer"
                                >
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
                  <p className="text-sm font-medium mb-2">Selected Categories:</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.exams.map((examId) => {
                      const exam = examsList.find(e => e.id === examId);
                      return exam ? (
                        <Badge key={examId} variant="default">{exam.name}</Badge>
                      ) : null;
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {formData.mentor_types.length} mentor type(s) selected
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div>
              <Label>Upload Documents *</Label>
              <p className="text-sm text-muted-foreground mt-1 mb-3">
                Upload certificates, ID proof, or other verification documents (PDF, JPG, PNG)
              </p>
              
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
                <Upload className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <Label
                  htmlFor="documents"
                  className="cursor-pointer text-primary hover:underline"
                >
                  Click to upload documents
                </Label>
                <Input
                  id="documents"
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {formData.documents.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium">Selected Documents:</p>
                  {formData.documents.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-secondary/50 rounded"
                    >
                      <span className="text-sm flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {file.name}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDocument(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="rate">Consultation Rate (per 15 minutes) *</Label>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-2xl font-bold">₹</span>
                <Input
                  id="rate"
                  type="number"
                  min="100"
                  step="50"
                  value={formData.fixed_rate_per_15m}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    fixed_rate_per_15m: parseInt(e.target.value) || 0 
                  }))}
                  className="text-2xl font-bold"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Estimated hourly rate: ₹{formData.fixed_rate_per_15m * 4}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                You'll earn 80% after platform fees
              </p>
            </div>

            <div className="bg-secondary/20 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Rate Guidelines</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Consider your experience and expertise level</li>
                <li>• Research competitive rates in your category</li>
                <li>• You can adjust your rate after approval</li>
                <li>• Minimum rate: ₹100/15min</li>
              </ul>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="bg-secondary/20 p-4 rounded-lg">
              <h4 className="font-semibold mb-3">Review Your Application</h4>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Bio</p>
                  <p className="text-sm text-muted-foreground">{formData.bio}</p>
                </div>

                <div>
                  <p className="text-sm font-medium">Specialization</p>
                  <p className="text-sm text-muted-foreground">{formData.specialization}</p>
                </div>

                <div>
                  <p className="text-sm font-medium">Qualifications</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {formData.qualifications.filter(q => q.trim() !== '').map((qual, idx) => (
                      <Badge key={idx} variant="secondary">{qual}</Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium">Exam Categories</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {formData.exams.map((examId) => {
                      const exam = examsList.find(e => e.id === examId);
                      return exam ? (
                        <Badge key={examId} variant="default">{exam.name}</Badge>
                      ) : null;
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Mentor types: {[...new Set(formData.mentor_types)].join(', ')}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium">Documents</p>
                  <p className="text-sm text-muted-foreground">
                    {formData.documents.length} document(s) ready to upload
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium">Consultation Rate</p>
                  <p className="text-sm text-muted-foreground">
                    ₹{formData.fixed_rate_per_15m}/15min (₹{formData.fixed_rate_per_15m * 4}/hour)
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm">
                <strong>Next Steps:</strong> Your application will be reviewed by our admin team. 
                You'll receive a notification once your profile is approved (usually within 24-48 hours).
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-teal-glow/5 to-background p-6">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : navigate('/home')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {currentStep > 1 ? 'Previous' : 'Exit'}
        </Button>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-3xl">Mentor Application</CardTitle>
            <CardDescription>
              Complete your profile to start mentoring students
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">
                  Step {currentStep} of {totalSteps}
                </span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(progressPercentage)}% Complete
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>

            {/* Step Indicators */}
            <div className="flex justify-between mb-8">
              {steps.map((step) => {
                const StepIcon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;

                return (
                  <div
                    key={step.id}
                    className={`flex flex-col items-center gap-2 flex-1 ${
                      isActive ? 'opacity-100' : 'opacity-50'
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors ${
                        isCompleted
                          ? 'bg-primary border-primary text-primary-foreground'
                          : isActive
                          ? 'border-primary text-primary'
                          : 'border-muted-foreground'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-6 w-6" />
                      ) : (
                        <StepIcon className="h-6 w-6" />
                      )}
                    </div>
                    <div className="text-center hidden sm:block">
                      <p className="text-xs font-medium">{step.title}</p>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Step Content */}
            <div className="min-h-[300px] mb-6">
              <h3 className="text-xl font-semibold mb-4">
                {steps[currentStep - 1].title}
              </h3>
              {renderStepContent()}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between gap-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              {currentStep < totalSteps ? (
                <Button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={!validateCurrentStep()}
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !validateCurrentStep()}
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
