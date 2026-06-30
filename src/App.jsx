import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { useNotifications } from './hooks/useNotifications';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LoadingFallback from './components/LoadingFallback'; // 👈 NEW

// ── Critical routes (load immediately) ──
import Landing from './pages/Landing';
import Home from './pages/Home';

// ── Lazy-loaded routes ──
const Movies = lazy(() => import('./pages/Movies'));
const Series = lazy(() => import('./pages/Series'));
const Animations = lazy(() => import('./pages/Animations'));
const African = lazy(() => import('./pages/African'));
const MovieDetail = lazy(() => import('./pages/MovieDetail'));
const Search = lazy(() => import('./pages/Search'));
const Login = lazy(() => import('./pages/Login'));
const Profile = lazy(() => import('./pages/Profile'));

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
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/home" element={<Home />} />
              <Route path="/movies" element={<Movies />} />
              <Route path="/series" element={<Series />} />
              <Route path="/animations" element={<Animations />} />
              <Route path="/african" element={<African />} />
              <Route path="/movie/:id" element={<MovieDetail />} />
              <Route path="/tv/:id" element={<MovieDetail />} />
              <Route path="/search" element={<Search />} />
              <Route path="/login" element={<Login />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </Suspense>
          <Footer />
        </Router>
      </SubscriptionProvider>
    </AuthProvider>
  );
}

export default App;