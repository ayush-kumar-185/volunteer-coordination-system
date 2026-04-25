import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import VolunteerTaskPage from './pages/VolunteerTaskPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <div className="h-screen w-screen bg-gray-50 overflow-hidden">
            <Dashboard />
          </div>
        } />
        <Route path="/volunteer/task/:id" element={<VolunteerTaskPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
