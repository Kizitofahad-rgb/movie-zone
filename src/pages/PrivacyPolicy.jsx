import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiChevronRight } from 'react-icons/fi';

const sections = [
  { id: 'introduction', label: 'Introduction' },
  { id: 'information', label: 'Information We Collect' },
  { id: 'how-we-use', label: 'How We Use Your Information' },
  { id: 'storage-security', label: 'Data Storage & Security' },
  { id: 'third-party', label: 'Third Party Services' },
  { id: 'your-rights', label: 'Your Rights' },
  { id: 'cookies', label: 'Cookies & Local Storage' },
  { id: 'children', label: "Children's Privacy" },
  { id: 'changes', label: 'Changes To This Policy' },
  { id: 'contact', label: 'Contact Us' },
];

export default function PrivacyPolicy() {
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
            <span className="gradient-text">Privacy Policy</span>
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            Last Updated: July 2025
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Movie Zone — Your privacy matters to us.
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

        {/* ─── SECTION 1: Introduction ─── */}
        <motion.div
          ref={(el) => (sectionRefs.current['introduction'] = el)}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="glass rounded-2xl border border-white/10 p-6 mb-6"
        >
          <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            Introduction
          </h2>
          <p className="text-gray-300 text-sm leading-relaxed mb-3">
            Welcome to <span className="text-primary font-semibold">Movie Zone</span> ("we," "our," or "us"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our streaming services.
          </p>
          <p className="text-gray-300 text-sm leading-relaxed">
            Movie Zone is a movie and series streaming platform operated by an individual developer based in Uganda. We are committed to protecting your privacy and ensuring a safe, transparent experience.
          </p>
        </motion.div>

        {/* ─── SECTION 2: Information We Collect ─── */}
        <motion.div
          ref={(el) => (sectionRefs.current['information'] = el)}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="glass rounded-2xl border border-white/10 p-6 mb-6"
        >
          <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            Information We Collect
          </h2>
          <p className="text-gray-400 text-sm mb-3">We collect the following types of information:</p>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span><span className="text-white font-medium">Account Information:</span> Email address, display name, and password (encrypted).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span><span className="text-white font-medium">Usage Data:</span> Watch history, watchlist items, subscription status, and viewing preferences.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span><span className="text-white font-medium">Device Information:</span> Device type, browser, operating system, and IP address (for analytics and security).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span><span className="text-white font-medium">Cookies & Local Storage:</span> We use local storage to remember your preferences (e.g., theme, currency preference). We do not use tracking cookies or ad networks.</span>
            </li>
          </ul>
        </motion.div>

        {/* ─── SECTION 3: How We Use Your Information ─── */}
        <motion.div
          ref={(el) => (sectionRefs.current['how-we-use'] = el)}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="glass rounded-2xl border border-white/10 p-6 mb-6"
        >
          <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            How We Use Your Information
          </h2>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span><span className="text-white font-medium">Provide and Improve Our Service:</span> To deliver streaming content, maintain user accounts, and enhance your experience.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span><span className="text-white font-medium">Process Payments:</span> When you subscribe to a paid plan, we use Flutterwave to process your payment securely.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span><span className="text-white font-medium">Communication:</span> To send you important updates about your subscription, new features, or content recommendations.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span><span className="text-white font-medium">Security:</span> To protect your account and prevent fraud or unauthorized access.</span>
            </li>
          </ul>
        </motion.div>

        {/* ─── SECTION 4: Data Storage & Security ─── */}
        <motion.div
          ref={(el) => (sectionRefs.current['storage-security'] = el)}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="glass rounded-2xl border border-white/10 p-6 mb-6"
        >
          <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            Data Storage & Security
          </h2>
          <p className="text-gray-300 text-sm leading-relaxed mb-3">
            Your data is stored securely using <span className="text-primary font-semibold">Supabase</span> (our database provider) and hosted on <span className="text-primary font-semibold">Vercel</span>. We implement industry-standard security measures to protect your information, including:
          </p>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>All passwords are encrypted using Supabase's built-in authentication.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>All data transmitted between your device and our servers is encrypted via HTTPS.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>We regularly update our dependencies to patch security vulnerabilities.</span>
            </li>
          </ul>
        </motion.div>

        {/* ─── SECTION 5: Third Party Services ─── */}
        <motion.div
          ref={(el) => (sectionRefs.current['third-party'] = el)}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="glass rounded-2xl border border-white/10 p-6 mb-6"
        >
          <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            Third Party Services
          </h2>
          <p className="text-gray-300 text-sm leading-relaxed mb-3">
            We use the following third-party services to power Movie Zone:
          </p>
          <div className="space-y-3 text-sm">
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <p className="text-white font-semibold">Supabase</p>
              <p className="text-gray-400 text-xs">Authentication, database, and storage. <a href="https://supabase.com/privacy" target="_blank" rel="noreferrer" className="text-primary hover:underline">Privacy Policy</a></p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <p className="text-white font-semibold">Flutterwave</p>
              <p className="text-gray-400 text-xs">Payment processing (MTN Mobile Money, Airtel Money, Visa/Mastercard). <a href="https://flutterwave.com/ng/privacy-policy" target="_blank" rel="noreferrer" className="text-primary hover:underline">Privacy Policy</a></p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <p className="text-white font-semibold">TMDB API</p>
              <p className="text-gray-400 text-xs">Movie and series metadata (posters, descriptions, ratings). <a href="https://www.themoviedb.org/privacy-policy" target="_blank" rel="noreferrer" className="text-primary hover:underline">Privacy Policy</a></p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <p className="text-white font-semibold">Vercel</p>
              <p className="text-gray-400 text-xs">Application hosting and deployment. <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noreferrer" className="text-primary hover:underline">Privacy Policy</a></p>
            </div>
          </div>
        </motion.div>

        {/* ─── SECTION 6: Your Rights ─── */}
        <motion.div
          ref={(el) => (sectionRefs.current['your-rights'] = el)}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="glass rounded-2xl border border-white/10 p-6 mb-6"
        >
          <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            Your Rights
          </h2>
          <p className="text-gray-300 text-sm leading-relaxed mb-3">
            You have the right to:
          </p>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span><span className="text-white font-medium">Access:</span> Request a copy of the personal data we hold about you.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span><span className="text-white font-medium">Correct:</span> Update or correct your personal information (e.g., display name, email).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span><span className="text-white font-medium">Delete:</span> Request deletion of your account and associated data.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span><span className="text-white font-medium">Opt-Out:</span> Unsubscribe from promotional communications.</span>
            </li>
          </ul>
          <p className="text-gray-400 text-sm mt-3">
            To exercise any of these rights, please <a href="#contact" className="text-primary hover:underline">contact us</a>.
          </p>
        </motion.div>

        {/* ─── SECTION 7: Cookies & Local Storage ─── */}
        <motion.div
          ref={(el) => (sectionRefs.current['cookies'] = el)}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="glass rounded-2xl border border-white/10 p-6 mb-6"
        >
          <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            Cookies & Local Storage
          </h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            We use <span className="text-primary font-semibold">localStorage</span> to store your preferences (such as currency choice and theme). We do not use tracking cookies, ad networks, or analytics cookies that track your behavior across other websites.
          </p>
          <p className="text-gray-400 text-sm mt-2">
            You can clear your local storage at any time through your browser settings.
          </p>
        </motion.div>

        {/* ─── SECTION 8: Children's Privacy ─── */}
        <motion.div
          ref={(el) => (sectionRefs.current['children'] = el)}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="glass rounded-2xl border border-white/10 p-6 mb-6"
        >
          <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            Children's Privacy
          </h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            Movie Zone is not directed at children under the age of 13. We do not knowingly collect personal information from children. If you are a parent or guardian and believe your child has provided us with personal information, please <a href="#contact" className="text-primary hover:underline">contact us</a> and we will delete it.
          </p>
        </motion.div>

        {/* ─── SECTION 9: Changes To This Policy ─── */}
        <motion.div
          ref={(el) => (sectionRefs.current['changes'] = el)}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="glass rounded-2xl border border-white/10 p-6 mb-6"
        >
          <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            Changes To This Policy
          </h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            We may update this Privacy Policy from time to time. Any changes will be posted on this page, and the "Last Updated" date will be revised. We encourage you to review this policy periodically.
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Last Updated: July 2025
          </p>
        </motion.div>

        {/* ─── SECTION 10: Contact Us ─── */}
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
            If you have any questions, concerns, or requests regarding this Privacy Policy or your data, please contact us:
          </p>
          <div className="mt-3 p-4 bg-white/5 rounded-xl border border-white/5">
            <p className="text-white font-medium">Movie Zone</p>
            <p className="text-gray-400 text-sm">
              Email: <span className="text-primary">kizitofahad665@gmail.com=</span>
            </p>
            <p className="text-gray-500 text-xs mt-1">(Replace with your actual email)</p>
          </div>
        </motion.div>

        <p className="text-center text-gray-600 text-xs mt-8">
          Last updated: July 2025
        </p>
      </div>
    </div>
  );
}