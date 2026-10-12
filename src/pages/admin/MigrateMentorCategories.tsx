import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, CheckCircle, AlertCircle, Database } from 'lucide-react';

export default function MigrateMentorCategories() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    totalMentors?: number;
    migrated?: number;
    skipped?: number;
    details?: Array<{id: string, old: string[], new: string[]}>;
    error?: string;
  } | null>(null);

  const handleMigration = async () => {
    setMigrating(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('migrate-mentor-categories', {
        body: {}
      });

      if (error) throw error;

      setResult(data);
      
      if (data.success) {
        toast({
          title: 'Migration Complete',
          description: `Successfully migrated ${data.migrated} mentors`,
        });
      } else {
        toast({
          title: 'Migration Failed',
          description: data.error || 'Unknown error occurred',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Migration error:', error);
      setResult({
        success: false,
        message: 'Migration failed',
        error: error.message
      });
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin Dashboard
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Migrate Mentor Categories
            </CardTitle>
            <CardDescription>
              Convert existing mentor categories from flat format to hierarchical format
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>About This Migration</AlertTitle>
              <AlertDescription className="text-sm space-y-2 mt-2">
                <p>
                  This migration will convert mentor categories from the old flat format 
                  (e.g., "JEE - IITian") to the new hierarchical format 
                  (e.g., "Exam Preparation &gt; JEE &gt; IITian").
                </p>
                <p className="font-medium mt-2">What happens:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>All mentors with old format categories will be updated</li>
                  <li>Mentors already using hierarchical format will be skipped</li>
                  <li>Unmapped categories will be logged but not migrated</li>
                  <li>This operation is safe to run multiple times</li>
                </ul>
              </AlertDescription>
            </Alert>

            {!result && (
              <Button
                onClick={handleMigration}
                disabled={migrating}
                className="w-full"
                size="lg"
              >
                {migrating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Migrating...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    Start Migration
                  </>
                )}
              </Button>
            )}

            {result && (
              <div className="space-y-4">
                <Alert variant={result.success ? 'default' : 'destructive'}>
                  {result.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertTitle>
                    {result.success ? 'Migration Successful' : 'Migration Failed'}
                  </AlertTitle>
                  <AlertDescription className="mt-2">
                    {result.message}
                  </AlertDescription>
                </Alert>

                {result.success && result.totalMentors !== undefined && (
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{result.totalMentors}</div>
                        <p className="text-xs text-muted-foreground">Total Mentors</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-green-600">{result.migrated}</div>
                        <p className="text-xs text-muted-foreground">Migrated</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-yellow-600">{result.skipped}</div>
                        <p className="text-xs text-muted-foreground">Skipped</p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {result.details && result.details.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-3">Migration Details (First 10):</h3>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {result.details.map((detail, index) => (
                        <Card key={detail.id} className="bg-muted/50">
                          <CardContent className="pt-4 text-sm">
                            <div className="font-mono text-xs text-muted-foreground mb-2">
                              Mentor #{index + 1}: {detail.id}
                            </div>
                            <div className="space-y-2">
                              <div>
                                <span className="font-medium">Old:</span>
                                <div className="ml-4 text-muted-foreground">
                                  {detail.old.join(', ')}
                                </div>
                              </div>
                              <div>
                                <span className="font-medium text-green-600">New:</span>
                                <div className="ml-4">
                                  {detail.new.map(type => (
                                    <div key={type} className="text-xs">→ {type}</div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {result.error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error Details</AlertTitle>
                    <AlertDescription className="font-mono text-xs mt-2">
                      {result.error}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-3">
                  <Button
                    onClick={() => setResult(null)}
                    variant="outline"
                    className="flex-1"
                  >
                    Run Again
                  </Button>
                  <Button
                    onClick={() => navigate('/admin/dashboard')}
                    className="flex-1"
                  >
                    Back to Dashboard
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
