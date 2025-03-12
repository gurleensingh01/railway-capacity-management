export const fetchWeatherData = async (lat, lon) => {
    const apiKey = process.env.NEXT_PUBLIC_WEATHERAPI_KEY;
    if (!apiKey) {
        console.error("WeatherAPI Key is missing!");
        return null;
    }

    const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${lat},${lon}`;

    try {
        console.log("Fetching weather from:", url);
        const response = await fetch(url);

        if (!response.ok) {
            console.error(`Weather API Error: ${response.status}`);
            return null;
        }

        const data = await response.json();
        if (!data || !data.current) {
            console.error("No weather data received for:", lat, lon);
            return null;
        }

        return {
            temperature: data.current.temp_c,  // Temperature in Celsius
            description: data.current.condition.text,
            windSpeed: data.current.wind_kph,
            icon: data.current.condition.icon  // Weather icon
        };
    } catch (error) {
        console.error("Fetch error:", error);
        return null;
    }
};
