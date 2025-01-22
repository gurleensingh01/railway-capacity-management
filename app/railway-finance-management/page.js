"use client";

import { useState } from "react";

export default function Page() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div
            className="min-h-screen flex"
            style={{ backgroundColor: "#E8F1E7" }}
        >
            {/* Sidebar */}
            {isSidebarOpen && (
                <div
                    className="w-1/4 h-full flex flex-col p-5"
                    style={{
                        backgroundColor: "#223B34",
                        color: "#FFFFFF",
                        transition: "all 0.3s ease",
                        position: "fixed",
                    }}
                >
                    <h2
                        style={{
                            fontSize: "1.5rem",
                            fontWeight: "bold",
                            marginBottom: "1rem",
                            textAlign: "center",
                        }}
                    >
                        Menu
                    </h2>
                    <ul className="space-y-4">
                        <li>
                            <a
                                href="#"
                                style={{
                                    color: "#FFFFFF",
                                    textDecoration: "none",
                                    fontSize: "1.2rem",
                                    display: "block",
                                    padding: "10px",
                                    borderRadius: "5px",
                                    backgroundColor: "#2F4F4F",
                                }}
                            >
                                Home
                            </a>
                        </li>
                        <li>
                            <a
                                href="#"
                                style={{
                                    color: "#FFFFFF",
                                    textDecoration: "none",
                                    fontSize: "1.2rem",
                                    display: "block",
                                    padding: "10px",
                                    borderRadius: "5px",
                                    backgroundColor: "#2F4F4F",
                                }}
                            >
                                Railway Capacity
                            </a>
                        </li>
                        <li>
                            <a
                                href="#"
                                style={{
                                    color: "#FFFFFF",
                                    textDecoration: "none",
                                    fontSize: "1.2rem",
                                    display: "block",
                                    padding: "10px",
                                    borderRadius: "5px",
                                    backgroundColor: "#2F4F4F",
                                }}
                            >
                                Weather Data
                            </a>
                        </li>
                        <li>
                            <a
                                href="#"
                                style={{
                                    color: "#FFFFFF",
                                    textDecoration: "none",
                                    fontSize: "1.2rem",
                                    display: "block",
                                    padding: "10px",
                                    borderRadius: "5px",
                                    backgroundColor: "#2F4F4F",
                                }}
                            >
                                About Us
                            </a>
                        </li>
                    </ul>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col justify-center items-center relative">
                {/* Sidebar Toggle Button */}
                <button
                    onClick={toggleSidebar}
                    style={{
                        position: "fixed",
                        top: "20px",
                        left: isSidebarOpen ? "260px" : "20px", // Adjust position based on sidebar state
                        backgroundColor: "#223B34",
                        color: "#FFFFFF",
                        border: "none",
                        padding: "10px",
                        borderRadius: "50%",
                        cursor: "pointer",
                        width: "50px",
                        height: "50px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        transition: "all 0.3s ease",
                    }}
                >
                    <i
                        className={`fa ${
                            isSidebarOpen ? "fa-times" : "fa-bars"
                        }`}
                        style={{ fontSize: "1.5rem" }}
                    />
                </button>

                <h1
                    style={{
                        color: "#223B34",
                        fontSize: "3rem",
                        fontWeight: "bold",
                        textAlign: "center",
                    }}
                >
                    Railway Management System
                </h1>
                <p
                    style={{
                        color: "#223B34",
                        fontSize: "1.5rem",
                        fontWeight: "bold",
                        textAlign: "center",
                    }}
                >
                    Get capacity and live weather data for railway stations
                </p>
            </div>
        </div>
    );
}
