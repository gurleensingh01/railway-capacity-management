import Link from "next/link";
import "./styles.css";

export default function Page() {
    return (
        <div className="padded_body min-h-screen flex flex-col">
            <div className="login_page_header">
                <h1 className="login_page_greeting">Welcome</h1>
                <p className="login_page_description">Please Sign-In to Continue</p>
            </div>
            <div className="body flex flex-col">
                <h3 className="input_title">E-mail:</h3>
                <input></input>
                <h3 className="input_title">Password:</h3>
                <input type="password"></input>
                <Link href="/railway-finance-management" className="main_button login_page_submit_button">
                    Submit
                </Link>
            </div>
        </div>
    );
}
