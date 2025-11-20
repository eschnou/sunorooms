import { Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import RoomView from './components/RoomView';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/room/:slug" element={<RoomView />} />
    </Routes>
  );
}

export default App;
