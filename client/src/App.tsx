import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { GameProvider } from "./contexts/GameContext";
import Home from "./pages/Home";
import MapPage from "./pages/MapPage";
import StagePage from "./pages/StagePage";
import QuizPage from "./pages/QuizPage";
import Ending from "./pages/Ending";
import StarBackground from "./components/StarBackground";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/map" component={MapPage} />
      <Route path="/stage/:id" component={StagePage} />
      <Route path="/quiz" component={QuizPage} />
      <Route path="/ending" component={Ending} />
      <Route component={Home} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <GameProvider>
          <TooltipProvider>
            <StarBackground />
            <Router />
            <Toaster />
          </TooltipProvider>
        </GameProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
