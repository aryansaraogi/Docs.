import Background from "./components/Background";
import Foreground from "./components/Foreground";

function App() {
  return (
    <div className="relative w-full min-h-screen bg-gradient-to-b from-zinc-900 to-zinc-800">
      <Background />
      <Foreground />
    </div>
  );
}

export default App;
