const serializeError = (value) => {
    if (value instanceof Error) {
        return {
            name: value.name,
            message: value.message,
            stack: value.stack,
        };
    }

    return value;
};

const writeLog = (level, event, payload = {}) => {
    const entry = {
        timestamp: new Date().toISOString(),
        level,
        event,
        ...payload,
    };

    const serialized = JSON.stringify(entry, (_, value) => serializeError(value));

    if (level === "error") {
        console.error(serialized);
        return;
    }

    if (level === "warn") {
        console.warn(serialized);
        return;
    }

    console.log(serialized);
};

export const logger = {
    info: (event, payload) => writeLog("info", event, payload),
    warn: (event, payload) => writeLog("warn", event, payload),
    error: (event, payload) => writeLog("error", event, payload),
};
