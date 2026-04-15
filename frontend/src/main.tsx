import React from 'react';
import './index.css';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { OverviewPage } from './pages/OverviewPage';
import { LatencyPage } from './pages/LatencyPage';
import { CarbonPage } from './pages/CarbonPage';
import { AnomaliesPage } from './pages/AnomaliesPage';
import { RecommendationsPage } from './pages/RecommendationsPage';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/overview"        element={<OverviewPage />} />
          <Route path="/latency"         element={<LatencyPage />} />
          <Route path="/carbon"          element={<CarbonPage />} />
          <Route path="/anomalies"       element={<AnomaliesPage />} />
          <Route path="/recommendations" element={<RecommendationsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
