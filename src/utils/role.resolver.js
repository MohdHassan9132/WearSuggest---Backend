export const resolveSubscriberPayload = ({
    role,
    subscriberId
}) => {

    const payload = {};

    if (role === "USER") {
        payload.userId = subscriberId;
    }

    if (role === "SELLER") {
        payload.sellerId = subscriberId;
    }

    return payload;
};