import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Vote, ArrowLeft } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { api } from "../utils/api";

interface RegistrationCompletePageProps {
  registrationToken: string;
  onRegistrationComplete: () => void;
  onBack: () => void;
}

export function RegistrationCompletePage({ 
  registrationToken, 
  onRegistrationComplete, 
  onBack 
}: RegistrationCompletePageProps) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState("");

  const classes = [
    "freshman",
    "sophomore", 
    "junior",
    "senior",
    "masters"
  ];

  // Verify the registration token on load
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const data = await api.verifyRegistrationToken(registrationToken);
        setEmail(data.email);
        setVerifying(false);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Invalid or expired registration link";
        setError(errorMessage);
        toast.error(errorMessage);
        setVerifying(false);
      }
    };

    verifyToken();
  }, [registrationToken]);

  const handleCompleteRegistration = async () => {
    if (!fullName || !studentClass) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      await api.completeRegistration(registrationToken, fullName, studentClass);
      toast.success("Registration completed successfully! You can now request voting links.");
      onRegistrationComplete();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Registration failed. Please try again.";
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 pb-24">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Vote className="h-8 w-8 text-[--color-zimbabwe-green] mx-auto mb-4" />
              <p>Verifying registration link...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 pb-24">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Vote className="h-8 w-8 text-destructive mx-auto" />
              <div>
                <h3 className="text-lg font-medium">Registration Link Invalid</h3>
                <p className="text-sm text-muted-foreground mt-2">{error}</p>
              </div>
              <Button onClick={onBack} variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 pb-24">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-2 mb-4">
            <Vote className="h-8 w-8 text-[--color-zimbabwe-green]" />
            <h1 className="text-3xl text-[--color-zimbabwe-black]">Complete Registration</h1>
          </div>
          <p className="text-muted-foreground">Complete your voter registration</p>
          
          {/* Flag stripe */}
          <div className="w-24 h-1 mx-auto mt-4 flex">
            <div className="flex-1 bg-[--color-zimbabwe-green]"></div>
            <div className="flex-1 bg-[--color-zimbabwe-yellow]"></div>
            <div className="flex-1 bg-[--color-zimbabwe-red]"></div>
            <div className="flex-1 bg-[--color-zimbabwe-black]"></div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Complete Your Registration</CardTitle>
            <CardDescription>
              Complete your registration for {email}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="full-name">Full Name</Label>
              <Input
                id="full-name"
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="class">Class</Label>
              <Select value={studentClass} onValueChange={setStudentClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls} value={cls}>
                      {cls}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={onBack} 
                variant="outline" 
                className="flex-1"
                disabled={loading}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={handleCompleteRegistration}
                disabled={loading}
                className="flex-1 bg-[--color-zimbabwe-green] hover:bg-[--color-zimbabwe-green]/90"
              >
                {loading ? "Registering..." : "Complete Registration"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}