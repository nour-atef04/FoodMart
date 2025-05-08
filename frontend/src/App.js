import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
//import { useState } from 'react';
import Login from "./components/Login";
import Store from "./components/Store";
import Signup from "./components/Signup";
import ControlPanel from "./components/ControlPanel";
import { AuthProvider } from "./components/AuthContext";

function App() {
  //const [currentUser, setCurrentUser] = useState(null);
  //console.log("current user: " + currentUser);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/store" element={<Store />} />
          <Route path="/control" element={<ControlPanel />} />
          <Route path="/" element={<Login />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
