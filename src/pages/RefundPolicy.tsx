import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const RefundPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto p-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/home", { replace: true })}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <h1 className="text-3xl font-bold text-foreground mb-2">Refund & Cancellation Policy</h1>
        <p className="text-muted-foreground mb-8">Effective Date: January 1, 2025 | Last Updated: January 1, 2025</p>

        <Card>
          <CardContent className="pt-6 space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">1. Overview</h2>
              <p className="text-muted-foreground leading-relaxed">
                At MentSol, we strive to provide excellent mentorship services. This Refund and Cancellation Policy outlines the terms under which refunds may be issued for session bookings made through our platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">2. Cancellation by Student</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Students may cancel booked sessions subject to the following refund schedule:
              </p>
              <div className="space-y-3">
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="font-medium text-foreground">Full Refund (100%)</p>
                  <p className="text-muted-foreground text-sm">Cancellation made more than 24 hours before the scheduled session time.</p>
                </div>
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="font-medium text-foreground">Partial Refund (50%)</p>
                  <p className="text-muted-foreground text-sm">Cancellation made between 4 to 24 hours before the scheduled session time.</p>
                </div>
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="font-medium text-foreground">No Refund (0%)</p>
                  <p className="text-muted-foreground text-sm">Cancellation made less than 4 hours before the scheduled session time, or no-show without cancellation.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">3. Cancellation by Mentor</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                If a mentor cancels a session or fails to attend:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li><strong>Full Refund:</strong> You will receive a 100% refund of the session amount</li>
                <li><strong>Automatic Processing:</strong> Refund will be initiated automatically within 24 hours</li>
                <li><strong>Rebooking Option:</strong> You may also choose to reschedule with the same mentor at no additional cost</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">4. Technical Issues</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                If a session cannot be completed due to technical issues:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li><strong>Platform Issues:</strong> Full refund if the issue is on our end (server downtime, app crash)</li>
                <li><strong>User-Side Issues:</strong> No automatic refund for issues with your device, internet, or settings</li>
                <li><strong>Partial Session:</strong> Pro-rated refund may be issued if less than 50% of the session was completed due to technical problems</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-2">
                Please report technical issues within 24 hours of the scheduled session for consideration.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">5. Dissatisfaction with Session</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                If you are dissatisfied with a completed session:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Submit a complaint within 48 hours of the session</li>
                <li>Provide specific details about your concerns</li>
                <li>Our team will review and may offer a partial refund or credit at our discretion</li>
                <li>Refunds for dissatisfaction are evaluated case-by-case</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">6. How to Request a Refund</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                To request a refund:
              </p>
              <ol className="list-decimal list-inside text-muted-foreground space-y-1 ml-4">
                <li>Go to <strong>Bookings</strong> in the app</li>
                <li>Select the session you wish to cancel</li>
                <li>Tap <strong>Cancel Session</strong></li>
                <li>Confirm your cancellation</li>
              </ol>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Alternatively, you can email us at <strong>mentsol123@gmail.com</strong> with:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mt-2">
                <li>Your registered email or phone number</li>
                <li>Session booking ID</li>
                <li>Reason for refund request</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">7. Refund Processing</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Once a refund is approved:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li><strong>Processing Time:</strong> 5-7 business days for the refund to reflect in your account</li>
                <li><strong>Payment Method:</strong> Refund will be credited to the original payment method used</li>
                <li><strong>Bank Processing:</strong> Additional time may be required by your bank</li>
                <li><strong>Confirmation:</strong> You will receive an email/notification once the refund is processed</li>
              </ul>
              <h3 className="text-lg font-medium text-foreground mt-4 mb-2">7.1 Refund Timeline by Payment Method (via Razorpay)</h3>
              <div className="space-y-2 ml-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium text-sm">UPI Payments</p>
                  <p className="text-muted-foreground text-sm">Instant to 24 hours</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium text-sm">Debit Cards</p>
                  <p className="text-muted-foreground text-sm">5-7 business days</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium text-sm">Credit Cards</p>
                  <p className="text-muted-foreground text-sm">5-7 business days (may reflect in next billing cycle)</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium text-sm">Net Banking</p>
                  <p className="text-muted-foreground text-sm">5-7 business days</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium text-sm">Wallets</p>
                  <p className="text-muted-foreground text-sm">Instant to 24 hours</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">8. Rescheduling Sessions</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Instead of cancelling, you may reschedule a session:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li><strong>Free Reschedule:</strong> If done more than 24 hours before the session</li>
                <li><strong>Reschedule Fee:</strong> A small fee may apply for rescheduling within 24 hours</li>
                <li><strong>Limit:</strong> Each booking can be rescheduled a maximum of 2 times</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">9. Non-Refundable Items</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                The following are not eligible for refunds:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Completed sessions (unless there's a valid complaint)</li>
                <li>No-show by student without prior cancellation</li>
                <li>Cancellations made less than 4 hours before session</li>
                <li>Platform fees (if applicable)</li>
                <li>Promotional credits or gift amounts</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">10. Dispute Resolution</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you disagree with a refund decision, you may appeal by emailing mentsol123@gmail.com with the subject "Refund Appeal - [Booking ID]". We will review your case within 5 business days and provide a final decision.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">11. Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Refund Policy from time to time. Changes will be notified via email or in-app notification. The updated policy will apply to bookings made after the effective date of the changes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">12. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                For refund-related queries, contact us at:
              </p>
              <div className="text-muted-foreground space-y-1 mt-2 p-4 bg-muted/50 rounded-lg">
                <p><strong>MentSol Support</strong></p>
                <p>Email: mentsol123@gmail.com</p>
                <p>Phone: +91 9699938263 / +91 8209114342</p>
                <p>Support Hours: Monday to Saturday, 9 AM to 6 PM IST</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">13. Payment Processor (Razorpay)</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                All refunds are processed through Razorpay, our payment gateway partner.
              </p>
              <h3 className="text-lg font-medium text-foreground mb-2">13.1 Razorpay Refund Process</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
                <li>Refunds are initiated automatically through Razorpay's system</li>
                <li>You will receive a refund notification from both MentSol and Razorpay</li>
                <li>Razorpay refund reference number will be provided for tracking</li>
              </ul>
              <h3 className="text-lg font-medium text-foreground mb-2">13.2 Chargeback Policy</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
                <li>If you initiate a chargeback without contacting us first, your account may be suspended</li>
                <li>We encourage users to contact our support team before filing a chargeback</li>
                <li>Fraudulent chargebacks may result in permanent account termination</li>
                <li>We cooperate fully with Razorpay's dispute resolution process</li>
              </ul>
              <h3 className="text-lg font-medium text-foreground mb-2">13.3 Partial Refunds</h3>
              <p className="text-muted-foreground leading-relaxed">
                In cases where partial refunds are applicable (e.g., 50% refund for late cancellation), the partial amount will be calculated and refunded through the same payment method. Transaction fees charged by payment gateways are non-refundable.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RefundPolicy;
