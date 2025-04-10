import React from "react";
import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";
import { DockDemo } from "@/components/DockDemo";

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <div className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between p-4 bg-background border-b">
          <h1 className="text-xl font-bold">My App</h1>
          <ModeToggle />
        </header>
        <main className="flex-1">
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Routes>
            <div className="fixed bottom-0 left-0 right-0 z-50">
              <DockDemo />
            </div>
          </BrowserRouter>
        </main>
      </div>
    </ThemeProvider>
  );
}
