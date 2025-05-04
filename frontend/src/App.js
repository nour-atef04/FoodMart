import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import Login from './components/Login';
import Store from './components/Store';
import Signup from './components/Signup';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  //console.log("current user: " + currentUser);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login setCurrentUser={setCurrentUser} />} />
        <Route path="/signup" element={<Signup setCurrentUser={setCurrentUser} />} />
        <Route path="/store" element={<Store user_id={currentUser?.user_id} />} />
        <Route path="/" element={<Login setCurrentUser={setCurrentUser} />} />
      </Routes>
    </Router>
  );
}

export default App;