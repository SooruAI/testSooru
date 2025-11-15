import React from 'react'
import Footer from '../components/Footer'

function CancellationRefund() {
    return (
        <div className="legal-page">
            <Navbar />
            
            <div className="legal-hero">
                <h1>Cancellation and Refund Policy</h1>
            </div>

            <div className="breadcrumb">
                <a href="/">Home</a> &gt; Cancellation and Refund
            </div>

            <div className="legal-content">
                <p className="last-updated">Last Updated: November 10, 2025</p>

                <section className="legal-section">
                    <h2>1. Introduction</h2>
                    <p>
                        This Cancellation and Refund Policy outlines the terms and conditions regarding cancellations and 
                        refunds for subscriptions and services purchased through Sooru.AI. We are committed to ensuring 
                        customer satisfaction while maintaining fair and transparent policies.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>2. Subscription Plans</h2>
                    <p>
                        Sooru.AI offers various subscription tiers designed to meet the needs of different users, from 
                        individual designers to large architectural firms. Each subscription plan provides access to specific 
                        features and capabilities of our AI-powered design platform.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>3. Free Trial Period</h2>
                    <p>
                        We offer a free trial period for new users to experience our platform's core features. During the 
                        trial period:
                    </p>
                    <ul>
                        <li>You can cancel at any time without being charged</li>
                        <li>No refund is necessary as no payment has been processed</li>
                        <li>Your access to premium features will end immediately upon cancellation</li>
                        <li>You may retain access to basic features as specified in our free tier</li>
                    </ul>
                    <p>
                        If you do not cancel before the trial period ends, you will be automatically charged for your chosen 
                        subscription plan.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>4. Cancellation Policy</h2>
                    <h3>4.1 How to Cancel</h3>
                    <p>
                        You can cancel your subscription at any time through:
                    </p>
                    <ul>
                        <li>Your account settings on the Sooru.AI platform</li>
                        <li>Contacting our customer support at <a href="mailto:info@sooru.ai">info@sooru.ai</a></li>
                        <li>Calling us at +91 97438 10910</li>
                    </ul>
                    <h3>4.2 Effect of Cancellation</h3>
                    <p>
                        When you cancel your subscription:
                    </p>
                    <ul>
                        <li>Your subscription will remain active until the end of your current billing period</li>
                        <li>You will continue to have access to all features until the subscription expires</li>
                        <li>No further charges will be made after the current billing period ends</li>
                        <li>Your account data will be retained for 30 days after cancellation for potential reactivation</li>
                    </ul>
                    <h3>4.3 Immediate Cancellation</h3>
                    <p>
                        If you require immediate cancellation and termination of services, please contact our support team. 
                        Please note that immediate cancellations do not automatically qualify for refunds unless otherwise 
                        specified in this policy.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>5. Refund Policy</h2>
                    <h3>5.1 7-Day Money-Back Guarantee</h3>
                    <p>
                        We offer a 7-day money-back guarantee for first-time subscribers. If you are not satisfied with our 
                        service within the first 7 days of your initial subscription, you may request a full refund.
                    </p>
                    <p>
                        <strong>Conditions:</strong>
                    </p>
                    <ul>
                        <li>Available only for first-time paid subscribers</li>
                        <li>Request must be made within 7 days of the initial payment</li>
                        <li>Does not apply to subsequent renewal payments</li>
                        <li>Does not apply to annual plans after 30 days</li>
                    </ul>
                    
                    <h3>5.2 Monthly Subscriptions</h3>
                    <p>
                        For monthly subscriptions:
                    </p>
                    <ul>
                        <li>Refunds are available only within the 7-day money-back guarantee period for new subscribers</li>
                        <li>No refunds are provided for partial months of service</li>
                        <li>Cancellations made after the 7-day period will be effective at the end of the current billing cycle</li>
                    </ul>

                    <h3>5.3 Annual Subscriptions</h3>
                    <p>
                        For annual subscriptions:
                    </p>
                    <ul>
                        <li>Full refund available within 7 days of initial purchase for new subscribers</li>
                        <li>Pro-rated refunds may be available within 30 days at management's discretion</li>
                        <li>After 30 days, no refunds will be provided</li>
                        <li>Cancellation will be effective at the end of the annual term</li>
                    </ul>

                    <h3>5.4 Pay-Per-Project Services</h3>
                    <p>
                        For individual project-based services:
                    </p>
                    <ul>
                        <li>Refunds are available if the project has not been initiated or processed</li>
                        <li>Once a project has been processed and outputs generated, refunds are not available</li>
                        <li>Contact support within 24 hours of purchase if you need to cancel a project order</li>
                    </ul>
                </section>

                <section className="legal-section">
                    <h2>6. Non-Refundable Items</h2>
                    <p>
                        The following are not eligible for refunds:
                    </p>
                    <ul>
                        <li>Add-on features or premium services already utilized</li>
                        <li>Completed project deliverables and generated designs</li>
                        <li>Custom development or consulting services after commencement</li>
                        <li>Third-party services or software integrated through our platform</li>
                        <li>Subscription renewals after the initial 7-day guarantee period</li>
                    </ul>
                </section>

                <section className="legal-section">
                    <h2>7. Refund Process</h2>
                    <h3>7.1 How to Request a Refund</h3>
                    <p>
                        To request a refund:
                    </p>
                    <ol>
                        <li>Email us at <a href="mailto:info@sooru.ai">info@sooru.ai</a> with your account details and reason for refund</li>
                        <li>Include your order number, email address, and subscription details</li>
                        <li>Our team will review your request within 3-5 business days</li>
                        <li>You will receive an email confirmation once your refund is approved</li>
                    </ol>

                    <h3>7.2 Processing Time</h3>
                    <p>
                        Once approved:
                    </p>
                    <ul>
                        <li>Refunds are processed within 5-10 business days</li>
                        <li>Funds will be returned to the original payment method</li>
                        <li>Depending on your financial institution, it may take an additional 5-7 business days for the refund to appear in your account</li>
                    </ul>
                </section>

                <section className="legal-section">
                    <h2>8. Downgrading Plans</h2>
                    <p>
                        If you wish to downgrade from a higher-tier plan to a lower-tier plan:
                    </p>
                    <ul>
                        <li>The downgrade will be effective at the start of your next billing cycle</li>
                        <li>You will continue to have access to your current plan features until the end of the current period</li>
                        <li>No refunds will be provided for the difference in plan pricing</li>
                        <li>You can upgrade again at any time</li>
                    </ul>
                </section>

                <section className="legal-section">
                    <h2>9. Service Disruptions</h2>
                    <p>
                        In the event of significant service disruptions or outages:
                    </p>
                    <ul>
                        <li>We will work to resolve issues as quickly as possible</li>
                        <li>Extended outages may qualify for service credits or pro-rated refunds</li>
                        <li>Service Level Agreement (SLA) terms apply to enterprise customers</li>
                        <li>Contact support for compensation related to service disruptions</li>
                    </ul>
                </section>

                <section className="legal-section">
                    <h2>10. Exceptions and Special Circumstances</h2>
                    <p>
                        We understand that special circumstances may arise. We will review refund requests outside our 
                        standard policy on a case-by-case basis. Contact our support team to discuss your specific situation.
                    </p>
                    <p>
                        Examples of special circumstances may include:
                    </p>
                    <ul>
                        <li>Technical issues preventing use of the platform</li>
                        <li>Billing errors or duplicate charges</li>
                        <li>Unauthorized account access resulting in charges</li>
                        <li>Medical emergencies or unforeseen personal circumstances</li>
                    </ul>
                </section>

                <section className="legal-section">
                    <h2>11. Changes to This Policy</h2>
                    <p>
                        We reserve the right to modify this Cancellation and Refund Policy at any time. Changes will be 
                        effective immediately upon posting to our website. Your continued use of our services after any 
                        changes indicates acceptance of the updated policy.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>12. Contact Information</h2>
                    <p>
                        If you have any questions about our Cancellation and Refund Policy, please contact us:
                    </p>
                    <p>
                        <strong>Email:</strong> <a href="mailto:info@sooru.ai">info@sooru.ai</a><br />
                        <strong>Phone:</strong> +91 97438 10910<br />
                        <strong>Address:</strong> No. 816, 27th Main Road, Sector - 1, H S R Layout, Bengaluru 560 102<br />
                        <strong>Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM IST
                    </p>
                </section>
            </div>

            <Footer bgColor="white" />
        </div>
    )
}

export default CancellationRefund