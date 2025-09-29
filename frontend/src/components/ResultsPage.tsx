import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { ArrowLeft, Trophy, Medal, Award } from "lucide-react";
import { api } from "../utils/api";

interface Results {
  [className: string]: {
    [candidateName: string]: number;
  };
}

interface ResultsPageProps {
  onBack: () => void;
}

export function ResultsPage({ onBack }: ResultsPageProps) {
  const [results, setResults] = useState<Results>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      const data = await api.getResults();
      setResults(data.results);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load results");
    } finally {
      setLoading(false);
    }
  };

  const getTopCandidates = (classResults: { [name: string]: number }) => {
    return Object.entries(classResults)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);
  };

  const getProgressPercentage = (score: number, maxScore: number) => {
    return maxScore > 0 ? (score / maxScore) * 100 : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-24">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[--color-zimbabwe-green] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 pb-24">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={onBack} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-2 mb-4">
            <Trophy className="h-8 w-8 text-[--color-zimbabwe-yellow]" />
            <h1 className="text-3xl text-[--color-zimbabwe-black]">Election Results</h1>
          </div>
          <p className="text-muted-foreground">Class Representative Voting Results</p>
          
          {/* Flag stripe */}
          <div className="w-24 h-1 mx-auto mt-4 flex">
            <div className="flex-1 bg-[--color-zimbabwe-green]"></div>
            <div className="flex-1 bg-[--color-zimbabwe-yellow]"></div>
            <div className="flex-1 bg-[--color-zimbabwe-red]"></div>
            <div className="flex-1 bg-[--color-zimbabwe-black]"></div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mb-6">
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>

        {/* Results by Class */}
        <div className="grid gap-6">
          {Object.keys(results).length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No votes have been cast yet.</p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(results).map(([className, classResults]) => {
              const topCandidates = getTopCandidates(classResults);
              const maxScore = Math.max(...Object.values(classResults));
              const totalVotes = Object.values(classResults).reduce((sum, score) => {
                // Each vote can contribute max 3 points (2 for first choice + 1 for second choice)
                // So estimate number of voters
                return sum + score;
              }, 0);

              return (
                <Card key={className}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-[--color-zimbabwe-green]" />
                      {className}
                    </CardTitle>
                    <CardDescription>
                      Total Points Awarded: {totalVotes} • Voting System: 2 points (1st choice) + 1 point (2nd choice)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {topCandidates.map(([candidateName, score], index) => (
                        <div key={candidateName} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {index === 0 && <Trophy className="h-5 w-5 text-[--color-zimbabwe-yellow]" />}
                              {index === 1 && <Medal className="h-5 w-5 text-gray-400" />}
                              {index === 2 && <Medal className="h-5 w-5 text-amber-600" />}
                              <span className={index === 0 ? "font-semibold" : ""}>{candidateName}</span>
                            </div>
                            <span className="font-medium">{score} points</span>
                          </div>
                          <Progress 
                            value={getProgressPercentage(score, maxScore)} 
                            className={`h-2 ${
                              index === 0 
                                ? '[&>div]:bg-[--color-zimbabwe-green]' 
                                : index === 1 
                                ? '[&>div]:bg-gray-400' 
                                : '[&>div]:bg-amber-600'
                            }`}
                          />
                        </div>
                      ))}

                      {Object.keys(classResults).length > 3 && (
                        <details className="mt-4">
                          <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                            Show all candidates ({Object.keys(classResults).length - 3} more)
                          </summary>
                          <div className="mt-2 space-y-2">
                            {Object.entries(classResults)
                              .sort(([, a], [, b]) => b - a)
                              .slice(3)
                              .map(([candidateName, score]) => (
                                <div key={candidateName} className="flex justify-between text-sm">
                                  <span>{candidateName}</span>
                                  <span>{score} points</span>
                                </div>
                              ))}
                          </div>
                        </details>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Explanation */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>How Points Are Calculated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Point System:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• First choice: 2 points</li>
                  <li>• Second choice: 1 point</li>
                  <li>• Maximum per voter: 3 points total</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Security Features:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Anonymous voting with hashed identities</li>
                  <li>• One vote per registered email</li>
                  <li>• Class-based candidate filtering</li>
                  <li>• Secure token-based access</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}