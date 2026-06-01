import Cookies from "js-cookie";

export const getGreeting = () => {
    const now = new Date();

    const hour = now.getHours();

    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    if (hour < 21) return "Good Evening";
    return "Good Night";
};

export const generateTimeOptions = () => {
    const options: { time: string; period: string; label: string }[] = [];

    for (let h = 0; h < 24; h++) {
        const hour12 = h % 12 === 0 ? 12 : h % 12;
        const period = h < 12 ? "AM" : "PM";
        const time = `${hour12}:00`;
        const label = `${hour12}:00 ${period}`;
        options.push({ time, period, label });
    }

    return options;
};

export const timeOptions = generateTimeOptions();

export const convertToMinutes = (time: string, period: string) => {
    let [h, m] = time.split(":").map(Number);

    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;

    return h * 60 + m;
};

export const isOverlapping = (
    slots: any[],
    newStart: number,
    newEnd: number,
    currentIndex?: number
) => {
    return slots.some((slot, index) => {
        if (index === currentIndex) return false;

        const start = convertToMinutes(slot.startTime, slot.startPeriod);
        const end = convertToMinutes(slot.endTime, slot.endPeriod);

        return newStart < end && newEnd > start;
    });
};

export const getMentorFromCookie = () => {
    const cookie = Cookies.get("mentor");

    if (!cookie) return null;

    try {
        return JSON.parse(decodeURIComponent(cookie));
    } catch {
        return null;
    }
};

export const filterSlotsAfter2Hours = (slots: string[], selectedDateISO: string) => {
    const now = new Date();
    const [year, month, day] = selectedDateISO.split("-").map(Number);

    return slots.filter((slot) => {
        try {
            const match = slot.trim().match(/^(\d{1,2}):(\d{2})(?:\s*(am|pm))?/i);
            if (!match || !year || !month || !day) return false;
            let hour = Number(match[1]);
            const minute = Number(match[2]);
            const period = String(match[3] ?? "").toLowerCase();
            if (hour > 23 || minute > 59) return false;
            if (period === "pm" && hour !== 12) hour += 12;
            if (period === "am" && hour === 12) hour = 0;
            const slotDateTime = new Date(year, month - 1, day, hour, minute);

            const minAllowedTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);

            return slotDateTime >= minAllowedTime;
        } catch {
            return false;
        }
    });
};

export const getDurationLabel = (slot: any) => {
    const start = convertToMinutes(slot.startTime, slot.startPeriod);
    const end = convertToMinutes(slot.endTime, slot.endPeriod);

    const diff = end - start;
    if (diff <= 0) return "";

    const hrs = Math.floor(diff / 60);
    const mins = diff % 60;

    if (hrs && mins) return `${hrs}h ${mins}m`;
    if (hrs) return `${hrs} hr`;
    return `${mins} min`;
};

export const formatTime = (time: string, period: string) => {
    const [h, m] = time.split(":");
    let hour = parseInt(h);

    if (hour > 12) hour -= 12;
    if (hour === 0) hour = 12;

    return `${hour}:${m} ${period}`;
};
