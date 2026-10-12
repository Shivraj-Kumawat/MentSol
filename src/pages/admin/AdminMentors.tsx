import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, CheckCircle, XCircle, Ban, Edit, Tags, IndianRupee, Star, Calendar, ShieldCheck, Upload, Trash2 } from 'lucide-react';
import { exams } from '@/data/exams';

import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useRef } from 'react';

interface Mentor {
  id: string;
  user_id: string;
  bio: string;
  specialization: string;
  qualifications: string[];
  documents_urls: string[];
  fixed_rate_per_15m: number;
  allow_rate_edit: boolean;
  status: string;
  total_sessions: number;
  total_earnings: number;
  rating: number;
  created_at: string;
  exams: string[];
  mentor_types: string[];
  profiles?: {
    full_name: string;
    email: string;
    phone: string;
  };
}

export default function AdminMentors() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('pending_request');
  const [editingMentor, setEditingMentor] = useState<Mentor | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editRate, setEditRate] = useState(0);
  const [editRate30m, setEditRate30m] = useState(0);
  const [editRate45m, setEditRate45m] = useState(0);
  const [allowRateEdit, setAllowRateEdit] = useState(false);
  
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'without_categories'>('all');

  // Piece of Proof state
  const [proofDialogOpen, setProofDialogOpen] = useState(false);
  const [proofMentor, setProofMentor] = useState<Mentor | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const proofInputRef = useRef<HTMLInputElement>(null);

  const openProofDialog = (mentor: Mentor) => {
    setProofMentor(mentor);
    setProofDialogOpen(true);
  };

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !proofMentor) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: 'Invalid file type', description: 'Only JPG, JPEG, PNG are allowed', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Maximum file size is 5MB', variant: 'destructive' });
      return;
    }

    try {
      setUploadingProof(true);
      const filePath = `mentor-proof/${proofMentor.id}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('mentors')
        .update({ piece_of_proof_url: publicUrl } as any)
        .eq('id', proofMentor.id);

      if (updateError) throw updateError;

      toast({ title: 'Success', description: 'Proof uploaded successfully' });
      setProofDialogOpen(false);
      fetchMentors();
    } catch (error) {
      console.error('Error uploading proof:', error);
      toast({ title: 'Upload failed', description: 'Failed to upload proof document', variant: 'destructive' });
    } finally {
      setUploadingProof(false);
      if (proofInputRef.current) proofInputRef.current.value = '';
    }
  };

  const removeProof = async () => {
    if (!proofMentor) return;
    try {
      setUploadingProof(true);
      const { error } = await supabase
        .from('mentors')
        .update({ piece_of_proof_url: null } as any)
        .eq('id', proofMentor.id);

      if (error) throw error;

      await supabase.storage.from('avatars').remove([`mentor-proof/${proofMentor.id}`]);

      toast({ title: 'Removed', description: 'Proof document removed' });
      setProofDialogOpen(false);
      fetchMentors();
    } catch (error) {
      console.error('Error removing proof:', error);
      toast({ title: 'Error', description: 'Failed to remove proof', variant: 'destructive' });
    } finally {
      setUploadingProof(false);
    }
  };

  const fetchMentors = async () => {
    try {
      setLoading(true);
      
      // First fetch all mentors from mentors table (no joins that could filter out records)
      const { data: mentorsData, error: mentorsError } = await supabase
        .from('mentors')
        .select('*')
        .order('created_at', { ascending: false });

      if (mentorsError) throw mentorsError;
      
      console.log('[AdminMentors] Raw mentors fetched:', mentorsData?.length, mentorsData);

      // Then fetch profiles separately and merge
      const userIds = mentorsData?.map(m => m.user_id) || [];
      let profilesMap: Record<string, { full_name: string; email: string; phone: string }> = {};
      
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email, phone')
          .in('id', userIds);
        
        if (profilesError) {
          console.warn('[AdminMentors] Error fetching profiles:', profilesError);
        } else if (profilesData) {
          profilesData.forEach(p => {
            profilesMap[p.id] = { full_name: p.full_name || '', email: p.email || '', phone: p.phone || '' };
          });
        }
      }

      // Merge mentors with profiles data (LEFT JOIN behavior)
      const enrichedMentors = (mentorsData || []).map(mentor => ({
        ...mentor,
        profiles: profilesMap[mentor.user_id] || { full_name: 'Unknown', email: '', phone: '' }
      }));

      console.log('[AdminMentors] Enriched mentors:', enrichedMentors.length, enrichedMentors);
      setMentors(enrichedMentors);
    } catch (error) {
      console.error('[AdminMentors] Error fetching mentors:', error);
      toast({
        title: 'Error',
        description: 'Failed to load mentors',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentors();
  }, []);

  const updateMentorStatus = async (mentorId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('mentors')
        .update({ status })
        .eq('id', mentorId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Mentor ${status === 'approved' ? 'approved' : status}`,
      });

      fetchMentors();
    } catch (error) {
      console.error('Error updating mentor status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update mentor status',
        variant: 'destructive',
      });
    }
  };

  const openDocument = async (url: string) => {
    const marker = '/object/public/mentor-documents/';
    const idx = url.indexOf(marker);

    if (idx === -1) {
      window.open(url, '_blank');
      return;
    }

    const filePath = url.substring(idx + marker.length);

    const { data, error } = await supabase.storage
      .from('mentor-documents')
      .createSignedUrl(filePath, 3600);

    if (error || !data?.signedUrl) {
      toast({ title: 'Error', description: 'Could not open document', variant: 'destructive' });
      return;
    }

    window.open(data.signedUrl, '_blank');
  };

  const openEditDialog = (mentor: Mentor) => {
    setEditingMentor(mentor);
    setEditRate(mentor.fixed_rate_per_15m || 0);
    setEditRate30m((mentor as any).fixed_rate_per_30m || 0);
    setEditRate45m((mentor as any).fixed_rate_per_45m || 0);
    setAllowRateEdit(mentor.allow_rate_edit);
    setEditDialogOpen(true);
  };

  const saveRateChanges = async () => {
    if (!editingMentor) return;

    try {
      const { error } = await supabase
        .from('mentors')
        .update({
          fixed_rate_per_15m: Math.round(editRate),
          fixed_rate_per_30m: Math.round(editRate30m),
          fixed_rate_per_45m: Math.round(editRate45m),
          allow_rate_edit: allowRateEdit,
        })
        .eq('id', editingMentor.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Mentor rate updated successfully',
      });

      setEditDialogOpen(false);
      fetchMentors();
    } catch (error) {
      console.error('Error updating mentor rate:', error);
      toast({
        title: 'Error',
        description: 'Failed to update mentor rate',
        variant: 'destructive',
      });
    }
  };

  

  const filteredMentors = mentors.filter((mentor) => {
    const matchesTab = mentor.status === selectedTab;
    const matchesSearch =
      mentor.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.specialization?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === 'all' ||
      (categoryFilter === 'without_categories' &&
        (!mentor.exams || mentor.exams.length === 0));
    return matchesTab && matchesSearch && matchesCategory;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      pending_request: { variant: 'secondary', label: 'Pending' },
      approved: { variant: 'default', label: 'Approved' },
      suspended: { variant: 'destructive', label: 'Suspended' },
      rejected: { variant: 'outline', label: 'Rejected' },
    };
    const config = variants[status] || variants.pending_request;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-teal-glow/5 to-background p-6">
      <div className="max-w-7xl mx-auto">
        <Button variant="ghost" onClick={() => navigate('/admin')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Mentor Management</h1>
          <p className="text-muted-foreground">Approve, manage, and configure mentors</p>
        </div>

        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search mentors by name, email, or specialization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={categoryFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategoryFilter('all')}
            >
              All Mentors
            </Button>
            <Button
              variant={categoryFilter === 'without_categories' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategoryFilter('without_categories')}
            >
              Without Categories
            </Button>
          </div>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending_request">
              Pending ({mentors.filter((m) => m.status === 'pending_request').length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({mentors.filter((m) => m.status === 'approved').length})
            </TabsTrigger>
            <TabsTrigger value="suspended">
              Suspended ({mentors.filter((m) => m.status === 'suspended').length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({mentors.filter((m) => m.status === 'rejected').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="mt-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-pulse text-muted-foreground">Loading mentors...</div>
              </div>
            ) : filteredMentors.length === 0 ? (
              <Card className="glass">
                <CardContent className="py-12 text-center text-muted-foreground">
                  No mentors found in this category
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredMentors.map((mentor) => (
                  <Card key={mentor.id} className="glass card-hover">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {mentor.profiles?.full_name || 'Unknown'}
                            {getStatusBadge(mentor.status)}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {mentor.profiles?.email}
                          </p>
                          {mentor.profiles?.phone && (
                            <p className="text-sm text-muted-foreground">
                              Phone: {mentor.profiles.phone}
                            </p>
                          )}
                        </div>
                         <div className="text-right">
                          <div className="text-sm font-medium text-foreground">
                            {(mentor as any).fixed_rate_per_30m > 0 && (
                              <span>₹{(mentor as any).fixed_rate_per_30m}/30m</span>
                            )}
                            {(mentor as any).fixed_rate_per_45m > 0 && (
                              <span className="ml-1">| ₹{(mentor as any).fixed_rate_per_45m}/1hr</span>
                            )}
                            {!(mentor as any).fixed_rate_per_30m && !(mentor as any).fixed_rate_per_45m && (
                              <span>₹{mentor.fixed_rate_per_15m || 0}/15m (legacy)</span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {mentor.allow_rate_edit ? 'Editable' : 'Locked'}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">Specialization</p>
                          <p className="text-sm text-muted-foreground">{mentor.specialization || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Bio</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">{mentor.bio || 'No bio provided'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground mb-2">Categories</p>
                          {mentor.exams && mentor.exams.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {mentor.exams.map((examId) => {
                                const exam = exams.find((e) => e.id === examId);
                                return exam ? (
                                  <Badge key={examId} variant="secondary" className="text-xs">
                                    {exam.name}
                                  </Badge>
                                ) : null;
                              })}
                              {mentor.mentor_types && mentor.mentor_types.length > 0 && (
                                <>
                                  <span className="text-muted-foreground mx-1">•</span>
                                  {[...new Set(mentor.mentor_types)].map((typeId, index) => (
                                    <Badge key={`${typeId}-${index}`} variant="outline" className="text-xs">
                                      {typeId}
                                    </Badge>
                                  ))}
                                </>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">No categories assigned</p>
                          )}
                        </div>
                        {/* Verification Documents */}
                        <div>
                          <p className="text-sm font-medium text-foreground mb-2">Verification Documents</p>
                          {mentor.documents_urls && mentor.documents_urls.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {mentor.documents_urls.map((url: string, idx: number) => {
                                const fileName = url.split('/').pop() || `Document ${idx + 1}`;
                                const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                                return (
                                  <button
                                    key={idx}
                                    onClick={() => openDocument(url)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 hover:bg-muted rounded-md text-xs text-primary underline-offset-2 hover:underline transition-colors cursor-pointer"
                                  >
                                    {isImage ? '🖼️' : '📄'} {fileName.length > 25 ? fileName.slice(0, 25) + '...' : fileName}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">No documents uploaded</p>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div className="p-2 bg-muted/50 rounded-lg">
                            <p className="text-xs text-muted-foreground">Sessions</p>
                            <p className="font-semibold">{mentor.total_sessions || 0}</p>
                          </div>
                          <div className="p-2 bg-muted/50 rounded-lg">
                            <p className="text-xs text-muted-foreground">Rating</p>
                            <p className="font-semibold flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {(mentor.rating || 0).toFixed(1)}
                            </p>
                          </div>
                          <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded-lg">
                            <p className="text-xs text-muted-foreground">Earnings</p>
                            <p className="font-semibold text-green-600">₹{mentor.total_earnings || 0}</p>
                          </div>
                          <div className="p-2 bg-muted/50 rounded-lg">
                            <p className="text-xs text-muted-foreground">Rate</p>
                            <p className="font-semibold">{(mentor as any).fixed_rate_per_30m > 0 ? `₹${(mentor as any).fixed_rate_per_30m}/30m` : ''}{(mentor as any).fixed_rate_per_45m > 0 ? ` | ₹${(mentor as any).fixed_rate_per_45m}/1hr` : ''}{!(mentor as any).fixed_rate_per_30m && !(mentor as any).fixed_rate_per_45m ? `₹${mentor.fixed_rate_per_15m || 0}/15m` : ''}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                          {selectedTab === 'pending_request' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => updateMentorStatus(mentor.id, 'approved')}
                                className="flex-1"
                              >
                                <CheckCircle className="mr-1 h-4 w-4" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateMentorStatus(mentor.id, 'rejected')}
                                className="flex-1"
                              >
                                <XCircle className="mr-1 h-4 w-4" />
                                Reject
                              </Button>
                            </>
                          )}
                          {selectedTab === 'approved' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateMentorStatus(mentor.id, 'suspended')}
                            >
                              <Ban className="mr-1 h-4 w-4" />
                              Suspend
                            </Button>
                          )}
                          {selectedTab === 'suspended' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateMentorStatus(mentor.id, 'approved')}
                            >
                              <CheckCircle className="mr-1 h-4 w-4" />
                              Reactivate
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => openEditDialog(mentor)}>
                            <Edit className="mr-1 h-4 w-4" />
                            Edit Rate
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => navigate(`/admin/mentors/${mentor.id}/categories`)}>
                            <Tags className="mr-1 h-4 w-4" />
                            Categories
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => navigate(`/admin/mentor/${mentor.id}/sessions`)}
                          >
                            <Calendar className="mr-1 h-4 w-4" />
                            Sessions
                          </Button>
                          <Button 
                            size="sm" 
                            variant="default"
                            onClick={() => navigate(`/admin/mentor/${mentor.id}/earnings`)}
                          >
                            <IndianRupee className="mr-1 h-4 w-4" />
                            Earnings
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openProofDialog(mentor)}
                          >
                            <ShieldCheck className="mr-1 h-4 w-4" />
                            {(mentor as any).piece_of_proof_url ? 'View Proof' : 'Upload Proof'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit Rate Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Mentor Rate</DialogTitle>
              <DialogDescription>
                Set the fixed rate for {editingMentor?.profiles?.full_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="rate30m">Rate per 30 minutes (₹)</Label>
                <Input
                  id="rate30m"
                  type="number"
                  value={editRate30m}
                  onChange={(e) => setEditRate30m(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="1"
                />
                <p className="text-xs text-muted-foreground mt-1">Standard session rate</p>
              </div>
              <div>
                <Label htmlFor="rate45m">Rate per 1 hour (₹)</Label>
                <Input
                  id="rate45m"
                  type="number"
                  value={editRate45m}
                  onChange={(e) => setEditRate45m(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="1"
                />
                <p className="text-xs text-muted-foreground mt-1">1 hour session rate. Set to 0 to disable.</p>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="allow-edit">Allow mentor to edit rate</Label>
                <Switch
                  id="allow-edit"
                  checked={allowRateEdit}
                  onCheckedChange={setAllowRateEdit}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveRateChanges}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Proof Upload Dialog */}
        <Dialog open={proofDialogOpen} onOpenChange={setProofDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Piece of Proof</DialogTitle>
              <DialogDescription>
                Upload verification document for {proofMentor?.profiles?.full_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {(proofMentor as any)?.piece_of_proof_url ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">Current Proof</p>
                  <div className="border rounded-lg overflow-hidden">
                    <img
                      src={(proofMentor as any).piece_of_proof_url}
                      alt="Verification proof"
                      className="w-full max-h-64 object-contain bg-muted"
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No proof document uploaded yet.</p>
              )}
              <div>
                <Label>{(proofMentor as any)?.piece_of_proof_url ? 'Replace Document' : 'Upload Document'}</Label>
                <Input
                  ref={proofInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={handleProofUpload}
                  disabled={uploadingProof}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">JPG, JPEG, PNG only. Max 5MB.</p>
              </div>
            </div>
            <DialogFooter>
              {(proofMentor as any)?.piece_of_proof_url && (
                <Button variant="destructive" onClick={removeProof} disabled={uploadingProof}>
                  <Trash2 className="mr-1 h-4 w-4" />
                  Remove
                </Button>
              )}
              <Button variant="outline" onClick={() => setProofDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        
      </div>
    </div>
  );
}
