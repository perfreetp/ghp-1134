import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Buildings from "@/pages/Buildings";
import Equipment from "@/pages/Equipment";
import Inspections from "@/pages/Inspections";
import Hazards from "@/pages/Hazards";
import Drills from "@/pages/Drills";
import Reports from "@/pages/Reports";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/buildings" element={<Buildings />} />
          <Route path="/equipment" element={<Equipment />} />
          <Route path="/inspections" element={<Inspections />} />
          <Route path="/hazards" element={<Hazards />} />
          <Route path="/drills" element={<Drills />} />
          <Route path="/reports" element={<Reports />} />
        </Route>
      </Routes>
    </Router>
  );
}
