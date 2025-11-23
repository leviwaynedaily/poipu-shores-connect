import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-accent/10 to-background">
      <div className="container mx-auto px-4 py-8 flex-1">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Privacy Policy</CardTitle>
            <p className="text-muted-foreground mt-2">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
              <p className="text-muted-foreground">
                Welcome to Poipu Shores Owner Portal. This privacy policy explains how we collect, use, 
                and protect your personal information when you use our platform. Poipu Shores is built 
                and maintained by Cook Solutions Group.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
              <p className="text-muted-foreground mb-2">We collect the following types of information:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>Account information (name, email address, unit number)</li>
                <li>Profile information (phone number, contact preferences)</li>
                <li>Communication data (messages, announcements, document interactions)</li>
                <li>Usage data (login times, feature usage, device information)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
              <p className="text-muted-foreground mb-2">Your information is used to:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>Provide and maintain the owner portal services</li>
                <li>Communicate important HOA announcements and updates</li>
                <li>Enable communication between owners and board members</li>
                <li>Manage document sharing and access</li>
                <li>Improve platform security and functionality</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Data Sharing and Disclosure</h2>
              <p className="text-muted-foreground">
                We do not sell your personal information. Your data is only shared with other owners 
                and board members within the Poipu Shores community as necessary for HOA operations. 
                We may disclose information if required by law or to protect the rights and safety 
                of our community.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Data Security</h2>
              <p className="text-muted-foreground">
                We implement industry-standard security measures to protect your personal information, 
                including encryption, secure authentication, and regular security audits. However, no 
                method of transmission over the internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Your Rights</h2>
              <p className="text-muted-foreground mb-2">You have the right to:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>Access your personal information</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data (subject to HOA record-keeping requirements)</li>
                <li>Opt-out of non-essential communications</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Cookies and Tracking</h2>
              <p className="text-muted-foreground">
                We use essential cookies to maintain your session and remember your preferences. 
                We do not use third-party advertising or tracking cookies.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Children's Privacy</h2>
              <p className="text-muted-foreground">
                This platform is not intended for use by children under 18. We do not knowingly 
                collect information from children.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Changes to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this privacy policy from time to time. We will notify you of any 
                significant changes through the platform or via email.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Contact Information</h2>
              <p className="text-muted-foreground">
                For questions about this privacy policy or your personal information, please contact:
              </p>
              <p className="text-muted-foreground font-semibold mt-2">
                Poipu Shores<br />
                Email: privacy@poipu-shores.com
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
