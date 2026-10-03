async function getWeather() {
  try {
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=41.2995&longitude=69.2401&current_weather=true';
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const curr = data.current_weather;

    const temp = Math.round(curr.temperature);
    const code = curr.weathercode;

    let condition = 'Ochiq va quyoshli ☀️';
    if ([1, 2, 3].includes(code)) condition = 'Qisman bulutli ⛅';
    if ([45, 48].includes(code)) condition = 'Tumanli 🌫️';
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) condition = 'Yomg\'irli 🌧️';
    if ([71, 73, 75, 85, 86].includes(code)) condition = 'Qorli ❄️';
    if ([95, 96, 99].includes(code)) condition = 'Momaqaldiroqli ⛈️';

    let advice = 'Tashqarida yugurish va sport uchun ajoyib ob-havo! 💪';
    if (temp < 10) advice = 'Havo salqin, iliqroq kiyinib chiqing. 🧥';
    if (temp > 30) advice = 'Havo issiq, ko\'proq suv iching va quyoshdan saqlaning. 💧';
    if (condition.includes('Yomg\'ir')) advice = 'Yomg\'ir yog\'moqda, soyabon olishni unutmang. ☔';

    return {
      temp,
      condition,
      windSpeed: curr.windspeed,
      advice,
      summary: `🌤️ **Toshkent Ob-havosi:** ${temp}°C, ${condition}\n💡 *Tavsiya:* ${advice}`,
    };
  } catch (err) {
    console.warn('Weather fetch error:', err.message);
    return null;
  }
}

module.exports = {
  getWeather,
};
