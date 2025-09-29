import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Vote, Users, Shield } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { api } from "../utils/api";

interface AuthPageProps {
  onVotingLinkGenerated: (link: string) => void;
  onRegistrationLinkGenerated: (link: string) => void;
}

export function AuthPage({ onVotingLinkGenerated, onRegistrationLinkGenerated }: AuthPageProps) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const classes = [
    "freshman",
    "sophomore", 
    "junior",
    "senior",
    "masters"
  ];

  const handleRegister = async () => {
    if (!email || !fullName || !studentClass) {
      setMessage("Please fill in all fields");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await api.register(email, fullName, studentClass);
      toast.success("Registration successful! You can now request a voting link.");
      setMessage("");
      setFullName("");
      setStudentClass("");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Registration failed. Please try again.";
      toast.error(errorMessage);
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestRegistrationLink = async () => {
    if (!email) {
      setMessage("Please enter your email address");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const data = await api.sendRegistrationLink(email);
      toast.success("Registration link generated successfully!");
      setMessage("");
      onRegistrationLinkGenerated(data.registrationLink);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to generate registration link. Please try again.";
      toast.error(errorMessage);
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestVotingLink = async () => {
    if (!email) {
      setMessage("Please enter your email address");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const data = await api.sendVoteLink(email);
      toast.success("Voting link generated successfully!");
      setMessage("");
      onVotingLinkGenerated(data.votingLink);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to generate voting link. Please try again.";
      toast.error(errorMessage);
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 pb-24">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-2 mb-4">
            <Vote className="h-8 w-8 text-[--color-zimbabwe-green]" />
            <h1 className="text-3xl text-[--color-zimbabwe-black]">Class Representative Voting</h1>
          </div>
          <p className="text-muted-foreground">Secure, anonymous voting for your class representative</p>
          
          {/* Flag stripe */}
          <div className="w-24 h-1 mx-auto mt-4 flex">
            <div className="flex-1 bg-[--color-zimbabwe-green]"></div>
            <div className="flex-1 bg-[--color-zimbabwe-yellow]"></div>
            <div className="flex-1 bg-[--color-zimbabwe-red]"></div>
            <div className="flex-1 bg-[--color-zimbabwe-black]"></div>
          </div>
        </div>

        <Tabs defaultValue="vote" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="vote" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Vote
            </TabsTrigger>
            <TabsTrigger value="register" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Register
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vote">
            <Card>
              <CardHeader>
                <CardTitle>Request Voting Link</CardTitle>
                <CardDescription>
                  Enter your registered email to receive a secure voting link
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vote-email">Email Address</Label>
                  <Input
                    id="vote-email"
                    type="email"
                    placeholder="your.email@school.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <Button 
                  onClick={handleRequestVotingLink}
                  disabled={loading}
                  className="w-full bg-[--color-zimbabwe-green] hover:bg-[--color-zimbabwe-green]/90"
                >
                  {loading ? "Generating..." : "Get Voting Link"}
                </Button>

                {message && (
                  <p className={`text-sm ${message.includes('error') || message.includes('failed') 
                    ? 'text-destructive' 
                    : 'text-[--color-zimbabwe-green]'}`}>
                    {message}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <div className="space-y-6">
              {/* Request Registration Link */}
              <Card>
                <CardHeader>
                  <CardTitle>Request Registration Link</CardTitle>
                  <CardDescription>
                    Enter your email to receive a secure registration link
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">Email Address</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="your.email@school.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <Button 
                    onClick={handleRequestRegistrationLink}
                    disabled={loading}
                    className="w-full bg-[--color-zimbabwe-green] hover:bg-[--color-zimbabwe-green]/90"
                  >
                    {loading ? "Sending..." : "Send Registration Link"}
                  </Button>

                  {message && (
                    <p className={`text-sm ${message.includes('error') || message.includes('failed') 
                      ? 'text-destructive' 
                      : 'text-[--color-zimbabwe-green]'}`}>
                      {message}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Direct Registration (Alternative) */}
              <Card>
                <CardHeader>
                  <CardTitle>Direct Registration</CardTitle>
                  <CardDescription>
                    Or register directly (for testing purposes)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                    <Label htmlFor="direct-email">Email Address</Label>
                    <Input
                      id="direct-email"
                      type="email"
                      placeholder="your.email@school.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
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

                  <Button 
                    onClick={handleRegister}
                    disabled={loading}
                    variant="outline"
                    className="w-full"
                  >
                    {loading ? "Registering..." : "Register Directly"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}