import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Circle, 
  Shield,
  AlertTriangle,
  Clock,
  RefreshCw
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { runLovableFixTests, TestSuiteResults, TestResult } from "@/tests/lovable-fix-tests";

const SecurityTests = () => {
  const navigate = useNavigate();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestSuiteResults | null>(null);
  const [autoRun, setAutoRun] = useState(false);

  useEffect(() => {
    // Auto-run on mount if query param is present
    const params = new URLSearchParams(window.location.search);
    if (params.get('autorun') === 'true') {
      setAutoRun(true);
      runTests();
    }
  }, []);

  const runTests = async () => {
    setIsRunning(true);
    setResults(null);
    
    try {
      const testResults = await runLovableFixTests();
      setResults(testResults);
    } catch (error) {
      console.error('Test suite error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-500" />;
      case 'fail':
        return <XCircle className="w-4 h-4 text-red-600 dark:text-red-500" />;
      case 'skip':
        return <Circle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants: Record<TestResult['status'], any> = {
      pass: { variant: 'default', className: 'bg-green-500 hover:bg-green-600' },
      fail: { variant: 'destructive', className: '' },
      skip: { variant: 'secondary', className: '' },
    };
    return variants[status];
  };

  const groupedTests = results?.tests.reduce((acc, test) => {
    if (!acc[test.category]) acc[test.category] = [];
    acc[test.category].push(test);
    return acc;
  }, {} as Record<string, TestResult[]>);

  const passRate = results ? Math.round((results.passed / results.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/home", { replace: true })}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                Security Tests
              </h1>
              <p className="text-sm text-muted-foreground">
                Automated validation of Lovable Fix V2 protections
              </p>
            </div>
            <Button
              onClick={runTests}
              disabled={isRunning}
              className="gap-2"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Run Tests
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Instructions */}
        {!results && !isRunning && (
          <Alert className="mb-6">
            <Shield className="w-4 h-4" />
            <AlertDescription>
              Click "Run Tests" to validate all Lovable Fix V2 security features. Tests will check token scrubbing,
              iframe sanitization, request protection, and API exposure.
            </AlertDescription>
          </Alert>
        )}

        {/* Running State */}
        {isRunning && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin" />
                Running Tests...
              </CardTitle>
              <CardDescription>
                Please wait while we validate all security features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={undefined} className="w-full" />
            </CardContent>
          </Card>
        )}

        {/* Results Summary */}
        {results && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Test Results</span>
                  <Badge variant={results.failed === 0 ? 'default' : 'destructive'} className="text-base px-4">
                    {results.failed === 0 ? 'All Passed' : `${results.failed} Failed`}
                  </Badge>
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Completed in {results.duration}ms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-foreground">{results.total}</div>
                    <div className="text-sm text-muted-foreground">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-500">{results.passed}</div>
                    <div className="text-sm text-muted-foreground">Passed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600 dark:text-red-500">{results.failed}</div>
                    <div className="text-sm text-muted-foreground">Failed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-muted-foreground">{results.skipped}</div>
                    <div className="text-sm text-muted-foreground">Skipped</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Pass Rate</span>
                    <span className="font-medium">{passRate}%</span>
                  </div>
                  <Progress value={passRate} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Failures Alert */}
            {results.failed > 0 && (
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>
                  {results.failed} test{results.failed > 1 ? 's' : ''} failed. Review the details below and check your
                  security configuration.
                </AlertDescription>
              </Alert>
            )}

            {/* Test Categories */}
            {groupedTests && Object.entries(groupedTests).map(([category, tests]) => (
              <Card key={category} className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{category}</span>
                    <Badge variant="outline">
                      {tests.filter(t => t.status === 'pass').length}/{tests.length} passed
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tests.map((test, idx) => (
                      <div key={idx}>
                        {idx > 0 && <Separator className="mb-4" />}
                        <div className="flex items-start gap-3">
                          {getStatusIcon(test.status)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{test.name}</span>
                              <Badge {...getStatusBadge(test.status)} size="sm">
                                {test.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{test.message}</p>
                            {test.details && (
                              <details className="mt-2">
                                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                                  Show details
                                </summary>
                                <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto">
                                  {JSON.stringify(test.details, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Actions */}
            <div className="flex gap-4">
              <Button onClick={runTests} variant="outline" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Run Again
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  console.log('Test Results:', results);
                  alert('Test results have been logged to console');
                }}
                className="gap-2"
              >
                Export to Console
              </Button>
            </div>
          </>
        )}

        {/* Info Card */}
        <Card className="mt-6 bg-muted/50">
          <CardHeader>
            <CardTitle className="text-sm">Testing Information</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              This test suite validates all Lovable Fix V2 security features by:
            </p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>Checking URL token scrubbing functionality</li>
              <li>Creating test iframes and validating sanitization</li>
              <li>Verifying outgoing request protection</li>
              <li>Testing form and anchor link protection</li>
              <li>Validating API exposure and version</li>
            </ul>
            <p className="pt-2">
              <strong>Note:</strong> Tests are non-destructive and create temporary DOM elements that are cleaned up
              automatically. Check the browser console for detailed logs.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SecurityTests;
