"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
    LayoutDashboard, 
    PlusCircle, 
    Package, 
    FolderTree, 
    ClipboardList, 
    LogOut,
    Menu,
    X
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface NavItem {
    title: string
    href: string
    icon: React.ReactNode
}

const navItems: NavItem[] = [
    {
        title: "Dashboard",
        href: "/admin/dashboard",
        icon: <LayoutDashboard className="w-5 h-5" />
    },
    {
        title: "Add Product",
        href: "/admin/dashboard/addproducts",
        icon: <PlusCircle className="w-5 h-5" />
    },
    {
        title: "Products",
        href: "/admin/dashboard/products",
        icon: <Package className="w-5 h-5" />
    },
    {
        title: "Categories",
        href: "/admin/dashboard/categories",
        icon: <FolderTree className="w-5 h-5" />
    },
    {
        title: "Orders",
        href: "/admin/dashboard/orders",
        icon: <ClipboardList className="w-5 h-5" />
    }
]

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        setIsLoading(false)
    }, [pathname])

    const handleNavigation = () => {
        setIsLoading(true)
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-30">
                <div className="flex items-center justify-between h-full px-4">
                    <div className="flex items-center">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="mr-4"
                        >
                            {isSidebarOpen ? (
                                <X className="h-6 w-6" />
                            ) : (
                                <Menu className="h-6 w-6" />
                            )}
                        </Button>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            Admin Dashboard
                        </h1>
                    </div>
                    <Link href="/admin">
  <Button
    variant="ghost"
    size="icon"
    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
  >
    <LogOut className="h-5 w-5" />
  </Button>
</Link>
                </div>
            </header>

            {/* Sidebar */}
            <aside className={cn(
                "fixed left-0 top-16 bottom-0 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-20",
                !isSidebarOpen && "hidden"
            )}>
                <nav className="p-4 space-y-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            prefetch={true}
                            onClick={handleNavigation}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700",
                                pathname === item.href && "bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400"
                            )}
                        >
                            {item.icon}
                            <span>{item.title}</span>
                        </Link>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <main className={cn(
                "pt-16",
                isSidebarOpen ? "pl-64" : "pl-0"
            )}>
                <div className="p-6">
                    {isLoading && (
                        <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-40">
                            <div className="text-gray-600">Loading...</div>
                        </div>
                    )}
                    {children}
                </div>
            </main>
        </div>
    )
} 