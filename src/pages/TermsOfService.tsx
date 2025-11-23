import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const TermsOfService = () => {
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
            <CardTitle className="text-3xl font-bold">Terms of Service</CardTitle>
            <p className="text-muted-foreground mt-2">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By accessing and using the Poipu Shores Owner Portal, you accept and agree to be bound 
                by these Terms of Service. This platform is built and maintained by Cook Solutions Group 
                for the exclusive use of Poipu Shores HOA owners and authorized personnel.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Eligibility</h2>
              <p className="text-muted-foreground">
                Access to this platform is restricted to current owners of units at Poipu Shores and 
                authorized board members or administrators. You must be at least 18 years old to use 
                this service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Account Responsibilities</h2>
              <p className="text-muted-foreground mb-2">You agree to:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>Maintain the confidentiality of your account credentials</li>
                <li>Notify us immediately of any unauthorized account access</li>
                <li>Provide accurate and current information</li>
                <li>Not share your account with others</li>
                <li>Accept responsibility for all activities under your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Acceptable Use</h2>
              <p className="text-muted-foreground mb-2">You agree NOT to:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>Use the platform for any unlawful purpose</li>
                <li>Harass, threaten, or intimidate other users</li>
                <li>Upload malicious code or viruses</li>
                <li>Attempt to gain unauthorized access to any part of the system</li>
                <li>Share confidential HOA documents with non-owners</li>
                <li>Use automated tools to scrape or download content</li>
                <li>Impersonate another owner or board member</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Content and Communications</h2>
              <p className="text-muted-foreground">
                You retain ownership of content you post, but grant the HOA and Cook Solutions Group 
                a license to use, store, and display such content as necessary to operate the platform. 
                All communications should be professional and respectful.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Privacy and Data</h2>
              <p className="text-muted-foreground">
                Your use of this platform is also governed by our Privacy Policy. By using the service, 
                you consent to the collection and use of information as described in the Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Platform Availability</h2>
              <p className="text-muted-foreground">
                We strive to provide reliable service but do not guarantee uninterrupted access. 
                We reserve the right to modify, suspend, or discontinue any aspect of the platform 
                with or without notice.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Intellectual Property</h2>
              <p className="text-muted-foreground">
                All platform software, design, and functionality are owned by Cook Solutions Group 
                and protected by copyright and intellectual property laws. You may not copy, modify, 
                or reverse engineer any part of the platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                Cook Solutions Group and Poipu Shores HOA shall not be liable for any indirect, 
                incidental, special, or consequential damages arising from your use of the platform. 
                Our total liability shall not exceed the amount paid for access to the service, if any.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Account Termination</h2>
              <p className="text-muted-foreground">
                We reserve the right to suspend or terminate your account if you violate these terms 
                or engage in conduct harmful to other users or the platform. Upon sale of your unit, 
                your access will be transferred or terminated.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Governing Law</h2>
              <p className="text-muted-foreground">
                These terms are governed by the laws of the State of Hawaii. Any disputes shall be 
                resolved in the appropriate courts of Hawaii.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">12. Changes to Terms</h2>
              <p className="text-muted-foreground">
                We may update these terms from time to time. Continued use of the platform after 
                changes are posted constitutes acceptance of the modified terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">13. Contact Information</h2>
              <p className="text-muted-foreground">
                For questions about these Terms of Service, please contact:
              </p>
              <p className="text-muted-foreground font-semibold mt-2">
                Poipu Shores<br />
                Email: support@poipu-shores.com
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default TermsOfService;
