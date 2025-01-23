"use client";
import { use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import "../styles.css";

export default function Page({ searchParams }) {
    const router = useRouter();
    const { userId, userToken } = use(searchParams);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    useEffect(() => {
        router.replace("/dashboard");
        // TODO: delete after debug
        alert("User authenticated: " + (userId != null && userToken != null).toString());
    }, []);

    // TODO: dynamically load names
    const username = "Bob";
    // TODO: dynamically load greeting
    var greeting = "evening";
    // TODO: dynamically load location
    var location = "Alberta";

    return (
        <div className="h-full w-full flex flex-col">
            {/* TODO: turn sidebar components into JS component for import */}


            {/* Sidebar Toggle Button */}
            <button
                className="fixed menu_button mt-7 -ml-[24px] pl-0 w-[24px] h-[72px] rounded-[10%]"
                onClick={toggleSidebar}
                style={{
                    left: isSidebarOpen ? "0" : "20px",
                    display: isSidebarOpen ? "none" : "initial",
                }}
            >&raquo;</button>


            {/* Sidebar */}
                <div
                    className="menu fixed w-[330px] h-full flex flex-col p-[24px]"
                    style={{
                        left: isSidebarOpen ? "0px": "-330px",
                        boxShadow: isSidebarOpen ? "" : "none",
                    }}
                >
                    <h2 className="text-2xl font-bold mt-6 mb-12">Navigation</h2>
                    <button
                        className="absolute menu_close_button w-[48px] h-[48px] rounded-[50%] ml-[236px] mt-[16px]"
                        onClick={toggleSidebar}
                    >X</button>
                    <ul className="space-y-4">
                        {/* TODO: this can be generated */}
                        <li>
                            <a className="menu_item light_button block py-3 px-4 mr-1" href="#">Home</a>
                        </li>
                        <li>
                            <a className="menu_item light_button block py-3 px-4 mr-1" href="#">Railway Capacity</a>
                        </li> 
                        <li>
                            <a className="menu_item light_button block py-3 px-4 mr-1" href="#">Weather Data</a>
                        </li>
                        <li>
                            <a className="menu_item light_button block py-3 px-4 mr-1" href="#">About Us</a>
                        </li>
                    </ul>
                </div>


            {/* Main Content */}
            <div className="flex flex-col h-full w-full justify-stretch p-4">
                <div className="p-4 pb-auto">
                    <h1 className="text-4xl font-bold">Good {greeting}, {username}!</h1>
                    <h2 className="text-base font-bold pb-8">Here is your overview for {location}.</h2>
                </div>
                {/* TODO: use actual data */}
                <div className="flex flex-col h-full w-full">
                    <div className="h-40 flex-auto m-2 flex flex-col justify-center text-center">
                        <div className="w-full flex flex-row justify-between text-center">
                            <h1 className="text-xl font-bold text-left pl-1">Railway Map</h1>
                            <Link className="text-xs dark_button px-3 py-2 mb-1" href="#">Expand Map</Link>
                        </div>
                        <div className="content_background h-full w-full flex flex-col justify-center">
                            <h1>Railway Map</h1>
                        </div>
                    </div>
                    <div className="h-10 flex-auto flex flex-row justify-stretch">
                        <div className="flex-1 m-2 flex flex-col justify-center text-center">
                            <div className="w-full flex flex-row justify-between text-center">
                                <h1 className="text-base font-bold text-left pl-1">KPI #1</h1>
                                <Link className="text-xs dark_button px-3 py-1 mb-1" href="#">Expand</Link>
                            </div>
                            <div className="content_background h-full w-full flex flex-col justify-center">
                                <h1>KPI #1</h1>
                            </div>
                        </div>
                        <div className="flex-1 m-2 flex flex-col justify-center text-center">
                            <div className="w-full flex flex-row justify-between text-center">
                                <h1 className="text-base font-bold text-left pl-1">KPI #2</h1>
                                <Link className="text-xs dark_button px-3 py-1 mb-1" href="#">Expand</Link>
                            </div>
                            <div className="content_background h-full w-full flex flex-col justify-center">
                                <h1>KPI #2</h1>
                            </div>
                        </div>
                        <div className="flex-1 m-2 flex flex-col justify-center text-center">
                            <div className="w-full flex flex-row justify-between text-center">
                                <h1 className="text-base font-bold text-left pl-1">KPI #3</h1>
                                <Link className="text-xs dark_button px-3 py-1 mb-1" href="#">Expand</Link>
                            </div>
                            <div className="content_background h-full w-full flex flex-col justify-center">
                                <h1>KPI #3</h1>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
