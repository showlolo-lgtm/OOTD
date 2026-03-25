import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import DashboardPage from './pages/DashboardPage';
import WardrobePage from './pages/WardrobePage';
import AddClothingPage from './pages/AddClothingPage';
import ProfilePage from './pages/ProfilePage';
import InspirationPage from './pages/InspirationPage';
import RecommendationPage from './pages/RecommendationPage';
import OutfitsPage from './pages/OutfitsPage';
import OutfitDetailPage from './pages/OutfitDetailPage';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/wardrobe" element={<WardrobePage />} />
        <Route path="/wardrobe/add" element={<AddClothingPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/inspirations" element={<InspirationPage />} />
        <Route path="/recommend" element={<RecommendationPage />} />
        <Route path="/outfits" element={<OutfitsPage />} />
        <Route path="/outfits/:id" element={<OutfitDetailPage />} />
      </Routes>
    </Layout>
  );
}
