import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Settings, Activity, LogOut, Flag } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useClerk } from "@clerk/react";
import ReportDialog from "./report-dialog";

export default function Navigation() {
  const [location] = useLocation();
  const { user } = useAuth();
  const clerk = useClerk();

  const handleLogout = () => {
    clerk.signOut();
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900">Diagnostic Assessment</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button 
                variant={location === "/" ? "default" : "ghost"} 
                size="sm"
                className="flex items-center space-x-2"
              >
                <Activity className="h-4 w-4" />
                <span>Assessment</span>
              </Button>
            </Link>
            
            <Link href="/settings">
              <Button 
                variant={location === "/settings" ? "default" : "ghost"} 
                size="sm"
                className="flex items-center space-x-2"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.imageUrl || ""} alt={user?.firstName || "User"} />
                    <AvatarFallback>
                      {user?.firstName?.charAt(0) || user?.primaryEmailAddress?.emailAddress?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {user?.firstName && (
                      <p className="font-medium">{user.firstName} {user?.lastName}</p>
                    )}
                    {user?.primaryEmailAddress?.emailAddress && (
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user.primaryEmailAddress.emailAddress}
                      </p>
                    )}
                  </div>
                </div>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="w-full flex items-center cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <ReportDialog 
                  trigger={
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Flag className="mr-2 h-4 w-4" />
                      Report Issue
                    </DropdownMenuItem>
                  }
                />
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
