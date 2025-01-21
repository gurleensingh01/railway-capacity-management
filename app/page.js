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
        </div>
    );
}
