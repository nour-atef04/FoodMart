import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
//import { useState } from 'react';
import Login from "./components/Login";
import Store from "./components/Store";
import Signup from "./components/Signup";
import ControlPanel from "./components/ControlPanel";
import { AuthProvider } from "./components/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  //const [currentUser, setCurrentUser] = useState(null);
  //console.log("current user: " + currentUser);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/store"
            element={
              <ProtectedRoute>
                <Store />
              </ProtectedRoute>
            }
          />
          <Route
            path="/control"
            element={
              <ProtectedRoute>
                <ControlPanel />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Login />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
