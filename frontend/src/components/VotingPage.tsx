import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Vote, CheckCircle, ArrowLeft } from "lucide-react";
import { api } from "../utils/api";

interface Candidate {
  id: string;
  name: string;
}

interface VotingPageProps {
  votingToken: string;
  onBack: () => void;
  onVoteComplete: () => void;
}

const characteristics = [
  { id: "leadership", label: "Strong Leadership Skills", value: 0.5 },
  { id: "communication", label: "Excellent Communication", value: 0.5 },
  { id: "reliability", label: "Reliability and Trustworthiness", value: 0.5 },
  { id: "experience", label: "Previous Experience", value: 0.5 }
];

export function VotingPage({ votingToken, onBack, onVoteComplete }: VotingPageProps) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [voterInfo, setVoterInfo] = useState<{ voterClass: string; voterName: string } | null>(null);
  const [firstChoice, setFirstChoice] = useState("");
  const [firstReason, setFirstReason] = useState("");
  const [secondChoice, setSecondChoice] = useState("");
  const [secondReason, setSecondReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [step, setStep] = useState(1);

  useEffect(() => {
    verifyTokenAndLoadData();
  }, [votingToken]);

  const verifyTokenAndLoadData = async () => {
    try {
      // Verify token and get voter info
      const tokenData = await api.verifyToken(votingToken);
      setVoterInfo(tokenData);

      // Load candidates for the voter's class
      const candidatesData = await api.getCandidates(tokenData.voterClass);
      setCandidates(candidatesData.candidates);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to load voting data. Please try again.");
    }
  };

  const handleSubmitVote = async () => {
    if (!firstChoice || !firstReason || !secondChoice || !secondReason) {
      setMessage("Please complete all questions before submitting");
      return;
    }

    if (firstChoice === secondChoice) {
      setMessage("Please select different candidates for your first and second choices");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await api.submitVote(votingToken, {
        firstChoice,
        firstReason,
        secondChoice,
        secondReason
      });
      onVoteComplete();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to submit vote. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!voterInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 pb-24">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-destructive">{message || "Loading..."}</p>
              <Button onClick={onBack} variant="outline" className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const availableCandidates = candidates.filter(c => c.name !== voterInfo.voterName);

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-2 mb-4">
            <Vote className="h-8 w-8 text-[--color-zimbabwe-green]" />
            <h1 className="text-3xl text-[--color-zimbabwe-black]">Voting Ballot</h1>
          </div>
          <p className="text-muted-foreground">
            Welcome {voterInfo.voterName} ({voterInfo.voterClass})
          </p>
          
          {/* Flag stripe */}
          <div className="w-24 h-1 mx-auto mt-4 flex">
            <div className="flex-1 bg-[--color-zimbabwe-green]"></div>
            <div className="flex-1 bg-[--color-zimbabwe-yellow]"></div>
            <div className="flex-1 bg-[--color-zimbabwe-red]"></div>
            <div className="flex-1 bg-[--color-zimbabwe-black]"></div>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3, 4].map((num) => (
              <div
                key={num}
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  step >= num 
                    ? 'bg-[--color-zimbabwe-green] text-white' 
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {num}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6">
          {/* Question 1: First Choice (2 points) */}
          <Card className={step !== 1 ? 'opacity-50' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-[--color-zimbabwe-green] text-white rounded-full w-6 h-6 flex items-center justify-center">1</span>
                Who is your preferred candidate for class representative? (2 points)
              </CardTitle>
              <CardDescription>
                Select your top choice from your class
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="first-choice">Select Candidate</Label>
                <Select 
                  value={firstChoice} 
                  onValueChange={(value) => {
                    setFirstChoice(value);
                    if (step === 1) setStep(2);
                  }}
                  disabled={step !== 1}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your preferred candidate" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCandidates.map((candidate) => (
                      <SelectItem key={candidate.id} value={candidate.name}>
                        {candidate.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Question 2: First Choice Reasoning (2 points) */}
          <Card className={step !== 2 ? 'opacity-50' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-[--color-zimbabwe-yellow] text-black rounded-full w-6 h-6 flex items-center justify-center">2</span>
                Why do you think this candidate is best? (2 points)
              </CardTitle>
              <CardDescription>
                Select the most important characteristic (each option worth 0.5 points)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup 
                value={firstReason} 
                onValueChange={(value) => {
                  setFirstReason(value);
                  if (step === 2) setStep(3);
                }}
                disabled={step !== 2}
              >
                {characteristics.map((char) => (
                  <div key={char.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={char.id} id={`first-${char.id}`} />
                    <Label htmlFor={`first-${char.id}`}>{char.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Question 3: Second Choice (1 point) */}
          <Card className={step !== 3 ? 'opacity-50' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-[--color-zimbabwe-red] text-white rounded-full w-6 h-6 flex items-center justify-center">3</span>
                Who else would make a good class representative? (1 point)
              </CardTitle>
              <CardDescription>
                Select your second choice from your class
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="second-choice">Select Candidate</Label>
                <Select 
                  value={secondChoice} 
                  onValueChange={(value) => {
                    setSecondChoice(value);
                    if (step === 3) setStep(4);
                  }}
                  disabled={step !== 3}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your second preference" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCandidates
                      .filter(c => c.name !== firstChoice)
                      .map((candidate) => (
                        <SelectItem key={candidate.id} value={candidate.name}>
                          {candidate.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Question 4: Second Choice Reasoning (2 points) */}
          <Card className={step !== 4 ? 'opacity-50' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-[--color-zimbabwe-black] text-white rounded-full w-6 h-6 flex items-center justify-center">4</span>
                Why would this candidate also be good? (2 points)
              </CardTitle>
              <CardDescription>
                Select the most important characteristic for your second choice
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup 
                value={secondReason} 
                onValueChange={setSecondReason}
                disabled={step !== 4}
              >
                {characteristics.map((char) => (
                  <div key={char.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={char.id} id={`second-${char.id}`} />
                    <Label htmlFor={`second-${char.id}`}>{char.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Submit Button */}
          {step === 4 && (
            <div className="flex justify-center gap-4 mt-8">
              <Button onClick={onBack} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitVote}
                disabled={loading || !firstChoice || !firstReason || !secondChoice || !secondReason}
                className="bg-[--color-zimbabwe-green] hover:bg-[--color-zimbabwe-green]/90"
              >
                {loading ? "Submitting..." : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Submit Vote
                  </>
                )}
              </Button>
            </div>
          )}

          {message && (
            <div className="text-center">
              <p className={`text-sm ${message.includes('error') || message.includes('failed') 
                ? 'text-destructive' 
                : 'text-[--color-zimbabwe-green]'}`}>
                {message}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}