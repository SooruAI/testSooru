function saveEventLocally(event: any) {
    let events = JSON.parse(localStorage.getItem("userEvents") || "[]");
    events.push(event);
    // console.log("Logged Event:", event);
    localStorage.setItem("userEvents", JSON.stringify(events));
}

export function logEvent(eventName: string, data: any = {}) {
    const eventData = {
    event: eventName,
    timestamp: new Date().toISOString(),
    page: window.location.pathname,
    ...data,
    };
    saveEventLocally(eventData);
}