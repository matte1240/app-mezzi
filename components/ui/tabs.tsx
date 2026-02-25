"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

const TabsContext = React.createContext<{ value: string; onValueChange: (v: string) => void }>({ value: "", onValueChange: () => {} })

interface TabsProps {
    defaultValue?: string;
    value?: string;
    onValueChange?: (value: string) => void;
    children: React.ReactNode;
    className?: string;
}

export function Tabs({ defaultValue, value, onValueChange, children, className }: TabsProps) {
    const [stateValue, setStateValue] = React.useState(defaultValue || "")
    const activeValue = value !== undefined ? value : stateValue
    const handleValueChange = (v: string) => {
        if (onValueChange) onValueChange(v)
        else setStateValue(v)
    }
    return (
        <TabsContext.Provider value={{ value: activeValue, onValueChange: handleValueChange }}>
            <div className={className}>{children}</div>
        </TabsContext.Provider>
    )
}

interface TabsListProps {
    className?: string;
    children: React.ReactNode;
}

export function TabsList({ className, children }: TabsListProps) {
    return <div className={cn("inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground", className)}>{children}</div>
}

interface TabsTriggerProps {
    value: string;
    className?: string;
    children: React.ReactNode;
}

export function TabsTrigger({ value, className, children }: TabsTriggerProps) {
    const context = React.useContext(TabsContext)
    const isActive = context.value === value
    return (
        <button
            className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                isActive && "bg-background text-foreground shadow-sm",
                className
            )}
            onClick={() => context.onValueChange(value)}
        >
            {children}
        </button>
    )
}

interface TabsContentProps {
    value: string;
    className?: string;
    children: React.ReactNode;
}

export function TabsContent({ value, className, children }: TabsContentProps) {
    const context = React.useContext(TabsContext)
    if (context.value !== value) return null
    return <div className={cn("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className)}>{children}</div>
}
