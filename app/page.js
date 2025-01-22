import Link from "next/link";

export default function Page() {
    return (
        <div
            className="min-h-screen flex flex-col justify-center items-center"
            style={{ backgroundColor: "#E8F1E7" }}
        >
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
            <Link
                href="/railway-finance-management"
                style={{
                    marginTop: "20px",
                    padding: "10px 20px",
                    backgroundColor: "#223B34",
                    color: "#FFFFFF",
                    fontSize: "1.2rem",
                    fontWeight: "bold",
                    borderRadius: "5px",
                    textDecoration: "none",
                }}
            >
                Go to Next Page
            </Link>
        </div>
    );
}
