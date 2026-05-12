import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './views/Dashboard';
import ProjectDetail from './views/ProjectDetail';
import TimelineView from './views/TimelineView';

function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/project/:projectId" element={<ProjectDetail />} />
          <Route path="/project/:projectId/package/:packageId/submission/:submissionId" element={<TimelineView />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

export default App;
