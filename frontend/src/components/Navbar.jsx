import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ShoppingCart,
  User,
  Menu,
  LogOut,
  Settings,
  X,
  Home,
  ShoppingBag,
  Package,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/utils/authContext";
import { useCart } from "@/utils/cartContext";
import { ModeToggle } from "@/components/mode-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const { cartCount, cartTotal } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary text-primary-foreground">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold">ShopApp</h1>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">Products</Link>
          </Button>

          {isAuthenticated ? (
            <>
              <Button variant="ghost" size="sm" className="relative" asChild>
                <Link to="/cart">
                  <ShoppingCart className="h-5 w-5 mr-1" />
                  <span>Cart</span>
                  {cartCount > 0 && (
                    <div className="flex flex-col items-center absolute -top-3 -right-3">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-medium">
                        {cartCount}
                      </span>
                    </div>
                  )}
                </Link>
              </Button>

              {cartCount > 0 && (
                <span className="text-sm text-muted-foreground">
                  ${cartTotal}
                </span>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <User className="h-5 w-5 mr-1" />
                    <span>Account</span>
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/register">Register</Link>
              </Button>
            </>
          )}
          <ModeToggle />
        </nav>

        {/* Mobile Navigation */}
        <div className="flex items-center gap-3 md:hidden">
          {isAuthenticated && (
            <Button variant="ghost" size="icon" asChild className="relative">
              <Link to="/cart">
                <ShoppingCart className="h-5 w-5" />
                <span className="sr-only">Cart</span>
                {cartCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 font-semibold">
                    {cartCount}
                  </Badge>
                )}
              </Link>
            </Button>
          )}
          <ModeToggle />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader className="mb-4">
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-3">
                <SheetClose asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="justify-start"
                  >
                    <Link to="/">
                      <Package className="mr-2 h-4 w-4" />
                      Products
                    </Link>
                  </Button>
                </SheetClose>

                {isAuthenticated && (
                  <>
                    <SheetClose asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="justify-start"
                      >
                        <Link to="/cart">
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Cart {cartCount > 0 && `(${cartCount})`}
                        </Link>
                      </Button>
                    </SheetClose>
                  </>
                )}

                {isAuthenticated ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start"
                    onClick={() => {
                      handleLogout();
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                ) : (
                  <>
                    <SheetClose asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="justify-start"
                      >
                        <Link to="/login">
                          <LogOut className="mr-2 h-4 w-4" />
                          Login
                        </Link>
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="justify-start"
                      >
                        <Link to="/register">
                          <User className="mr-2 h-4 w-4" />
                          Register
                        </Link>
                      </Button>
                    </SheetClose>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
