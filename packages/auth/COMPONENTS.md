# Auth Package - Frontend Components

This package provides ready-to-use authentication components for your React application.

## Components

### SignInForm

A complete sign-in form with email and password inputs.

```tsx
import { SignInForm } from "auth/components";
import { authClient } from "auth/client";

function SignInPage() {
  const handleSignIn = async (email: string, password: string) => {
    const { data, error } = await authClient.signIn.email({
      email,
      password,
    });
    
    if (error) {
      console.error("Sign in failed:", error);
    } else {
      console.log("Signed in successfully:", data);
    }
  };

  return (
    <SignInForm
      onSubmit={handleSignIn}
      onSignUpClick={() => navigate("/signup")}
      onForgotPasswordClick={() => navigate("/forgot-password")}
    />
  );
}
```

### SignUpForm

A complete sign-up form with name, email, and password inputs.

```tsx
import { SignUpForm } from "auth/components";
import { authClient } from "auth/client";

function SignUpPage() {
  const handleSignUp = async (email: string, password: string, name: string) => {
    const { data, error } = await authClient.signUp.email({
      email,
      password,
      name,
    });
    
    if (error) {
      console.error("Sign up failed:", error);
    } else {
      console.log("Signed up successfully:", data);
    }
  };

  return (
    <SignUpForm
      onSubmit={handleSignUp}
      onSignInClick={() => navigate("/signin")}
    />
  );
}
```

### AuthProviderButton

OAuth provider buttons for social authentication.

```tsx
import { AuthProviderButton } from "auth/components";
import { authClient } from "auth/client";

function SocialAuth() {
  const handleGoogleSignIn = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    });
  };

  const handleGitHubSignIn = async () => {
    await authClient.signIn.social({
      provider: "github",
      callbackURL: "/dashboard",
    });
  };

  return (
    <div className="space-y-3">
      <AuthProviderButton 
        provider="google" 
        onSignIn={handleGoogleSignIn}
      />
      <AuthProviderButton 
        provider="github" 
        onSignIn={handleGitHubSignIn}
      />
    </div>
  );
}
```

Supported providers:
- `google`
- `github`
- `microsoft`
- `apple`
- `discord`
- `facebook`

### AuthLayout

A layout wrapper for authentication pages.

```tsx
import { AuthLayout, SignInForm } from "auth/components";

function SignInPage() {
  return (
    <AuthLayout
      title="Welcome Back"
      description="Sign in to your account to continue"
    >
      <SignInForm onSubmit={handleSignIn} />
    </AuthLayout>
  );
}
```

## Complete Example with React Router

```tsx
import { useState } from "react";
import { AuthLayout, SignInForm, SignUpForm, AuthProviderButton } from "auth/components";
import { authClient } from "auth/client";

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (email: string, password: string) => {
    setIsLoading(true);
    setError(undefined);
    
    const { data, error } = await authClient.signIn.email({
      email,
      password,
    });
    
    if (error) {
      setError(error.message);
    } else {
      // Redirect or update UI
      window.location.href = "/dashboard";
    }
    
    setIsLoading(false);
  };

  const handleSignUp = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    setError(undefined);
    
    const { data, error } = await authClient.signUp.email({
      email,
      password,
      name,
    });
    
    if (error) {
      setError(error.message);
    } else {
      // Redirect or update UI
      window.location.href = "/dashboard";
    }
    
    setIsLoading(false);
  };

  const handleSocialSignIn = async (provider: string) => {
    setIsLoading(true);
    await authClient.signIn.social({
      provider,
      callbackURL: "/dashboard",
    });
    setIsLoading(false);
  };

  return (
    <AuthLayout
      title={mode === "signin" ? "Welcome Back" : "Create Account"}
      description={
        mode === "signin"
          ? "Sign in to your account to continue"
          : "Get started with a new account"
      }
    >
      <div className="space-y-4">
        {mode === "signin" ? (
          <SignInForm
            onSubmit={handleSignIn}
            isLoading={isLoading}
            error={error}
            onSignUpClick={() => setMode("signup")}
          />
        ) : (
          <SignUpForm
            onSubmit={handleSignUp}
            isLoading={isLoading}
            error={error}
            onSignInClick={() => setMode("signin")}
          />
        )}

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <AuthProviderButton
            provider="google"
            onSignIn={() => handleSocialSignIn("google")}
            isLoading={isLoading}
            mode={mode}
          />
          <AuthProviderButton
            provider="github"
            onSignIn={() => handleSocialSignIn("github")}
            isLoading={isLoading}
            mode={mode}
          />
        </div>
      </div>
    </AuthLayout>
  );
}
```

## Props Reference

### SignInFormProps

```tsx
interface SignInFormProps {
  onSubmit: (email: string, password: string) => void | Promise<void>;
  isLoading?: boolean;
  error?: string;
  onSignUpClick?: () => void;
  onForgotPasswordClick?: () => void;
}
```

### SignUpFormProps

```tsx
interface SignUpFormProps {
  onSubmit: (email: string, password: string, name: string) => void | Promise<void>;
  isLoading?: boolean;
  error?: string;
  onSignInClick?: () => void;
}
```

### AuthProviderButtonProps

```tsx
interface AuthProviderButtonProps {
  provider: "google" | "github" | "microsoft" | "apple" | "discord" | "facebook";
  onSignIn: () => void | Promise<void>;
  isLoading?: boolean;
  mode?: "signin" | "signup";
}
```

### AuthLayoutProps

```tsx
interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}
```

## Styling

All components use Tailwind CSS classes and are compatible with your design system. They use:
- Card components from `@ui/components/ui/card`
- Button components from `@ui/components/ui/button`
- Input components from `@ui/components/ui/input`
- Label components from `@ui/components/ui/label`

The components are fully responsive and support dark mode through Tailwind's dark mode utility classes.
