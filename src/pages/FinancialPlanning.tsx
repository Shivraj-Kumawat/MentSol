import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, Wallet, Building2, Calculator, CreditCard, LineChart, Shield, Award } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const financialServices = [
  {
    id: 'stock-market',
    title: 'Stock Market Investment',
    description: 'SEBI-registered brokers & expert trading guidance',
    icon: TrendingUp,
    color: 'from-green-600 to-emerald-700',
    popular: true,
    certified: 'SEBI Registered'
  },
  {
    id: 'mutual-funds',
    title: 'Mutual Funds & SIP',
    description: 'AMFI certified advisors for systematic investing',
    icon: Wallet,
    color: 'from-blue-600 to-indigo-700',
    popular: true,
    certified: 'AMFI Certified'
  },
  {
    id: 'real-estate',
    title: 'Real Estate Investment',
    description: 'RERA-registered consultants for property guidance',
    icon: Building2,
    color: 'from-orange-600 to-amber-700',
    certified: 'RERA Registered'
  },
  {
    id: 'tax-planning',
    title: 'Tax Planning & CA Services',
    description: 'Chartered Accountants for tax saving strategies',
    icon: Calculator,
    color: 'from-purple-600 to-violet-700',
    popular: true,
    certified: 'CA Certified'
  },
  {
    id: 'loan-consultation',
    title: 'Loan Consultation',
    description: 'Home, personal & business loan experts',
    icon: CreditCard,
    color: 'from-cyan-600 to-teal-700',
    certified: 'Govt. Approved'
  },
  {
    id: 'financial-planning',
    title: 'Complete Financial Planning',
    description: 'Certified Financial Planners (CFP) for holistic planning',
    icon: LineChart,
    color: 'from-rose-600 to-pink-700',
    popular: true,
    certified: 'CFP Certified'
  }
];

const FinancialPlanning = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center gap-4 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/home')}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Financial Planning</h1>
            <p className="text-sm text-muted-foreground">Government-certified experts</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Trust Banner */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Shield className="h-6 w-6 text-primary mt-1 shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">100% Certified & Government Approved</h3>
                <p className="text-sm text-muted-foreground">
                  All our financial experts are certified by SEBI, AMFI, RERA, and other regulatory bodies. Many are IIM/IIT graduates.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services Grid */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Choose Your Financial Service</h2>
          
          {financialServices.map((service) => {
            const Icon = service.icon;
            return (
              <Card
                key={service.id}
                className="cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden border-2 hover:border-primary/50"
                onClick={() => navigate(`/category/financial-planning/${service.id}`)}
              >
                <div className={`h-2 bg-gradient-to-r ${service.color}`} />
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${service.color}`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <CardTitle className="text-lg">{service.title}</CardTitle>
                      </div>
                      <CardDescription className="text-sm">
                        {service.description}
                      </CardDescription>
                    </div>
                    {service.popular && (
                      <Badge variant="secondary" className="shrink-0">
                        Popular
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      {service.certified}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Award className="h-3 w-3 mr-1" />
                      IIM Graduates
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Why Choose Us */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="h-5 w-5 text-primary" />
              Why Choose Our Financial Experts?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <Shield className="h-4 w-4 text-primary mt-1 shrink-0" />
              <div>
                <p className="text-sm font-medium">Government Certified</p>
                <p className="text-xs text-muted-foreground">
                  SEBI, AMFI, RERA, and other regulatory approvals
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Award className="h-4 w-4 text-primary mt-1 shrink-0" />
              <div>
                <p className="text-sm font-medium">IIM/Top B-School Graduates</p>
                <p className="text-xs text-muted-foreground">
                  Industry experts with premier education background
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <TrendingUp className="h-4 w-4 text-primary mt-1 shrink-0" />
              <div>
                <p className="text-sm font-medium">Personalized Strategies</p>
                <p className="text-xs text-muted-foreground">
                  Customized financial plans tailored to your goals
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="h-4 w-4 text-primary mt-1 shrink-0" />
              <div>
                <p className="text-sm font-medium">Confidential & Secure</p>
                <p className="text-xs text-muted-foreground">
                  Your financial data is 100% safe and encrypted
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Specializations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Expert Specializations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="text-muted-foreground">Stock Market Trading & Portfolio Management</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="text-muted-foreground">Mutual Fund Selection & SIP Planning</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="text-muted-foreground">Real Estate Investment & RERA Guidance</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="text-muted-foreground">Income Tax Planning & GST by CAs</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="text-muted-foreground">Home, Personal & Business Loans</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="text-muted-foreground">Complete Wealth & Retirement Planning</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinancialPlanning;
