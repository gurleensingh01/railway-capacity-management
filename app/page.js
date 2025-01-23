"use client"
import { useRouter } from "next/navigation";
import "./styles.css";

export default function Page() {
    const router = useRouter();
    const query = router.query;
    const onSubmit = (event) => {
        event.preventDefault();
        const input = event.target;
        const e = input[0].value;
        const p = input[1].value;

        // TODO: auth on firebase
        // TODO: (?) access token cookie
        var success = true;
        if (success) {
            const userId = "user123";
            const userToken = "7361380427";
            router.push(`/dashboard?userId=${userId}&userToken=${userToken}`);
        } else {
            // TODO: better unauthorized page / notification
            alert("Unauthorized");
        }
    }
    return (
        <div className="h-full w-full flex flex-col m-auto justify-center">
            <div className="m-12">
                <div className="mb-12">
                    <h1 className="text-6xl font-bold">Welcome</h1>
                    <h2 className="text-lg font-bold">Please sign-in to continue.</h2>
                </div>

                <form onSubmit={onSubmit} className="flex flex-col">
                    <h3 className="text-med font-bold pl-2 pb-2">E-mail:</h3>
                    <input
                        type="email"
                        placeholder="e-mail"
                        className="w-[80%] max-w-[400px] h-16 pl-6 mb-12"
                    />

                    <h3 className="text-med font-bold pl-2 pb-2">Password:</h3>
                    <input
                        type="password"
                        placeholder="password"
                        className="w-[80%] max-w-[400px] h-16 pl-6 mb-12" type="password"
                    />

                    <input
                        type="submit"
                        value="Authenticate"
                        className="h-16 w-[160px] dark_button text-lg font-bold p-auto"
                        href="/railway-finance-management"
                    />
                </form>
            </div>
        </div>
    );
}
