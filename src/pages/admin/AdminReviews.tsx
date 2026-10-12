import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Star, Flag, Trash2, MessageSquare, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Review {
  id: string;
  rating: number;
  review_text: string;
  is_flagged: boolean;
  admin_response: string | null;
  created_at: string;
  student: {
    full_name: string;
    email: string;
  };
  mentor: {
    user: {
      full_name: string;
    };
  };
}

export default function AdminReviews() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState<string>('all');
  const [filterFlagged, setFilterFlagged] = useState<string>('all');
  const [responseText, setResponseText] = useState<{ [key: string]: string }>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterRating !== 'all') {
        query = query.eq('rating', parseInt(filterRating));
      }

      if (filterFlagged === 'flagged') {
        query = query.eq('is_flagged', true);
      } else if (filterFlagged === 'unflagged') {
        query = query.eq('is_flagged', false);
      }

      const { data: reviewsData, error } = await query;

      if (error) throw error;

      // Fetch student and mentor data
      const reviewsWithDetails = await Promise.all(
        (reviewsData || []).map(async (review) => {
          const [studentRes, mentorRes] = await Promise.all([
            supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', review.student_id)
              .single(),
            supabase
              .from('mentors')
              .select('user_id')
              .eq('id', review.mentor_id)
              .single(),
          ]);

          let mentorName = 'Unknown';
          if (mentorRes.data) {
            const { data: mentorProfile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', mentorRes.data.user_id)
              .single();
            mentorName = mentorProfile?.full_name || 'Unknown';
          }

          return {
            ...review,
            student: studentRes.data || { full_name: 'Unknown', email: '' },
            mentor: {
              user: {
                full_name: mentorName,
              },
            },
          };
        })
      );

      setReviews(reviewsWithDetails as Review[]);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reviews',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [filterRating, filterFlagged]);

  const toggleFlag = async (reviewId: string, currentFlag: boolean) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ is_flagged: !currentFlag })
        .eq('id', reviewId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: currentFlag ? 'Review unflagged' : 'Review flagged for attention',
      });
      
      fetchReviews();
    } catch (error) {
      console.error('Error toggling flag:', error);
      toast({
        title: 'Error',
        description: 'Failed to update review',
        variant: 'destructive',
      });
    }
  };

  const saveResponse = async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ admin_response: responseText[reviewId] })
        .eq('id', reviewId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Admin response saved',
      });
      
      fetchReviews();
    } catch (error) {
      console.error('Error saving response:', error);
      toast({
        title: 'Error',
        description: 'Failed to save response',
        variant: 'destructive',
      });
    }
  };

  const deleteReview = async () => {
    if (!reviewToDelete) return;

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewToDelete);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Review deleted successfully',
      });
      
      setDeleteDialogOpen(false);
      setReviewToDelete(null);
      fetchReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete review',
        variant: 'destructive',
      });
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
            }`}
          />
        ))}
      </div>
    );
  };

  const stats = {
    total: reviews.length,
    flagged: reviews.filter(r => r.is_flagged).length,
    averageRating: reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '0',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-teal-glow/5 to-background p-6">
      <div className="max-w-7xl mx-auto">
        <Button variant="ghost" onClick={() => navigate('/admin')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Review Management</h1>
          <p className="text-muted-foreground">Moderate and respond to user reviews</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="glass">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">{stats.total}</p>
                <p className="text-sm text-muted-foreground mt-1">Total Reviews</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-500">{stats.averageRating}</p>
                <p className="text-sm text-muted-foreground mt-1">Average Rating</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-destructive">{stats.flagged}</p>
                <p className="text-sm text-muted-foreground mt-1">Flagged Reviews</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Rating</label>
                <Select value={filterRating} onValueChange={setFilterRating}>
                  <SelectTrigger>
                    <SelectValue placeholder="All ratings" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ratings</SelectItem>
                    <SelectItem value="5">5 Stars</SelectItem>
                    <SelectItem value="4">4 Stars</SelectItem>
                    <SelectItem value="3">3 Stars</SelectItem>
                    <SelectItem value="2">2 Stars</SelectItem>
                    <SelectItem value="1">1 Star</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={filterFlagged} onValueChange={setFilterFlagged}>
                  <SelectTrigger>
                    <SelectValue placeholder="All reviews" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Reviews</SelectItem>
                    <SelectItem value="flagged">Flagged Only</SelectItem>
                    <SelectItem value="unflagged">Unflagged Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reviews List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-pulse text-muted-foreground">Loading reviews...</div>
          </div>
        ) : reviews.length === 0 ? (
          <Card className="glass">
            <CardContent className="py-12 text-center text-muted-foreground">
              No reviews found
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {reviews.map((review) => (
              <Card key={review.id} className={`glass card-hover ${review.is_flagged ? 'border-destructive' : ''}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {renderStars(review.rating)}
                        {review.is_flagged && (
                          <Badge variant="destructive" className="gap-1">
                            <Flag className="h-3 w-3" />
                            Flagged
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg">
                        {review.student?.full_name} → {review.mentor?.user?.full_name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(new Date(review.created_at), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={review.is_flagged ? 'default' : 'outline'}
                        onClick={() => toggleFlag(review.id, review.is_flagged)}
                      >
                        <Flag className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setReviewToDelete(review.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {review.review_text && (
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                          {review.review_text}
                        </p>
                      </div>
                    )}

                    {/* Admin Response Section */}
                    <div className="border-t pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        <label className="text-sm font-semibold text-foreground">
                          Admin Response
                        </label>
                      </div>
                      
                      {review.admin_response ? (
                        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 mb-2">
                          <p className="text-sm text-foreground">{review.admin_response}</p>
                        </div>
                      ) : null}

                      <Textarea
                        placeholder="Add admin response or comment..."
                        value={responseText[review.id] || review.admin_response || ''}
                        onChange={(e) =>
                          setResponseText({ ...responseText, [review.id]: e.target.value })
                        }
                        className="mb-2"
                      />
                      <Button
                        size="sm"
                        onClick={() => saveResponse(review.id)}
                        disabled={!responseText[review.id] || responseText[review.id] === review.admin_response}
                      >
                        Save Response
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Review</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this review? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={deleteReview} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}