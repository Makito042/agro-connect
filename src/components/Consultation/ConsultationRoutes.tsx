import React from 'react';
import { Route, Routes } from 'react-router-dom';
import BookConsultation from './BookConsultation';
import ExpertAvailability from './ExpertAvailability';

const ConsultationRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="book" element={<BookConsultation />} />
      <Route path="availability" element={<ExpertAvailability />} />
    </Routes>
  );
};

export default ConsultationRoutes;