"use client";

export function RandomLoadMessage() {
    const MESSAGES = [
        "Clearing the tracks...",
        "Refueling the trains...",
        "Chugging along...",
        "All aboard!",
        "Switching gears...",
        "Switching tracks...",
        "Firing up the engines...",
        "Fasten your seatbelts!",
        "Stowing the cargo...",
        "Full steam ahead!",
    ];

    function getRandomMessage() {
        const rand = Math.floor(Math.random() * MESSAGES.length);
        return MESSAGES[rand];
    }
    
    return (
        <div className="size-full flex flex-col gap-2 justify-center text-center content-center">
            <p className="text-center text-5xl font-bold" suppressHydrationWarning>{getRandomMessage()}</p>
            <p className="text-center text-lg">Loading...</p>
        </div>
    );
}
