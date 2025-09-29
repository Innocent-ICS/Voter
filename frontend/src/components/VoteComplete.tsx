import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { CheckCircle, Home, BarChart3 } from "lucide-react";

interface VoteCompleteProps {
  onBackToHome: () => void;
  onViewResults: () => void;
}

export function VoteComplete({ onBackToHome, onViewResults }: VoteCompleteProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 pb-24">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-[--color-zimbabwe-green]" />
          </div>
          <CardTitle className="text-2xl text-[--color-zimbabwe-black]">Vote Submitted Successfully!</CardTitle>
          <CardDescription>
            Thank you for participating in the class representative election. Your vote has been securely recorded.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Flag stripe */}
          <div className="w-32 h-2 mx-auto flex rounded">
            <div className="flex-1 bg-[--color-zimbabwe-green] rounded-l"></div>
            <div className="flex-1 bg-[--color-zimbabwe-yellow]"></div>
            <div className="flex-1 bg-[--color-zimbabwe-red]"></div>
            <div className="flex-1 bg-[--color-zimbabwe-black] rounded-r"></div>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-medium mb-2">What happens next?</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Your vote has been anonymously recorded</li>
              <li>• Results will be automatically calculated</li>
              <li>• You cannot vote again with this email</li>
              <li>• Check back for results after the voting deadline</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={onBackToHome}
              variant="outline"
              className="flex-1"
            >
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
            <Button 
              onClick={onViewResults}
              className="flex-1 bg-[--color-zimbabwe-green] hover:bg-[--color-zimbabwe-green]/90"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              View Results
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}