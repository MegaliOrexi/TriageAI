import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PatientView from './components/PatientView';
import AdminDashboard from './components/AdminDashboard';
import PatientManagement from './components/PatientManagement';
import StaffManagement from './components/StaffManagement';
import ResourceManagement from './components/ResourceManagement';
import SystemSettings from './components/SystemSettings';
import ModelTester from './components/ModelTester';
import './styles/App.css';
import './styles/ModelTester.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PatientView />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/patients" element={<PatientManagement />} />
        <Route path="/admin/staff" element={<StaffManagement />} />
        <Route path="/admin/resources" element={<ResourceManagement />} />
        <Route path="/admin/settings" element={<SystemSettings />} />
        <Route path="/model-tester" element={<ModelTester />} />
      </Routes>
    </Router>
  );
}

export default App;
