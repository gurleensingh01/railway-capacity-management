/**
 * Renders the current and forecast weather for a stop.
 *
 * @param {HTMLElement} container - The DOM element where weather info will be rendered.
 * @param {object} weather - The weather object returned by fetchWeatherData.
 */
export function renderWeatherPanel(container, weather) {
    const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
    const sectionClass = "w-full flex flex-row gap-2 justify-left text-left place-content-center grow-0";
    const descClass = "text-right text-[12px] mt-[-8px] whitespace-break-spaces";
  
    // ==== Current Weather ====
    const nowDiv = document.createElement("div");
    nowDiv.className = sectionClass;

    const iconImg = document.createElement("img");
    iconImg.src = weather["now"]["icon"];
    iconImg.width = 32;
    iconImg.height = 32;
    iconImg.className = "size-fit flex flex-row justify-left text-left place-content-center"

    const nowTextDiv = document.createElement("div");
    nowTextDiv.className = "w-full flex flex-col justify-right text-right place-content-center mt-[-10px]";
  
    const tempP = document.createElement("p");
    tempP.innerHTML = `<b>${weather.now.temp}</b><sup>°C</sup>`;
    tempP.className = "text-right text-[24px]";
  
    const descP = document.createElement("p");
    descP.textContent = weather.now.desc;
    descP.className = descClass;
  
    nowTextDiv.appendChild(tempP);
    nowTextDiv.appendChild(descP);
    nowDiv.appendChild(iconImg);
    nowDiv.appendChild(nowTextDiv);
  
    // ==== Forecast Title ====
    const forecastTitle = document.createElement("p");
    forecastTitle.innerHTML = "<b>Forecast</b><br>";
  
    // ==== Forecast ====
    const forecastDiv = document.createElement("div");
    forecastDiv.className = "w-full flex flex-col gap-6";
  
    for (let i = 0; i < 14; i++) {
      const ref = weather[`${i}`];
      if (!ref) continue;
  
      const d = new Date(ref.date);
      const day = DAYS[d.getDay()];
      const month = MONTHS[d.getMonth()];
      const date = d.getDate();
  
      const dayDiv = document.createElement("div");
      dayDiv.className = "w-full flex flex-col justify-left text-left";
  
      const dateP = document.createElement("p");
      dateP.innerHTML = `${day}, ${month} ${date}`;
  
      const contentDiv = document.createElement("div");
      contentDiv.className = sectionClass;

      const forecastIcon = document.createElement("img");
      forecastIcon.src = weather["now"]["icon"];
      forecastIcon.width = 32;
      forecastIcon.height = 32;
      forecastIcon.className = "size-fit flex flex-row justify-left text-left place-content-center"

      const textDiv = document.createElement("div");
      textDiv.className = "w-full flex flex-col justify-right text-right place-content-center";
  
      const temps = document.createElement("p");
      temps.innerHTML = `${ref.mintemp}<sup>°C</sup> / <b>${ref.maxtemp}</b><sup>°C</sup>`;
      temps.className = "w-full text-right text-[24px]";
  
      const desc = document.createElement("p");
      desc.textContent = ref.desc;
      desc.className = descClass;
  
      textDiv.appendChild(temps);
      textDiv.appendChild(desc);
      contentDiv.appendChild(forecastIcon);
      contentDiv.appendChild(textDiv);
      dayDiv.appendChild(dateP);
      dayDiv.appendChild(contentDiv);
      forecastDiv.appendChild(dayDiv);
    }
  
    // ==== Final append ====
    container.innerHTML = "";
    container.appendChild(nowDiv);
    container.appendChild(forecastTitle);
    container.appendChild(forecastDiv);
  }
  
