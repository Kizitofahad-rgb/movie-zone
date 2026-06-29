import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { useNotifications } from './hooks/useNotifications'; // 👈 NEW
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Landing from './pages/Landing';
import Home from './pages/Home';
import Movies from './pages/Movies';
import Series from './pages/Series';
import Animations from './pages/Animations';
import African from './pages/African';
import MovieDetail from './pages/MovieDetail';
import Search from './pages/Search';
import Login from './pages/Login';
import Profile from './pages/Profile';

// ── Component to initialize notifications ──
function NotificationInitializer() {
  useNotifications(); // Just call the hook to trigger its effects
  return null;
}

function App() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <Router>
          <NotificationInitializer /> {/* 👈 NEW */}
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
          <Footer />
        </Router>
      </SubscriptionProvider>
    </AuthProvider>
  );
}

export default App;