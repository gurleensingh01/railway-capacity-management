"use client";
import { useState } from "react";
import "../styles.css";

export default function Page() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className="min-h-screen flex">
            {/* Sidebar */}
            {isSidebarOpen && (
                <div className="menu w-1/4 h-full flex flex-col p-5">
                    <h2 className="menu_title">Menu</h2>
                    <ul className="space-y-4">
                        <li><a className='menu_button' href="#">Home</a></li>
                        <li><a className='menu_button' href="#">Railway Capacity</a></li>
                        <li><a className='menu_button' href="#">Weather Data</a></li>
                        <li><a className='menu_button' href="#">About Us</a></li>
                    </ul>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col justify-center items-center relative">
                {/* Sidebar Toggle Button */}
                <button
                    className='menu_toggle_button'
                    onClick={toggleSidebar}
                    style={{
                        left: isSidebarOpen ? "260px" : "20px", // Adjust position based on sidebar state
                    }}
                >
                    <i
                        className={`fa ${isSidebarOpen ? "fa-times" : "fa-bars"}`}
                        style={{ fontSize: "1.5rem" }}
                    />
                </button>

                <h1>Railway Management System</h1>
                <p>Get capacity and live weather data for railway stations</p>
            </div>
        </div>
    );
}
