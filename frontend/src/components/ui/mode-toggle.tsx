import { Moon, Sun } from "lucide-react"
import React from "react"
import { cn } from "../../lib/utils"

import { Button } from "./button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu"
import { useTheme } from "../../theme-provider"

export function ModeToggle({ className = "" }: { className?: string }) {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "h-9 w-9 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-all shadow-sm",
            className
          )}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-400" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-blue-400" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-[#091122] border-slate-800 text-slate-200 rounded-xl">
        <DropdownMenuItem onClick={() => setTheme("light")} className="hover:bg-slate-800 hover:text-white cursor-pointer rounded-lg text-xs">
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="hover:bg-slate-800 hover:text-white cursor-pointer rounded-lg text-xs">
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("black")} className="hover:bg-slate-800 hover:text-white cursor-pointer rounded-lg text-xs">
          Black
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} className="hover:bg-slate-800 hover:text-white cursor-pointer rounded-lg text-xs">
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
