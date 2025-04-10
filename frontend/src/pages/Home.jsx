import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Welcome
          </CardTitle>
          <CardDescription className="text-center">
            Experience our beautiful forms with Shadcn UI
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-center text-muted-foreground">
            This demo showcases beautiful form components with validation using
            React Hook Form and Zod. The design is based on Shadcn UI
            components.
          </p>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Link to="/login">
              <Button className="w-full" variant="default">
                Login
              </Button>
            </Link>
            <Link to="/register">
              <Button className="w-full" variant="outline">
                Register
              </Button>
            </Link>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground text-center">
            The forms include field validation and follow best practices for
            accessibility.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
