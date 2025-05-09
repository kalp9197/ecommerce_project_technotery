import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/utils/authContext";
import api from "@/utils/axios";

export default function TokenTest() {
  const { token, refreshCycles, tokenExpiry, refreshToken } = useAuth();
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Calculate time remaining
  const getTimeRemaining = () => {
    if (!tokenExpiry) return "Unknown";
    
    const expiryTime = new Date(tokenExpiry);
    const now = new Date();
    
    if (now >= expiryTime) return "Expired";
    
    const diffMs = expiryTime - now;
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    
    return `${diffMins}m ${diffSecs}s`;
  };

  // Make a test API call to a protected endpoint
  const testProtectedEndpoint = async () => {
    setLoading(true);
    setError(null);
    setTestResult(null);
    
    try {
      // This will trigger the token refresh if needed
      const response = await api.get("/users/all");
      setTestResult(response.data);
    } catch (error) {
      console.error("API test error:", error);
      setError(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  // Force token refresh
  const handleForceRefresh = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await refreshToken();
      if (!result.success) {
        setError("Token refresh failed");
      }
    } catch (error) {
      console.error("Manual refresh error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>Token Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="font-medium">Token Status:</span>
            <span>{token ? "Active" : "Not set"}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Refresh Cycles Left:</span>
            <span>{refreshCycles || "N/A"}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Expires At:</span>
            <span>{formatDate(tokenExpiry)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Time Remaining:</span>
            <span>{getTimeRemaining()}</span>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button 
            onClick={testProtectedEndpoint} 
            disabled={loading || !token}
            className="flex-1"
          >
            {loading ? "Testing..." : "Test Protected Endpoint"}
          </Button>
          <Button 
            onClick={handleForceRefresh} 
            disabled={loading || !token || refreshCycles <= 1}
            variant="outline"
            className="flex-1"
          >
            Force Refresh
          </Button>
        </div>

        {error && (
          <div className="p-3 bg-destructive/15 text-destructive rounded-md">
            {error}
          </div>
        )}

        {testResult && (
          <div className="p-3 bg-muted rounded-md">
            <pre className="text-xs overflow-auto">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
