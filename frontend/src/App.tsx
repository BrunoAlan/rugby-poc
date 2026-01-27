import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Matches from './pages/Matches'
import MatchDetail from './pages/MatchDetail'
import Players from './pages/Players'
import PlayerDetail from './pages/PlayerDetail'
import PlayerCompare from './pages/PlayerCompare'
import Rankings from './pages/Rankings'
import Upload from './pages/Upload'
import ScoringConfig from './pages/ScoringConfig'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/matches/:id" element={<MatchDetail />} />
        <Route path="/players" element={<Players />} />
        <Route path="/players/compare" element={<PlayerCompare />} />
        <Route path="/players/:name" element={<PlayerDetail />} />
        <Route path="/rankings" element={<Rankings />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/scoring" element={<ScoringConfig />} />
      </Routes>
    </Layout>
  )
}

export default App
