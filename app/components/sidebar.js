import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";  // Import router to handle navigation
import "../styles.css";

export function Sidebar() {
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    // Logout function to clear the auth cookie and redirect
    const handleLogout = () => {
        document.cookie = "authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;"; // Clear authentication cookie
        router.replace("/"); // Redirect to the first page (welcome page)
    };

    return (
        <>
            {/* Sidebar Toggle Button */}
            <button
                className="fixed menu_button mt-7 -ml-[24px] pl-0 w-[24px] h-[72px] rounded-[10%]"
                onClick={toggleSidebar}
                style={{
                    left: isSidebarOpen ? "0" : "20px",
                    display: isSidebarOpen ? "none" : "initial",
                }}
            >
                &raquo;
            </button>

            {/* Sidebar */}
            <div
                className="menu fixed w-[330px] h-full flex flex-col p-[24px]"
                style={{
                    left: isSidebarOpen ? "0px" : "-330px",
                    boxShadow: isSidebarOpen ? "" : "none",
                }}
            >
                <div className="flex flex-row mt-6 mb-12">
                    <h2 className="text-2xl font-bold">Navigation</h2>
                    <button
                        className="menu_close_button w-10 h-10 rounded-[50%] -mt-1 mr-0 ml-auto"
                        onClick={toggleSidebar}
                    >X</button>
                </div>
                <ul className="space-y-4">
                    {/* TODO: this can be generated with loop and dictionary */}
                    <li>
                        <a className="menu_item light_button block py-3 px-4 mr-1" href="/dashboard">Dashboard</a>
                    </li>
                    <li>
                        <a className="menu_item light_button block py-3 px-4 mr-1" href="/map">Railway Map</a>
                    </li>
                    <li>
                        <a className="menu_item light_button block py-3 px-4 mr-1" href="/stats">Statistics</a>
                    </li>
                </ul>

                <div className="flex flex-row mb-0 mt-auto">
                    <button
                        onClick={handleLogout} // Handle logout click
                        className="flex justify-around content-around dark_button w-24 h-12 pt-3 mr-0 ml-auto"
                    >
                        Log Out
                    </button>
                </div>
            </div>
        </>
    );
}
