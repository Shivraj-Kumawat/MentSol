import { useNavigate } from "react-router-dom";
import { ChevronLeft, TrendingUp } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const collegePredictorSchema = z.object({
  exam: z.string().min(1, "Please select an exam"),
  rank: z.coerce
    .number()
    .int("Rank must be a whole number")
    .positive("Rank must be positive")
    .max(10000000, "Rank must be less than 10,000,000"),
  category: z.string().min(1, "Please select a category"),
});

type CollegePredictorFormValues = z.infer<typeof collegePredictorSchema>;

const CollegePredictor = () => {
  const navigate = useNavigate();
  
  const form = useForm<CollegePredictorFormValues>({
    resolver: zodResolver(collegePredictorSchema),
    defaultValues: {
      exam: "",
      rank: undefined,
      category: "",
    },
  });

  const onSubmit = (data: CollegePredictorFormValues) => {
    // Navigate to results page with validated data
    navigate("/college-results", { state: data });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-teal-glow/5 to-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/home", { replace: true })}
            className="rounded-full"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">
              College Predictor
            </h1>
            <p className="text-sm text-muted-foreground">
              Find your best college options
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Info Card */}
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                AI-Powered Predictions
              </h3>
              <p className="text-sm text-muted-foreground">
                Get accurate college predictions based on your rank, category, and preferences. 
                Connect with expert counselors for personalized guidance.
              </p>
            </div>
          </div>
        </Card>

        {/* Input Form */}
        <Card className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="exam"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Exam</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Choose your exam" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="jee-main">JEE Main</SelectItem>
                        <SelectItem value="jee-advanced">JEE Advanced</SelectItem>
                        <SelectItem value="neet">NEET UG</SelectItem>
                        <SelectItem value="mht-cet">MHT-CET</SelectItem>
                        <SelectItem value="bitsat">BITSAT</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rank"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Rank/Percentile</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter your rank or percentile"
                        className="rounded-xl"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Select your category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="obc">OBC-NCL</SelectItem>
                        <SelectItem value="sc">SC</SelectItem>
                        <SelectItem value="st">ST</SelectItem>
                        <SelectItem value="ews">EWS</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                size="lg"
                className="w-full rounded-2xl h-14"
              >
                Predict Colleges
              </Button>
            </form>
          </Form>
        </Card>

        {/* CTA Card */}
        <Card className="p-6 bg-gradient-to-br from-secondary/5 to-navy-light/5 border-secondary/20">
          <h3 className="font-semibold text-foreground mb-2">
            Need Expert Guidance?
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Talk to verified IITians and NITians for personalized college counseling
          </p>
          <Button
            onClick={() => navigate("/category/counselling")}
            variant="secondary"
            className="w-full rounded-2xl"
          >
            Find Counsellors
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default CollegePredictor;
