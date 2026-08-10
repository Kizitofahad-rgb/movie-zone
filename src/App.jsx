import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider } from './context/AuthContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { useNotifications } from './hooks/useNotifications';
import Navbar from './components/Navbar';
import InstallPrompt from './components/InstallPrompt';
import MovieChatbot from './components/MovieChatbot'; // 👈 NEW IMPORT
import Footer from './components/Footer';
import LoadingFallback from './components/LoadingFallback';

// ── Critical routes (load immediately) ──
import Landing from './pages/Landing';
import Home from './pages/Home';

// ── Lazy-loaded routes ──
const Movies = lazy(() => import('./pages/Movies'));
const Series = lazy(() => import('./pages/Series'));
const Animations = lazy(() => import('./pages/Animations'));
const African = lazy(() => import('./pages/African'));
const Documentaries = lazy(() => import('./pages/Documentaries'));
const MovieDetail = lazy(() => import('./pages/MovieDetail'));
const Search = lazy(() => import('./pages/Search'));
const Login = lazy(() => import('./pages/Login'));
const Profile = lazy(() => import('./pages/Profile'));
const Admin = lazy(() => import('./pages/Admin'));
const AdminPayments = lazy(() => import('./pages/AdminPayments'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));

// ── Component to initialize notifications ──
function NotificationInitializer() {
  useNotifications();
  return null;
}

function App() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <Router>
          <NotificationInitializer />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#12121a',
                color: '#fff',
                border: '1px solid #00d4ff',
              },
            }}
          />
          <Navbar />
          <InstallPrompt />
          <MovieChatbot /> {/* 👈 ADD THIS LINE */}
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/home" element={<Home />} />
              <Route path="/movies" element={<Movies />} />
              <Route path="/series" element={<Series />} />
              <Route path="/animations" element={<Animations />} />
              <Route path="/african" element={<African />} />
              <Route path="/documentaries" element={<Documentaries />} />
              <Route path="/movie/:id" element={<MovieDetail />} />
              <Route path="/tv/:id" element={<MovieDetail />} />
              <Route path="/search" element={<Search />} />
              <Route path="/login" element={<Login />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/payments" element={<AdminPayments />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
            </Routes>
          </Suspense>
          <Footer />
          <Analytics />
        </Router>
      </SubscriptionProvider>
    </AuthProvider>
  );
}

export default App;