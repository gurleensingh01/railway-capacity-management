export const fetchWeatherData = async (lat, lon) => {
    const apiKey = process.env.NEXT_PUBLIC_WEATHERAPI_KEY;
    if (!apiKey) {
        console.error("[ERROR]: WeatherAPI Key is missing!");
        return null;
    }

    const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${lat},${lon}&days=14`;

    try {
        console.log("[INFO]: Fetching weather from:", url);
        const response = await fetch(url);

        if (!response.ok) {
            console.error(`[ERROR]: Weather API Error: ${response.status}`);
            return null;
        }

        const data = await response.json();
        if (!data || !data.current) {
            console.error("[ERROR]: No weather data received for:", lat, lon);
            return null;
        }
        
        var out = {};
        out["now"] = {};
        out["now"]["temp"] = Math.round(data["current"]["temp_c"]);
        out["now"]["desc"] = data["current"]["condition"]["text"];
        out["now"]["icon"] = data["current"]["condition"]["icon"];
        for (let i = 0; i < data["forecast"]["forecastday"].length; i++) {
            out[`${i}`] = {};
            out[`${i}`]["date"] = data["forecast"]["forecastday"][i]["date"];
            out[`${i}`]["maxtemp"] = Math.round(data["forecast"]["forecastday"][i]["day"]["maxtemp_c"]);
            out[`${i}`]["mintemp"] = Math.round(data["forecast"]["forecastday"][i]["day"]["mintemp_c"]);
            out[`${i}`]["avgtemp"] = Math.round(data["forecast"]["forecastday"][i]["day"]["avgtemp_c"]);
            out[`${i}`]["desc"] = data["forecast"]["forecastday"][i]["day"]["condition"]["text"];
            out[`${i}`]["icon"] = data["forecast"]["forecastday"][i]["day"]["condition"]["icon"];
        }

        return out;
    } catch (error) {
        console.error("[ERROR]: Fetch error:", error);
        return null;
    }
};
