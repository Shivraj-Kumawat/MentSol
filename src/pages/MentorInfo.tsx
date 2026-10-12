import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Calendar, Users, TrendingUp, Star, Clock, BookOpen, Award, ArrowLeft } from "lucide-react";

const MentorInfo = () => {
  const navigate = useNavigate();

  const benefits = [
    { icon: Clock, title: "Flexible Scheduling", description: "Set your own availability and work on your terms" },
    { icon: TrendingUp, title: "Competitive Earnings", description: "Set your own rates and maximize your income" },
    { icon: Users, title: "Make an Impact", description: "Help students achieve their dreams and goals" },
    { icon: Award, title: "Build Your Brand", description: "Establish yourself as an expert in your field" },
  ];

  const steps = [
    { number: "1", title: "Create Profile", description: "Sign up and complete your mentor profile with qualifications" },
    { number: "2", title: "Set Availability", description: "Choose your available time slots using our easy calendar" },
    { number: "3", title: "Get Bookings", description: "Students discover and book sessions with you" },
    { number: "4", title: "Earn & Grow", description: "Conduct sessions and receive payments automatically" },
  ];

  const categories = [
    { icon: "📐", name: "JEE", description: "Engineering entrance coaching" },
    { icon: "🏥", name: "NEET", description: "Medical entrance guidance" },
    { icon: "💼", name: "CAT/MBA", description: "Management entrance prep" },
    { icon: "🎯", name: "Career", description: "Career counseling & advice" },
    { icon: "🏛️", name: "UPSC", description: "Civil services preparation" },
    { icon: "🎓", name: "College", description: "College selection guidance" },
  ];

  const faqs = [
    { q: "How much can I earn?", a: "You set your own rates per session (30 or 45 minutes). Top mentors earn ₹5,000-₹20,000+ per month." },
    { q: "When do I get paid?", a: "Payments are processed automatically after each completed session." },
    { q: "What qualifications do I need?", a: "You need to have cleared the exam you want to mentor for, or have relevant career experience." },
    { q: "How flexible is the schedule?", a: "Completely flexible! You choose which time slots to make available." },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/", { replace: true })}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-primary">MentSol</h1>
            <Button variant="ghost" size="sm" onClick={() => navigate('/home?mode=guest')}>
              Browse as Student
            </Button>
          </div>
          <Button onClick={() => navigate('/mentor/onboarding')}>
            Sign Up as Mentor
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-12 md:py-24">
        <div className="mx-auto max-w-3xl text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Share Your Knowledge & Earn
          </h1>
          <p className="text-xl text-muted-foreground">
            Join MentSol's community of mentors helping students achieve their dreams while building a flexible income stream
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/mentor/onboarding')} className="text-lg">
              Become a Mentor
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/home?mode=guest')}>
              Browse Student Portal
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container py-12 bg-muted/30">
        <h2 className="text-3xl font-bold text-center mb-12">Why Become a Mentor?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => (
            <Card key={index}>
              <CardHeader>
                <benefit.icon className="w-10 h-10 text-primary mb-2" />
                <CardTitle className="text-lg">{benefit.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{benefit.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="container py-12">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-primary/20" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-12 bg-muted/30">
        <h2 className="text-3xl font-bold text-center mb-12">Mentor Dashboard Features</h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <Calendar className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Availability Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Easily set and manage your available time slots with our intuitive calendar interface
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <BookOpen className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Session Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Track all your upcoming and completed sessions in one place with student details
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <TrendingUp className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Earnings Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Monitor your earnings, completed sessions, and pending payouts with detailed analytics
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Categories */}
      <section className="container py-12">
        <h2 className="text-3xl font-bold text-center mb-12">Mentor Categories We Need</h2>
        <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
          {categories.map((category, index) => (
            <Card key={index} className="text-center hover:border-primary transition-colors">
              <CardHeader>
                <div className="text-4xl mb-2">{category.icon}</div>
                <CardTitle className="text-lg">{category.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">{category.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="container py-12 bg-muted/30">
        <h2 className="text-3xl font-bold text-center mb-12">What Our Mentors Say</h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            { name: "Priya Sharma", role: "JEE Mentor", text: "Mentoring on MentSol has been incredibly rewarding. I help 15-20 students monthly while earning a great side income!", rating: 5 },
            { name: "Rahul Verma", role: "Career Counselor", text: "The platform is easy to use and payments are always on time. I love helping students make informed career choices.", rating: 5 },
            { name: "Anjali Singh", role: "NEET Mentor", text: "Setting my own schedule means I can mentor alongside my medical practice. Best decision I made!", rating: 5 },
          ].map((testimonial, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex gap-1 mb-2">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                <CardDescription>{testimonial.role}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground italic">"{testimonial.text}"</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="container py-12">
        <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  {faq.q}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground pl-7">{faq.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="container py-12 bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold">Ready to Make a Difference?</h2>
          <p className="text-xl text-muted-foreground">
            Join hundreds of mentors who are helping students achieve their goals while building a flexible income
          </p>
          <Button size="lg" onClick={() => navigate('/mentor/onboarding')} className="text-lg">
            Become a Mentor Today
          </Button>
        </div>
      </section>

      {/* Sticky CTA Bar - Mobile */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t lg:hidden z-50">
        <Button className="w-full" size="lg" onClick={() => navigate('/mentor/onboarding')}>
          Become a Mentor
        </Button>
      </div>
    </div>
  );
};

export default MentorInfo;
