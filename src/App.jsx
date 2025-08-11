import "./App.css";
import NavBar from "./components/NavBar";
import Homepage from "./pages/Homepage";

function App() {
  return (
    <div className="min-h-screen bg-white">
      <NavBar />

      <Homepage />
    </div>
  );
}

export default App;
