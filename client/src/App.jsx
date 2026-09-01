import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import LiveMap from './pages/LiveMap';
import Fleet from './pages/Fleet';
import Dispatch from './pages/Dispatch';
import DemoMode from './pages/DemoMode';
import DriverMode from './pages/DriverMode';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/map" element={<LiveMap />} />
          <Route path="/fleet" element={<Fleet />} />
          <Route path="/dispatch" element={<Dispatch />} />
          <Route path="/demo" element={<DemoMode />} />
          <Route path="/driver" element={<DriverMode />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
