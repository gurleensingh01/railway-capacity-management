import { usePathname } from "next/navigation";

import "../styles.css";

export function KPI() {
    const pathname = usePathname();
    var isRouteOnExpandedPage = (pathname === "/stats");
    return (
        <>
            <div className="h-full w-full flex flex-row space-x-4 justify-stretch">
                <div className="h-full w-full flex flex-col justify-center text-center">
                    { !isRouteOnExpandedPage &&
                        <h1 className="text-xl font-bold text-left pl-1 mb-2">KPI #1</h1>
                    }
                    <div className="content_background h-full w-full flex flex-col justify-center">
                        <h1>Key Performance Indicator</h1>
                    </div>
                </div>
                <div className="h-full w-full flex flex-col justify-center text-center">
                    { !isRouteOnExpandedPage &&
                        <h1 className="text-xl font-bold text-left pl-1 mb-2">KPI #2</h1>
                    }
                    <div className="content_background h-full w-full flex flex-col justify-center">
                        <h1>Key Performance Indicator</h1>
                    </div>
                </div>
                <div className="h-full w-full flex flex-col justify-center text-center">
                    { !isRouteOnExpandedPage &&
                        <h1 className="text-xl font-bold text-left pl-1 mb-2">KPI #3</h1>
                    }
                    <div className="content_background h-full w-full flex flex-col justify-center">
                        <h1>Key Performance Indicator</h1>
                    </div>
                </div>
            </div>
        </>
    );
}
