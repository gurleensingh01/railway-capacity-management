import Link from "next/link";
import "./styles.css";

export default function Page() {
    return (
        <div className="h-full w-full flex flex-col m-auto justify-center">
            <div className="m-12">
                <div className="mb-12">
                    <h1 className="text-6xl font-bold">Welcome</h1>
                    <h2 className="text-lg font-bold">Please sign-in to continue</h2>
                </div>

                <div className="flex flex-col">
                    <h3 className="text-med font-bold pl-2 pb-2">E-mail:</h3>
                    <input className="w-[80%] max-w-[400px] h-16 pl-6 mb-12"></input>
                    <h3 className="text-med font-bold pl-2 pb-2">Password:</h3>
                    <input className="w-[80%] max-w-[400px] h-16 pl-6 mb-12" type="password"></input>
                    <Link
                        className="h-16 w-[144px] dark_button text-lg font-bold pl-10 pt-4"
                        href="/railway-finance-management"
                    >
                        Submit
                    </Link>
                </div>
            </div>
        </div>
    );
}
