import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { useAuth } from "../../contexts/AuthContext";

export const LoginCard = () => {
  const { signIn, loading } = useAuth();

  const handleGoogleSignIn = () => {
    if (!loading) {
      signIn("google");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Welcome to vhybZ</CardTitle>
          <CardDescription>
            Sign in to start creating interactive digital artifacts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? "Loading..." : "Continue with Google"}
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            <p>AI-powered platform for creative coding</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};