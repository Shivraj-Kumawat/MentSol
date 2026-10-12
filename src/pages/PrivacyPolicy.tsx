import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const PrivacyPolicy = () => {
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

        <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Effective Date: January 1, 2025 | Last Updated: January 1, 2025</p>

        <Card>
          <CardContent className="pt-6 space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                MentSol ("we," "us," or "our") operates the MentSol mobile application and website (collectively, the "Service"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mentorship platform. By using MentSol, you agree to the collection and use of information in accordance with this policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">2. Data Controller</h2>
              <p className="text-muted-foreground leading-relaxed">
                MentSol is the data controller responsible for your personal data. For any questions about this Privacy Policy or our data practices, contact us at mentsol123@gmail.com.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">3. Information We Collect</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                We collect the following categories of information:
              </p>
              <h3 className="text-lg font-medium text-foreground mb-2">3.1 Information You Provide</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
                <li>Account information (name, email address, phone number, password)</li>
                <li>Profile information (educational background, qualifications, bio, profile photo)</li>
                <li>Mentor verification documents (ID proof, certificates)</li>
                <li>Intro videos uploaded by mentors</li>
                <li>Payment information (processed securely by Razorpay - we do not store card details)</li>
                <li>Communication data (messages, session feedback, reviews)</li>
              </ul>
              <h3 className="text-lg font-medium text-foreground mb-2">3.2 Automatically Collected Information</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
                <li>Device information (device type, operating system, unique device identifiers)</li>
                <li>Log data (IP address, browser type, access times, pages viewed)</li>
                <li>Usage data (features used, session duration, interaction patterns)</li>
                <li>Location data (approximate location based on IP address)</li>
              </ul>
              <h3 className="text-lg font-medium text-foreground mb-2">3.3 Device Permissions</h3>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Our app may request access to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li><strong>Camera:</strong> For video calls with mentors and profile photo capture</li>
                <li><strong>Microphone:</strong> For voice/video calls during mentorship sessions</li>
                <li><strong>Storage:</strong> To upload documents and profile images</li>
                <li><strong>Notifications:</strong> To send session reminders and updates</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-2">
                You can revoke these permissions at any time through your device settings.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">4. How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                We use collected information for:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Providing, maintaining, and improving our services</li>
                <li>Creating and managing your account</li>
                <li>Processing payments and transactions through Razorpay</li>
                <li>Matching students with appropriate mentors</li>
                <li>Facilitating video calls and messaging between users</li>
                <li>Sending notifications about sessions, reminders, and platform updates</li>
                <li>Verifying mentor credentials and qualifications</li>
                <li>Analyzing usage patterns to improve user experience</li>
                <li>Detecting and preventing fraud, abuse, or security threats</li>
                <li>Responding to customer support requests</li>
                <li>Complying with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">5. Legal Basis for Processing (GDPR)</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                We process your personal data based on:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li><strong>Contract:</strong> Processing necessary to provide our services</li>
                <li><strong>Consent:</strong> Where you have given explicit consent (e.g., marketing communications)</li>
                <li><strong>Legitimate Interest:</strong> For platform security, fraud prevention, and service improvement</li>
                <li><strong>Legal Obligation:</strong> To comply with applicable laws and regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">6. Information Sharing and Disclosure</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                <strong>We do not sell your personal information.</strong> We may share information with:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li><strong>Mentors/Students:</strong> Limited profile information necessary for sessions</li>
                <li><strong>Razorpay:</strong> Payment processor for secure transaction handling</li>
                <li><strong>Supabase:</strong> Cloud infrastructure provider for data storage</li>
                <li><strong>Analytics providers:</strong> To understand usage patterns (anonymized data)</li>
                <li><strong>Legal authorities:</strong> When required by law or to protect our rights</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">7. Data Security</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                We implement industry-standard security measures including:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Encrypted data transmission (SSL/TLS)</li>
                <li>Secure password hashing</li>
                <li>Row Level Security (RLS) policies on database</li>
                <li>Regular security audits</li>
                <li>Access controls and authentication</li>
                <li>Secure cloud infrastructure with Supabase</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-2">
                While we strive to protect your data, no method of transmission over the Internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">8. Data Retention</h2>
              <p className="text-muted-foreground leading-relaxed">
                We retain your personal data for as long as your account is active or as needed to provide services. After account deletion, we may retain certain data for up to 90 days for legal compliance and fraud prevention. Transaction records may be retained longer as required by tax and financial regulations.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">9. Your Rights</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                You have the following rights regarding your personal data:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update inaccurate or incomplete data</li>
                <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                <li><strong>Portability:</strong> Receive your data in a portable format</li>
                <li><strong>Objection:</strong> Object to certain processing activities</li>
                <li><strong>Restriction:</strong> Request limited processing of your data</li>
                <li><strong>Withdraw Consent:</strong> Withdraw previously given consent</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-2">
                To exercise these rights, contact us at mentsol123@gmail.com. We will respond within 30 days.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">10. Account and Data Deletion</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                You can request complete deletion of your account and associated data by:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Going to Profile → Settings → Delete Account in the app</li>
                <li>Emailing us at mentsol123@gmail.com with subject "Account Deletion Request"</li>
                <li>Calling us at +91 9699938263</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-2">
                Upon deletion request, we will delete your personal data within 30 days, except where retention is required by law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">11. Cookies and Tracking Technologies</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use cookies and similar technologies to maintain session security, remember preferences, and analyze usage patterns. You can control cookies through your browser settings. Disabling cookies may affect some features of our Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">12. Children's Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our Service is intended for users aged 13 and above. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately at mentsol123@gmail.com. We will take steps to delete such information from our servers.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">13. International Data Transfers</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy and applicable data protection laws.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">14. Third-Party Links</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our Service may contain links to third-party websites or services. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies before providing any personal information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">15. Changes to This Privacy Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy periodically. We will notify you of significant changes via email or in-app notification at least 7 days before they take effect. Your continued use of the Service after changes become effective constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">16. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                For privacy-related questions, data requests, or concerns, contact us at:
              </p>
              <div className="text-muted-foreground space-y-1 mt-2 p-4 bg-muted/50 rounded-lg">
                <p><strong>MentSol</strong></p>
                <p>Email: mentsol123@gmail.com</p>
                <p>Phone: +91 9699938263 / +91 8209114342</p>
                <p>Address: India</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">17. Grievance Officer</h2>
              <p className="text-muted-foreground leading-relaxed">
                In accordance with the Information Technology Act, 2000, the name and contact details of the Grievance Officer are:
              </p>
              <div className="text-muted-foreground space-y-1 mt-2 p-4 bg-muted/50 rounded-lg">
                <p><strong>Grievance Officer:</strong> MentSol Support Team</p>
                <p>Email: mentsol123@gmail.com</p>
                <p>Response Time: Within 24 hours of receiving the grievance</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">18. Payment Data & Razorpay</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                All payment transactions on MentSol are processed through Razorpay, a PCI DSS compliant payment gateway.
              </p>
              <h3 className="text-lg font-medium text-foreground mb-2">18.1 Data Razorpay Collects</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
                <li>Card details (card number, expiry date, CVV) - processed directly by Razorpay</li>
                <li>UPI ID for UPI payments</li>
                <li>Net banking credentials (processed by your bank)</li>
                <li>Wallet information for digital wallet payments</li>
                <li>Transaction metadata (amount, timestamp, merchant details)</li>
              </ul>
              <h3 className="text-lg font-medium text-foreground mb-2">18.2 What We Do NOT Store</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
                <li><strong>We never store your full card number, CVV, or PIN</strong></li>
                <li>We do not have access to your banking credentials</li>
                <li>Only transaction IDs and payment status are stored for record-keeping</li>
              </ul>
              <h3 className="text-lg font-medium text-foreground mb-2">18.3 Razorpay's Security</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
                <li>PCI DSS Level 1 certified (highest security standard)</li>
                <li>256-bit SSL encryption for all transactions</li>
                <li>3D Secure authentication for card payments</li>
                <li>Real-time fraud detection</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-2">
                For more information about Razorpay's privacy practices, visit{' '}
                <a href="https://razorpay.com/privacy/" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  Razorpay's Privacy Policy
                </a>.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
