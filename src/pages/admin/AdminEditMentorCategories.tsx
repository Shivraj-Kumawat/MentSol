import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { exams } from '@/data/exams';

export default function AdminEditMentorCategories() {
  const { mentorId } = useParams<{ mentorId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [mentorName, setMentorName] = useState('');
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [selectedMentorTypes, setSelectedMentorTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!mentorId) return;

    const fetchMentor = async () => {
      try {
        const { data: mentor, error } = await supabase
          .from('mentors')
          .select('exams, mentor_types, user_id')
          .eq('id', mentorId)
          .single();

        if (error) throw error;

        setSelectedExams(mentor.exams || []);
        setSelectedMentorTypes(mentor.mentor_types || []);

        // Fetch profile name
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', mentor.user_id)
          .single();

        setMentorName(profile?.full_name || 'Unknown Mentor');
      } catch (error) {
        console.error('Error fetching mentor:', error);
        toast({ title: 'Error', description: 'Failed to load mentor data', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    fetchMentor();
  }, [mentorId]);

  const toggleExam = (examId: string) => {
    setSelectedExams((prev) =>
      prev.includes(examId) ? prev.filter((id) => id !== examId) : [...prev, examId]
    );
  };

  const toggleMentorType = (typeId: string) => {
    setSelectedMentorTypes((prev) =>
      prev.includes(typeId) ? prev.filter((id) => id !== typeId) : [...prev, typeId]
    );
  };

  const handleSave = async () => {
    if (!mentorId) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('mentors')
        .update({ exams: selectedExams, mentor_types: selectedMentorTypes })
        .eq('id', mentorId);

      if (error) throw error;

      toast({ title: 'Success', description: 'Mentor categories updated successfully' });
      navigate('/admin/mentors', { replace: true });
    } catch (error) {
      console.error('Error saving categories:', error);
      toast({ title: 'Error', description: 'Failed to update categories', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading mentor data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gradient-to-br from-background via-teal-glow/5 to-background">
      {/* Fixed Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/mentors', { replace: true })}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Edit Categories</h1>
            <p className="text-sm text-muted-foreground">{mentorName}</p>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          <p className="text-sm text-muted-foreground mb-4">
            Select the exam categories and mentor types for this mentor.
          </p>

          {exams.map((exam) => (
            <div key={exam.id} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`exam-${exam.id}`}
                  checked={selectedExams.includes(exam.id)}
                  onCheckedChange={() => toggleExam(exam.id)}
                />
                <Label htmlFor={`exam-${exam.id}`} className="font-semibold cursor-pointer text-base">
                  {exam.name}
                </Label>
              </div>
              {selectedExams.includes(exam.id) && (
                <div className="ml-6 space-y-2 mt-3">
                  <p className="text-sm text-muted-foreground mb-2">Select mentor types:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {exam.mentorTypes.map((type) => (
                      <div key={type.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`type-${type.id}`}
                          checked={selectedMentorTypes.includes(type.id)}
                          onCheckedChange={() => toggleMentorType(type.id)}
                        />
                        <Label htmlFor={`type-${type.id}`} className="text-sm cursor-pointer">
                          {type.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="sticky bottom-0 z-10 bg-background/95 backdrop-blur border-t px-4 py-4">
        <div className="max-w-3xl mx-auto flex gap-3 justify-end">
          <Button variant="outline" onClick={() => navigate('/admin/mentors', { replace: true })}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
