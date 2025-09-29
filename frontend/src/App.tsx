import { useState, useEffect } from "react";
import { AuthPage } from "./components/AuthPage";
import { VotingPage } from "./components/VotingPage";
import { VoteComplete } from "./components/VoteComplete";
import { ResultsPage } from "./components/ResultsPage";
import { RegistrationCompletePage } from "./components/RegistrationCompletePage";
import { Button } from "./components/ui/button";
import { Toaster } from "./components/ui/sonner";
import { Moon, Sun } from "lucide-react";

type AppState = 'auth' | 'voting' | 'complete' | 'results' | 'registration';

export default function App() {
  const [appState, setAppState] = useState<AppState>('auth');
  const [votingToken, setVotingToken] = useState("");
  const [registrationToken, setRegistrationToken] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check for tokens in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const regToken = urlParams.get('regToken');
    
    if (token) {
      setVotingToken(token);
      setAppState('voting');
    } else if (regToken) {
      setRegistrationToken(regToken);
      setAppState('registration');
    }
  }, []);

  // Dark mode toggle
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const handleVotingLinkGenerated = (link: string) => {
    // Extract token from the link and navigate to voting
    const url = new URL(link);
    const token = url.searchParams.get('token');
    if (token) {
      setVotingToken(token);
      setAppState('voting');
    }
  };

  const handleRegistrationLinkGenerated = (link: string) => {
    // Extract registration token from the link and navigate to registration
    const url = new URL(link);
    const regToken = url.searchParams.get('regToken');
    if (regToken) {
      setRegistrationToken(regToken);
      setAppState('registration');
    }
  };

  const handleVoteComplete = () => {
    setAppState('complete');
  };

  const handleBackToHome = () => {
    setAppState('auth');
    setVotingToken("");
    setRegistrationToken("");
    // Clear URL params
    window.history.replaceState({}, '', window.location.pathname);
  };

  const handleRegistrationComplete = () => {
    setAppState('auth');
    setRegistrationToken("");
    // Clear URL params
    window.history.replaceState({}, '', window.location.pathname);
  };

  const handleViewResults = () => {
    setAppState('results');
  };

  const handleBackFromVoting = () => {
    setAppState('auth');
    setVotingToken("");
  };

  const handleBackFromRegistration = () => {
    setAppState('auth');
    setRegistrationToken("");
  };

  const handleBackFromResults = () => {
    setAppState('auth');
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <Toaster position="top-center" />
      {/* Dark mode toggle */}
      <div className="fixed top-4 right-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="bg-background/80 backdrop-blur-sm"
        >
          {isDarkMode ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Main App Content */}
      {appState === 'auth' && (
        <AuthPage 
          onVotingLinkGenerated={handleVotingLinkGenerated} 
          onRegistrationLinkGenerated={handleRegistrationLinkGenerated}
        />
      )}

      {appState === 'registration' && (
        <RegistrationCompletePage
          registrationToken={registrationToken}
          onRegistrationComplete={handleRegistrationComplete}
          onBack={handleBackFromRegistration}
        />
      )}

      {appState === 'voting' && (
        <VotingPage
          votingToken={votingToken}
          onBack={handleBackFromVoting}
          onVoteComplete={handleVoteComplete}
        />
      )}

      {appState === 'complete' && (
        <VoteComplete
          onBackToHome={handleBackToHome}
          onViewResults={handleViewResults}
        />
      )}

      {appState === 'results' && (
        <ResultsPage onBack={handleBackFromResults} />
      )}

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>Class Representative Voting System</span>
              <div className="w-16 h-0.5 flex">
                <div className="flex-1 bg-[--color-zimbabwe-green]"></div>
                <div className="flex-1 bg-[--color-zimbabwe-yellow]"></div>
                <div className="flex-1 bg-[--color-zimbabwe-red]"></div>
                <div className="flex-1 bg-[--color-zimbabwe-black]"></div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span>Secure • Anonymous • Transparent</span>
              {appState === 'auth' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleViewResults}
                  className="text-muted-foreground hover:text-foreground"
                >
                  View Results
                </Button>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}