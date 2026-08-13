import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiChevronRight } from 'react-icons/fi';

const sections = [
  { id: 'acceptance', label: 'Acceptance of Terms' },
  { id: 'description', label: 'Description of Service' },
  { id: 'user-accounts', label: 'User Accounts' },
  { id: 'subscriptions', label: 'Subscription & Payments' },
  { id: 'acceptable-use', label: 'Acceptable Use' },
  { id: 'content-disclaimer', label: 'Content Disclaimer' },
  { id: 'dmca', label: 'DMCA / Content Removal' },
  { id: 'liability', label: 'Limitation of Liability' },
  { id: 'governing-law', label: 'Governing Law' },
  { id: 'changes', label: 'Changes to Terms' },
  { id: 'contact', label: 'Contact Us' },
];

export default function TermsOfService() {
  const navigate = useNavigate();
  const sectionRefs = useRef({});

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const scrollToSection = (id) => {
    const el = sectionRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-dark px-4 sm:px-8 py-10">
      <div className="max-w-4xl mx-auto">

        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 glass px-4 py-2 rounded-full text-white hover:text-primary border border-white/20 hover:border-primary transition-all text-sm mb-8"
        >
          <FiArrowLeft /> Back
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1
            className="text-5xl font-black text-white"
            style={{ fontFamily: 'Bebas Neue, sans-serif' }}
          >
            <span className="gradient-text">Terms of Service</span>
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            Last Updated: July 2025
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Please read these terms carefully before using Movie Zone.
          </p>
        </motion.div>

        {/* Table of Contents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl border border-white/10 p-6 mb-10"
        >
          <h2 className="text-white font-bold text-lg mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            Table of Contents
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className="flex items-center gap-2 text-gray-400 hover:text-primary text-sm transition-colors text-left"
              >
                <FiChevronRight className="text-primary text-xs" />
                {section.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ─── SECTION 1: Acceptance of Terms ─── */}
        <motion.div
          ref={(el) => (sectionRefs.current['acceptance'] = el)}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="glass rounded-2xl border border-white/10 p-6 mb-6"
        >
          <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            Acceptance of Terms
          </h2>
          <p className="text-gray-300 text-sm leading-relaxed mb-3">
            By using <span className="text-primary font-semibold">Movie Zone</span> ("we," "our," or "us"), you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
          </p>
          <p className="text-gray-400 text-sm">
            These terms apply to all users, whether registered or unregistered.
          </p>
        </motion.div>

        {/* ─── SECTION 2: Description of Service ─── */}
        <motion.div
          ref={(el) => (sectionRefs.current['description'] = el)}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="glass rounded-2xl border border-white/10 p-6 mb-6"
        >
          <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            Description of Service
          </h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            Movie Zone is a movie and series streaming platform that provides access to a curated library of content. We do not host any video files on our servers; all video content is embedded from third-party sources.
          </p>
          <p className="text-gray-400 text-sm mt-2">
            We strive to maintain a reliable service, but we cannot guarantee uninterrupted access, availability of specific content, or the quality of embedded streams.
          </p>
        </motion.div>

        {/* ─── SECTION 3: User Accounts ─── */}
        <motion.div
          ref={(el) => (sectionRefs.current['user-accounts'] = el)}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="glass rounded-2xl border border-white/10 p-6 mb-6"
        >
          <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            User Accounts
          </h2>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>You are responsible for maintaining the security of your account credentials.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>You may not share your account with others. Each account is for a single individual.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>You must be at least 13 years old to create an account.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>You are responsible for all activity that occurs under your account.</span>
            </li>
          </ul>
        </motion.div>

        {/* ─── SECTION 4: Subscription & Payments ─── */}
        <motion.div
          ref={(el) => (sectionRefs.current['subscriptions'] = el)}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="glass rounded-2xl border border-white/10 p-6 mb-6"
        >
          <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            Subscription & Payments
          </h2>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span><span className="text-white font-medium">Free Trial:</span> New users receive a 7-day free trial with full access to the platform.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span><span className="text-white font-medium">Paid Plans:</span> After the trial, you may subscribe to a paid plan (Daily, Weekly, Monthly, or Student).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span><span className="text-white font-medium">Payment Processing:</span> All payments are processed securely by Flutterwave. We accept MTN Mobile Money, Airtel Money, Visa, and Mastercard.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span><span className="text-white font-medium">No Refund Policy:</span> Due to the digital nature of our service, we do not offer refunds for subscription payments once content has been accessed. Please ensure you understand the plan before subscribing.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span><span className="text-white font-medium">Cancellation:</span> You may cancel your subscription at any time. Cancellation will take effect at the end of the current billing period.</span>
            </li>
          </ul>
        </motion.div>

        {/* ─── SECTION 5: Acceptable Use ─── */}
        <motion.div
          ref={(el) => (sectionRefs.current['acceptable-use'] = el)}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="glass rounded-2xl border border-white/10 p-6 mb-6"
        >
          <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            Acceptable Use
          </h2>
          <p className="text-gray-300 text-sm leading-relaxed mb-3">
            You agree not to use Movie Zone for:
          </p>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Sharing your account credentials with others.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Scraping or extracting content from the platform.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Any illegal or unauthorized purpose.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Posting inappropriate content or harassing other users.</span>
            </li>
          </ul>
        </motion.div>

        {/* ─── SECTION 6: Content Disclaimer ─── */}
        <motion.div
          ref={(el) => (sectionRefs.current['content-disclaimer'] = el)}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="glass rounded-2xl border border-white/10 p-6 mb-6"
        >
          <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            Content Disclaimer
          </h2>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-4">
            <p className="text-yellow-400 text-sm font-bold">⚠️ Important Notice</p>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed">
            <span className="text-white font-bold">Movie Zone does not host any video content.</span> All video content available on our platform is embedded from third-party sources. We do not control, host, or store any copyrighted material.
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Movie Zone is not responsible for the availability, quality, legality, or accuracy of third-party content. If you are a content owner and believe your rights are being infringed, please refer to our <a href="#dmca" className="text-primary hover:underline">DMCA / Content Removal</a> section below.
          </p>
        </motion.div>

        {/* ─── SECTION 7: DMCA / Content Removal ─── */}
        <motion.div
          ref={(el) => (sectionRefs.current['dmca'] = el)}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="glass rounded-2xl border border-white/10 p-6 mb-6"
        >
          <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            DMCA / Content Removal
          </h2>
          <p className="text-gray-300 text-sm leading-relaxed mb-3">
            If you are a content owner or authorized representative and believe that content available on Movie Zone infringes your copyright, please contact us with the following information:
          </p>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Identification of the copyrighted work claimed to be infringed.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>The URL of the page containing the allegedly infringing content.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Your contact information (name, address, phone number, email).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>A statement that you have a good faith belief that use of the material is unauthorized.</span>
            </li>
          </ul>
          <p className="text-gray-400 text-sm mt-3">
            We respond to all DMCA takedown requests within <span className="text-white font-medium">48 hours</span>. Please email us at: <span className="text-primary">support@moviezone.ug</span>
          </p>
        </motion.div>

        {/* ─── SECTION 8: Limitation of Liability ─── */}
        <motion.div
          ref={(el) => (sectionRefs.current['liability'] = el)}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="glass rounded-2xl border border-white/10 p-6 mb-6"
        >
          <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            Limitation of Liability
          </h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            Movie Zone is provided "as is" and "as available." We do not warrant that the service will be uninterrupted, error-free, or free of viruses. To the maximum extent permitted by law, Movie Zone shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service.
          </p>
        </motion.div>

        {/* ─── SECTION 9: Governing Law ─── */}
        <motion.div
          ref={(el) => (sectionRefs.current['governing-law'] = el)}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="glass rounded-2xl border border-white/10 p-6 mb-6"
        >
          <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            Governing Law
          </h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            These Terms of Service shall be governed by and construed in accordance with the laws of the <span className="text-white font-medium">Republic of Uganda</span>. Any disputes arising from these terms shall be resolved in the courts of Uganda.
          </p>
        </motion.div>

        {/* ─── SECTION 10: Changes to Terms ─── */}
        <motion.div
          ref={(el) => (sectionRefs.current['changes'] = el)}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="glass rounded-2xl border border-white/10 p-6 mb-6"
        >
          <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            Changes to Terms
          </h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            We may update these Terms of Service from time to time. We will notify users of any significant changes via email or by posting a notice on our website. Your continued use of Movie Zone after any changes constitutes your acceptance of the new terms.
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Last Updated: July 2025
          </p>
        </motion.div>

        {/* ─── SECTION 11: Contact Us ─── */}
        <motion.div
          ref={(el) => (sectionRefs.current['contact'] = el)}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="glass rounded-2xl border border-white/10 p-6 mb-6"
        >
          <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            Contact Us
          </h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            If you have any questions, concerns, or content removal requests, please contact us:
          </p>
          <div className="mt-3 p-4 bg-white/5 rounded-xl border border-white/5">
            <p className="text-white font-medium">Movie Zone</p>
            <p className="text-gray-400 text-sm">
              Email: <span className="text-primary">kizitofahad665@gmail.com</span>
            </p>
            <p className="text-gray-500 text-xs mt-1">(kizitofahad665@gmail.com)</p>
          </div>
        </motion.div>

        <p className="text-center text-gray-600 text-xs mt-8">
          Last updated: July 2025
        </p>
      </div>
    </div>
  );
}