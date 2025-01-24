import { usePathname } from "next/navigation";
import Link from "next/link";

import "../styles.css";

export function Map() {
    const pathname = usePathname();
    var isRouteOnExpandedPage = (pathname === "/map");
    return (
        <>
            <div className="h-full w-full flex-auto flex flex-col justify-center text-center">
                { !isRouteOnExpandedPage &&
                    <div className="w-full flex flex-row justify-between text-center">
                        <h1 className="text-xl font-bold text-left pl-1">Railway Map</h1>
                        <Link className="text-xs dark_button px-3 py-2 mb-1" href="/map" as="/map">Expand Map</Link>
                    </div>
                }
                <div className="content_background h-full w-full flex flex-col justify-center">
                    <h1>Railway Map</h1>
                </div>
            </div>
        </>
    );
}
