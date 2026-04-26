import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import VolunteerRegister from './pages/VolunteerRegister';
import Dashboard from './components/Dashboard';
import Report from './pages/Report';
import VolunteerTaskPage from './pages/VolunteerTaskPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/volunteer/register" element={<VolunteerRegister />} />

          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['ngo_admin']}>
                <div className="h-screen w-screen bg-gray-50 overflow-hidden">
                  <Dashboard />
                </div>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/report" 
            element={
              <ProtectedRoute allowedRoles={['field_worker', 'ngo_admin']}>
                <Report />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/my-tasks" 
            element={
              <ProtectedRoute allowedRoles={['volunteer']}>
                <VolunteerTaskPage />
              </ProtectedRoute>
            } 
          />
          
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
