import axios from "axios";

export const createCarouselContainer = async ({
    igUserId,
    accessToken,
    children,
    caption,
}) => {
    const payload = new URLSearchParams({
        media_type: "CAROUSEL",
        children: children.join(","),
        caption,
        access_token: accessToken,
    });

    const response = await axios.post(
        `https://graph.instagram.com/v25.0/${igUserId}/media`,
        payload.toString(),
        {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        }
    );

    return response.data?.id;
};
