import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Home from './pages/Home';
import Profile from './pages/Profile';

// Layout Component: Renders Navbar + Current Page
const MainLayout = () => {
  return (
    <div>
      <Navbar />
      <Outlet />
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes (Wrapped in Layout) */}
        <Route element={<MainLayout />}>
           {/* Redirect root "/" to "/home" */}
           <Route path="/" element={<Navigate to="/home" replace />} />
           
           <Route path="/home" element={<Home />} />
           <Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;