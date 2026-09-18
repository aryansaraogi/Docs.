import { MotionConfig } from "framer-motion";
import Background from "./components/Background";
import Foreground from "./components/Foreground";

function App() {
  return (
    // Respect the OS "reduce motion" setting for all animations
    <MotionConfig reducedMotion="user">
      {/* overflow-clip: a card scaled up mid-drag at the edge mustn't add scrollbars */}
      <div className="relative w-full min-h-screen overflow-clip bg-gradient-to-b from-zinc-900 to-zinc-800">
        <Background />
        <Foreground />
      </div>
    </MotionConfig>
  );
}

export default App;
