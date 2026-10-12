import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const TermsConditions = () => {
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

        <h1 className="text-3xl font-bold text-foreground mb-2">Terms & Conditions</h1>
        <p className="text-muted-foreground mb-8">Effective Date: January 1, 2025 | Last Updated: January 1, 2025</p>

        <Card>
          <CardContent className="pt-6 space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By downloading, installing, or using the MentSol application ("App") or website ("Service"), you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, do not use our Service. These Terms constitute a legally binding agreement between you and MentSol.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">2. Eligibility</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                To use MentSol, you must:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Be at least 13 years of age</li>
                <li>Have the legal capacity to enter into a binding agreement</li>
                <li>Not be barred from using the Service under applicable laws</li>
                <li>If under 18, have parental or guardian consent</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">3. User Accounts</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                When creating an account, you agree to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain the security of your password and account</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Not share your account credentials with others</li>
                <li>Not create multiple accounts for fraudulent purposes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">4. Service Description</h2>
              <p className="text-muted-foreground leading-relaxed">
                MentSol is a platform that connects students with mentors for educational guidance, career counseling, and skill development through video calls and messaging. We facilitate these connections but are not a party to the mentor-student relationship. The quality of advice and guidance provided by mentors is their responsibility.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">5. Mentorship Sessions</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                By booking a session, you agree that:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>All sessions must be booked and paid for through the platform</li>
                <li>Payment is required before the session is confirmed</li>
                <li>Sessions are conducted via video call within the app</li>
                <li>You will maintain professional conduct during sessions</li>
                <li>Recording sessions without consent is prohibited</li>
                <li>Session content is confidential between mentor and student</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">6. Payments and Pricing</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                All payments are processed through Razorpay, a PCI DSS Level 1 compliant payment gateway. By making a payment, you agree to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
                <li>Mentor rates are set by individual mentors and displayed before booking</li>
                <li>Prices are shown in Indian Rupees (INR)</li>
                <li>A platform fee may be added to the mentor's rate</li>
                <li>Payment must be completed to confirm a session booking</li>
                <li>All transactions are final unless eligible for refund as per our Refund Policy</li>
                <li>You are responsible for any taxes applicable to your transactions</li>
              </ul>
              <h3 className="text-lg font-medium text-foreground mb-2">6.1 Accepted Payment Methods</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
                <li>Credit/Debit Cards (Visa, MasterCard, RuPay, American Express)</li>
                <li>UPI (Google Pay, PhonePe, Paytm, BHIM, etc.)</li>
                <li>Net Banking (all major Indian banks)</li>
                <li>Digital Wallets (Paytm Wallet, Amazon Pay, etc.)</li>
              </ul>
              <h3 className="text-lg font-medium text-foreground mb-2">6.2 Payment Security</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
                <li>All payments are secured with 256-bit SSL encryption</li>
                <li>3D Secure authentication for card payments</li>
                <li>We do not store your card details - handled by Razorpay</li>
                <li>Real-time fraud detection and prevention</li>
              </ul>
              <h3 className="text-lg font-medium text-foreground mb-2">6.3 Failed Transactions</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
                <li>If a transaction fails but money is debited, it will be automatically refunded within 5-7 business days</li>
                <li>You can retry the payment immediately or choose a different payment method</li>
                <li>Contact support if refund is not received within 7 business days</li>
              </ul>
              <h3 className="text-lg font-medium text-foreground mb-2">6.4 Transaction Receipts</h3>
              <p className="text-muted-foreground leading-relaxed">
                A digital receipt will be sent to your registered email for every successful transaction. You can also view all transaction history in the Bookings section of the app.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">7. Refund and Cancellation Policy</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Our refund policy is as follows:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li><strong>Full Refund:</strong> If cancelled more than 24 hours before the scheduled session</li>
                <li><strong>50% Refund:</strong> If cancelled between 4-24 hours before the session</li>
                <li><strong>No Refund:</strong> If cancelled less than 4 hours before the session</li>
                <li><strong>Full Refund:</strong> If mentor cancels or fails to attend the session</li>
                <li><strong>Technical Issues:</strong> Full refund if session cannot occur due to platform technical failure</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-2">
                Refunds are processed within 5-7 business days to the original payment method. For detailed refund information, see our <a href="/refund-policy" className="text-primary underline">Refund Policy</a>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">8. User Conduct</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                You agree NOT to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Share inappropriate, offensive, harmful, or illegal content</li>
                <li>Harass, threaten, abuse, or discriminate against other users</li>
                <li>Attempt to bypass payment systems or commit fraud</li>
                <li>Misrepresent your identity, qualifications, or credentials</li>
                <li>Violate intellectual property rights</li>
                <li>Use the Service for any unlawful purpose</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Attempt to gain unauthorized access to any part of the Service</li>
                <li>Share contact information to circumvent the platform</li>
                <li>Engage in any activity that could harm minors</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">9. Mentor Obligations</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Mentors on MentSol agree to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Provide accurate information about qualifications and experience</li>
                <li>Submit valid verification documents as required</li>
                <li>Honor scheduled sessions or provide reasonable cancellation notice</li>
                <li>Maintain professional standards during all interactions</li>
                <li>Not provide advice in areas outside their expertise</li>
                <li>Respect student privacy and confidentiality</li>
                <li>Comply with platform guidelines and policies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">10. Device Permissions</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                To use all features of MentSol, you grant permission for the app to access:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li><strong>Camera:</strong> For video calls and profile photos</li>
                <li><strong>Microphone:</strong> For audio during calls</li>
                <li><strong>Storage:</strong> To upload documents and media</li>
                <li><strong>Notifications:</strong> To receive session reminders and updates</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-2">
                You can revoke these permissions at any time, but some features may not work without them.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">11. Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                All content, trademarks, logos, and materials on MentSol are owned by or licensed to us. You may not copy, reproduce, distribute, or create derivative works without our express written permission. Content you upload remains yours, but you grant us a license to use it for providing the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">12. Disclaimer of Warranties</h2>
              <p className="text-muted-foreground leading-relaxed">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE. WE ARE NOT RESPONSIBLE FOR THE QUALITY, ACCURACY, OR OUTCOMES OF MENTORSHIP SESSIONS. USE THE SERVICE AT YOUR OWN RISK.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">13. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, MENTSOL SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT PAID BY YOU IN THE PAST 12 MONTHS.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">14. Indemnification</h2>
              <p className="text-muted-foreground leading-relaxed">
                You agree to indemnify, defend, and hold harmless MentSol and its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from your use of the Service, violation of these Terms, or infringement of any third-party rights.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">15. Account Termination</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                We reserve the right to suspend or terminate accounts that:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Violate these Terms or our policies</li>
                <li>Engage in fraudulent or illegal activity</li>
                <li>Misuse the platform or harass other users</li>
                <li>Provide false information</li>
                <li>Remain inactive for extended periods</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-2">
                You may delete your account at any time through Profile Settings or by contacting support.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">16. Dispute Resolution</h2>
              <p className="text-muted-foreground leading-relaxed">
                Any disputes arising from these Terms or the Service shall first be attempted to be resolved through informal negotiation. If unresolved within 30 days, disputes shall be settled through binding arbitration in accordance with Indian law. You agree to waive any right to participate in class action lawsuits.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">17. Governing Law</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of India. Any legal action shall be brought exclusively in the courts located in India, and you consent to the jurisdiction of such courts.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">18. Severability</h2>
              <p className="text-muted-foreground leading-relaxed">
                If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">19. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may modify these Terms at any time. Material changes will be notified via email or in-app notification at least 7 days before taking effect. Continued use of the Service after changes constitutes acceptance of the updated Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">20. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                For questions about these Terms, contact us at:
              </p>
              <div className="text-muted-foreground space-y-1 mt-2 p-4 bg-muted/50 rounded-lg">
                <p><strong>MentSol</strong></p>
                <p>Email: mentsol123@gmail.com</p>
                <p>Phone: +91 9699938263 / +91 8209114342</p>
                <p>Address: India</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">21. Entire Agreement</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms, together with our Privacy Policy and Refund Policy, constitute the entire agreement between you and MentSol regarding the Service and supersede all prior agreements and understandings.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsConditions;
